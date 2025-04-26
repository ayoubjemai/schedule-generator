import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
export class MaxConsecutiveHours {
  constructor(protected maxHours: number, protected minGapBeteweenActivity = 0) {}
  protected isValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    const activitiesByDay = ActivityHelper.groupActivitiesByDay(assignment, activities);
    for (const [_, dayActivities] of Object.entries(activitiesByDay)) {
      const consecutiveDurations = ActivityHelper.calculateConsecutiveActivityDurations(
        dayActivities,
        this.minGapBeteweenActivity
      );
      for (const durationInMinutes of consecutiveDurations) {
        const durationInHours = durationInMinutes / 60;
        if (durationInHours > this.maxHours) {
          return false;
        }
      }
    }
    return true;
  }
}
