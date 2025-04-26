import { Activity } from '../v1/models/Activity';
import { TimetableAssignment } from '../v1/scheduler/TimetableAssignment';
import { Period } from '../v1/types/core';
export class ActivityHelper {
  static groupActivitiesByDay = (
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
  static calculateConsecutiveActivityDurations(
    activities: { activity: Activity; slot: Period }[],
    MIN_GAP_MINUTES = 0
  ): number[] {
    if (activities.length === 0) return [];
    const sortedActivities = this.sortActivitiesByTime([...activities]);
    const totalDurations: number[] = [];
    let currentGroupDuration = sortedActivities[0].activity.totalDurationInMinutes;
    let previousEndTime = this.getEndTimeInMinutes(sortedActivities[0]);
    for (let i = 1; i < sortedActivities.length; i++) {
      const currentActivity = sortedActivities[i];
      const currentStartTime = this.getStartTimeInMinutes(currentActivity);
      const gap = currentStartTime - previousEndTime;
      if (gap <= MIN_GAP_MINUTES) {
        currentGroupDuration += currentActivity.activity.totalDurationInMinutes;
      } else {
        totalDurations.push(currentGroupDuration);
        currentGroupDuration = currentActivity.activity.totalDurationInMinutes;
      }
      previousEndTime = this.getEndTimeInMinutes(currentActivity);
    }
    totalDurations.push(currentGroupDuration);
    return totalDurations;
  }
  static getStartTimeInMinutes(activity: { slot: Period }): number {
    return activity.slot.day * 60 * 24 + activity.slot.hour * 60 + activity.slot.minute;
  }
  static getEndTimeInMinutes(activity: {
    activity: { totalDurationInMinutes: number };
    slot: Period;
  }): number {
    return this.getStartTimeInMinutes(activity) + activity.activity.totalDurationInMinutes;
  }
  static sortActivitiesByTime(activities: { activity: Activity; slot: Period }[]): {
    activity: Activity;
    slot: Period;
  }[] {
    return activities.sort((a, b) => {
      const aTime = this.getStartTimeInMinutes(a);
      const bTime = this.getStartTimeInMinutes(b);
      return aTime - bTime;
    });
  }
}
