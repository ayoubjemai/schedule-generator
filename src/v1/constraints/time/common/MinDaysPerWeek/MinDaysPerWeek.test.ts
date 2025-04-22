import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { MinDaysPerWeek } from './MinDaysPerWeek';

describe('MinDaysPerWeek', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_DAYS = 3;

  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let activity4: Activity;
  let subject: Subject;
  let teacher: Teacher;
  let constraint: MinDaysPerWeek;
  let room: Room;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    teacher = new Teacher('t1', 'John Doe');

    // Create activities for different days
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 60);
    activity1.teachers.push(teacher);

    activity2 = new Activity('a2', 'Math Lecture 2', subject, 60);
    activity2.teachers.push(teacher);

    activity3 = new Activity('a3', 'Math Lecture 3', subject, 60);
    activity3.teachers.push(teacher);

    activity4 = new Activity('a4', 'Math Lecture 4', subject, 60);
    activity4.teachers.push(teacher);

    room = new Room('r1', 'Classroom 101', 30);

    constraint = new MinDaysPerWeek(MIN_DAYS);
  });

  it('should not be satisfied when teacher has activities on fewer than the minimum days', () => {
    // Assign activities on 2 days (less than MIN_DAYS = 3)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 1, hour: 8, minute: 0 }, room.id);

    expect(constraint.isValid(assignment, [activity1, activity2, activity3])).toBe(false);
  });

  it('should be satisfied when teacher has activities on exactly the minimum days', () => {
    // Assign activities on 3 days (equal to MIN_DAYS)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 2, hour: 8, minute: 0 }, room.id);

    expect(constraint.isValid(assignment, [activity1, activity2, activity3])).toBe(true);
  });

  it('should be satisfied when teacher has activities on more than the minimum days', () => {
    // Assign activities on 4 days (more than MIN_DAYS = 3)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 2, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity4, { day: 3, hour: 8, minute: 0 }, room.id);

    expect(constraint.isValid(assignment, [activity1, activity2, activity3, activity4])).toBe(true);
  });

  it('should count each day only once even with multiple activities on the same day', () => {
    // Assign multiple activities on the same day and one on another day (total: 2 days)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 0, hour: 13, minute: 0 }, room.id);
    assignment.assignActivity(activity4, { day: 1, hour: 8, minute: 0 }, room.id);

    // Only 2 unique days, which is less than MIN_DAYS = 3
    expect(constraint.isValid(assignment, [activity1, activity2, activity3, activity4])).toBe(false);
  });

  it('should ignore activities for other teachers', () => {
    const otherTeacher = new Teacher('t2', 'Jane Smith');
    const otherActivity1 = new Activity('oa1', 'Physics Lecture 1', subject, 60);
    otherActivity1.teachers.push(otherTeacher);
    const otherActivity2 = new Activity('oa2', 'Physics Lecture 2', subject, 60);
    otherActivity2.teachers.push(otherTeacher);
    const otherActivity3 = new Activity('oa3', 'Physics Lecture 3', subject, 60);
    otherActivity3.teachers.push(otherTeacher);

    // Assign activities for the other teacher on 3 days
    assignment.assignActivity(otherActivity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherActivity2, { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherActivity3, { day: 2, hour: 8, minute: 0 }, room.id);

    // Assign activities for the main teacher on 2 days
    assignment.assignActivity(activity1, { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 1, hour: 10, minute: 0 }, room.id);

    // Only 2 days for the main teacher, so constraint should not be satisfied
    expect(constraint.isValid(assignment, [activity1, activity2])).toBe(false);
  });
});
