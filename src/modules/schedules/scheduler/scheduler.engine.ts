import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DayOfWeek, Level, Semester } from '../../../generated/prisma';
import { ALL_DAY_SLOTS, DaySlot } from './scheduler.constants';

export interface CourseInput {
  courseCode: string;
  departmentCode: string;
  level: Level;
  semester: Semester;
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
  ): DaySlot[] {
    return ALL_DAY_SLOTS.filter((slot) =>
      this.isSlotAvailable(course, slot, occupied),
    );
  }

  private availableSlotsOrdered(
    course: CourseInput,
    occupied: Map<BucketKey, TimeInterval[]>,
    dayLoad: Map<DayOfWeek, number>,
    timeSlotLoad: Map<string, number>,
  ): DaySlot[] {
    const slots = this.availableSlots(course, occupied);
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
        this.availableSlots(a, occupied).length -
        this.availableSlots(b, occupied).length,
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

    const occupied = this.buildInitialOccupancy(locked, allDepartmentCodes);
    const dayLoad = this.buildInitialDayLoad(locked);
    const timeSlotLoad = this.buildInitialTimeSlotLoad(locked);
    const sorted = this.sortByMostConstrained(courses, occupied);
    const assignments = new Map<string, ScheduleAssignment>();

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
