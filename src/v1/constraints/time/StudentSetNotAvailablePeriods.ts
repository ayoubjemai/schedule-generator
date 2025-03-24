import { StudentSet } from '../../models/StudentSet';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Constraint } from '../../types/constraints';
import { Period } from '../../types/core';
import { convertMinutesToHoursAndMinutes } from '../../utils/helper';

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

      const { hours, minutes } = convertMinutesToHoursAndMinutes(activity.totalDurationInMinutes);
      for (let hour = 0; hour < hours; hour++) {
        for (let min = 0; min < minutes; min++) {
          const period: Period = {
            day: slot.day,
            hour: slot.hour + hour,
            minute: slot.minute + min,
          };

          if (
            this.periods.some(
              p => p.day === period.day && p.hour === period.hour && p.minute === period.minute
            )
          ) {
            return false;
          }
        }
      }
    }

    return true;
  }
}
