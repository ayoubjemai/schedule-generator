import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { StudentSetMinSpanPerDay } from './StudentSetMinSpanPerDay';
import { Room } from '../../../../models/Room';
import { StudentSet } from '../../../../models/StudentSet';

describe('StudentSetMinSpanPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_HOUR_SPAN = 4; // 4 hours minimum span

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let constraint: StudentSetMinSpanPerDay;
  let room: Room;
  let studentSet: StudentSet;
  let anotherStudentSet: StudentSet;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create activities
    activities = [
      new Activity('a1', 'Math Lecture 1', subject, 60), // 1 hour
      new Activity('a2', 'Math Lecture 2', subject, 60), // 1 hour
      new Activity('a3', 'Math Lecture 3', subject, 90), // 1.5 hours
      new Activity('a4', 'Math Lecture 4', subject, 120), // 2 hours
    ];

    // Create rooms
    room = new Room('r1', 'Classroom 101', 30);

    // Create student sets
    studentSet = new StudentSet('s1', { name: 'Class 1A' });
    anotherStudentSet = new StudentSet('s2', { name: 'Class 1B' });

    // Add student sets to activities
    activities.forEach(activity => {
      activity.studentSets.push(studentSet);
    });

    // Create the constraint with 4 hour minimum span
    constraint = new StudentSetMinSpanPerDay(studentSet, MIN_HOUR_SPAN);
  });

  it('should be initialized with correct properties', () => {
    expect(constraint.studentSet).toBe(studentSet);
    expect(constraint.activities).toHaveLength(0);
    expect(constraint.active).toBe(true);
    expect(constraint.weight).toBeDefined();
  });

  it('should be satisfied when no activities are assigned', () => {
    // No activities means the constraint doesn't apply
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when student set has insufficient daily span', () => {
    // Assign two activities with only a 3-hour span (below minimum)
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-10:00
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); // 11:00-12:00

    // Span: 9:00 to 12:00 = 3 hours (below the 4-hour minimum)
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should be satisfied when student set has sufficient daily span', () => {
    // Assign two activities with a 5-hour span (above minimum)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id); // 12:00-13:00

    // Span: 8:00 to 13:00 = 5 hours (above the 4-hour minimum)
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when student set has exactly the minimum span', () => {
    // Assign activities with exactly 4-hour span (start of first to end of last)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[3], { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-12:00

    // Span: 8:00 to 12:00 = 4 hours (equal to minimum)
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should only consider activities for the specified student set', () => {
    // Create an activity for another student set
    const otherActivity1 = new Activity('oa1', 'Other Class Lecture 1', subject, 60);
    const otherActivity2 = new Activity('oa2', 'Other Class Lecture 2', subject, 60);
    otherActivity1.studentSets.push(anotherStudentSet);
    otherActivity2.studentSets.push(anotherStudentSet);

    // Assign activities with insufficient span for the target student set
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-10:00
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); // 11:00-12:00

    // Assign activities with sufficient span for the other student set
    assignment.assignActivity(otherActivity1, { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(otherActivity2, { day: 0, hour: 13, minute: 0 }, room.id); // 13:00-14:00

    // Should still fail because our student set has insufficient span
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should validate each day independently', () => {
    // Day 0: 5-hour span (above minimum)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id); // 12:00-13:00

    // Day 1: 3-hour span (below minimum)
    assignment.assignActivity(activities[2], { day: 1, hour: 9, minute: 0 }, room.id); // 9:00-10:30
    assignment.assignActivity(activities[3], { day: 1, hour: 10, minute: 30 }, room.id); // 10:30-12:30

    // Should fail due to day 1 not meeting the minimum span
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should use getActivitiesForStudentSet from assignment', () => {
    // Spy on getActivitiesForStudentSet
    const spy = jest.spyOn(assignment, 'getActivitiesForStudentSet');

    constraint.isSatisfied(assignment);

    // Verify that getActivitiesForStudentSet was called with the correct student set ID
    expect(spy).toHaveBeenCalledWith(studentSet.id);
  });

  it('should delegate to parent class isValid method with student set activities', () => {
    // Spy on the isValid method
    const spy = jest.spyOn(constraint, 'isValid');

    // Assign activities
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id);

    constraint.isSatisfied(assignment);

    // Verify isValid was called with the student set's activities
    expect(spy).toHaveBeenCalledWith(assignment, expect.arrayContaining([activities[0], activities[1]]));
  });

  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id);

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

    // Assign activities with insufficient span
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id);

    // Should be satisfied because constraint is inactive
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should handle activities with multiple student sets', () => {
    // Create an activity that belongs to both student sets
    const sharedActivity = new Activity('shared', 'Shared Activity', subject, 60);
    sharedActivity.studentSets.push(studentSet);
    sharedActivity.studentSets.push(anotherStudentSet);

    // Assign the shared activity and another activity with insufficient span
    assignment.assignActivity(sharedActivity, { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-10:00
    assignment.assignActivity(activities[0], { day: 0, hour: 11, minute: 0 }, room.id); // 11:00-12:00

    // Span: 9:00 to 12:00 = 3 hours (below minimum)
    expect(constraint.isSatisfied(assignment)).toBe(false);

    // Add another activity to increase the span
    assignment.assignActivity(activities[1], { day: 0, hour: 13, minute: 0 }, room.id); // 13:00-14:00

    // Span: 9:00 to 14:00 = 5 hours (above minimum)
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should work with different min span values', () => {
    // Create a constraint with a less restrictive span requirement (2 hours)
    const relaxedConstraint = new StudentSetMinSpanPerDay(studentSet, 2);

    // Assign activities with a 3-hour span
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-10:00
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); // 11:00-12:00

    // Should be satisfied with the 2-hour minimum
    expect(relaxedConstraint.isSatisfied(assignment)).toBe(true);

    // Create a constraint with a more restrictive span requirement (6 hours)
    const strictConstraint = new StudentSetMinSpanPerDay(studentSet, 6);

    // Should not be satisfied with the 6-hour minimum
    expect(strictConstraint.isSatisfied(assignment)).toBe(false);
  });

  it('should handle days with only one activity', () => {
    // Assign a single activity that doesn't meet the minimum span by itself
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 9:00-10:00 (1 hour)

    // Should not be satisfied
    expect(constraint.isSatisfied(assignment)).toBe(false);

    // Create a long activity that meets the minimum span
    const longActivity = new Activity('long', 'Long Lecture', subject, 240); // 4 hours
    longActivity.studentSets.push(studentSet);
    assignment.assignActivity(longActivity, { day: 1, hour: 9, minute: 0 }, room.id); // 9:00-13:00 (4 hours)

    // Should still not be satisfied because day 0 doesn't meet the minimum
    expect(constraint.isSatisfied(assignment)).toBe(false);

    // Clear day 0's assignment
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    assignment.assignActivity(longActivity, { day: 0, hour: 9, minute: 0 }, room.id);

    // Now should be satisfied
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
