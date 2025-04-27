import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { StudentSetMaxHoursPerDay } from './StudentSetMaxHoursPerDay';
import { Room } from '../../../../models/Room';
import { StudentSet } from '../../../../models/StudentSet';

describe('StudentSetMaxHoursPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_MINUTES_PER_DAY = 180; // 3 hours max per day

  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let constraint: StudentSetMaxHoursPerDay;
  let room: Room;
  let studentSet: StudentSet;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create a student set
    studentSet = new StudentSet('s1', { name: 'Class 1A' });

    // Create activities with different durations
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 60); // 60 minutes
    activity1.studentSets.push(studentSet);

    activity2 = new Activity('a2', 'Math Lecture 2', subject, 90); // 90 minutes
    activity2.studentSets.push(studentSet);

    activity3 = new Activity('a3', 'Math Lecture 3', subject, 60); // 60 minutes
    activity3.studentSets.push(studentSet);

    room = new Room('r1', 'Classroom 101', 30);

    constraint = new StudentSetMaxHoursPerDay(studentSet, MAX_MINUTES_PER_DAY);
  });

  it('should be satisfied when no activities are assigned to the student set', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;

    // Assign 3 activities on the same day, totaling 210 minutes (exceeds MAX_MINUTES_PER_DAY)
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
    const otherStudentSet = new StudentSet('s2', { name: 'Class 1B' });
    const otherActivity = new Activity('a4', 'Physics Lecture', subject, 120);
    otherActivity.studentSets.push(otherStudentSet);

    // Assign student set's activities close to the limit
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);

    // Assign other student set's activity on the same day
    assignment.assignActivity(otherActivity, { day: 0, hour: 12, minute: 0 }, room.id);

    // Should still be satisfied as the other student set's activity isn't counted
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should correctly identify student set activities', () => {
    // Add activities for our student set
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);

    // Create activity for a different student set
    const differentStudentSet = new StudentSet('s3', { name: 'Class 2A' });
    const activityForDifferentSet = new Activity('adiff', 'Different Class Activity', subject, 60);
    activityForDifferentSet.studentSets.push(differentStudentSet);
    assignment.assignActivity(activityForDifferentSet, { day: 0, hour: 10, minute: 0 }, room.id);

    // Check constraint
    constraint.isSatisfied(assignment);

    // Should only contain this student set's activities
    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities).not.toContain(activityForDifferentSet);
    expect(constraint.activities.length).toBe(1);
  });
});
