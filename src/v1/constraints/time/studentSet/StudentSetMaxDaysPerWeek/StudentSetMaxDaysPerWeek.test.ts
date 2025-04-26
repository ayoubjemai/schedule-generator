import { Activity } from '../../../../models/Activity';
import { StudentSet } from '../../../../models/StudentSet';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { StudentSetMaxDaysPerWeek } from './StudentSetMaxDaysPerWeek';
describe('StudentSetMaxDaysPerWeek', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  let assignment: TimetableAssignment;
  let studentSet: StudentSet;
  let subject: Subject;
  let activities: Activity[];
  let room: Room;
  let constraint: StudentSetMaxDaysPerWeek;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    studentSet = new StudentSet('s1', 'Class 1A');
    subject = new Subject('sub1', 'Mathematics');
    room = new Room('r1', 'Classroom 101', 30);
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`a${i}`, `Activity ${i}`, subject, 60);
      activity.studentSets.push(studentSet);
      activities.push(activity);
    }
    constraint = new StudentSetMaxDaysPerWeek(studentSet, 3);
  });
  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when student set has activities on fewer days than max', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 2, hour: 9, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when student set has activities exactly on max days', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 2, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 4, hour: 9, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should not be satisfied when student set has activities on more days than max', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 2, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 3, hour: 9, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;
    for (let i = 0; i < 5; i++) {
      assignment.assignActivity(activities[i], { day: i, hour: 9, minute: 0 }, room.id);
    }
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should maintain a list of activities that the constraint applies to', () => {
    expect(constraint.activities.length).toBe(0);
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).toContain(activities[1]);
    expect(constraint.activities.length).toBe(2);
    assignment.assignActivity(activities[2], { day: 2, hour: 9, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activities[2]);
    expect(constraint.activities.length).toBe(3);
  });
  it('should not add duplicate activities', () => {
    constraint.addActivity(activities[0]);
    expect(constraint.activities.length).toBe(1);
    constraint.addActivity(activities[0]);
    expect(constraint.activities.length).toBe(1);
  });
  it('should handle activities scheduled multiple times on the same day', () => {
    const repeatingActivity = new Activity('repeat', 'Repeating Activity', subject, 60);
    repeatingActivity.studentSets.push(studentSet);
    assignment.assignActivity(repeatingActivity, { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[0], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should work with different max days values', () => {
    const strictConstraint = new StudentSetMaxDaysPerWeek(studentSet, 1);
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    expect(strictConstraint.isSatisfied(assignment)).toBe(true);
    assignment.assignActivity(activities[2], { day: 1, hour: 9, minute: 0 }, room.id);
    expect(strictConstraint.isSatisfied(assignment)).toBe(false);
  });
});
