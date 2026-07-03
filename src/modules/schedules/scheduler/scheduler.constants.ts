import { DayOfWeek, Semester, SessionType } from '../../../generated/prisma';
export { SessionType };

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

export interface FixedFridayCourseSlot {
  courseCode: string;
  startTime: string;
  endTime: string;
  sessionType?: SessionType;
}

export const FRIDAY_FIXED_COURSE_SLOTS: Record<
  Semester,
  FixedFridayCourseSlot[]
> = {
  [Semester.FIRST]: [
    { courseCode: 'ESM101', startTime: '09:00', endTime: '12:00' },
    { courseCode: 'ESM401', startTime: '09:00', endTime: '12:00' },
    { courseCode: 'ESM501', startTime: '09:00', endTime: '12:00' },
    { courseCode: 'ENT211', startTime: '09:00', endTime: '12:00' },
    { courseCode: 'ENT311', startTime: '09:00', endTime: '12:00' },
    { courseCode: 'ESM301', startTime: '13:00', endTime: '15:00' },
    { courseCode: 'ESM201', startTime: '13:00', endTime: '15:00' },
    {
      courseCode: 'GST401',
      startTime: '13:00',
      endTime: '15:00',
      sessionType: SessionType.PRACTICAL,
    },
    {
      courseCode: 'GST501',
      startTime: '13:00',
      endTime: '15:00',
      sessionType: SessionType.PRACTICAL,
    },
    { courseCode: 'SDN101', startTime: '13:00', endTime: '15:00' },
  ],
  [Semester.SECOND]: [
    { courseCode: 'ESM102', startTime: '09:00', endTime: '12:00' },
    { courseCode: 'ESM402', startTime: '09:00', endTime: '12:00' },
    { courseCode: 'ESM502', startTime: '09:00', endTime: '12:00' },
    { courseCode: 'ENT212', startTime: '09:00', endTime: '12:00' },
    { courseCode: 'ENT312', startTime: '09:00', endTime: '12:00' },
    { courseCode: 'ESM302', startTime: '13:00', endTime: '15:00' },
    { courseCode: 'ESM202', startTime: '13:00', endTime: '15:00' },
    {
      courseCode: 'GST402',
      startTime: '13:00',
      endTime: '15:00',
      sessionType: SessionType.PRACTICAL,
    },
    {
      courseCode: 'GST502',
      startTime: '13:00',
      endTime: '15:00',
      sessionType: SessionType.PRACTICAL,
    },
    { courseCode: 'SDN102', startTime: '13:00', endTime: '15:00' },
  ],
};

export function findFixedFridayCourseSlot(
  courseCode: string,
  semester: Semester,
): FixedFridayCourseSlot | undefined {
  const normalizedCode = courseCode.toUpperCase();
  return FRIDAY_FIXED_COURSE_SLOTS[semester].find(
    (slot) => slot.courseCode === normalizedCode,
  );
}

export const ESM_COURSE_CODE_PATTERN = /^ESM/i;
export const GST_COURSE_CODE_PATTERN = /^GST/i;
export const ENT_COURSE_CODE_PATTERN = /^ENT/i;
export const PIF_COURSE_CODE_PATTERN = /^PIF/i;
export const SDN_COURSE_CODE_PATTERN = /^SDN/i;
