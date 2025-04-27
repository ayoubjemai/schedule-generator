import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { StudentSet } from '../../../../models/StudentSet';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { Period } from '../../../../types/core';
import { convertMinutesToHoursAndMinutes } from '../../../../utils/convertMinutesToHoursAndMinutes';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ConstraintType } from '../../../constraintType.enum';

export class StudentSetNotAvailablePeriods implements Constraint {
  type = ConstraintType.time.studentSet.StudentSetNotAvailablePeriods;
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  periods: Period[];
  activities: Activity[] = [];

  constructor(studentSet: StudentSet, weight = DEFAULT_WEIGHT, active = true) {
    this.studentSet = studentSet;
    this.weight = weight;
    this.active = active;
    this.periods = [...studentSet.get('notAvailablePeriods')];
  }
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const studentSetActivities = assignment.getActivitiesForStudentSet(this.studentSet.id);

    for (const activity of studentSetActivities) {
      this.addActivity(activity);
      const slot = assignment.getSlotForActivity(activity.id);
      if (!slot) continue;

      const startActivityInMinutes = ActivityHelper.getStartTimeInMinutes({ slot });
      const endActivityInMinutes = ActivityHelper.getEndTimeInMinutes({ slot, activity });
      const periodInMinuts = this.periods.map(p => ActivityHelper.getStartTimeInMinutes({ slot: p }));

      const isNotAvailable = periodInMinuts.some(period => {
        return period >= startActivityInMinutes && period <= endActivityInMinutes;
      });
      if (isNotAvailable) return false;
    }

    return true;
  }
}
