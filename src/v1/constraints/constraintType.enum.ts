export const ConstraintType = {
  time: {
    activity: {
      PreferredStartingTimesForActivity: 'PreferredStartingTimesForActivity',
      ActivitiesNotOverlapping: 'ActivitiesNotOverlapping',
      MinGapsBetweenActivities: 'MinGapsBetweenActivities',
    },
    studentSet: {
      StudentSetNotAvailablePeriods: 'StudentSetNotAvailablePeriods',
    },
    teacher: {
      MaxConsecutiveHoursForTeacher: 'MaxConsecutiveHoursForTeacher',
      TeacherMaxDaysPerWeek: 'TeacherMaxDaysPerWeek',
      TeacherMinDaysPerWeek: 'TeacherMinDaysPerWeek',
      TeacherNotAvailablePeriods: 'TeacherNotAvailablePeriods',
      TeacherMaxGapPerDayBetweenActivities: 'TeacherMaxGapPerDayBetweenActivities',
      TeacherMinGapPerDayBetweenActivities: 'TeacherMinGapPerDayBetweenActivities',
      TeacherMaxHoursPerDay: 'TeacherMaxHoursPerDay',
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
