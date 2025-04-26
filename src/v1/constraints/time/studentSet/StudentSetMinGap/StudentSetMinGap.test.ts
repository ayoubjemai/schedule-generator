import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { StudentSetMinGap } from './StudentSetMinGap';
import { StudentSet } from '../../../../models/StudentSet';
describe('StudentSetMinGap', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_GAP_MINUTES = 30; 
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let studentSet: StudentSet;
  let anotherStudentSet: StudentSet;
  let constraint: StudentSetMinGap;
  let room: Room;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    studentSet = new StudentSet('s1', 'Class 1A');
    anotherStudentSet = new StudentSet('s2', 'Class 1B');
    activities = [];
    for (let i = 0; i < 6; i++) {
      const activity = new Activity(`a${i + 1}`, `Math Activity ${i + 1}`, subject, 60); 
      activity.studentSets.push(studentSet);
      activities.push(activity);
    }
    const otherActivities = [];
    for (let i = 0; i < 3; i++) {
      const activity = new Activity(`b${i + 1}`, `Other Math Activity ${i + 1}`, subject, 60);
      activity.studentSets.push(anotherStudentSet);
      otherActivities.push(activity);
    }
    activities = [...activities, ...otherActivities];
    room = new Room('r1', 'Classroom 101', 30);
    constraint = new StudentSetMinGap(studentSet, MIN_GAP_MINUTES);
  });
  it('should be initialized with correct properties', () => {
    expect(constraint.studentSet).toBe(studentSet);
    expect(constraint.activities).toHaveLength(0);
    expect(constraint.active).toBe(true);
    expect(constraint.weight).toBeDefined();
  });
  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
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
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 20 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should ignore activities for other student sets', () => {
    assignment.assignActivity(activities[6], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[7], { day: 0, hour: 8, minute: 20 }, room.id);
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should use getActivitiesForStudentSet from assignment', () => {
    const spy = jest.spyOn(assignment, 'getActivitiesForStudentSet');
    constraint.isSatisfied(assignment);
    expect(spy).toHaveBeenCalledWith(studentSet.id);
  });
  it('should delegate to parent class isValid method with student set activities', () => {
    const spy = jest.spyOn(constraint, 'isValid');
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(spy).toHaveBeenCalledWith(assignment, expect.arrayContaining([activities[0], activities[1]]));
  });
  it('should correctly identify specific student set activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[6], { day: 0, hour: 9, minute: 0 }, room.id); 
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).not.toContain(activities[6]);
  });
  it('should be satisfied when student set has sufficient gaps between activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should not be satisfied when student set has insufficient gaps between activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 20 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should handle activities for student set on different days correctly', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 20 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should handle activities with multiple student sets correctly', () => {
    const sharedActivity = new Activity('shared', 'Shared Activity', subject, 60);
    sharedActivity.studentSets.push(studentSet);
    sharedActivity.studentSets.push(anotherStudentSet);
    assignment.assignActivity(sharedActivity, { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 20 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
});
