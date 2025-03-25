import { StudentSet } from '../../models/StudentSet';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Constraint } from '../../types/constraints';
import { Period } from '../../types/core';
import { convertMinutesToHoursAndMinutes } from '../../utils/convertMinutesToHoursAndMinutes';
import { DEFAULT_WEIGHT } from '../../utils/defaultWeight';

export class StudentSetNotAvailablePeriods implements Constraint {
  type = 'StudentSetNotAvailablePeriods';
  weight: number;
  active: boolean;
  studentSet: StudentSet;
  periods: Period[];

  constructor(studentSet: StudentSet, weight = DEFAULT_WEIGHT, active = true) {
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
