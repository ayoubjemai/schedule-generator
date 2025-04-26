import { Activity } from '../../../../models/Activity';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { Period } from '../../../../types/core';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { groupActivitiesByDay } from '../../../../utils/groupActivitiesByDay';
import { ValidationError } from '../../../../utils/ValidationError';
import { ConstraintType } from '../../../constraintType.enum';
import { MaxSpanPerDay } from '../../common/MaxSpanPerDay/MaxSpanPerDay';
class TeacherMaxSpanPerDay extends MaxSpanPerDay implements Constraint {
  type = ConstraintType.time.teacher.TeacherMaxSpanPerDay;
  weight: number;
  active: boolean;
  teacher: Teacher;
  activities: Activity[] = [];
  constructor(teacher: Teacher, protected maxSpanHours: number, weight = DEFAULT_WEIGHT, active = true) {
    super(maxSpanHours);
    this.teacher = teacher;
    this.weight = weight;
    this.active = active;
  }
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }
  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;
    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    teacherActivities.forEach(activity => {
      this.addActivity(activity);
    });
    return this.isValid(assignment, teacherActivities);
  }
}
export { TeacherMaxSpanPerDay };
