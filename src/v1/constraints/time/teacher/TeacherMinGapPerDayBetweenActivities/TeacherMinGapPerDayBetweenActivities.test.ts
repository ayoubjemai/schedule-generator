import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { TeacherMinGapPerDayBetweenActivities } from './TeacherMinGapPerDayBetweenActivities';

describe('TeacherMinGapPerDayBetweenActivities', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_GAP_MINUTES = 30; // 30 minutes minimum gap between activities

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMinGapPerDayBetweenActivities;
  let room: Room;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    teacher = new Teacher('t1', 'John Doe');

    // Create activities for testing
    activities = [];
    for (let i = 0; i < 6; i++) {
      const activity = new Activity(`a${i + 1}`, `Math Activity ${i + 1}`, subject, 60); // Each activity is 60 minutes
      activity.teachers.push(teacher);
      activities.push(activity);
    }

    room = new Room('r1', 'Classroom 101', 30);

    constraint = new TeacherMinGapPerDayBetweenActivities(teacher, MIN_GAP_MINUTES);
  });

  it('should be satisfied when no activities are assigned to the teacher', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when only one activity is assigned to the teacher per day', () => {
    // Assign one activity per day for three days
    for (let day = 0; day < 3; day++) {
      assignment.assignActivity(activities[day], { day, hour: 9, minute: 0 }, room.id);
    }

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when multiple activities with sufficient gap are assigned', () => {
    // Day 0: Two activities with 60 minutes gap (greater than MIN_GAP_MINUTES)
    // Activity 1: 8:00-9:00
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    // Activity 2: 10:00-11:00 (60 minutes gap after Activity 1)
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when activities have insufficient gap', () => {
    // Day 0: Two activities with only 20 minutes gap (less than MIN_GAP_MINUTES)
    // Activity 1: 8:00-9:00
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    // Activity 2: 9:20-10:20 (20 minutes gap after Activity 1)
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 20 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should evaluate each day independently', () => {
    // Day 0: Activities with sufficient gap (60 minutes)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    // Day 1: Activities with insufficient gap (20 minutes)
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 9, minute: 20 }, room.id);

    // Overall constraint should not be satisfied because of Day 1
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should correctly handle overlapping activities', () => {
    // Two overlapping activities
    // Activity 1: 8:00-9:00
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    // Activity 2: 8:30-9:30 (overlaps with Activity 1)
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 30 }, room.id);

    // Overlapping activities have a gap of 0, which is less than MIN_GAP_MINUTES
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should check all pairs of activities in a day', () => {
    // Activity 1: 8:00-9:00
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    // Activity 2: 10:00-11:00 (60 minutes gap after Activity 1 - sufficient)
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    // Activity 3: 11:20-12:20 (20 minutes gap after Activity 2 - insufficient)
    assignment.assignActivity(activities[2], { day: 0, hour: 11, minute: 20 }, room.id);

    // Even though the gap between Activity 1 and 2 is sufficient,
    // the gap between Activity 2 and 3 is insufficient
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should correctly calculate gap when activities are in different order', () => {
    // Activities assigned out of chronological order
    // Activity 2: 10:00-11:00
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    // Activity 1: 8:00-9:00 (added later but happens earlier)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);

    // Gap should still be correctly calculated as 60 minutes
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    constraint.isSatisfied(assignment);

    // Both activities should be in the constraint's list
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).toContain(activities[1]);
    expect(constraint.activities.length).toBe(2);
  });

  it('should not add duplicate activities', () => {
    constraint.addActivity(activities[0]);
    constraint.addActivity(activities[0]);

    expect(constraint.activities.length).toBe(1);
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;

    // Assign activities with insufficient gap
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 20 }, room.id);

    // Should be satisfied because constraint is inactive
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should ignore activities for other teachers', () => {
    const otherTeacher = new Teacher('t2', 'Jane Smith');
    const otherTeacherActivity1 = new Activity('oa1', 'Other Teacher Activity 1', subject, 60);
    const otherTeacherActivity2 = new Activity('oa2', 'Other Teacher Activity 2', subject, 60);

    otherTeacherActivity1.teachers.push(otherTeacher);
    otherTeacherActivity2.teachers.push(otherTeacher);

    // Assign activities with insufficient gap for other teacher
    assignment.assignActivity(otherTeacherActivity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherTeacherActivity2, { day: 0, hour: 8, minute: 20 }, room.id);

    // Assign activities with sufficient gap for main teacher
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    // Should be satisfied for main teacher, despite other teacher having insufficient gap
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should handle activities with different durations', () => {
    // Create activities with different durations
    const shortActivity = new Activity('short', 'Short Activity', subject, 30); // 30 minutes
    const longActivity = new Activity('long', 'Long Activity', subject, 120); // 2 hours

    shortActivity.teachers.push(teacher);
    longActivity.teachers.push(teacher);

    // Short activity: 8:00-8:30
    assignment.assignActivity(shortActivity, { day: 0, hour: 8, minute: 0 }, room.id);
    // Long activity: 9:20-11:20 (50 minutes gap after short activity - sufficient)
    assignment.assignActivity(longActivity, { day: 0, hour: 9, minute: 20 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
