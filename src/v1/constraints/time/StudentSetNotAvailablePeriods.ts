import { StudentSet } from '../../models/StudentSet';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Constraint } from '../../types/constraints';
import { Period } from '../../types/core';

export class StudentSetNotAvailablePeriods implements Constraint {
  type = 'StudentSetNotAvailablePeriods';
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  periods: Period[];

  constructor(studentSet: StudentSet, weight = 100, active = true) {
    this.studentSet = studentSet;
    this.weight = weight;
    this.active = active;
    this.periods = [...studentSet.notAvailablePeriods];
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const studentSetActivities = assignment.getActivitiesForStudentSet(this.studentSet.id);

    for (const activity of studentSetActivities) {
      const slot = assignment.getSlotForActivity(activity.id);
      if (!slot) continue;

      for (let i = 0; i < activity.totalDuration; i++) {
        const period: Period = {
          day: slot.day,
          hour: slot.hour + i,
          minute: slot.minute,
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
