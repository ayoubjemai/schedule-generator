import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { TeacherMaxGapPerDayBetweenActivities } from './TeacherMaxGapPerDayBetweenActivities';
describe('TeacherMaxGapPerDayBetweenActivities', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_GAP_MINUTES = 120; 
  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMaxGapPerDayBetweenActivities;
  let room: Room;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    teacher = new Teacher('t1', 'John Doe');
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 60);
    activity1.teachers.push(teacher);
    activity2 = new Activity('a2', 'Math Lecture 2', subject, 60);
    activity2.teachers.push(teacher);
    activity3 = new Activity('a3', 'Math Lecture 3', subject, 60);
    activity3.teachers.push(teacher);
    room = new Room('r1', 'Classroom 101', 30);
    constraint = new TeacherMaxGapPerDayBetweenActivities(teacher, MAX_GAP_MINUTES);
  });
  it('should be satisfied when no activities are assigned to the teacher', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when constraint is inactive', () => {
    constraint.active = false;
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 15, minute: 0 }, room.id); 
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
    const otherActivity1 = new Activity('oa1', 'Physics Lecture 1', subject, 60);
    otherActivity1.teachers.push(otherTeacher);
    const otherActivity2 = new Activity('oa2', 'Physics Lecture 2', subject, 60);
    otherActivity2.teachers.push(otherTeacher);
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(otherActivity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherActivity2, { day: 0, hour: 14, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should correctly identify teacher's activities", () => {
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    const activityWithoutTeacher = new Activity('awt', 'No Teacher Activity', subject, 60);
    assignment.assignActivity(activityWithoutTeacher, { day: 0, hour: 10, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities).not.toContain(activityWithoutTeacher);
    expect(constraint.activities.length).toBe(1);
  });
});
