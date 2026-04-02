import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DayOfWeek, Level, Semester } from '../../../generated/prisma';
import {
  DEPARTMENTAL_DAY_SLOTS,
  DaySlot,
  FRIDAY_UNIVERSITY_SLOTS,
  ESM_COURSE_CODE_PATTERN,
  GST_COURSE_CODE_PATTERN,
} from './scheduler.constants';

export interface CourseInput {
  courseCode: string;
  departmentCode: string;
  level: Level;
  semester: Semester;
  isGeneral?: boolean;
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
  private bucketKey(
    departmentCode: string,
    level: Level,
    day: DayOfWeek,
  ): BucketKey {
    return `${departmentCode}|${level}|${day}`;
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

  private buildInitialOccupancy(
    locked: LockedSlot[],
    allDepartmentCodes: string[],
  ): Map<BucketKey, TimeInterval[]> {
    const occupied = new Map<BucketKey, TimeInterval[]>();

    for (const slot of locked) {
      const interval: TimeInterval = {
        startTime: slot.startTime,
        endTime: slot.endTime,
      };

      if (slot.isUniversityCourse) {
        for (const deptCode of allDepartmentCodes) {
          const key = this.bucketKey(deptCode, slot.level, slot.dayOfWeek);
          if (!occupied.has(key)) occupied.set(key, []);
          occupied.get(key)!.push(interval);
        }
      } else {
        const key = this.bucketKey(
          slot.departmentCode,
          slot.level,
          slot.dayOfWeek,
        );
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
  ): boolean {
    const key = this.bucketKey(course.departmentCode, course.level, slot.day);
    const intervals = occupied.get(key);
    if (!intervals || intervals.length === 0) return true;

    const candidate: TimeInterval = {
      startTime: slot.startTime,
      endTime: slot.endTime,
    };

    return !intervals.some((interval) =>
      this.intervalsOverlap(candidate, interval),
    );
  }

  private availableSlots(
    course: CourseInput,
    occupied: Map<BucketKey, TimeInterval[]>,
    allowedSlots: DaySlot[],
  ): DaySlot[] {
    return allowedSlots.filter((slot) =>
      this.isSlotAvailable(course, slot, occupied),
    );
  }

  private availableSlotsOrdered(
    course: CourseInput,
    occupied: Map<BucketKey, TimeInterval[]>,
    dayLoad: Map<DayOfWeek, number>,
    timeSlotLoad: Map<string, number>,
    allowedSlots: DaySlot[],
  ): DaySlot[] {
    const slots = this.availableSlots(course, occupied, allowedSlots);
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
  ): CourseInput[] {
    return [...courses].sort(
      (a, b) =>
        this.availableSlots(a, occupied, DEPARTMENTAL_DAY_SLOTS).length -
        this.availableSlots(b, occupied, DEPARTMENTAL_DAY_SLOTS).length,
    );
  }

  private addToOccupied(
    occupied: Map<BucketKey, TimeInterval[]>,
    departmentCode: string,
    level: Level,
    day: DayOfWeek,
    interval: TimeInterval,
  ): void {
    const key = this.bucketKey(departmentCode, level, day);
    if (!occupied.has(key)) occupied.set(key, []);
    occupied.get(key)!.push(interval);
  }

  private removeFromOccupied(
    occupied: Map<BucketKey, TimeInterval[]>,
    departmentCode: string,
    level: Level,
    day: DayOfWeek,
    interval: TimeInterval,
  ): void {
    const key = this.bucketKey(departmentCode, level, day);
    const intervals = occupied.get(key);
    if (!intervals) return;
    const idx = intervals.findIndex(
      (i) =>
        i.startTime === interval.startTime && i.endTime === interval.endTime,
    );
    if (idx !== -1) intervals.splice(idx, 1);
  }

  private getFridaySlotForUniversityCourse(
    courseCode: string,
    level: Level,
  ): DaySlot | null {
    const levelSlots = FRIDAY_UNIVERSITY_SLOTS[level];
    if (!levelSlots) return null;

    if (ESM_COURSE_CODE_PATTERN.test(courseCode)) {
      return { day: DayOfWeek.FRIDAY, ...levelSlots.esm };
    }

    if (GST_COURSE_CODE_PATTERN.test(courseCode)) {
      return { day: DayOfWeek.FRIDAY, ...levelSlots.gst };
    }

    return null;
  }

  private solve(
    courses: CourseInput[],
    index: number,
    assignments: Map<string, ScheduleAssignment>,
    occupied: Map<BucketKey, TimeInterval[]>,
    dayLoad: Map<DayOfWeek, number>,
    timeSlotLoad: Map<string, number>,
  ): boolean {
    if (index === courses.length) return true;

    const course = courses[index];
    const slots = this.availableSlotsOrdered(
      course,
      occupied,
      dayLoad,
      timeSlotLoad,
      DEPARTMENTAL_DAY_SLOTS,
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
        course.departmentCode,
        course.level,
        slot.day,
        interval,
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
        )
      ) {
        return true;
      }

      assignments.delete(course.courseCode);
      this.removeFromOccupied(
        occupied,
        course.departmentCode,
        course.level,
        slot.day,
        interval,
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

    const universityCourses = courses.filter(
      (c) =>
        c.isGeneral === true ||
        ESM_COURSE_CODE_PATTERN.test(c.courseCode) ||
        GST_COURSE_CODE_PATTERN.test(c.courseCode),
    );

    const departmentalCourses = courses.filter(
      (c) =>
        !c.isGeneral &&
        !ESM_COURSE_CODE_PATTERN.test(c.courseCode) &&
        !GST_COURSE_CODE_PATTERN.test(c.courseCode),
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
        `Scheduler could not determine Friday slots for university courses: ${unscheduledUniversity.join(', ')}. Only ESM and GST prefixed courses are supported for Friday auto-scheduling.`,
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
      };
    });

    const allLocked = [...locked, ...universityLockedSlots];

    if (departmentalCourses.length === 0) {
      return Array.from(assignments.values());
    }

    const occupied = this.buildInitialOccupancy(allLocked, allDepartmentCodes);
    const dayLoad = this.buildInitialDayLoad(allLocked);
    const timeSlotLoad = this.buildInitialTimeSlotLoad(allLocked);
    const sorted = this.sortByMostConstrained(departmentalCourses, occupied);

    const solved = this.solve(
      sorted,
      0,
      assignments,
      occupied,
      dayLoad,
      timeSlotLoad,
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
