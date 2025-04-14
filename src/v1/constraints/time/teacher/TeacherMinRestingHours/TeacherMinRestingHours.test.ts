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
  const MIN_RESTING_HOURS = 12; // 12 hours minimum rest between days

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

    // Create activities for consecutive days
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
    // Day 0 and Day 2 (skipping Day 1)
    assignment.assignActivity(lastActivityDay1, { day: 0, hour: 16, minute: 0 }, room.id);
    assignment.assignActivity(firstActivityDay2, { day: 2, hour: 9, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when teacher has sufficient resting hours between consecutive days', () => {
    // Day 0 late afternoon and Day 1 afternoon - more than MIN_RESTING_HOURS between
    assignment.assignActivity(lastActivityDay1, { day: 0, hour: 16, minute: 0 }, room.id); // Ends at 17:00
    assignment.assignActivity(firstActivityDay2, { day: 1, hour: 13, minute: 0 }, room.id); // Starts at 13:00

    // 20 hours rest (from 17:00 to 13:00 next day)
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when teacher has insufficient resting hours between consecutive days', () => {
    // Day 0 evening and Day 1 early morning - less than MIN_RESTING_HOURS between
    assignment.assignActivity(lastActivityDay1, { day: 0, hour: 18, minute: 0 }, room.id); // Ends at 19:00
    assignment.assignActivity(firstActivityDay2, { day: 1, hour: 6, minute: 0 }, room.id); // Starts at 6:00

    // Only 11 hours rest (from 19:00 to 6:00 next day)
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;

    // Set up activities with insufficient rest
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

    // Set up problematic timing for the main teacher's activities
    assignment.assignActivity(lastActivityDay1, { day: 0, hour: 18, minute: 0 }, room.id);

    // This would violate the constraint if it belonged to the main teacher
    assignment.assignActivity(otherActivity, { day: 1, hour: 6, minute: 0 }, room.id);

    // Main teacher has no activities on day 1, so the constraint is satisfied
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
