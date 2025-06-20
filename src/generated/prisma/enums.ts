
/* !!! This is code generated by Prisma. Do not edit directly. !!! */
/* eslint-disable */
// @ts-nocheck 
/**
* This file exports all enum related types from the schema.
*
* 🟢 You can import this file directly.
*/
export const Role = {
  STUDENT: 'STUDENT',
  LECTURER: 'LECTURER',
  ADMIN: 'ADMIN'
} as const

export type Role = (typeof Role)[keyof typeof Role]


export const Level = {
  LEVEL_100: 'LEVEL_100',
  LEVEL_200: 'LEVEL_200',
  LEVEL_300: 'LEVEL_300',
  LEVEL_400: 'LEVEL_400',
  LEVEL_500: 'LEVEL_500'
} as const

export type Level = (typeof Level)[keyof typeof Level]


export const DayOfWeek = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY'
} as const

export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek]


export const ComplaintStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
} as const

export type ComplaintStatus = (typeof ComplaintStatus)[keyof typeof ComplaintStatus]


export const ClassType = {
  LECTURE: 'LECTURE',
  SEMINAR: 'SEMINAR',
  LAB: 'LAB',
  TUTORIAL: 'TUTORIAL'
} as const

export type ClassType = (typeof ClassType)[keyof typeof ClassType]
