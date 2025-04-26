import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { Teacher } from '../../../../models/Teacher';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { ActivityTag } from '../../../../models/ActivityTag';
import { TeacherMinGapBetweenActivityTags } from './TeacherMinGapBetweenActivityTags';
describe('TeacherMinGapBetweenActivityTags', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_GAP_MINUTES = 60; 
  const TAG_1_ID = 'lecture';
  const TAG_2_ID = 'lab';
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMinGapBetweenActivityTags;
  let room: Room;
  let lectureTag: ActivityTag;
  let labTag: ActivityTag;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Chemistry');
    teacher = new Teacher('t1', 'John Doe');
    const minGapMap = new Map();
    minGapMap.set(`${TAG_1_ID}_${TAG_2_ID}`, MIN_GAP_MINUTES);
    teacher['minHoursDailyActivityTagPerMinutes'] = minGapMap;
    teacher.get = jest.fn().mockImplementation(key => {
      if (key === 'minHoursDailyActivityTagPerMinutes') {
        return minGapMap;
      }
      return null;
    });
    lectureTag = new ActivityTag(TAG_1_ID, 'Lecture');
    labTag = new ActivityTag(TAG_2_ID, 'Laboratory');
    activities = [];
    for (let i = 0; i < 3; i++) {
      const activity = new Activity(`l${i + 1}`, `Chemistry Lecture ${i + 1}`, subject, 60);
      activity.teachers.push(teacher);
      activity.activityTags.push(lectureTag);
      activities.push(activity);
    }
    for (let i = 0; i < 3; i++) {
      const activity = new Activity(`lb${i + 1}`, `Chemistry Lab ${i + 1}`, subject, 60);
      activity.teachers.push(teacher);
      activity.activityTags.push(labTag);
      activities.push(activity);
    }
    room = new Room('r1', 'Chemistry Lab 101', 30);
    constraint = new TeacherMinGapBetweenActivityTags(teacher, TAG_1_ID, TAG_2_ID);
  });
  it('should be satisfied when no activities are assigned to the teacher', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when only tag1 activities are assigned', () => {
    for (let i = 0; i < 3; i++) {
      assignment.assignActivity(activities[i], { day: 0, hour: i + 1, minute: 0 }, room.id);
    }
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when only tag2 activities are assigned', () => {
    for (let i = 3; i < 6; i++) {
      assignment.assignActivity(activities[i], { day: 0, hour: i - 2, minute: 0 }, room.id);
    }
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when there is sufficient gap between tag1 and tag2 activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 10, minute: 30 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should not be satisfied when there is insufficient gap between tag1 and tag2 activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 9, minute: 30 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should check all pairs of activities on the same day', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 10, minute: 30 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 12, minute: 0 }, room.id);
    assignment.assignActivity(activities[4], { day: 0, hour: 13, minute: 30 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should check activities independently for each day', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 9, minute: 30 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[4], { day: 1, hour: 10, minute: 30 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 0, hour: 10, minute: 0 }, room.id); 
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).toContain(activities[3]);
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
    assignment.assignActivity(activities[3], { day: 0, hour: 8, minute: 30 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should ignore activities for other teachers', () => {
    const otherTeacher = new Teacher('t2', 'Jane Smith');
    const otherLecture = new Activity('ol1', 'Other Lecture', subject, 60);
    otherLecture.teachers.push(otherTeacher);
    otherLecture.activityTags.push(lectureTag);
    const otherLab = new Activity('olab1', 'Other Lab', subject, 60);
    otherLab.teachers.push(otherTeacher);
    otherLab.activityTags.push(labTag);
    assignment.assignActivity(otherLecture, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherLab, { day: 0, hour: 8, minute: 30 }, room.id);
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should throw validation error if teacher has no minimum gap configured', () => {
    const unconfiguredTeacher = new Teacher('t3', 'Unconfigured Teacher');
    unconfiguredTeacher.get = jest.fn().mockImplementation(() => new Map());
    expect(() => {
      new TeacherMinGapBetweenActivityTags(unconfiguredTeacher, TAG_1_ID, TAG_2_ID);
    }).toThrow();
  });
});
