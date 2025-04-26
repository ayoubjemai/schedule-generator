import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import { groupActivitiesByDay } from '../../../../utils/groupActivitiesByDay';
class MinHoursDaily {
  constructor(protected minHoursDaily: number) {}
  isValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    const minDuration = this.minHoursDaily * 60;
    const activitiesByDay: Record<number, { activity: Activity; slot: Period }[]> = groupActivitiesByDay(
      assignment,
      activities
    );
    const durationInMinutesByDays: number[] = [];
    for (const [_, activities] of Object.entries(activitiesByDay)) {
      if (activities.length === 0) continue;
      const totalDuraionInMinutes = activities.reduce((acc, { activity }) => {
        return acc + activity.totalDurationInMinutes;
      }, 0);
      durationInMinutesByDays.push(totalDuraionInMinutes);
    }
    return durationInMinutesByDays.every(duration => duration >= minDuration);
  }
}
export { MinHoursDaily };
