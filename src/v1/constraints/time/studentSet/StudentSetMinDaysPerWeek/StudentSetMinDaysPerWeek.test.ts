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
    activity = new Activity('a1', 'Math Lecture', subject, 60);
    activity2 = new Activity('a2', 'Physics Lecture', subject, 60);
    activity3 = new Activity('a3', 'Chemistry Lecture', subject, 60);
    room = new Room('r1', 'Classroom 101', 30);
    studentSet = new StudentSet('s1', 'Class 1A');
    anotherStudentSet = new StudentSet('s2', 'Class 1B');
    activity.studentSets.push(studentSet);
    activity2.studentSets.push(studentSet);
    activity3.studentSets.push(anotherStudentSet);
    slot = { day: 0, hour: 9, minute: 0 };
    constraint = new StudentSetMinDaysPerWeek(studentSet, 3);
  });
  it('should be initialized with correct properties', () => {
    expect(constraint.studentSet).toBe(studentSet);
    expect(constraint.activities).toHaveLength(0);
    expect(constraint.active).toBe(true);
    expect(constraint.weight).toBeDefined();
  });
  it('should only consider activities for the specified student set', () => {
    assignment.assignActivity(activity, slot, room.id);
    assignment.assignActivity(activity2, { day: 1, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 2, hour: 9, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activity);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities).not.toContain(activity3);
    expect(constraint.activities.length).toBe(2);
  });
  it('should use getActivitiesForStudentSet from assignment', () => {
    const spy = jest.spyOn(assignment, 'getActivitiesForStudentSet');
    constraint.isSatisfied(assignment);
    expect(spy).toHaveBeenCalledWith(studentSet.id);
  });
  it('should not add duplicate activities', () => {
    constraint.addActivity(activity);
    constraint.addActivity(activity);
    expect(constraint.activities.length).toBe(1);
  });
  it('should add activities found in the assignment', () => {
    assignment.assignActivity(activity, slot, room.id);
    expect(constraint.activities.length).toBe(0);
    constraint.isSatisfied(assignment);
    expect(constraint.activities.length).toBe(1);
    expect(constraint.activities[0]).toBe(activity);
  });
  it('should always return true when inactive', () => {
    constraint.active = false;
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should delegate to the parent class isValid method', () => {
    const spy = jest.spyOn(constraint, 'isValid');
    assignment.assignActivity(activity, slot, room.id);
    constraint.isSatisfied(assignment);
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(assignment, constraint.activities);
  });
});
