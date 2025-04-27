import { z } from 'zod';

const modelValidation = z.object({
  id: z.string(),
  name: z.string(),
});
export const validatePayload = z.object({
  dayCount: z.number().int(),
  periodsPerDay: z.number().int(),
  teachers: z.array(modelValidation),
  subjects: z.array(modelValidation),
  classes: z.array(modelValidation),
  rooms: z.array(modelValidation),
  activities: z.array(
    modelValidation.and(
      z.object({
        classes: z.array(z.string()),
        subject: z.string(),
        teachers: z.array(z.string()),
        totalDurationInMinutes: z.number().int(),
        preferredRooms: z.array(z.string()).optional(),
        preferredStartingTimes: z
          .array(z.object({ day: z.number().int(), hour: z.number().int(), minute: z.number().int() }))
          .optional(),
      })
    )
  ),
});
