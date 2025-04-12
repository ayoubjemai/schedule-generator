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
    this.periods = [...studentSet.notAvailablePeriods];
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

      const { totalDurationInMinutes } = activity;
      for (let duration = 0; duration < totalDurationInMinutes; duration++) {
        const { hours, minutes } = convertMinutesToHoursAndMinutes(duration);
        const period: Period = {
          day: slot.day,
          hour: slot.hour + hours,
          minute: slot.minute + minutes,
        };

        if (
          this.periods.some(p => p.day === period.day && p.hour === period.hour && p.minute === period.minute)
        ) {
          return false;
        }
      }
    }

    return true;
  }
}
