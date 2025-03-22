import { Activity } from '../../models/Activity';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Constraint } from '../../types/constraints';
//import { TimetableAssignment } from '../../scheduler/TimetableAssignment';

export class ActivitiesNotOverlapping implements Constraint {
  type = 'ActivitiesNotOverlapping';
  weight: number;
  active: boolean;

  constructor(weight = 100, active = true) {
    this.weight = weight;
    this.active = active;
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const activityAssignments = assignment.getAllActivityAssignments();

    for (let i = 0; i < activityAssignments.length; i++) {
      for (let j = i + 1; j < activityAssignments.length; j++) {
        const activityA = activityAssignments[i];
        const activityB = activityAssignments[j];

        if (this.activitiesOverlap(assignment, activityA, activityB)) {
          return false;
        }
      }
    }

    return true;
  }

  private activitiesOverlap(
    assignment: TimetableAssignment,
    activityA: Activity,
    activityB: Activity
  ): boolean {
    const slotA = assignment.getSlotForActivity(activityA.id);
    const slotB = assignment.getSlotForActivity(activityB.id);

    if (!slotA || !slotB) return false;

    const endA = slotA.hour + activityA.totalDuration + slotA.minute / 60;
    const endB = slotB.hour + activityB.totalDuration + slotB.minute / 60;

    return (
      slotA.day === slotB.day &&
      ((slotA.hour < endB && endA > slotB.hour) || (slotB.hour < endA && endB > slotA.hour))
    );
  }
}
