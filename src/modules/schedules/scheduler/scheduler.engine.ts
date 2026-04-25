import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DayOfWeek, Level, Semester } from '../../../generated/prisma';
import {
  DEPARTMENTAL_DAY_SLOTS,
  DaySlot,
  FRIDAY_UNIVERSITY_SLOTS,
  ESM_COURSE_CODE_PATTERN,
  GST_COURSE_CODE_PATTERN,
  ENT_COURSE_CODE_PATTERN,
  TimeSlot,
} from './scheduler.constants';

export interface CourseInput {
  courseCode: string;
  departmentCode: string;
  level: Level;
  semester: Semester;
  isGeneral?: boolean;
  aliasedCourseCodes?: string[];
}

export interface LockedSlot {
  courseCode: string;
  departmentCode: string;
  level: Level;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  semester: Semester;
  isUniversityCourse?: boolean;
  aliasedCourseCodes?: string[];
}

export interface ScheduleAssignment {
  courseCode: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  semester: Semester;
}

interface TimeInterval {
  startTime: string;
  endTime: string;
}

type BucketKey = string;

@Injectable()
export class SchedulerEngine {
  private getCoursePrefix(courseCode: string): string {
    const match = courseCode.match(/^([A-Z]+)/);
    return match ? match[1] : courseCode;
  }

