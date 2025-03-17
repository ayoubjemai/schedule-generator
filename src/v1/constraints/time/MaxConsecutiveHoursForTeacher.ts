// filepath: /generate-schedule/generate-schedule/src/constraints/time/MaxConsecutiveHoursForTeacher.ts
import { TimeConstraint } from '../../models/interfaces';
import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
import { Teacher } from '../../models/Teacher';

class MaxConsecutiveHoursForTeacher implements TimeConstraint {
  type = 'MaxConsecutiveHoursForTeacher';
  weight: number;
  active: boolean;
  teacher: Teacher;
  maxHours: number;

  constructor(teacher: Teacher, maxHours: number, weight = 100, active = true) {
    this.teacher = teacher;
    this.maxHours = maxHours;
    this.weight = weight;
    this.active = active;
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    let consecutiveHours = 0;

    for (const activity of teacherActivities) {
      const slot = assignment.getSlotForActivity(activity.id);
      if (slot) {
        for (let i = 0; i < activity.totalDuration; i++) {
          const hour = slot.hour + i;
          if (assignment.getActivityAtSlot(slot.day, hour)) {
            consecutiveHours++;
          } else {
            consecutiveHours = 0; // Reset if there's a gap
          }

          if (consecutiveHours > this.maxHours) {
            return false; // Exceeds max consecutive hours
          }
        }
      }
    }

    return true;
  }
}

export { MaxConsecutiveHoursForTeacher };