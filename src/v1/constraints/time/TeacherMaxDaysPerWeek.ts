export class TeacherMaxDaysPerWeek implements TimeConstraint {
  type = 'TeacherMaxDaysPerWeek';
  weight: number;
  active: boolean;
  teacher: Teacher;
  maxDays: number;

  constructor(teacher: Teacher, maxDays: number, weight = 100, active = true) {
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