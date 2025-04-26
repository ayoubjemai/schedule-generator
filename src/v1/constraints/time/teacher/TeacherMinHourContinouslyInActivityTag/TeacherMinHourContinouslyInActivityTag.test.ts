import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { ActivityTag } from '../../../../models/ActivityTag';
import { TeacherMinHourContinouslyInActivityTag } from './TeacherMinHourContinouslyInActivityTag';
describe('TeacherMinHourContinouslyInActivityTag', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_CONTINUOUS_HOURS = 2; 
  const TAG_ID = 'lecture';
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMinHourContinouslyInActivityTag;
  let room: Room;
  let lectureTag: ActivityTag;
  let labTag: ActivityTag;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Physics');
    teacher = new Teacher('t1', 'John Doe');
    lectureTag = new ActivityTag(TAG_ID, 'Lecture');
    labTag = new ActivityTag('lab', 'Laboratory');
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`lec${i + 1}`, `Physics Lecture ${i + 1}`, subject, 60); 
      activity.teachers.push(teacher);
      activity.activityTags.push(lectureTag);
      activities.push(activity);
    }
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`lab${i + 1}`, `Physics Lab ${i + 1}`, subject, 60); 
      activity.teachers.push(teacher);
      activity.activityTags.push(labTag);
      activities.push(activity);
    }
    room = new Room('r1', 'Physics Classroom', 30);
    constraint = new TeacherMinHourContinouslyInActivityTag(teacher, MIN_CONTINUOUS_HOURS, TAG_ID);
  });
  it('should be satisfied when teacher has sufficient continuous hours of tagged activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should not be satisfied when continuous tagged activities are less than required minimum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should not be satisfied when tagged activities are interrupted by non-tagged activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it("should be NOT satisfied when there's at least one continuous block meeting the requirement", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[5], { day: 1, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 1, hour: 10, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should handle activities with different durations', () => {
    const shortLecture = new Activity('short', 'Short Lecture', subject, 30); 
    shortLecture.teachers.push(teacher);
    shortLecture.activityTags.push(lectureTag);
    const longLecture = new Activity('long', 'Long Lecture', subject, 90); 
    longLecture.teachers.push(teacher);
    longLecture.activityTags.push(lectureTag);
    assignment.assignActivity(shortLecture, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(longLecture, { day: 0, hour: 8, minute: 30 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should maintain a list of activities with the specified tag', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); 
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).toContain(activities[1]);
    expect(constraint.activities).not.toContain(activities[5]);
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
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should ignore activities for other teachers', () => {
    const otherTeacher = new Teacher('t2', 'Jane Smith');
    const otherTeacherLecture1 = new Activity('otl1', 'Other Teacher Lecture 1', subject, 60);
    otherTeacherLecture1.teachers.push(otherTeacher);
    otherTeacherLecture1.activityTags.push(lectureTag);
    const otherTeacherLecture2 = new Activity('otl2', 'Other Teacher Lecture 2', subject, 60);
    otherTeacherLecture2.teachers.push(otherTeacher);
    otherTeacherLecture2.activityTags.push(lectureTag);
    assignment.assignActivity(otherTeacherLecture1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherTeacherLecture2, { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[0], { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should be satisfied when activities are on different days but each day has continuous requirement met', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 9, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should not treat activities on different days as continuous', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should handle multiple continuous blocks in the same day', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 13, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 14, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
