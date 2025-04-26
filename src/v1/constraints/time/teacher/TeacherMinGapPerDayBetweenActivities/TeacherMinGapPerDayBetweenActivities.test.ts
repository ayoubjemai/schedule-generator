import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { TeacherMinGapPerDayBetweenActivities } from './TeacherMinGapPerDayBetweenActivities';

describe('TeacherMinGapPerDayBetweenActivities', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_GAP_MINUTES = 30; // 30 minutes minimum gap between activities

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMinGapPerDayBetweenActivities;
  let room: Room;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    teacher = new Teacher('t1', 'John Doe');

    // Create activities for testing
    activities = [];
    for (let i = 0; i < 6; i++) {
      const activity = new Activity(`a${i + 1}`, `Math Activity ${i + 1}`, subject, 60); // Each activity is 60 minutes
      activity.teachers.push(teacher);
      activities.push(activity);
    }

    room = new Room('r1', 'Classroom 101', 30);

    constraint = new TeacherMinGapPerDayBetweenActivities(teacher, MIN_GAP_MINUTES);
  });

  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    constraint.isSatisfied(assignment);

    // Both activities should be in the constraint's list
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

    // Assign activities with insufficient gap
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 20 }, room.id);

    // Should be satisfied because constraint is inactive
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should ignore activities for other teachers', () => {
    const otherTeacher = new Teacher('t2', 'Jane Smith');
    const otherTeacherActivity1 = new Activity('oa1', 'Other Teacher Activity 1', subject, 60);
    const otherTeacherActivity2 = new Activity('oa2', 'Other Teacher Activity 2', subject, 60);

    otherTeacherActivity1.teachers.push(otherTeacher);
    otherTeacherActivity2.teachers.push(otherTeacher);

    // Assign activities with insufficient gap for other teacher
    assignment.assignActivity(otherTeacherActivity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherTeacherActivity2, { day: 0, hour: 8, minute: 20 }, room.id);

    // Assign activities with sufficient gap for main teacher
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    // Should be satisfied for main teacher, despite other teacher having insufficient gap
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should use getActivitiesForTeacher from assignment', () => {
    // Spy on getActivitiesForTeacher
    const spy = jest.spyOn(assignment, 'getActivitiesForTeacher');

    constraint.isSatisfied(assignment);

    // Verify the method was called with the correct teacher ID
    expect(spy).toHaveBeenCalledWith(teacher.id);
  });

  it('should delegate to parent class isValid method with teacher activities', () => {
    // Spy on the isValid method
    const spy = jest.spyOn(constraint, 'isValid');

    // Assign activities
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    // Check constraint satisfaction
    constraint.isSatisfied(assignment);

    // Verify that isValid was called with the teacher's activities
    expect(spy).toHaveBeenCalledWith(assignment, expect.arrayContaining([activities[0], activities[1]]));
  });

  it('should correctly identify specific teacher activities', () => {
    // Add more teachers and their activities
    const teacher2 = new Teacher('t2', 'Jane Doe');
    const teacher2Activity = new Activity('t2a1', 'Teacher 2 Activity', subject, 60);
    teacher2Activity.teachers.push(teacher2);

    // Assign activities for both teachers
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(teacher2Activity, { day: 0, hour: 9, minute: 0 }, room.id);

    constraint.isSatisfied(assignment);

    // Should only include activities for the specified teacher
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).not.toContain(teacher2Activity);
  });
});
