import { Activity } from '../../../../models/Activity';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { Period } from '../../../../types/core';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { groupActivitiesByDay } from '../../../../utils/groupActivitiesByDay';
import { ConstraintType } from '../../../constraintType.enum';

//! This constraint checks if a teacher has a minimum number of hours of activities per day.
//! if the teacher has no activities, the constraint is satisfied.
//! maybe we should change it, idk
class TeacherMinHoursDaily implements Constraint {
  type = ConstraintType.time.teacher.TeacherMinHoursDaily;
  weight: number;
  active: boolean;
  teacher: Teacher;
  activities: Activity[] = [];

  constructor(teacher: Teacher, private minHoursDaily: number, weight = DEFAULT_WEIGHT, active = true) {
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
      throw new Error(
        `Teacher ${this.teacher.name} has only ${allTeacherDurationInMinutes} minutes of activities, but needs at least ${minDuration} minutes.`
      );
    }
    teacherActivities.forEach(activity => {
      this.addActivity(activity);
    });
    const teacherActivitiesByDay: Record<number, { activity: Activity; slot: Period }[]> =
      groupActivitiesByDay(assignment, teacherActivities);

    const durationInMinutesByDays: number[] = [];
    for (const [_, activities] of Object.entries(teacherActivitiesByDay)) {
      if (activities.length === 0) continue;
      const totalDuraionInMinutes = activities.reduce((acc, { activity }) => {
        return acc + activity.totalDurationInMinutes;
      }, 0);

      durationInMinutesByDays.push(totalDuraionInMinutes);
    }

    return durationInMinutesByDays.every(duration => duration >= minDuration);
  }
}

export { TeacherMinHoursDaily };
