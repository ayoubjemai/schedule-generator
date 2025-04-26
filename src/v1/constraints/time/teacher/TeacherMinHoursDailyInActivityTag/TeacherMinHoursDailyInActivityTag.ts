import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { groupActivitiesByDay } from '../../../../utils/groupActivitiesByDay';
import { ValidationError } from '../../../../utils/ValidationError';
import { ConstraintType } from '../../../constraintType.enum';
class TeacherMinHoursDailyInActivityTag implements Constraint {
  type = ConstraintType.time.teacher.TeacherMinHoursDailyInActivityTag;
  weight: number;
  active: boolean;
  teacher: Teacher;
  activities: Activity[] = [];
  constructor(
    teacher: Teacher,
    private activityTagId: string,
    private minHourDaily: number,
    weight = DEFAULT_WEIGHT,
    active = true
  ) {
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
    const teacherActivitiesOfTag = teacherActivities.filter(activity => {
      return activity.activityTags.some(tag => tag.id === this.activityTagId);
    });
    teacherActivitiesOfTag.forEach(activity => {
      this.addActivity(activity);
    });
    const totalDurationInMinutes = teacherActivitiesOfTag.reduce((total, activity) => {
      return total + activity.totalDurationInMinutes;
    }, 0);
    const minMinutesDaily = this.minHourDaily * 60;
    if (totalDurationInMinutes < minMinutesDaily) {
      return false;
    }
    const teacherActivitiesByDay = ActivityHelper.groupActivitiesByDay(assignment, teacherActivitiesOfTag);
    let isTeacherDailyHoursBelowMinHours = false;
    for (const [_, activities] of Object.entries(teacherActivitiesByDay)) {
      const totalDurationInMinutes = activities.reduce((total, { activity }) => {
        return total + activity.totalDurationInMinutes;
      }, 0);
      if (totalDurationInMinutes < minMinutesDaily) {
        isTeacherDailyHoursBelowMinHours = true;
        break;
      }
    }
    return !isTeacherDailyHoursBelowMinHours;
  }
}
export { TeacherMinHoursDailyInActivityTag };
