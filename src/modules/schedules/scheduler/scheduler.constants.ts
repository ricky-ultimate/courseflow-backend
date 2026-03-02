import { DayOfWeek } from '../../../generated/prisma';

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface DaySlot extends TimeSlot {
  day: DayOfWeek;
}

export const BASE_TIME_SLOTS: TimeSlot[] = [
  { startTime: '09:00', endTime: '11:00' },
  { startTime: '10:00', endTime: '12:00' },
  { startTime: '11:00', endTime: '13:00' },
  { startTime: '12:00', endTime: '14:00' },
  { startTime: '13:00', endTime: '15:00' },
  { startTime: '14:00', endTime: '16:00' },
  { startTime: '15:00', endTime: '17:00' },
  { startTime: '16:00', endTime: '18:00' },
  { startTime: '17:00', endTime: '19:00' },
];

export const WEDNESDAY_TIME_SLOTS: TimeSlot[] = [
  { startTime: '09:00', endTime: '11:00' },
  { startTime: '10:00', endTime: '12:00' },
  { startTime: '11:00', endTime: '13:00' },
  { startTime: '12:00', endTime: '14:00' },
  { startTime: '13:00', endTime: '15:00' },
];

export const VALID_DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

export const SLOTS_BY_DAY: Partial<Record<DayOfWeek, TimeSlot[]>> = {
  [DayOfWeek.MONDAY]: BASE_TIME_SLOTS,
  [DayOfWeek.TUESDAY]: BASE_TIME_SLOTS,
  [DayOfWeek.WEDNESDAY]: WEDNESDAY_TIME_SLOTS,
  [DayOfWeek.THURSDAY]: BASE_TIME_SLOTS,
  [DayOfWeek.FRIDAY]: BASE_TIME_SLOTS,
};

export const ALL_DAY_SLOTS: DaySlot[] = VALID_DAYS.flatMap((day) =>
  (SLOTS_BY_DAY[day] ?? []).map((slot) => ({ day, ...slot })),
);
