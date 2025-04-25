import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { StudentSetMinDaysPerWeek } from './StudentSetMinDaysPerWeek';
import { Room } from '../../../../models/Room';
import { StudentSet } from '../../../../models/StudentSet';

describe('StudentSetMinDaysPerWeek', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;

  let assignment: TimetableAssignment;
  let activity: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let constraint: StudentSetMinDaysPerWeek;
  let room: Room;
  let studentSet: StudentSet;
  let anotherStudentSet: StudentSet;
  let slot: Period;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create activities
    activity = new Activity('a1', 'Math Lecture', subject, 60);
    activity2 = new Activity('a2', 'Physics Lecture', subject, 60);
    activity3 = new Activity('a3', 'Chemistry Lecture', subject, 60);

    // Create rooms
    room = new Room('r1', 'Classroom 101', 30);

    // Create student sets
    studentSet = new StudentSet('s1', 'Class 1A');
    anotherStudentSet = new StudentSet('s2', 'Class 1B');

    // Add student set to activities
    activity.studentSets.push(studentSet);
    activity2.studentSets.push(studentSet);
    activity3.studentSets.push(anotherStudentSet);

    // Create time slots
    slot = { day: 0, hour: 9, minute: 0 };

    // Create the constraint with min 3 days
    constraint = new StudentSetMinDaysPerWeek(studentSet, 3);
  });

  it('should be initialized with correct properties', () => {
    expect(constraint.studentSet).toBe(studentSet);
    expect(constraint.activities).toHaveLength(0);
    expect(constraint.active).toBe(true);
    expect(constraint.weight).toBeDefined();
  });

  it('should only consider activities for the specified student set', () => {
    // Assign activities for both student sets
    assignment.assignActivity(activity, slot, room.id);
    assignment.assignActivity(activity2, { day: 1, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 2, hour: 9, minute: 0 }, room.id);

    // Check constraint
    constraint.isSatisfied(assignment);

    // Should only include activities for the specified student set
    expect(constraint.activities).toContain(activity);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities).not.toContain(activity3);
    expect(constraint.activities.length).toBe(2);
  });

  it('should use getActivitiesForStudentSet from assignment', () => {
    // Spy on getActivitiesForStudentSet
    const spy = jest.spyOn(assignment, 'getActivitiesForStudentSet');

    constraint.isSatisfied(assignment);

    // Verify that getActivitiesForStudentSet was called with the correct student set ID
    expect(spy).toHaveBeenCalledWith(studentSet.id);
  });

  it('should not add duplicate activities', () => {
    constraint.addActivity(activity);
    constraint.addActivity(activity);

    expect(constraint.activities.length).toBe(1);
  });

  it('should add activities found in the assignment', () => {
    // Assign an activity
    assignment.assignActivity(activity, slot, room.id);

    // Initially empty
    expect(constraint.activities.length).toBe(0);

    // After checking satisfaction, it should contain the activity
    constraint.isSatisfied(assignment);
    expect(constraint.activities.length).toBe(1);
    expect(constraint.activities[0]).toBe(activity);
  });

  it('should always return true when inactive', () => {
    // Set constraint to inactive
    constraint.active = false;

    // Even with potentially unsatisfied requirements, should return true
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should delegate to the parent class isValid method', () => {
    // Spy on the isValid method
    const spy = jest.spyOn(constraint, 'isValid');

    assignment.assignActivity(activity, slot, room.id);
    constraint.isSatisfied(assignment);

    // Verify that isValid was called with correct parameters
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(assignment, constraint.activities);
  });
});
