import { Teacher } from '../../models/Teacher';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Constraint } from '../../types/constraints';
import { Period } from '../../types/core';
import { convertMinutesToHoursAndMinutes } from '../../utils/helper';

class TeacherNotAvailablePeriods implements Constraint {
  type = 'TeacherNotAvailablePeriods';
  weight: number;
  active: boolean;
  teacher: Teacher;
  periods: Period[];

  constructor(teacher: Teacher, weight = 100, active = true) {
    this.teacher = teacher;
    this.weight = weight;
    this.active = active;
    this.periods = [...teacher.notAvailablePeriods];
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);

    for (const activity of teacherActivities) {
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

export { TeacherNotAvailablePeriods };
