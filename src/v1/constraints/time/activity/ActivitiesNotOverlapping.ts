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
  activities: Activity[] = [];

  constructor(weight = DEFAULT_WEIGHT, active = true) {
    this.weight = weight;
    this.active = active;
  }
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const activityAssignments = assignment.getAllActivityAssignments();

    for (let i = 0; i < activityAssignments.length; i++) {
      const activityA = activityAssignments[i];
      this.addActivity(activityA);
      for (let j = i + 1; j < activityAssignments.length; j++) {
        const activityB = activityAssignments[j];
        if (activityA.id === activityB.id) continue;
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

    const endA = startA.clone().add(activityA.totalDurationInMinutes, 'minutes');

    const startB = moment(baseDate)
      .add(slotB.day, 'days')
      .add(slotB.hour, 'hours')
      .add(slotB.minute, 'minutes');

    const endB = startB.clone().add(activityB.totalDurationInMinutes, 'minutes');

    return startA.isBefore(endB) && startB.isBefore(endA);
  }
}
