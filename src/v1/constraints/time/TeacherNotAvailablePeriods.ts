import { TimeConstraint, Period } from '../../models/interfaces';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Teacher } from '../../models/Teacher';

class TeacherNotAvailablePeriods implements TimeConstraint {
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

      for (let i = 0; i < activity.totalDuration; i++) {
        const period: Period = {
          day: slot.day,
          hour: slot.hour + i,
        };

        if (this.periods.some(p => p.day === period.day && p.hour === period.hour)) {
          return false;
        }
      }
    }

    return true;
  }
}

export { TeacherNotAvailablePeriods };