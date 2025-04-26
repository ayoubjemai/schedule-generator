import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
export class MinDaysPerWeek {
  constructor(protected minDays: number) {}
  isValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    const workingDays = new Set<number>();
    for (const activity of activities) {
      const slot = assignment.getSlotForActivity(activity.id);
      if (slot) {
        workingDays.add(slot.day);
      }
    }
    return workingDays.size >= this.minDays;
  }
}
