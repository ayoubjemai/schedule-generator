import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { StudentSetMaxConsecutiveHours } from './StudentSetMaxConsecutiveHours';
import { Room } from '../../../../models/Room';
import { StudentSet } from '../../../../models/StudentSet';

describe('StudentSetMaxConsecutiveHours', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_CONSECUTIVE_HOURS = 4;

  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let studentSet: StudentSet;
  let constraint: StudentSetMaxConsecutiveHours;
  let room: Room;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create a student set
    studentSet = new StudentSet('s1', { name: 'Class 1A' });

    // Create three activities with different durations
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 120); // 2 hours
    activity1.studentSets.push(studentSet);

    activity2 = new Activity('a2', 'Math Lecture 2', subject, 120); // 2 hours
    activity2.studentSets.push(studentSet);

    activity3 = new Activity('a3', 'Math Lecture 3', subject, 120); // 2 hours
    activity3.studentSets.push(studentSet);

    room = new Room('r1', 'Classroom 101', 30);

    // Create constraint with 4-hour maximum
    constraint = new StudentSetMaxConsecutiveHours(studentSet, MAX_CONSECUTIVE_HOURS);
  });

  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when student set has non-consecutive activities', () => {
    // Assign activities with gaps between them
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-10:00
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id); // 12:00-14:00

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when student set has consecutive activities within the limit', () => {
    // Assign two consecutive activities (total 4 hours - at the limit)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-10:00
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-12:00

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when student set has consecutive activities exceeding the limit', () => {
    // Assign three consecutive activities (total 6 hours - exceeds limit)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-10:00
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-12:00
    assignment.assignActivity(activity3, { day: 0, hour: 12, minute: 0 }, room.id); // 12:00-14:00

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should be satisfied when activities are spread across different days', () => {
    // Assign activities on different days
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); // Day 0
    assignment.assignActivity(activity2, { day: 1, hour: 8, minute: 0 }, room.id); // Day 1
    assignment.assignActivity(activity3, { day: 2, hour: 8, minute: 0 }, room.id); // Day 2

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;

    // Assign three consecutive activities (total 6 hours - would exceed limit if active)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 0, hour: 12, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities.length).toBe(1);

    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
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
    const otherStudentSet = new StudentSet('s2', { name: 'Class 1B' });
    const otherActivity = new Activity('a4', 'Physics Lecture', subject, 120);
    otherActivity.studentSets.push(otherStudentSet);

    // Assign the main student set's activities up to the limit
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);

    // Assign the other student set's activity right after - would exceed limit if counted
    assignment.assignActivity(otherActivity, { day: 0, hour: 12, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should detect consecutive activities across multiple days', () => {
    // Day 0: within limit
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);

    // Day 1: exceeds limit
    assignment.assignActivity(activity1, { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 1, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 1, hour: 12, minute: 0 }, room.id);

    // Should fail due to Day 1
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
});
