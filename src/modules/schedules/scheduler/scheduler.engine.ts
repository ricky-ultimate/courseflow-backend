import { Injectable } from '@nestjs/common';
import { DayOfWeek, Level, Semester } from '../../../generated/prisma';
import {
  DEPARTMENTAL_DAY_SLOTS,
  DaySlot,
  ESM_COURSE_CODE_PATTERN,
  GST_COURSE_CODE_PATTERN,
  ENT_COURSE_CODE_PATTERN,
  SDN_COURSE_CODE_PATTERN,
  PIF_COURSE_CODE_PATTERN,
  SessionType,
  findFixedFridayCourseSlot,
} from './scheduler.constants';

export interface CourseInput {
  courseCode: string;
  courseName?: string;
  departmentCode: string;
  level: Level;
  semester: Semester;
  isGeneral?: boolean;
  lecturerId?: string | null;
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
  lecturerId?: string | null;
  aliasedCourseCodes?: string[];
}

export interface ScheduleAssignment {
  courseCode: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  semester: Semester;
  sessionType?: SessionType;
}

export interface UnscheduledCourse {
  courseCode: string;
  courseName: string;
  departmentCode: string;
  level: Level;
  semester: Semester;
  reason: string;
}

export interface SchedulingResult {
  assignments: ScheduleAssignment[];
  unscheduled: UnscheduledCourse[];
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

