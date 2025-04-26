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
  const MIN_HOUR_SPAN = 4; 
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
    activities = [
      new Activity('a1', 'Math Lecture 1', subject, 60), 
      new Activity('a2', 'Math Lecture 2', subject, 60), 
      new Activity('a3', 'Math Lecture 3', subject, 90), 
      new Activity('a4', 'Math Lecture 4', subject, 120), 
    ];
    room = new Room('r1', 'Classroom 101', 30);
    studentSet = new StudentSet('s1', 'Class 1A');
    anotherStudentSet = new StudentSet('s2', 'Class 1B');
    activities.forEach(activity => {
      activity.studentSets.push(studentSet);
    });
    constraint = new StudentSetMinSpanPerDay(studentSet, MIN_HOUR_SPAN);
  });
  it('should be initialized with correct properties', () => {
    expect(constraint.studentSet).toBe(studentSet);
    expect(constraint.activities).toHaveLength(0);
    expect(constraint.active).toBe(true);
    expect(constraint.weight).toBeDefined();
  });
  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should not be satisfied when student set has insufficient daily span', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should be satisfied when student set has sufficient daily span', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when student set has exactly the minimum span', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should only consider activities for the specified student set', () => {
    const otherActivity1 = new Activity('oa1', 'Other Class Lecture 1', subject, 60);
    const otherActivity2 = new Activity('oa2', 'Other Class Lecture 2', subject, 60);
    otherActivity1.studentSets.push(anotherStudentSet);
    otherActivity2.studentSets.push(anotherStudentSet);
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); 
    assignment.assignActivity(otherActivity1, { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(otherActivity2, { day: 0, hour: 13, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should validate each day independently', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 1, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 1, hour: 10, minute: 30 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should use getActivitiesForStudentSet from assignment', () => {
    const spy = jest.spyOn(assignment, 'getActivitiesForStudentSet');
    constraint.isSatisfied(assignment);
    expect(spy).toHaveBeenCalledWith(studentSet.id);
  });
  it('should delegate to parent class isValid method with student set activities', () => {
    const spy = jest.spyOn(constraint, 'isValid');
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(spy).toHaveBeenCalledWith(assignment, expect.arrayContaining([activities[0], activities[1]]));
  });
  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
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
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should handle activities with multiple student sets', () => {
    const sharedActivity = new Activity('shared', 'Shared Activity', subject, 60);
    sharedActivity.studentSets.push(studentSet);
    sharedActivity.studentSets.push(anotherStudentSet);
    assignment.assignActivity(sharedActivity, { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[0], { day: 0, hour: 11, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
    assignment.assignActivity(activities[1], { day: 0, hour: 13, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should work with different min span values', () => {
    const relaxedConstraint = new StudentSetMinSpanPerDay(studentSet, 2);
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); 
    expect(relaxedConstraint.isSatisfied(assignment)).toBe(true);
    const strictConstraint = new StudentSetMinSpanPerDay(studentSet, 6);
    expect(strictConstraint.isSatisfied(assignment)).toBe(false);
  });
  it('should handle days with only one activity', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
    const longActivity = new Activity('long', 'Long Lecture', subject, 240); 
    longActivity.studentSets.push(studentSet);
    assignment.assignActivity(longActivity, { day: 1, hour: 9, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    assignment.assignActivity(longActivity, { day: 0, hour: 9, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
