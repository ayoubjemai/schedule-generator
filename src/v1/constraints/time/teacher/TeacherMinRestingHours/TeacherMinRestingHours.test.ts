import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { TeacherMinRestinHours } from './TeacherMinRestingHours';
describe('TeacherMinRestingHours', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_RESTING_HOURS = 12; 
  let assignment: TimetableAssignment;
  let lastActivityDay1: Activity;
  let firstActivityDay2: Activity;
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMinRestinHours;
  let room: Room;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    teacher = new Teacher('t1', 'John Doe');
    lastActivityDay1 = new Activity('a1', 'Last Activity Day 1', subject, 60);
    lastActivityDay1.teachers.push(teacher);
    firstActivityDay2 = new Activity('a2', 'First Activity Day 2', subject, 60);
    firstActivityDay2.teachers.push(teacher);
    room = new Room('r1', 'Classroom 101', 30);
    constraint = new TeacherMinRestinHours(teacher, MIN_RESTING_HOURS);
  });
  it('should be satisfied when no activities are assigned to the teacher', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when teacher has activities only on one day', () => {
    assignment.assignActivity(lastActivityDay1, { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(lastActivityDay1, { day: 0, hour: 14, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when teacher has activities on non-consecutive days', () => {
    assignment.assignActivity(lastActivityDay1, { day: 0, hour: 16, minute: 0 }, room.id);
    assignment.assignActivity(firstActivityDay2, { day: 2, hour: 9, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when teacher has sufficient resting hours between consecutive days', () => {
    assignment.assignActivity(lastActivityDay1, { day: 0, hour: 16, minute: 0 }, room.id); 
    assignment.assignActivity(firstActivityDay2, { day: 1, hour: 13, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should not be satisfied when teacher has insufficient resting hours between consecutive days', () => {
    assignment.assignActivity(lastActivityDay1, { day: 0, hour: 18, minute: 0 }, room.id); 
    assignment.assignActivity(firstActivityDay2, { day: 1, hour: 6, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;
    assignment.assignActivity(lastActivityDay1, { day: 0, hour: 18, minute: 0 }, room.id);
    assignment.assignActivity(firstActivityDay2, { day: 1, hour: 6, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(lastActivityDay1, { day: 0, hour: 16, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(lastActivityDay1);
    expect(constraint.activities.length).toBe(1);
    assignment.assignActivity(firstActivityDay2, { day: 1, hour: 13, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(lastActivityDay1);
    expect(constraint.activities).toContain(firstActivityDay2);
    expect(constraint.activities.length).toBe(2);
  });
  it('should not add duplicate activities', () => {
    constraint.addActivity(lastActivityDay1);
    constraint.addActivity(lastActivityDay1);
    expect(constraint.activities.length).toBe(1);
  });
  it('should ignore activities for other teachers', () => {
    const otherTeacher = new Teacher('t2', 'Jane Smith');
    const otherActivity = new Activity('a3', 'Other Teacher Activity', subject, 60);
    otherActivity.teachers.push(otherTeacher);
    assignment.assignActivity(lastActivityDay1, { day: 0, hour: 18, minute: 0 }, room.id);
    assignment.assignActivity(otherActivity, { day: 1, hour: 6, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
