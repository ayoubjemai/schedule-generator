import { ActivityHelper } from '../../../../../helpers/activity.helper';
import { Activity } from '../../../../models/Activity';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../../types/constraints';
import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';
import { groupActivitiesByDay } from '../../../../utils/groupActivitiesByDay';
import { ConstraintType } from '../../../constraintType.enum';

class TeacherMaxHoursContinouslyInActivityTag implements Constraint {
  type = ConstraintType.time.teacher.TeacherMaxHoursContinouslyInActivityTag;
  weight: number;
  active: boolean;
  teacher: Teacher;
  activities: Activity[] = [];
  private MIN_GAP_MINUTES: number;

  constructor(
    teacher: Teacher,
    private activityTagId: string,
    private maxHourContinously: number,
    weight = DEFAULT_WEIGHT,
    active = true
  ) {
    this.teacher = teacher;
    this.weight = weight;
    this.active = active;
    this.MIN_GAP_MINUTES = teacher.get('minGapsPerDay') || 0;
  }

  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;
    const maxContinuousMinutes = this.maxHourContinously * 60;
    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
    let isMaxContinuouslyHoursReached = false;
    const teacherActivitieByDays = groupActivitiesByDay(assignment, teacherActivities);
    for (const [_, activities] of Object.entries(teacherActivitieByDays)) {
      const filterdActivities = activities.filter(activity =>
        activity.activity.activityTags.some(tag => tag.id === this.activityTagId)
      );
      filterdActivities.forEach(activity => {
        this.addActivity(activity.activity);
      });

      const totalDurationsInMinutes = ActivityHelper.calculateConsecutiveActivityDurations(
        filterdActivities,
        this.MIN_GAP_MINUTES
      );

      const exceedsMaxContinuousDuration = totalDurationsInMinutes.some(
        duration => duration > maxContinuousMinutes
      );
      if (exceedsMaxContinuousDuration) {
        isMaxContinuouslyHoursReached = true;
      }
    }

    return !isMaxContinuouslyHoursReached;
  }
}

export { TeacherMaxHoursContinouslyInActivityTag };
