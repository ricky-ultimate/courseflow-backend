import { DayOfWeek, Level } from '../../../generated/prisma';

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
  { startTime: '09:00', endTime: '12:00' },
  { startTime: '10:00', endTime: '13:00' },
  { startTime: '11:00', endTime: '14:00' },
  { startTime: '12:00', endTime: '15:00' },
  { startTime: '13:00', endTime: '16:00' },
  { startTime: '14:00', endTime: '17:00' },
  { startTime: '15:00', endTime: '18:00' },
  { startTime: '16:00', endTime: '19:00' },
];

export const WEDNESDAY_TIME_SLOTS: TimeSlot[] = [
  { startTime: '09:00', endTime: '11:00' },
  { startTime: '10:00', endTime: '12:00' },
  { startTime: '11:00', endTime: '13:00' },
  { startTime: '12:00', endTime: '14:00' },
  { startTime: '13:00', endTime: '15:00' },
  { startTime: '09:00', endTime: '12:00' },
  { startTime: '10:00', endTime: '13:00' },
  { startTime: '11:00', endTime: '14:00' },
  { startTime: '12:00', endTime: '15:00' },
];

export const WEEKDAYS_ONLY: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
];

export const SLOTS_BY_DAY: Partial<Record<DayOfWeek, TimeSlot[]>> = {
  [DayOfWeek.MONDAY]: BASE_TIME_SLOTS,
  [DayOfWeek.TUESDAY]: BASE_TIME_SLOTS,
  [DayOfWeek.WEDNESDAY]: WEDNESDAY_TIME_SLOTS,
  [DayOfWeek.THURSDAY]: BASE_TIME_SLOTS,
  [DayOfWeek.FRIDAY]: BASE_TIME_SLOTS,
};

export const DEPARTMENTAL_DAY_SLOTS: DaySlot[] = WEEKDAYS_ONLY.flatMap((day) =>
  (SLOTS_BY_DAY[day] ?? []).map((slot) => ({ day, ...slot })),
);

export const FRIDAY_UNIVERSITY_SLOTS: Record<
  string,
  {
    esm?: TimeSlot;
    gstEnt?: TimeSlot;
    sdn?: TimeSlot;
  }
> = {
  LEVEL_100: {
    esm: { startTime: '09:00', endTime: '11:00' },
  },
  LEVEL_200: {
    esm: { startTime: '09:00', endTime: '11:00' },
    gstEnt: { startTime: '11:00', endTime: '13:00' },
  },
  LEVEL_300: {
    esm: { startTime: '09:00', endTime: '11:00' },
    gstEnt: { startTime: '11:00', endTime: '13:00' },
  },
  LEVEL_400: {
    esm: { startTime: '09:00', endTime: '11:00' },
    gstEnt: { startTime: '11:00', endTime: '13:00' },
    sdn: { startTime: '13:00', endTime: '15:00' },
  },
  LEVEL_500: {
    esm: { startTime: '09:00', endTime: '11:00' },
    sdn: { startTime: '11:00', endTime: '13:00' },
  },
};

export const GST_ENT_FRIDAY_CODES: Set<string> = new Set([
  'GST201',
  'GST202',
  'GST301',
  'GST302',
  'GST401',
  'GST402',
  'ENT201',
  'ENT202',
  'ENT301',
  'ENT302',
  'ENT401',
  'ENT402',
]);

export const SDN_FRIDAY_ELIGIBLE_LEVELS: Level[] = [
  Level.LEVEL_400,
  Level.LEVEL_500,
];

export const ESM_COURSE_CODE_PATTERN = /^ESM/i;
export const GST_COURSE_CODE_PATTERN = /^GST/i;
export const ENT_COURSE_CODE_PATTERN = /^ENT/i;
export const PIF_COURSE_CODE_PATTERN = /^PIF/i;
export const SDN_COURSE_CODE_PATTERN = /^SDN/i;
