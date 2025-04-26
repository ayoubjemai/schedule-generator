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
  const MAX_SPAN_HOURS = 6; 
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
    studentSet = new StudentSet('s1', 'Class 1A');
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 60);
    activity1.studentSets.push(studentSet);
    activity2 = new Activity('a2', 'Math Lecture 2', subject, 60);
    activity2.studentSets.push(studentSet);
    activity3 = new Activity('a3', 'Math Lecture 3', subject, 60);
    activity3.studentSets.push(studentSet);
    room = new Room('r1', 'Classroom 101', 30);
    constraint = new StudentSetMaxSpanPerDay(studentSet, MAX_SPAN_HOURS);
  });
  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when a single activity is assigned', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when span is below maximum', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when span is exactly at maximum', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 13, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should not be satisfied when span exceeds maximum', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 14, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should check span for each day independently', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id);
    assignment.assignActivity(activity1, { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 1, hour: 14, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 15, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should consider activities with non-standard times', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 15 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 13, minute: 45 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should calculate span based on multiple activities', () => {
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
    const otherStudentSet = new StudentSet('s2', 'Class 1B');
    const otherActivity1 = new Activity('oa1', 'Other Class Lecture 1', subject, 60);
    otherActivity1.studentSets.push(otherStudentSet);
    const otherActivity2 = new Activity('oa2', 'Other Class Lecture 2', subject, 60);
    otherActivity2.studentSets.push(otherStudentSet);
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id);
    assignment.assignActivity(otherActivity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherActivity2, { day: 0, hour: 15, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should handle activities with longer durations', () => {
    const longActivity = new Activity('long', 'Long Lecture', subject, 180);
    longActivity.studentSets.push(studentSet);
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(longActivity, { day: 0, hour: 10, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should work with different max span values', () => {
    const strictConstraint = new StudentSetMaxSpanPerDay(studentSet, 4);
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id);
    expect(strictConstraint.isSatisfied(assignment)).toBe(false);
    assignment.removeActivity(activity2);
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id);
    expect(strictConstraint.isSatisfied(assignment)).toBe(true);
  });
  it('should handle activities that span the entire day', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 0, hour: 16, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
});
