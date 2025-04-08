import { ActivityHelper } from '../../../../helpers/activity.helper';
import { Activity } from '../../../models/Activity';
import { Teacher } from '../../../models/Teacher';
import { TimetableAssignment } from '../../../scheduler/TimetableAssignment';
import { Constraint } from '../../../types/constraints';
import { Period } from '../../../types/core';
import { DEFAULT_WEIGHT } from '../../../utils/defaultWeight';
import { ValidationError } from '../../../utils/ValidationError';
import { ConstraintType } from '../../constraintType.enum';

export class TeacherMinGapBetweenActivityTags implements Constraint {
  type = ConstraintType.time.teacher.TeacherMinGapBetweenActivityTags;
  weight: number;
  active: boolean;
  teacher: Teacher;
  activities: Activity[] = [];
  minGapPerMinutes: number;

  constructor(
    teacher: Teacher,
    private activityTag1: string,
    private activityTag2: string,
    weight = DEFAULT_WEIGHT,
    active = true
  ) {
    this.teacher = teacher;
    this.weight = weight;
    this.active = active;

    const minHoursDailyByTwoActivityTagPerMinutes = teacher.get('minHoursDailyActivityTagPerMinutes');

    const minDailyHoursBetweenActivities = minHoursDailyByTwoActivityTagPerMinutes.get(
      `${activityTag1}_${activityTag2}`
    );

    if (!minDailyHoursBetweenActivities) {
      throw new ValidationError(
        `Teacher ${teacher.name} has no minimum gap between activity tags ${activityTag1} and ${activityTag2}.`
      );
    }
    this.minGapPerMinutes = minDailyHoursBetweenActivities;
  }
  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);

    const teacherActivitiesByDay = ActivityHelper.groupActivitiesByDay(assignment, teacherActivities);

    for (const [_, teacherActivities] of Object.entries(teacherActivitiesByDay)) {
      if (!this.validateMinGapBetweenTags(teacherActivities)) {
        return false;
      }
    }

    return true;
  }

  private validateMinGapBetweenTags(activities: { activity: Activity; slot: Period }[]): boolean {
    const tag1 = this.activityTag1;
    const tag2 = this.activityTag2;
    const minGapMinutes = this.minGapPerMinutes;
    const tag1Activities = activities.filter(a => a.activity.activityTags.some(tag => tag.id === tag1));
    const tag2Activities = activities.filter(a => a.activity.activityTags.some(tag => tag.id === tag2));

    const sortedTag1 = ActivityHelper.sortActivitiesByTime(tag1Activities);
    const sortedTag2 = ActivityHelper.sortActivitiesByTime(tag2Activities);

    for (const activity1 of sortedTag1) {
      for (const activity2 of sortedTag2) {
        const gap =
          ActivityHelper.getStartTimeInMinutes(activity2) - ActivityHelper.getEndTimeInMinutes(activity1);
        if (gap < minGapMinutes) return false;
      }
    }

    return true;
  }
}