  private lecturerBucketKey(lecturerId: string, day: DayOfWeek): BucketKey {
    return `lecturer|${lecturerId}|${day}`;
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

      if (slot.lecturerId) {
        keys.push(this.lecturerBucketKey(slot.lecturerId, slot.dayOfWeek));
      }

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

  private bucketsFree(
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

  private lecturerFree(
    course: CourseInput,
    slot: DaySlot,
    occupied: Map<BucketKey, TimeInterval[]>,
  ): boolean {
    if (!course.lecturerId) return true;

    const candidate: TimeInterval = {
      startTime: slot.startTime,
      endTime: slot.endTime,
    };

    const key = this.lecturerBucketKey(course.lecturerId, slot.day);
    const intervals = occupied.get(key);
    if (!intervals) return true;

    return !intervals.some((i) => this.intervalsOverlap(candidate, i));
  }

  private isSlotAvailable(
    course: CourseInput,
    slot: DaySlot,
    occupied: Map<BucketKey, TimeInterval[]>,
    allDepartmentCodes: string[],
    allCourseInputMap: Map<string, CourseInput>,
  ): boolean {
    return (
      this.bucketsFree(
        course,
        slot,
        occupied,
        allDepartmentCodes,
        allCourseInputMap,
      ) && this.lecturerFree(course, slot, occupied)
    );
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

    if (course.lecturerId) {
      keys.push(this.lecturerBucketKey(course.lecturerId, day));
    }

    for (const key of keys) {
      if (!occupied.has(key)) occupied.set(key, []);
      occupied.get(key)!.push(interval);
    }
  }

  private getFixedFridaySlot(
    courseCode: string,
    semester: Semester,
  ): (DaySlot & { sessionType?: SessionType }) | null {
    const fixedSlot = findFixedFridayCourseSlot(courseCode, semester);

    if (!fixedSlot) {
      return null;
    }

    return {
      day: DayOfWeek.FRIDAY,
      startTime: fixedSlot.startTime,
      endTime: fixedSlot.endTime,
      sessionType: fixedSlot.sessionType,
    };
  }

  private isManuallyScheduledOnly(courseCode: string): boolean {
    return (
      PIF_COURSE_CODE_PATTERN.test(courseCode) ||
      SDN_COURSE_CODE_PATTERN.test(courseCode)
    );
  }

  hasConflictWithFixedFridaySlot(
    courseCode: string,
    semester: Semester,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
  ): boolean {
    const fixedSlot = this.getFixedFridaySlot(courseCode, semester);

    if (!fixedSlot) {
      return false;
    }

    if (fixedSlot.sessionType === SessionType.PRACTICAL) {
      return dayOfWeek === DayOfWeek.FRIDAY;
    }

    if (dayOfWeek !== fixedSlot.day) {
      return false;
    }

    return this.intervalsOverlap(
      { startTime, endTime },
      { startTime: fixedSlot.startTime, endTime: fixedSlot.endTime },
    );
  }

  private buildUnscheduled(
    course: CourseInput,
    reason: string,
  ): UnscheduledCourse {
    return {
      courseCode: course.courseCode,
      courseName: course.courseName ?? course.courseCode,
      departmentCode: course.departmentCode,
      level: course.level,
      semester: course.semester,
      reason,
    };
  }

  private determineFailureReason(
    course: CourseInput,
    occupied: Map<BucketKey, TimeInterval[]>,
    allDepartmentCodes: string[],
    allCourseInputMap: Map<string, CourseInput>,
  ): string {
    const bucketFreeSlots = DEPARTMENTAL_DAY_SLOTS.filter((slot) =>
      this.bucketsFree(
        course,
        slot,
        occupied,
        allDepartmentCodes,
        allCourseInputMap,
      ),
    );

    if (bucketFreeSlots.length === 0) {
      return `No available time slot for ${course.level} in the ${course.semester.toLowerCase()} semester`;
    }

    const lecturerFreeAmongBucketFree = bucketFreeSlots.some((slot) =>
      this.lecturerFree(course, slot, occupied),
    );

    if (!lecturerFreeAmongBucketFree) {
      return 'Lecturer unavailable for all remaining slots';
    }

    return `No available time slot for ${course.level} in the ${course.semester.toLowerCase()} semester`;
  }

  generate(
    courses: CourseInput[],
    locked: LockedSlot[],
    allDepartmentCodes: string[],
  ): SchedulingResult {
    if (courses.length === 0) return { assignments: [], unscheduled: [] };

    const allCourseInputMap = new Map<string, CourseInput>();
    for (const c of courses) {
      allCourseInputMap.set(c.courseCode, c);
    }

    const universityCourses = courses.filter(
      (c) =>
        c.isGeneral === true ||
        ESM_COURSE_CODE_PATTERN.test(c.courseCode) ||
        GST_COURSE_CODE_PATTERN.test(c.courseCode) ||
        ENT_COURSE_CODE_PATTERN.test(c.courseCode) ||
        SDN_COURSE_CODE_PATTERN.test(c.courseCode) ||
        PIF_COURSE_CODE_PATTERN.test(c.courseCode),
    );

    const departmentalCourses = courses.filter(
      (c) =>
        !c.isGeneral &&
        !ESM_COURSE_CODE_PATTERN.test(c.courseCode) &&
        !GST_COURSE_CODE_PATTERN.test(c.courseCode) &&
        !ENT_COURSE_CODE_PATTERN.test(c.courseCode) &&
        !SDN_COURSE_CODE_PATTERN.test(c.courseCode) &&
        !PIF_COURSE_CODE_PATTERN.test(c.courseCode),
    );

    const assignments = new Map<string, ScheduleAssignment>();
    const unscheduled: UnscheduledCourse[] = [];

    for (const course of universityCourses) {
      const fixedSlot = this.getFixedFridaySlot(
        course.courseCode,
        course.semester,
      );

      if (fixedSlot) {
        assignments.set(course.courseCode, {
          courseCode: course.courseCode,
          dayOfWeek: fixedSlot.day,
          startTime: fixedSlot.startTime,
          endTime: fixedSlot.endTime,
          semester: course.semester,
          sessionType: fixedSlot.sessionType,
        });
        continue;
      }

      if (this.isManuallyScheduledOnly(course.courseCode)) {
        unscheduled.push(
          this.buildUnscheduled(
            course,
            'This general course must be scheduled manually and is intentionally excluded from auto-generation',
          ),
        );
        continue;
      }

      unscheduled.push(
        this.buildUnscheduled(
          course,
          'No fixed Friday slot configured for this general course; requires manual scheduling',
        ),
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
        lecturerId: course.lecturerId,
        aliasedCourseCodes: course.aliasedCourseCodes ?? [],
      };
    });

    const allLocked = [...locked, ...universityLockedSlots];

    if (departmentalCourses.length === 0) {
      return { assignments: Array.from(assignments.values()), unscheduled };
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

    for (const course of sorted) {
      const slots = this.availableSlotsOrdered(
        course,
        occupied,
        dayLoad,
        timeSlotLoad,
        DEPARTMENTAL_DAY_SLOTS,
        allDepartmentCodes,
        allCourseInputMap,
      );

      if (slots.length === 0) {
        const reason = this.determineFailureReason(
          course,
          occupied,
          allDepartmentCodes,
          allCourseInputMap,
        );
        unscheduled.push(this.buildUnscheduled(course, reason));
        continue;
      }

      const slot = slots[0];
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
    }

    return { assignments: Array.from(assignments.values()), unscheduled };
  }
}
