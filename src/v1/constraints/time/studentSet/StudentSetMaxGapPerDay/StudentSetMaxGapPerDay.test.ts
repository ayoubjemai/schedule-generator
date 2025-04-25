import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { StudentSetMaxGapPerDay } from './StudentSetMaxGapPerDay';
import { Room } from '../../../../models/Room';
import { StudentSet } from '../../../../models/StudentSet';

describe('StudentSetMaxGapPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_GAP_MINUTES = 120; // 2 hours maximum gap

  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let subject: Subject;
  let constraint: StudentSetMaxGapPerDay;
  let room: Room;
  let studentSet: StudentSet;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create a student set
    studentSet = new StudentSet('s1', 'Class 1A');

    // Create activities
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 60);
    activity1.studentSets.push(studentSet);

    activity2 = new Activity('a2', 'Math Lecture 2', subject, 60);
    activity2.studentSets.push(studentSet);

    // Create a room
    room = new Room('r1', 'Classroom 101', 30);

    // Create the constraint
    constraint = new StudentSetMaxGapPerDay(studentSet, MAX_GAP_MINUTES);
  });

  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when constraint is inactive', () => {
    constraint.active = false;

    // Set up a scenario with excessive gap
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 14, minute: 0 }, room.id); // 5-hour gap

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id);
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
    const otherStudentSet = new StudentSet('s2', 'Class 1B');
    const otherActivity = new Activity('oa1', 'Another Class Activity', subject, 60);
    otherActivity.studentSets.push(otherStudentSet);

    // Set up activities for our student set within limit
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); // 1-hour gap

    // Set up activities for other student set with excessive gap
    assignment.assignActivity(otherActivity, { day: 0, hour: 14, minute: 0 }, room.id);

    // Should be satisfied because other student set's activities are not counted
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should correctly identify student set activities', () => {
    // Add activities for our student set
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);

    // Create activity for a different student set
    const differentStudentSet = new StudentSet('s3', 'Class 2A');
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
