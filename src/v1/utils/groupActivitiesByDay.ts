import { Activity } from '../models/Activity';
import { TimetableAssignment } from '../scheduler/TimetableAssignment';
import { Period } from '../types/core';
export const groupActivitiesByDay = (
  assignment: TimetableAssignment,
  activities: Activity[]
): Record<number, { activity: Activity; slot: Period }[]> => {
  const activitiesByDay: Record<number, { activity: Activity; slot: Period }[]> = activities.reduce(
    (acc, activity) => {
      const slot = assignment.getSlotForActivity(activity.id);
      if (!slot) return acc;
      if (!acc[slot.day]) {
        acc[slot.day] = [];
      }
      acc[slot.day].push({ activity, slot });
      return acc;
    },
    {} as Record<number, { activity: Activity; slot: Period }[]>
  );
  return activitiesByDay;
};
