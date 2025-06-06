import { Activity } from '../../../../models/Activity';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { ValidationError } from '../../../../utils/ValidationError';
import { ConstraintType } from '../../../constraintType.enum';
import { MinHoursDaily } from '../../common/MinHoursDaily/MinHoursDaily';

//! This constraint checks if a teacher has a minimum number of hours of activities per day.
//! if the teacher has no activities, the constraint is satisfied.
//! maybe we should change it, idk
class TeacherMinHoursDaily extends MinHoursDaily implements Constraint {
  type = ConstraintType.time.teacher.TeacherMinHoursDaily;
  weight: number;
  active: boolean;
  teacher: Teacher;
  activities: Activity[] = [];

  constructor(teacher: Teacher, protected minHoursDaily: number, weight = DEFAULT_WEIGHT, active = true) {
    super(minHoursDaily);
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

    const allTeacherDurationInMinutes = teacherActivities.reduce((acc, activity) => {
      return acc + activity.totalDurationInMinutes;
    }, 0);

    const minDuration = this.minHoursDaily * 60;
    if (allTeacherDurationInMinutes < minDuration) {
      return false;
    }
    teacherActivities.forEach(activity => {
      this.addActivity(activity);
    });

    return this.isValid(assignment, teacherActivities);
  }
}

export { TeacherMinHoursDaily };
