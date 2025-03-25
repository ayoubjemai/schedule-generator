import { Teacher } from '../../models/Teacher';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Constraint } from '../../types/constraints';
import { DEFAULT_WEIGHT } from '../../utils/defaultWeight';

export class TeacherMaxDaysPerWeek implements Constraint {
  type = 'TeacherMaxDaysPerWeek';
  weight: number;
  active: boolean;
  teacher: Teacher;
  maxDays: number;

  constructor(teacher: Teacher, maxDays: number, weight = DEFAULT_WEIGHT, active = true) {
    this.teacher = teacher;
    this.maxDays = maxDays;
    this.weight = weight;
    this.active = active;
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    const workingDays = new Set<number>();

    for (const activity of teacherActivities) {
      const slot = assignment.getSlotForActivity(activity.id);
      if (slot) {
        workingDays.add(slot.day);
      }
    }

    return workingDays.size <= this.maxDays;
  }
}
