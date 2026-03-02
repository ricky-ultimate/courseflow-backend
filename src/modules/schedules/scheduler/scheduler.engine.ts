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
}

export interface ScheduleAssignment {
  courseCode: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  semester: Semester;
}

type OccupancyKey = string;

@Injectable()
export class SchedulerEngine {
  private occupancyKey(
    departmentCode: string,
    level: Level,
    day: DayOfWeek,
    startTime: string,
  ): OccupancyKey {
    return `${departmentCode}|${level}|${day}|${startTime}`;
  }

  private buildInitialOccupancy(locked: LockedSlot[]): Set<OccupancyKey> {
    const occupied = new Set<OccupancyKey>();
    for (const slot of locked) {
      occupied.add(
        this.occupancyKey(
          slot.departmentCode,
          slot.level,
          slot.dayOfWeek,
          slot.startTime,
        ),
      );
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

  private availableSlots(
    course: CourseInput,
    occupied: Set<OccupancyKey>,
  ): DaySlot[] {
    return ALL_DAY_SLOTS.filter(
      (slot) =>
        !occupied.has(
          this.occupancyKey(
            course.departmentCode,
            course.level,
            slot.day,
            slot.startTime,
          ),
        ),
    );
  }

  private availableSlotsOrdered(
    course: CourseInput,
    occupied: Set<OccupancyKey>,
    dayLoad: Map<DayOfWeek, number>,
  ): DaySlot[] {
    const slots = this.availableSlots(course, occupied);
    return slots.sort(
      (a, b) => (dayLoad.get(a.day) ?? 0) - (dayLoad.get(b.day) ?? 0),
    );
  }

  private sortByMostConstrained(
    courses: CourseInput[],
    occupied: Set<OccupancyKey>,
  ): CourseInput[] {
    return [...courses].sort(
      (a, b) =>
        this.availableSlots(a, occupied).length -
        this.availableSlots(b, occupied).length,
    );
  }

  private solve(
    courses: CourseInput[],
    index: number,
    assignments: Map<string, ScheduleAssignment>,
    occupied: Set<OccupancyKey>,
    dayLoad: Map<DayOfWeek, number>,
  ): boolean {
    if (index === courses.length) return true;

    const course = courses[index];
    const slots = this.availableSlotsOrdered(course, occupied, dayLoad);

    for (const slot of slots) {
      const key = this.occupancyKey(
        course.departmentCode,
        course.level,
        slot.day,
        slot.startTime,
      );

      assignments.set(course.courseCode, {
        courseCode: course.courseCode,
        dayOfWeek: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        semester: course.semester,
      });
      occupied.add(key);
      dayLoad.set(slot.day, (dayLoad.get(slot.day) ?? 0) + 1);

      if (this.solve(courses, index + 1, assignments, occupied, dayLoad)) {
        return true;
      }

      assignments.delete(course.courseCode);
      occupied.delete(key);
      dayLoad.set(slot.day, (dayLoad.get(slot.day) ?? 0) - 1);
    }

    return false;
  }

  generate(courses: CourseInput[], locked: LockedSlot[]): ScheduleAssignment[] {
    if (courses.length === 0) return [];

    const occupied = this.buildInitialOccupancy(locked);
    const dayLoad = this.buildInitialDayLoad(locked);
    const sorted = this.sortByMostConstrained(courses, occupied);
    const assignments = new Map<string, ScheduleAssignment>();

    const solved = this.solve(sorted, 0, assignments, occupied, dayLoad);

    if (!solved) {
      const unscheduled = sorted
        .filter((c) => !assignments.has(c.courseCode))
        .map((c) => c.courseCode);

      throw new UnprocessableEntityException(
        `Scheduler could not find valid slots for: ${unscheduled.join(', ')}. ` +
          `Try reducing the number of courses per department/level or contact an administrator.`,
      );
    }

    return Array.from(assignments.values());
  }
}
