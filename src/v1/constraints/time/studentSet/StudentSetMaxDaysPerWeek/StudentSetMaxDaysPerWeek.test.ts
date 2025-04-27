import { Activity } from '../../../../models/Activity';
import { StudentSet } from '../../../../models/StudentSet';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { StudentSetMaxDaysPerWeek } from './StudentSetMaxDaysPerWeek';

describe('StudentSetMaxDaysPerWeek', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;

  let assignment: TimetableAssignment;
  let studentSet: StudentSet;
  let subject: Subject;
  let activities: Activity[];
  let room: Room;
  let constraint: StudentSetMaxDaysPerWeek;

  beforeEach(() => {
    // Create a new timetable assignment for each test
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);

    // Create a student set
    studentSet = new StudentSet('s1', { name: 'Class 1A' });

    // Create a subject
    subject = new Subject('sub1', 'Mathematics');

    // Create a room
    room = new Room('r1', 'Classroom 101', 30);

    // Create activities for different days
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`a${i}`, `Activity ${i}`, subject, 60);
      activity.studentSets.push(studentSet);
      activities.push(activity);
    }

    // Default constraint with max 3 days per week
    constraint = new StudentSetMaxDaysPerWeek(studentSet, 3);
  });

  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when student set has activities on fewer days than max', () => {
    // Assign activities to 2 different days (below the max of 3)
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); // Same day
    assignment.assignActivity(activities[2], { day: 2, hour: 9, minute: 0 }, room.id); // Different day

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when student set has activities exactly on max days', () => {
    // Assign activities to exactly 3 different days (equal to max)
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 2, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 4, hour: 9, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when student set has activities on more days than max', () => {
    // Assign activities to 4 different days (exceeding the max of 3)
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 2, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 3, hour: 9, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should always be satisfied when constraint is inactive', () => {
    // Make constraint inactive
    constraint.active = false;

    // Assign activities to all 5 days (exceeding the max of 3)
    for (let i = 0; i < 5; i++) {
      assignment.assignActivity(activities[i], { day: i, hour: 9, minute: 0 }, room.id);
    }

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should maintain a list of activities that the constraint applies to', () => {
    // Initially empty
    expect(constraint.activities.length).toBe(0);

    // Assign some activities
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id);

    // Check constraint
    constraint.isSatisfied(assignment);

    // Should have added the activities
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).toContain(activities[1]);
    expect(constraint.activities.length).toBe(2);

    // Add another activity
    assignment.assignActivity(activities[2], { day: 2, hour: 9, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);

    // Should have added the new activity
    expect(constraint.activities).toContain(activities[2]);
    expect(constraint.activities.length).toBe(3);
  });

  it('should not add duplicate activities', () => {
    // Manually add an activity
    constraint.addActivity(activities[0]);
    expect(constraint.activities.length).toBe(1);

    // Add the same activity again
    constraint.addActivity(activities[0]);
    expect(constraint.activities.length).toBe(1);
  });

  it('should handle activities scheduled multiple times on the same day', () => {
    // Create an activity that repeats on the same day
    const repeatingActivity = new Activity('repeat', 'Repeating Activity', subject, 60);
    repeatingActivity.studentSets.push(studentSet);

    // Schedule it multiple times on the same day
    assignment.assignActivity(repeatingActivity, { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[0], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id);

    // Should count as 2 days (not 3)
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should work with different max days values', () => {
    // Create constraint with max 1 day per week
    const strictConstraint = new StudentSetMaxDaysPerWeek(studentSet, 1);

    // Assign activities to one day only
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    // Should be satisfied
    expect(strictConstraint.isSatisfied(assignment)).toBe(true);

    // Now assign to a second day
    assignment.assignActivity(activities[2], { day: 1, hour: 9, minute: 0 }, room.id);

    // Should no longer be satisfied
    expect(strictConstraint.isSatisfied(assignment)).toBe(false);
  });
});
