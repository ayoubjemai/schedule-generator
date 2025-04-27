import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { StudentSetMinHoursDaily } from './StudentSetMinHoursDaily';
import { Room } from '../../../../models/Room';
import { StudentSet } from '../../../../models/StudentSet';

describe('StudentSetMinHoursDaily', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_HOURS_DAILY = 3; // 3 hours minimum per day

  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let studentSet: StudentSet;
  let constraint: StudentSetMinHoursDaily;
  let room: Room;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create a student set
    studentSet = new StudentSet('s1', { name: 'Class 1A' });

    // Create activities with different durations
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 60); // 1 hour
    activity1.studentSets.push(studentSet);

    activity2 = new Activity('a2', 'Math Lecture 2', subject, 90); // 1.5 hours
    activity2.studentSets.push(studentSet);

    activity3 = new Activity('a3', 'Math Lecture 3', subject, 120); // 2 hours
    activity3.studentSets.push(studentSet);

    room = new Room('r1', 'Classroom 101', 30);

    // Create constraint with 3-hour daily minimum
    constraint = new StudentSetMinHoursDaily(studentSet, MIN_HOURS_DAILY);
  });

  it('should be satisfied when no activities are assigned', () => {
    // This should technically not be satisfied, but the constraint throws an error instead
    expect(() => constraint.isSatisfied(assignment)).toThrow(Error);
  });

  it('should throw an error when total student set hours are less than minimum', () => {
    // Assign only 2.5 hours total (below 3 hour daily minimum)
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id); // 1 hour
    assignment.assignActivity(activity2, { day: 1, hour: 9, minute: 0 }, room.id); // 1.5 hours

    expect(() => constraint.isSatisfied(assignment)).toThrow(Error);
  });

  it('should not be satisfied when hours on any day are below minimum', () => {
    // Total hours exceed minimum, but not well distributed
    // Day 0: 2.5 hours (below minimum)
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id); // 1 hour
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id); // 1.5 hours

    // Day 1: 3.5 hours (meets minimum)
    assignment.assignActivity(activity3, { day: 1, hour: 9, minute: 0 }, room.id); // 2 hours
    assignment.assignActivity(activity1, { day: 1, hour: 12, minute: 0 }, room.id); // 1 hour (duplicate activity ID but different assignment)

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should be satisfied when hours on all days meet minimum', () => {
    // Good distribution of hours
    // Day 0: 3 hours (meets minimum)
    activity3.totalDurationInMinutes = 180; // 2 hours
    assignment.assignActivity(activity3, { day: 0, hour: 11, minute: 0 }, room.id); // 2 hours

    // Day 1: 3.5 hours (meets minimum)
    activity1.totalDurationInMinutes = 120;
    assignment.assignActivity(activity2, { day: 1, hour: 9, minute: 0 }, room.id); // 1.5 hours
    assignment.assignActivity(activity1, { day: 1, hour: 12, minute: 0 }, room.id); // 1 hour (duplicate activity ID but different assignment)

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;

    // No activities assigned but constraint is inactive
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should maintain a list of activities that the constraint applies to', () => {
    // Add enough activities to meet the minimum requirement
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 0, hour: 13, minute: 0 }, room.id);

    // Check constraint
    constraint.isSatisfied(assignment);

    // Should track all activities
    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities).toContain(activity3);
    expect(constraint.activities.length).toBe(3);
  });

  it('should not add duplicate activities', () => {
    constraint.addActivity(activity1);
    constraint.addActivity(activity1);

    expect(constraint.activities.length).toBe(1);
  });

  it('should ignore activities for other student sets', () => {
    const otherStudentSet = new StudentSet('s2', { name: 'Class 1B' });
    const otherActivity = new Activity('oa1', 'Other Class Activity', subject, 180); // 3 hours
    otherActivity.studentSets.push(otherStudentSet);

    // Assign activities for our student set (4.5 hours total)
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id); // 1 hour
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id); // 1.5 hours
    assignment.assignActivity(activity3, { day: 0, hour: 13, minute: 0 }, room.id); // 2 hours

    // Assign activity for other student set
    assignment.assignActivity(otherActivity, { day: 1, hour: 9, minute: 0 }, room.id);

    // Should be satisfied since our student set has enough hours on day 0
    expect(constraint.isSatisfied(assignment)).toBe(true);

    // Constraint activities should only include our student set's activities
    expect(constraint.activities).not.toContain(otherActivity);
  });

  it('should work with different minimum hour values', () => {
    // Create a more restrictive constraint
    const strictConstraint = new StudentSetMinHoursDaily(studentSet, 5);

    const anotherActivity = new Activity('a4', 'Math Lecture 4', subject, 120); // 2 hour
    anotherActivity.studentSets.push(studentSet);
    // Assign 4.5 hours on one day (below 5-hour minimum)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); // 1 hour
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); // 1.5 hours
    assignment.assignActivity(activity3, { day: 0, hour: 12, minute: 0 }, room.id); // 2 hours
    assignment.assignActivity(anotherActivity, { day: 5, hour: 13, minute: 0 }, room.id); // 2 hour

    expect(strictConstraint.isSatisfied(assignment)).toBe(false);

    // Create a more permissive constraint
    const relaxedConstraint = new StudentSetMinHoursDaily(studentSet, 2);

    expect(relaxedConstraint.isSatisfied(assignment)).toBe(true);
  });
});
