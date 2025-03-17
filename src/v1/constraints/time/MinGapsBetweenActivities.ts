import { TimeConstraint } from '../../models/interfaces';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';

export class MinGapsBetweenActivities implements TimeConstraint {
  type = 'MinGapsBetweenActivities';
  weight: number;
  active: boolean;
  minGaps: number;

  constructor(minGaps: number, weight = 100, active = true) {
    this.minGaps = minGaps;
    this.weight = weight;
    this.active = active;
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const activities = assignment.getAllActivityAssignments();

    for (let i = 0; i < activities.length; i++) {
      const activityA = activities[i];
      const slotA = assignment.getSlotForActivity(activityA.id);

      if (!slotA) continue;

      for (let j = i + 1; j < activities.length; j++) {
        const activityB = activities[j];
        const slotB = assignment.getSlotForActivity(activityB.id);

        if (!slotB) continue;

        const gap = Math.abs(slotA.hour - slotB.hour);
        if (gap < this.minGaps) {
          return false;
        }
      }
    }

    return true;
  }
}
