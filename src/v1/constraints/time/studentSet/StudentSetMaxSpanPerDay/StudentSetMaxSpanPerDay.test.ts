import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { StudentSetMaxSpanPerDay } from './StudentSetMaxSpanPerDay';
import { Room } from '../../../../models/Room';
import { StudentSet } from '../../../../models/StudentSet';

describe('StudentSetMaxSpanPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_SPAN_HOURS = 6; // 6 hours maximum span per day

  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let constraint: StudentSetMaxSpanPerDay;
  let room: Room;
  let studentSet: StudentSet;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create a student set
    studentSet = new StudentSet('s1', { name: 'Class 1A' });

    // Create activities with 1-hour duration
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 60);
    activity1.studentSets.push(studentSet);

    activity2 = new Activity('a2', 'Math Lecture 2', subject, 60);
    activity2.studentSets.push(studentSet);

    activity3 = new Activity('a3', 'Math Lecture 3', subject, 60);
    activity3.studentSets.push(studentSet);

    room = new Room('r1', 'Classroom 101', 30);

    // Create the constraint with 6-hour maximum span
    constraint = new StudentSetMaxSpanPerDay(studentSet, MAX_SPAN_HOURS);
  });

  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when a single activity is assigned', () => {
    // A single activity has a span equal to its duration
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when span is below maximum', () => {
    // First activity at 8:00-9:00, second at 12:00-13:00 (5-hour span)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when span is exactly at maximum', () => {
    // First activity at 8:00-9:00, second at 13:00-14:00 (6-hour span)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 13, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when span exceeds maximum', () => {
    // First activity at 8:00-9:00, second at 14:00-15:00 (7-hour span)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 14, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should check span for each day independently', () => {
    // Day 0: 4-hour span (within limit)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id);

    // Day 1: 7-hour span (exceeds limit)
    assignment.assignActivity(activity1, { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 1, hour: 14, minute: 0 }, room.id);

    // Should fail due to Day 1 exceeding span limit
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;

    // Set up a scenario that would normally violate the constraint
    // 8-hour span (exceeds 6-hour maximum)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 15, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should consider activities with non-standard times', () => {
    // First activity at 8:15-9:15, second at 13:45-14:45 (6.5-hour span)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 15 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 13, minute: 45 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should calculate span based on multiple activities', () => {
    // Three activities that span from 8:00 to 13:00 (5-hour span)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 0, hour: 12, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities.length).toBe(1);

    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities.length).toBe(2);
  });

  it('should not add duplicate activities', () => {
    constraint.addActivity(activity1);
    constraint.addActivity(activity1);

    expect(constraint.activities.length).toBe(1);
  });

  it('should ignore activities for other student sets', () => {
    // Create another student set
    const otherStudentSet = new StudentSet('s2', { name: 'Class 1B' });

    // Create activities for the other student set
    const otherActivity1 = new Activity('oa1', 'Other Class Lecture 1', subject, 60);
    otherActivity1.studentSets.push(otherStudentSet);

    const otherActivity2 = new Activity('oa2', 'Other Class Lecture 2', subject, 60);
    otherActivity2.studentSets.push(otherStudentSet);

    // Our student set: 5-hour span (within limit)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id);

    // Other student set: 8-hour span (exceeds limit)
    assignment.assignActivity(otherActivity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherActivity2, { day: 0, hour: 15, minute: 0 }, room.id);

    // Should be satisfied since our student set is within limits
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should handle activities with longer durations', () => {
    // Create an activity with a 3-hour duration
    const longActivity = new Activity('long', 'Long Lecture', subject, 180);
    longActivity.studentSets.push(studentSet);

    // First activity at 8:00-9:00, long activity at 10:00-13:00 (5-hour span)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(longActivity, { day: 0, hour: 10, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should work with different max span values', () => {
    // Create a more restrictive constraint
    const strictConstraint = new StudentSetMaxSpanPerDay(studentSet, 4);

    // Activities with 5-hour span (exceeds 4-hour limit)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id);

    expect(strictConstraint.isSatisfied(assignment)).toBe(false);

    // Reassign second activity to be within 4-hour span
    assignment.removeActivity(activity2);
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id);

    expect(strictConstraint.isSatisfied(assignment)).toBe(true);
  });

  it('should handle activities that span the entire day', () => {
    // Create activities that span from early morning to late evening
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 0, hour: 16, minute: 0 }, room.id);

    // Span from 8:00 to 17:00 (9 hours - exceeds limit)
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
});
