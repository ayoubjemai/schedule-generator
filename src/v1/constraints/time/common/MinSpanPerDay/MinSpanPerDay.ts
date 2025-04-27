import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import { ValidationError } from '../../../../utils/ValidationError';

export class MinSpanPerDay {
  constructor(protected minSpanHours: number) {}

  isValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    const activitiesByDay: Record<number, { activity: Activity; slot: Period }[]> =
      ActivityHelper.groupActivitiesByDay(assignment, activities);

    let minSpanReached = false;

    for (const activitieByDay of Object.entries(activitiesByDay)) {
      const [_, activities] = activitieByDay;
      if (activities.length === 0) continue;

      const sortedActivities = this.sortActivitiesByTime(activities);
      const firstActivitySlot = sortedActivities[0].slot;
      const lastActivity = sortedActivities[sortedActivities.length - 1];
      const lastActivitySlot = lastActivity.slot;
      const duration = this.getDurationInMinutes([
        firstActivitySlot,
        { ...lastActivitySlot, totalDuraionInMinutes: lastActivity.activity.totalDurationInMinutes },
      ]);

      this.checkDurationValidity(duration, sortedActivities, firstActivitySlot, lastActivitySlot);
      const minSpan = this.minSpanHours * 60;
      if (duration < minSpan) {
        minSpanReached = true;
        break;
      }
    }
    return !minSpanReached;
  }

  private checkDurationValidity(
    duration: number,
    sortedActivities: { activity: Activity; slot: Period }[],
    firstActivitySlot: Period,
    lastActivitySlot: Period
  ) {
    if (duration < 0) {
      throw new ValidationError(
        `Invalid time period for activity ${sortedActivities[0].activity.name} (${firstActivitySlot.hour}:${firstActivitySlot.minute} - ${lastActivitySlot.hour}:${lastActivitySlot.minute})`
      );
    }
  }

  private sortActivitiesByTime(activities: { activity: Activity; slot: Period }[]): {
    activity: Activity;
    slot: Period;
  }[] {
    return activities.sort((a, b) => {
      const aTime = this.getStartTimeInMinutes(a);
      const bTime = this.getStartTimeInMinutes(b);
      return aTime - bTime;
    });
  }

  private getStartTimeInMinutes(activity: { activity: Activity; slot: Period }): number {
    return activity.slot.hour * 60 + activity.slot.minute;
  }

  private getDurationInMinutes(periods: [Period, Period & { totalDuraionInMinutes: number }]): number {
    const [start, end] = periods;
    return this.toMinutes(end) + end.totalDuraionInMinutes - this.toMinutes(start);
  }

  private toMinutes(p: Period): number {
    return p.day * 24 * 60 + p.hour * 60 + p.minute;
  }
}