  private bucketKey(
    departmentCode: string,
    coursePrefix: string,
    level: Level,
    day: DayOfWeek,
  ): BucketKey {
    return `${departmentCode}|${coursePrefix}|${level}|${day}`;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private intervalsOverlap(a: TimeInterval, b: TimeInterval): boolean {
    return (
      this.timeToMinutes(a.startTime) < this.timeToMinutes(b.endTime) &&
      this.timeToMinutes(b.startTime) < this.timeToMinutes(a.endTime)
    );
  }

  private getAffectedBuckets(
    courseCode: string,
    departmentCode: string,
    level: Level,
    day: DayOfWeek,
    isUniversityCourse: boolean,
    aliasedCourseCodes: string[],
    allDepartmentCodes: string[],
    courseInputMap: Map<string, CourseInput>,
  ): BucketKey[] {
    const keys = new Set<BucketKey>();
    const prefix = this.getCoursePrefix(courseCode);

    if (isUniversityCourse) {
      for (const dept of allDepartmentCodes) {
        const deptCourses = Array.from(courseInputMap.values()).filter(
          (c) => c.departmentCode === dept,
        );
        const prefixesInDept = new Set(
          deptCourses.map((c) => this.getCoursePrefix(c.courseCode)),
        );
        if (prefixesInDept.size === 0) {
          keys.add(this.bucketKey(dept, '*', level, day));
        } else {
          for (const p of prefixesInDept) {
            keys.add(this.bucketKey(dept, p, level, day));
          }
        }
        keys.add(this.bucketKey(dept, '*', level, day));
      }
    } else {
      keys.add(this.bucketKey(departmentCode, prefix, level, day));

      for (const aliasCode of aliasedCourseCodes) {
        const aliasInput = courseInputMap.get(aliasCode);
        if (aliasInput) {
          const aliasPrefix = this.getCoursePrefix(aliasCode);
          keys.add(
            this.bucketKey(aliasInput.departmentCode, aliasPrefix, level, day),
          );
        }
      }
    }

    return Array.from(keys);
  }

  private buildInitialOccupancy(
    locked: LockedSlot[],
    allDepartmentCodes: string[],
    courseInputMap: Map<string, CourseInput>,
  ): Map<BucketKey, TimeInterval[]> {
    const occupied = new Map<BucketKey, TimeInterval[]>();

    for (const slot of locked) {
      const interval: TimeInterval = {
        startTime: slot.startTime,
        endTime: slot.endTime,
      };

      const keys = this.getAffectedBuckets(
        slot.courseCode,
        slot.departmentCode,
        slot.level,
        slot.dayOfWeek,
        slot.isUniversityCourse ?? false,
        slot.aliasedCourseCodes ?? [],
        allDepartmentCodes,
        courseInputMap,
      );

      for (const key of keys) {
        if (!occupied.has(key)) occupied.set(key, []);
        occupied.get(key)!.push(interval);
      }
    }

    return occupied;
  }

  private buildInitialDayLoad(locked: LockedSlot[]): Map<DayOfWeek, number> {
    const dayLoad = new Map<DayOfWeek, number>();
    for (const day of Object.values(DayOfWeek)) {
      dayLoad.set(day, 0);
    }
    for (const slot of locked) {
      dayLoad.set(slot.dayOfWeek, (dayLoad.get(slot.dayOfWeek) ?? 0) + 1);
    }
    return dayLoad;
  }

  private buildInitialTimeSlotLoad(locked: LockedSlot[]): Map<string, number> {
    const timeSlotLoad = new Map<string, number>();
    for (const slot of locked) {
      timeSlotLoad.set(
        slot.startTime,
        (timeSlotLoad.get(slot.startTime) ?? 0) + 1,
      );
    }
    return timeSlotLoad;
  }

  private isSlotAvailable(
    course: CourseInput,
    slot: DaySlot,
    occupied: Map<BucketKey, TimeInterval[]>,
    allDepartmentCodes: string[],
    allCourseInputMap: Map<string, CourseInput>,
  ): boolean {
    const candidate: TimeInterval = {
      startTime: slot.startTime,
      endTime: slot.endTime,
    };

    const keys = this.getAffectedBuckets(
      course.courseCode,
      course.departmentCode,
      course.level,
      slot.day,
      course.isGeneral ?? false,
      course.aliasedCourseCodes ?? [],
      allDepartmentCodes,
      allCourseInputMap,
    );

    for (const key of keys) {
      const intervals = occupied.get(key);
      if (
        intervals &&
        intervals.some((i) => this.intervalsOverlap(candidate, i))
      ) {
        return false;
      }
    }

    const wildcardKey = this.bucketKey(
      course.departmentCode,
      '*',
      course.level,
      slot.day,
    );
    const wildcardIntervals = occupied.get(wildcardKey);
    if (
      wildcardIntervals &&
      wildcardIntervals.some((i) => this.intervalsOverlap(candidate, i))
    ) {
      return false;
    }

    return true;
  }

  private availableSlots(
    course: CourseInput,
    occupied: Map<BucketKey, TimeInterval[]>,
    allowedSlots: DaySlot[],
    allDepartmentCodes: string[],
    allCourseInputMap: Map<string, CourseInput>,
  ): DaySlot[] {
    return allowedSlots.filter((slot) =>
      this.isSlotAvailable(
        course,
        slot,
        occupied,
        allDepartmentCodes,
        allCourseInputMap,
      ),
    );
  }

  private availableSlotsOrdered(
    course: CourseInput,
    occupied: Map<BucketKey, TimeInterval[]>,
    dayLoad: Map<DayOfWeek, number>,
    timeSlotLoad: Map<string, number>,
    allowedSlots: DaySlot[],
    allDepartmentCodes: string[],
    allCourseInputMap: Map<string, CourseInput>,
  ): DaySlot[] {
    const slots = this.availableSlots(
      course,
      occupied,
      allowedSlots,
      allDepartmentCodes,
      allCourseInputMap,
    );
    return slots.sort((a, b) => {
      const dayDiff = (dayLoad.get(a.day) ?? 0) - (dayLoad.get(b.day) ?? 0);
      if (dayDiff !== 0) return dayDiff;
      return (
        (timeSlotLoad.get(a.startTime) ?? 0) -
        (timeSlotLoad.get(b.startTime) ?? 0)
      );
    });
  }

  private sortByMostConstrained(
    courses: CourseInput[],
    occupied: Map<BucketKey, TimeInterval[]>,
    allDepartmentCodes: string[],
    allCourseInputMap: Map<string, CourseInput>,
  ): CourseInput[] {
    const availableCountCache = new Map<string, number>();

    const getCount = (course: CourseInput): number => {
      if (!availableCountCache.has(course.courseCode)) {
        availableCountCache.set(
          course.courseCode,
          this.availableSlots(
            course,
            occupied,
            DEPARTMENTAL_DAY_SLOTS,
            allDepartmentCodes,
            allCourseInputMap,
          ).length,
        );
      }
      return availableCountCache.get(course.courseCode)!;
    };

    return [...courses].sort((a, b) => getCount(a) - getCount(b));
  }

  private addToOccupied(
    occupied: Map<BucketKey, TimeInterval[]>,
    course: CourseInput,
    day: DayOfWeek,
    interval: TimeInterval,
    allDepartmentCodes: string[],
    allCourseInputMap: Map<string, CourseInput>,
  ): void {
    const keys = this.getAffectedBuckets(
      course.courseCode,
      course.departmentCode,
      course.level,
      day,
      course.isGeneral ?? false,
      course.aliasedCourseCodes ?? [],
      allDepartmentCodes,
      allCourseInputMap,
    );

    for (const key of keys) {
      if (!occupied.has(key)) occupied.set(key, []);
      occupied.get(key)!.push(interval);
    }
  }

  private removeFromOccupied(
    occupied: Map<BucketKey, TimeInterval[]>,
    course: CourseInput,
    day: DayOfWeek,
    interval: TimeInterval,
    allDepartmentCodes: string[],
    allCourseInputMap: Map<string, CourseInput>,
  ): void {
    const keys = this.getAffectedBuckets(
      course.courseCode,
      course.departmentCode,
      course.level,
      day,
      course.isGeneral ?? false,
      course.aliasedCourseCodes ?? [],
      allDepartmentCodes,
      allCourseInputMap,
    );

    for (const key of keys) {
      const intervals = occupied.get(key);
      if (!intervals) continue;
      const idx = intervals.findIndex(
        (i) =>
          i.startTime === interval.startTime && i.endTime === interval.endTime,
      );
      if (idx !== -1) intervals.splice(idx, 1);
    }
  }

  private getFridaySlotForUniversityCourse(
    courseCode: string,
    level: Level,
  ): DaySlot | null {
    const levelSlots = FRIDAY_UNIVERSITY_SLOTS[level];
    if (!levelSlots) return null;

    let timeSlot: TimeSlot | undefined;

    if (ESM_COURSE_CODE_PATTERN.test(courseCode)) {
      timeSlot = levelSlots.esm;
    } else if (GST_COURSE_CODE_PATTERN.test(courseCode)) {
      timeSlot = levelSlots.gst;
    } else if (ENT_COURSE_CODE_PATTERN.test(courseCode)) {
      timeSlot = levelSlots.ent;
    }

    if (!timeSlot || !timeSlot.startTime || !timeSlot.endTime) {
      return null;
    }

    return {
      day: DayOfWeek.FRIDAY,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
    };
  }

  private solve(
    courses: CourseInput[],
    index: number,
    assignments: Map<string, ScheduleAssignment>,
    occupied: Map<BucketKey, TimeInterval[]>,
    dayLoad: Map<DayOfWeek, number>,
    timeSlotLoad: Map<string, number>,
    allDepartmentCodes: string[],
    allCourseInputMap: Map<string, CourseInput>,
  ): boolean {
    if (index === courses.length) return true;

    const course = courses[index];
    const slots = this.availableSlotsOrdered(
      course,
      occupied,
      dayLoad,
      timeSlotLoad,
      DEPARTMENTAL_DAY_SLOTS,
      allDepartmentCodes,
      allCourseInputMap,
    );

    for (const slot of slots) {
      const interval: TimeInterval = {
        startTime: slot.startTime,
        endTime: slot.endTime,
      };

      assignments.set(course.courseCode, {
        courseCode: course.courseCode,
        dayOfWeek: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        semester: course.semester,
      });

      this.addToOccupied(
        occupied,
        course,
        slot.day,
        interval,
        allDepartmentCodes,
        allCourseInputMap,
      );
      dayLoad.set(slot.day, (dayLoad.get(slot.day) ?? 0) + 1);
      timeSlotLoad.set(
        slot.startTime,
        (timeSlotLoad.get(slot.startTime) ?? 0) + 1,
      );

      if (
        this.solve(
          courses,
          index + 1,
          assignments,
          occupied,
          dayLoad,
          timeSlotLoad,
          allDepartmentCodes,
          allCourseInputMap,
        )
      ) {
        return true;
      }

      assignments.delete(course.courseCode);
      this.removeFromOccupied(
        occupied,
        course,
        slot.day,
        interval,
        allDepartmentCodes,
        allCourseInputMap,
      );
      dayLoad.set(slot.day, (dayLoad.get(slot.day) ?? 0) - 1);
      timeSlotLoad.set(
        slot.startTime,
        (timeSlotLoad.get(slot.startTime) ?? 0) - 1,
      );
    }

    return false;
  }

  generate(
    courses: CourseInput[],
    locked: LockedSlot[],
    allDepartmentCodes: string[],
  ): ScheduleAssignment[] {
    if (courses.length === 0) return [];

    const allCourseInputMap = new Map<string, CourseInput>();
    for (const c of courses) {
      allCourseInputMap.set(c.courseCode, c);
    }

    const universityCourses = courses.filter(
      (c) =>
        c.isGeneral === true ||
        ESM_COURSE_CODE_PATTERN.test(c.courseCode) ||
        GST_COURSE_CODE_PATTERN.test(c.courseCode) ||
        ENT_COURSE_CODE_PATTERN.test(c.courseCode),
    );

    const departmentalCourses = courses.filter(
      (c) =>
        !c.isGeneral &&
        !ESM_COURSE_CODE_PATTERN.test(c.courseCode) &&
        !GST_COURSE_CODE_PATTERN.test(c.courseCode) &&
        !ENT_COURSE_CODE_PATTERN.test(c.courseCode),
    );

    const assignments = new Map<string, ScheduleAssignment>();
    const unscheduledUniversity: string[] = [];

    for (const course of universityCourses) {
      const fridaySlot = this.getFridaySlotForUniversityCourse(
        course.courseCode,
        course.level,
      );

      if (!fridaySlot) {
        unscheduledUniversity.push(course.courseCode);
        continue;
      }

      assignments.set(course.courseCode, {
        courseCode: course.courseCode,
        dayOfWeek: fridaySlot.day,
        startTime: fridaySlot.startTime,
        endTime: fridaySlot.endTime,
        semester: course.semester,
      });
    }

    if (unscheduledUniversity.length > 0) {
      throw new UnprocessableEntityException(
        `Scheduler could not determine Friday slots for university courses: ${unscheduledUniversity.join(', ')}. Only ESM, GST, PIF, SDN, and ENT prefixed courses are supported for Friday auto-scheduling.`,
      );
    }

    const universityLockedSlots: LockedSlot[] = Array.from(
      assignments.values(),
    ).map((a) => {
      const course = universityCourses.find(
        (c) => c.courseCode === a.courseCode,
      )!;
      return {
        courseCode: a.courseCode,
        departmentCode: course.departmentCode,
        level: course.level,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        semester: a.semester,
        isUniversityCourse: true,
        aliasedCourseCodes: course.aliasedCourseCodes ?? [],
      };
    });

    const allLocked = [...locked, ...universityLockedSlots];

    if (departmentalCourses.length === 0) {
      return Array.from(assignments.values());
    }

    const occupied = this.buildInitialOccupancy(
      allLocked,
      allDepartmentCodes,
      allCourseInputMap,
    );
    const dayLoad = this.buildInitialDayLoad(allLocked);
    const timeSlotLoad = this.buildInitialTimeSlotLoad(allLocked);
    const sorted = this.sortByMostConstrained(
      departmentalCourses,
      occupied,
      allDepartmentCodes,
      allCourseInputMap,
    );

    const solved = this.solve(
      sorted,
      0,
      assignments,
      occupied,
      dayLoad,
      timeSlotLoad,
      allDepartmentCodes,
      allCourseInputMap,
    );

    if (!solved) {
      const unscheduled = sorted
        .filter((c) => !assignments.has(c.courseCode))
        .map((c) => c.courseCode);

      throw new UnprocessableEntityException(
        `Scheduler could not find valid slots for: ${unscheduled.join(', ')}. Try reducing the number of courses per department/level or contact an administrator.`,
      );
    }

    return Array.from(assignments.values());
  }
}
