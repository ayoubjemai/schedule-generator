import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { groupActivitiesByDay } from '../../../../utils/groupActivitiesByDay';
class MaxHoursContinouslyInActivityTag {
  constructor(protected maxHourContinously: number, protected activityTagId: string) {}
  protected isValid(
    assignment: TimetableAssignment,
    activities: Activity[],
    addActivity: { (activity: Activity): void },
    MIN_GAP_MINUTES: number
  ): boolean {
    const maxContinuousMinutes = this.maxHourContinously * 60;
    let isMaxContinuouslyHoursReached = false;
    const activitieByDays = groupActivitiesByDay(assignment, activities);
    for (const [_, activities] of Object.entries(activitieByDays)) {
      const filterdActivities = activities.filter(activity =>
        activity.activity.activityTags.some(tag => tag.id === this.activityTagId)
      );
      filterdActivities.forEach(activity => {
        addActivity(activity.activity);
      });
      const totalDurationsInMinutes = ActivityHelper.calculateConsecutiveActivityDurations(
        filterdActivities,
        MIN_GAP_MINUTES
      );
      const exceedsMaxContinuousDuration = totalDurationsInMinutes.some(
        duration => duration > maxContinuousMinutes
      );
      if (exceedsMaxContinuousDuration) {
        isMaxContinuouslyHoursReached = true;
      }
    }
    return !isMaxContinuouslyHoursReached;
  }
}
export { MaxHoursContinouslyInActivityTag };
