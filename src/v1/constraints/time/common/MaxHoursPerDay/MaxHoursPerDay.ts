import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';

export class MaxHoursPerDay {
  constructor(protected maxMinutesPerDay: number) {}

  isValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    const activitiesByDay = ActivityHelper.groupActivitiesByDay(assignment, activities);
    let isValid = true;
    Object.values(activitiesByDay).forEach(dayActivities => {
      const totalMinutes = dayActivities.reduce((total, activity) => {
        const slot = assignment.getSlotForActivity(activity.activity.id);
        if (slot) return total + activity.activity.totalDurationInMinutes;

        return total;
      }, 0);

      if (totalMinutes > this.maxMinutesPerDay) {
        isValid = false;
      }
    });

    return isValid;
  }
}
