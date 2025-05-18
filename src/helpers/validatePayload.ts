import { z } from 'zod';

const modelValidation = z.object({
  id: z.string(),
  name: z.string(),
});
const validatePeriod = z.object({
  day: z.number().int(),
  hour: z.number().int(),
  minute: z.number().int().default(0),
});
export const validatePayload = z.object({
  dayCount: z.number().int(),
  periodsPerDay: z.number().int(),
  teachers: z.array(
    modelValidation.merge(
      z.object({
        notAvailableTimes: z.array(z.object({ day: z.number(), hour: z.number() })).optional(),
        notAvailablePeriods: z.array(validatePeriod).optional(),
        maxHoursContinuously: z.number().int().optional(),
        minRestingHours: z.number().int().optional(),
        minHoursDaily: z.number().int().optional(),
        maxHoursDaily: z.number().int().optional(),
        maxDailyMinutes: z.number().int().optional(),
        maxWeeklyMinutes: z.number().int().optional(),
        minDaysPerWeek: z.number().int().optional(),
        maxDaysPerWeek: z.number().int().optional(),
        maxGapPerDay: z.number().int().optional(),
        minGapPerDay: z.number().int().optional(),
        maxSpanPerDay: z.number().int().optional(),
      })
    )
  ),
  subjects: z.array(modelValidation),
  classes: z.array(
    modelValidation.merge(
      z.object({
        notAvailablePeriods: z.array(validatePeriod).optional(),
        notAvailableTimes: z.array(z.object({ day: z.number(), hour: z.number() })).optional(),
        maxHoursDaily: z.number().int().optional(),
        minHoursDaily: z.number().int().optional(),
        maxGapsPerDay: z.number().int().optional(),
        maxHoursContinuously: z.number().int().optional(),
        minDaysPerWeek: z.number().int().optional(),
        maxDaysPerWeek: z.number().int().optional(),
        maxSpanPerDay: z.number().int().optional(),
      })
    )
  ),
  rooms: z.array(
    modelValidation.merge(
      z.object({
        notAvailableTimes: z.array(z.object({ day: z.number(), hour: z.number() })).optional(),
        preferredFor: z.array(z.string()).optional(),
      })
    )
  ),
  activities: z.array(
    modelValidation.and(
      z.object({
        classes: z.array(z.string()),
        subject: z.string(),
        teachers: z.array(z.string()),
        totalDurationInMinutes: z.number().int(),
        preferredRooms: z.array(z.string()).optional(),
        preferredStartingTimes: z.array(validatePeriod).optional(),
        allowSplit: z.boolean().optional(),
        activityTags: z.array(z.string()).optional(),
      })
    )
  ),
  activityTags: z.array(modelValidation).optional(),
});
