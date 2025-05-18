import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { StudentSetMinGapPerDay } from './StudentSetMinGap';
import { StudentSet } from '../../../../models/StudentSet';

describe('StudentSetMinGap', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_GAP_MINUTES = 30; // 30 minutes minimum gap between activities

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let studentSet: StudentSet;
  let anotherStudentSet: StudentSet;
  let constraint: StudentSetMinGapPerDay;
  let room: Room;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    studentSet = new StudentSet('s1', { name: 'Class 1A' });
    anotherStudentSet = new StudentSet('s2', { name: 'Class 1B' });

    // Create activities for testing
    activities = [];
    for (let i = 0; i < 6; i++) {
      const activity = new Activity(`a${i + 1}`, `Math Activity ${i + 1}`, subject, 60); // Each activity is 60 minutes
      activity.studentSets.push(studentSet);
      activities.push(activity);
    }

    // Create activities for another student set
    const otherActivities = [];
    for (let i = 0; i < 3; i++) {
      const activity = new Activity(`b${i + 1}`, `Other Math Activity ${i + 1}`, subject, 60);
      activity.studentSets.push(anotherStudentSet);
      otherActivities.push(activity);
    }

    activities = [...activities, ...otherActivities];

    room = new Room('r1', 'Classroom 101', 30);

    constraint = new StudentSetMinGapPerDay(studentSet, MIN_GAP_MINUTES);
  });

  it('should be initialized with correct properties', () => {
    expect(constraint.studentSet).toBe(studentSet);
    expect(constraint.activities).toHaveLength(0);
    expect(constraint.active).toBe(true);
    expect(constraint.weight).toBeDefined();
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

  it('should ignore activities for other student sets', () => {
    // Assign activities with insufficient gap for another student set
    assignment.assignActivity(activities[6], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[7], { day: 0, hour: 8, minute: 20 }, room.id);

    // Assign activities with sufficient gap for main student set
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    // Should be satisfied for main student set, despite other student set having insufficient gap
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should use getActivitiesForStudentSet from assignment', () => {
    // Spy on getActivitiesForStudentSet
    const spy = jest.spyOn(assignment, 'getActivitiesForStudentSet');

    constraint.isSatisfied(assignment);

    // Verify the method was called with the correct student set ID
    expect(spy).toHaveBeenCalledWith(studentSet.id);
  });

  it('should delegate to parent class isValid method with student set activities', () => {
    // Spy on the isValid method
    const spy = jest.spyOn(constraint, 'isValid');

    // Assign activities
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    // Check constraint satisfaction
    constraint.isSatisfied(assignment);

    // Verify that isValid was called with the student set's activities
    expect(spy).toHaveBeenCalledWith(assignment, expect.arrayContaining([activities[0], activities[1]]));
  });

  it('should correctly identify specific student set activities', () => {
    // Assign activities for both student sets
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Main student set
    assignment.assignActivity(activities[6], { day: 0, hour: 9, minute: 0 }, room.id); // Other student set

    constraint.isSatisfied(assignment);

    // Should only include activities for the specified student set
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).not.toContain(activities[6]);
  });

  it('should be satisfied when student set has sufficient gaps between activities', () => {
    // Day 0: Two activities with 60 minutes gap (greater than MIN_GAP_MINUTES)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-11:00

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when student set has insufficient gaps between activities', () => {
    // Day 0: Two activities with only 20 minutes gap (less than MIN_GAP_MINUTES)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 20 }, room.id); // 9:20-10:20

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should handle activities for student set on different days correctly', () => {
    // Day 0: Activity at 8:00
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    // Day 1: Activity at 8:20 (different day - gaps requirement doesn't apply across days)
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 20 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should handle activities with multiple student sets correctly', () => {
    // Create an activity that belongs to both student sets
    const sharedActivity = new Activity('shared', 'Shared Activity', subject, 60);
    sharedActivity.studentSets.push(studentSet);
    sharedActivity.studentSets.push(anotherStudentSet);

    // Assign the shared activity and another activity for the main student set
    assignment.assignActivity(sharedActivity, { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 20 }, room.id); // 9:20-10:20

    // Gap is only 20 minutes (less than MIN_GAP_MINUTES)
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
});
