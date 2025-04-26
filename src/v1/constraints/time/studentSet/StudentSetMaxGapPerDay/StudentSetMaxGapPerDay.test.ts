import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { StudentSetMaxGapPerDay } from './StudentSetMaxGapPerDay';
import { Room } from '../../../../models/Room';
import { StudentSet } from '../../../../models/StudentSet';
describe('StudentSetMaxGapPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_GAP_MINUTES = 120; 
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
    studentSet = new StudentSet('s1', 'Class 1A');
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 60);
    activity1.studentSets.push(studentSet);
    activity2 = new Activity('a2', 'Math Lecture 2', subject, 60);
    activity2.studentSets.push(studentSet);
    room = new Room('r1', 'Classroom 101', 30);
    constraint = new StudentSetMaxGapPerDay(studentSet, MAX_GAP_MINUTES);
  });
  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when constraint is inactive', () => {
    constraint.active = false;
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 14, minute: 0 }, room.id); 
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
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(otherActivity, { day: 0, hour: 14, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should correctly identify student set activities', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    const differentStudentSet = new StudentSet('s3', 'Class 2A');
    const activityForDifferentSet = new Activity('adiff', 'Different Class Activity', subject, 60);
    activityForDifferentSet.studentSets.push(differentStudentSet);
    assignment.assignActivity(activityForDifferentSet, { day: 0, hour: 10, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities).not.toContain(activityForDifferentSet);
    expect(constraint.activities.length).toBe(1);
  });
});
