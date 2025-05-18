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
      StudentSetMaxHoursPerDay: 'StudentSetMaxHoursPerDay',
      StudentSetMaxConsecutiveHours: 'StudentSetMaxConsecutiveHours',
      StudentSetMaxSpanPerDay: 'StudentSetMaxSpanPerDay',
      StudentSetMinHoursDaily: 'StudentSetMinHoursDaily',
      StudentSetMaxHoursContinuouslyInActivityTag: 'StudentSetMaxHoursContinuouslyInActivityTag',
      StudentSetMinDaysPerWeek: 'StudentSetMinDaysPerWeek',
      StudentSetMinGapPerDay: 'StudentSetMinGapPerDay',
      StudentSetMinSpanPerDay: 'StudentSetMinSpanPerDay',
      StudentSetMinHoursContinouslyInActivityTag: 'StudentSetMinHoursContinouslyInActivityTag',
      StudentSetNotOverlapping: 'StudentSetNotOverlapping',
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
      TeacherMinRestingHours: 'TeacherMinRestingHours',
      TeacherMinHourContinouslyInActivityTag: 'TeacherMinHourContinouslyInActivityTag',
      TeachersNotOverlapping: 'TeachersNotOverlapping',
    },

    room: {
      RoomNotOverlapping: 'RoomNotOverlapping',
    },
  },
  space: {
    activity: {
      PreferredRoomsForActivity: 'PreferredRoomsForActivity',
    },
    room: {
      RoomNotAvailable: 'RoomNotAvailable',
    },
  },
} as const;

export type ExtractTypeFromObject<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends string ? T[K] : ExtractTypeFromObject<T[K]>;
}[keyof T];

export type TConstraintType = ExtractTypeFromObject<typeof ConstraintType>;
