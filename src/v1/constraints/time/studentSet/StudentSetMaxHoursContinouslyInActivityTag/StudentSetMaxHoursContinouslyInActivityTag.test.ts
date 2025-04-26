import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { StudentSet } from '../../../../models/StudentSet';
import { StudentSetMaxHoursContinouslyInActivityTag } from './StudentSetMaxHoursContinouslyInActivityTag';
import { ActivityTag } from '../../../../models/ActivityTag';
describe('StudentSetMaxHoursContinouslyInActivityTag', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_HOURS_CONTINUOUSLY = 2;
  const ACTIVITY_TAG_ID = 'lab';
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let constraint: StudentSetMaxHoursContinouslyInActivityTag;
  let room: Room;
  let studentSet: StudentSet;
  let labTag: ActivityTag;
  let otherTag: ActivityTag;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Chemistry');
    studentSet = new StudentSet('s1', 'Class 1A');
    studentSet.minGapsPerDay = 30; 
    labTag = new ActivityTag(ACTIVITY_TAG_ID, 'Laboratory');
    otherTag = new ActivityTag('lecture', 'Lecture');
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`a${i + 1}`, `Chemistry Lab ${i + 1}`, subject, 60);
      activity.studentSets.push(studentSet);
      activity.activityTags.push(labTag);
      activities.push(activity);
    }
    for (let i = 5; i < 8; i++) {
      const activity = new Activity(`a${i + 1}`, `Chemistry Lecture ${i - 4}`, subject, 60);
      activity.studentSets.push(studentSet);
      activity.activityTags.push(otherTag);
      activities.push(activity);
    }
    room = new Room('r1', 'Laboratory 101', 30);
    constraint = new StudentSetMaxHoursContinouslyInActivityTag(
      studentSet,
      MAX_HOURS_CONTINUOUSLY,
      ACTIVITY_TAG_ID
    );
  });
  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should be satisfied when activities with the tag are below the max continuous hours', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should not be satisfied when activities with the tag exceed max continuous hours', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should use studentSet minGapsPerDay value for determining gaps', () => {
    studentSet.minGapsPerDay = 40; 
    constraint = new StudentSetMaxHoursContinouslyInActivityTag(
      studentSet,
      MAX_HOURS_CONTINUOUSLY,
      ACTIVITY_TAG_ID
    );
    expect(constraint.minGapPerDay).toBe(40);
  });
  it('should handle activities with sufficient gaps as separate sequences', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 11, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 12, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should treat activities with insufficient gaps as a continuous sequence', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    const gapActivity = new Activity('gap', 'Short Gap Activity', subject, 60);
    gapActivity.studentSets.push(studentSet);
    gapActivity.activityTags.push(labTag);
    assignment.assignActivity(gapActivity, { day: 0, hour: 9, minute: 20 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 20 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should ignore activities for other student sets', () => {
    const otherStudentSet = new StudentSet('s2', 'Class 1B');
    for (let i = 0; i < 3; i++) {
      const otherActivity = new Activity(`oa${i + 1}`, `Other Lab ${i + 1}`, subject, 60);
      otherActivity.studentSets.push(otherStudentSet);
      otherActivity.activityTags.push(labTag);
      assignment.assignActivity(otherActivity, { day: 0, hour: 8 + i, minute: 0 }, room.id);
    }
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should ignore non-tagged activities when calculating continuous hours', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it('should check each day independently', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[4], { day: 1, hour: 9, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activities[0]);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).toContain(activities[1]);
  });
  it('should not add duplicate activities', () => {
    constraint.addActivity(activities[0]);
    constraint.addActivity(activities[0]);
    expect(constraint.activities.length).toBe(1);
  });
});
