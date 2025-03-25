import moment from 'moment';
import { Activity } from '../../../models/Activity';
import { TimetableAssignment } from '../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../utils/defaultWeight';
import { ConstraintType } from '../../constraintType.enum';

export class ActivitiesNotOverlapping implements Constraint {
  type = ConstraintType.time.activity.ActivitiesNotOverlapping;
  weight: number;
  active: boolean;

  constructor(weight = DEFAULT_WEIGHT, active = true) {
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

        if (this.checkActivityOverlap(assignment, activityA, activityB)) {
          return false;
        }
      }
    }

    return true;
  }

  private checkActivityOverlap(
    assignment: TimetableAssignment,
    activityA: Activity,
    activityB: Activity
  ): boolean {
    const slotA = assignment.getSlotForActivity(activityA.id);
    const slotB = assignment.getSlotForActivity(activityB.id);

    if (!slotA || !slotB) return false;

    const baseDate = moment().startOf('week');

    const startA = moment(baseDate)
      .add(slotA.day, 'days')
      .add(slotA.hour, 'hours')
      .add(slotA.minute, 'minutes');

    const endA = startA.add(activityA.totalDurationInMinutes, 'minutes');

    const startB = moment(baseDate)
      .add(slotB.day, 'days')
      .add(slotB.hour, 'hours')
      .add(slotB.minute, 'minutes');

    const endB = startB.add(activityB.totalDurationInMinutes, 'minutes');

    return startA.isBefore(endB) && startB.isBefore(endA);
  }
}
