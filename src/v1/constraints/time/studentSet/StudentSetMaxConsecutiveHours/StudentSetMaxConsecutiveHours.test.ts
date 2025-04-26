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
    studentSet = new StudentSet('s1', 'Class 1A');
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 120); 
    activity1.studentSets.push(studentSet);
    activity2 = new Activity('a2', 'Math Lecture 2', subject, 120); 
    activity2.studentSets.push(studentSet);
    activity3 = new Activity('a3', 'Math Lecture 3', subject, 120); 
    activity3.studentSets.push(studentSet);
    room = new Room('r1', 'Classroom 101', 30);
    constraint = new StudentSetMaxConsecutiveHours(studentSet, MAX_CONSECUTIVE_HOURS);
  });
  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when student set has non-consecutive activities', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when student set has consecutive activities within the limit', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should not be satisfied when student set has consecutive activities exceeding the limit', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activity3, { day: 0, hour: 12, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should be satisfied when activities are spread across different days', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activity2, { day: 1, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activity3, { day: 2, hour: 8, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;
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
    const otherStudentSet = new StudentSet('s2', 'Class 1B');
    const otherActivity = new Activity('a4', 'Physics Lecture', subject, 120);
    otherActivity.studentSets.push(otherStudentSet);
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(otherActivity, { day: 0, hour: 12, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should detect consecutive activities across multiple days', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity1, { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 1, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 1, hour: 12, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
});
