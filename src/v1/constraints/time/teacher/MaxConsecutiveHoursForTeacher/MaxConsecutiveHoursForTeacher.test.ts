import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { MaxConsecutiveHoursForTeacher } from './MaxConsecutiveHoursForTeacher';
describe('MaxConsecutiveHoursForTeacher', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_CONSECUTIVE_HOURS = 4;
  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let teacher: Teacher;
  let constraint: MaxConsecutiveHoursForTeacher;
  let room: Room;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    teacher = new Teacher('t1', 'John Doe');
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 120); 
    activity1.teachers.push(teacher);
    activity2 = new Activity('a2', 'Math Lecture 2', subject, 120); 
    activity2.teachers.push(teacher);
    activity3 = new Activity('a3', 'Math Lecture 3', subject, 120); 
    activity3.teachers.push(teacher);
    room = new Room('r1', 'Classroom 101', 30);
    constraint = new MaxConsecutiveHoursForTeacher(teacher, MAX_CONSECUTIVE_HOURS);
  });
  it('should be satisfied when no activities are assigned to the teacher', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when teacher has non-consecutive activities', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when teacher has consecutive activities within the limit', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should not be satisfied when teacher has consecutive activities exceeding the limit', () => {
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
  it('should ignore activities for other teachers', () => {
    const otherTeacher = new Teacher('t2', 'Jane Smith');
    const otherActivity = new Activity('a4', 'Physics Lecture', subject, 120);
    otherActivity.teachers.push(otherTeacher);
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(otherActivity, { day: 0, hour: 12, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
