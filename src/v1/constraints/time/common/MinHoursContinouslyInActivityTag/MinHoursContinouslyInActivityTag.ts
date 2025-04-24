import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { groupActivitiesByDay } from '../../../../utils/groupActivitiesByDay';

class MinHoursContinouslyInActivityTag {
  constructor(protected minHourContinously: number, protected activityTagId: string) {}

  protected isValid(
    assignment: TimetableAssignment,
    activities: Activity[],
    addActivity: { (activity: Activity): void },
    MIN_GAP_MINUTES: number
  ): boolean {
    const minContinuousMinutes = this.minHourContinously * 60;
    let isMinContinuouslyHoursReached = false;
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

      const exceedsMinContinuousDuration = totalDurationsInMinutes.some(
        duration => duration < minContinuousMinutes
      );
      if (exceedsMinContinuousDuration) {
        isMinContinuouslyHoursReached = true;
      }
    }

    return !isMinContinuouslyHoursReached;
  }
}

export { MinHoursContinouslyInActivityTag };
