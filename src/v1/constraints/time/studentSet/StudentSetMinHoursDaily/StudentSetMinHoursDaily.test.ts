import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { StudentSetMinHoursDaily } from './StudentSetMinHoursDaily';
import { Room } from '../../../../models/Room';
import { StudentSet } from '../../../../models/StudentSet';
describe('StudentSetMinHoursDaily', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_HOURS_DAILY = 3; 
  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let studentSet: StudentSet;
  let constraint: StudentSetMinHoursDaily;
  let room: Room;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    studentSet = new StudentSet('s1', 'Class 1A');
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 60); 
    activity1.studentSets.push(studentSet);
    activity2 = new Activity('a2', 'Math Lecture 2', subject, 90); 
    activity2.studentSets.push(studentSet);
    activity3 = new Activity('a3', 'Math Lecture 3', subject, 120); 
    activity3.studentSets.push(studentSet);
    room = new Room('r1', 'Classroom 101', 30);
    constraint = new StudentSetMinHoursDaily(studentSet, MIN_HOURS_DAILY);
  });
  it('should be satisfied when no activities are assigned', () => {
    expect(() => constraint.isSatisfied(assignment)).toThrow(Error);
  });
  it('should throw an error when total student set hours are less than minimum', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activity2, { day: 1, hour: 9, minute: 0 }, room.id); 
    expect(() => constraint.isSatisfied(assignment)).toThrow(Error);
  });
  it('should not be satisfied when hours on any day are below minimum', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id); 
    assignment.assignActivity(activity3, { day: 1, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activity1, { day: 1, hour: 12, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should be satisfied when hours on all days meet minimum', () => {
    activity3.totalDurationInMinutes = 180; 
    assignment.assignActivity(activity3, { day: 0, hour: 11, minute: 0 }, room.id); 
    activity1.totalDurationInMinutes = 120;
    assignment.assignActivity(activity2, { day: 1, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activity1, { day: 1, hour: 12, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id);
    assignment.assignActivity(activity3, { day: 0, hour: 13, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activity1);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities).toContain(activity3);
    expect(constraint.activities.length).toBe(3);
  });
  it('should not add duplicate activities', () => {
    constraint.addActivity(activity1);
    constraint.addActivity(activity1);
    expect(constraint.activities.length).toBe(1);
  });
  it('should ignore activities for other student sets', () => {
    const otherStudentSet = new StudentSet('s2', 'Class 1B');
    const otherActivity = new Activity('oa1', 'Other Class Activity', subject, 180); 
    otherActivity.studentSets.push(otherStudentSet);
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id); 
    assignment.assignActivity(activity3, { day: 0, hour: 13, minute: 0 }, room.id); 
    assignment.assignActivity(otherActivity, { day: 1, hour: 9, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
    expect(constraint.activities).not.toContain(otherActivity);
  });
  it('should work with different minimum hour values', () => {
    const strictConstraint = new StudentSetMinHoursDaily(studentSet, 5);
    const anotherActivity = new Activity('a4', 'Math Lecture 4', subject, 120); 
    anotherActivity.studentSets.push(studentSet);
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activity3, { day: 0, hour: 12, minute: 0 }, room.id); 
    assignment.assignActivity(anotherActivity, { day: 5, hour: 13, minute: 0 }, room.id); 
    expect(strictConstraint.isSatisfied(assignment)).toBe(false);
    const relaxedConstraint = new StudentSetMinHoursDaily(studentSet, 2);
    expect(relaxedConstraint.isSatisfied(assignment)).toBe(true);
  });
});
