export const ConstraintType = {
  time: {
    activity: {
      PreferredStartingTimesForActivity: 'PreferredStartingTimesForActivity',
      ActivitiesNotOverlapping: 'ActivitiesNotOverlapping',
      MinGapsBetweenActivities: 'MinGapsBetweenActivities',
    },
    studentSet: {
      StudentSetNotAvailablePeriods: 'StudentSetNotAvailablePeriods',
      StudentSetMaxDaysPerWeek: 'StudentSetMaxDaysPerWeek',
  StudentSetMaxGapPerDay: 'StudentSetMaxGapPerDay',
  StudentSetMaxConsecutiveHours: 'StudentSetMaxConsecutiveHours',
  StudentSetMaxSpanPerDay: 'StudentSetMaxSpanPerDay',
},
    teacher: {
      MaxConsecutiveHoursForTeacher: 'MaxConsecutiveHoursForTeacher',
      MinConsecutiveHoursForTeacher: 'MinConsecutiveHoursForTeacher',
      TeacherMaxDaysPerWeek: 'TeacherMaxDaysPerWeek',
      TeacherMinDaysPerWeek: 'TeacherMinDaysPerWeek',
      TeacherNotAvailablePeriods: 'TeacherNotAvailablePeriods',
      TeacherMaxGapPerDayBetweenActivities: 'TeacherMaxGapPerDayBetweenActivities',
      TeacherMinGapPerDayBetweenActivities: 'TeacherMinGapPerDayBetweenActivities',
      TeacherMaxMinutesPerDay: 'TeacherMaxMinutesPerDay',
      TeacherMaxSpanPerDay: 'TeacherMaxSpanPerDay',
      TeacherMinHoursDaily: 'TeacherMinHoursDaily',
      TeacherMaxHoursContinouslyInActivityTag: 'TeacherMaxHoursContinouslyInActivityTag',
      TeacherMinHoursDailyInActivityTag: 'TeacherMinHoursDailyInActivityTag',
      TeacherMinGapBetweenActivityTags: 'TeacherMinGapBetweenActivityTags',
      TeacherMaxDayInIntervalHours: 'TeacherMaxDayInIntervalHours',
      TeacherMinRestinHours: 'TeacherMinRestinHours',
    },
  },
  space: {
    activity: {
      PreferredRoomsForActivity: 'PreferredRoomsForActivity',
    },
    room: {
      RoomNotAvailable: 'RoomNotAvailable',
      StudentSetMaxHoursPerDay: 'StudentSetMaxHoursPerDay',
},
  },
} as const;

export type ExtractTypeFromObject<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends string ? T[K] : ExtractTypeFromObject<T[K]>;
}[keyof T];

export type TConstraintType = ExtractTypeFromObject<typeof ConstraintType>;
