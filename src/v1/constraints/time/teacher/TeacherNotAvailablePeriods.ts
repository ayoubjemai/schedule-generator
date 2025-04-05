import { Activity } from '../../../models/Activity';
import { Teacher } from '../../../models/Teacher';
import { TimetableAssignment } from '../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../types/constraints';
import { Period } from '../../../types/core';
import { convertMinutesToHoursAndMinutes } from '../../../utils/convertMinutesToHoursAndMinutes';
import { DEFAULT_WEIGHT } from '../../../utils/defaultWeight';
import { ConstraintType } from '../../constraintType.enum';

class TeacherNotAvailablePeriods implements Constraint {
  type = ConstraintType.time.teacher.TeacherNotAvailablePeriods;
  weight: number;
  active: boolean;
  teacher: Teacher;
  periods: Period[];
  activities: Activity[] = [];

  constructor(teacher: Teacher, weight = DEFAULT_WEIGHT, active = true) {
    this.teacher = teacher;
    this.weight = weight;
    this.active = active;
    this.periods = [...teacher.notAvailablePeriods];
  }
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);

    for (const activity of teacherActivities) {
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

export { TeacherNotAvailablePeriods };
