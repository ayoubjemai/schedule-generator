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

    studentSet = new StudentSet('s1', { name: 'Class 1A', minGapsPerDay: 30 }); // 30 minutes gap considered as break

    labTag = new ActivityTag(ACTIVITY_TAG_ID, 'Laboratory');
    otherTag = new ActivityTag('lecture', 'Lecture');

    // Create activities with lab tag for different days
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`a${i + 1}`, `Chemistry Lab ${i + 1}`, subject, 60);
      activity.studentSets.push(studentSet);
      activity.activityTags.push(labTag);
      activities.push(activity);
    }

    // Create activities with different tag
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
    // Assign 2 consecutive activities with lab tag (2 hours total, equal to MAX_HOURS_CONTINUOUSLY)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when activities with the tag exceed max continuous hours', () => {
    // Assign 3 consecutive activities with lab tag (3 hours total, exceeds MAX_HOURS_CONTINUOUSLY)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should use studentSet minGapsPerDay value for determining gaps', () => {
    studentSet.set('minGapsPerDay', 40); // Override default value
    constraint = new StudentSetMaxHoursContinouslyInActivityTag(
      studentSet,
      MAX_HOURS_CONTINUOUSLY,
      ACTIVITY_TAG_ID
    );

    // Verify that the minGapPerDay was set correctly
    expect(constraint.minGapPerDay).toBe(40);
  });

  it('should handle activities with sufficient gaps as separate sequences', () => {
    // First sequence: 2 hours (under limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    // Gap of more than minGapPerDay (30 minutes)

    // Second sequence: 2 hours (under limit)
    assignment.assignActivity(activities[2], { day: 0, hour: 11, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 12, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should treat activities with insufficient gaps as a continuous sequence', () => {
    // First activity
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);

    // Gap of less than minGapPerDay (only 20 minutes)
    // Activity that starts 1h20m after previous activity started (so 20min gap)
    const gapActivity = new Activity('gap', 'Short Gap Activity', subject, 60);
    gapActivity.studentSets.push(studentSet);
    gapActivity.activityTags.push(labTag);

    assignment.assignActivity(gapActivity, { day: 0, hour: 9, minute: 20 }, room.id);

    // Another activity right after
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 20 }, room.id);

    // Total continuous time: 3h20m (exceeds MAX_HOURS_CONTINUOUSLY)
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;

    // Assign 3 consecutive activities with lab tag (3 hours total, exceeds MAX_HOURS_CONTINUOUSLY)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should ignore activities for other student sets', () => {
    const otherStudentSet = new StudentSet('s2', { name: 'Class 1B' });

    // Assign 3 consecutive lab activities for other student set (exceeds limit)
    for (let i = 0; i < 3; i++) {
      const otherActivity = new Activity(`oa${i + 1}`, `Other Lab ${i + 1}`, subject, 60);
      otherActivity.studentSets.push(otherStudentSet);
      otherActivity.activityTags.push(labTag);
      assignment.assignActivity(otherActivity, { day: 0, hour: 8 + i, minute: 0 }, room.id);
    }

    // Assign 2 consecutive lab activities for main student set (within limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    // Should be satisfied for main student set, despite other student set exceeding limit
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should ignore non-tagged activities when calculating continuous hours', () => {
    // Lab activities
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);

    // Lecture activity in between (different tag)
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id);

    // Lab activity again
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    // Even though there are 3 consecutive hours of activities,
    // only 2 hours have the lab tag, so constraint is satisfied
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should check each day independently', () => {
    // Day 0: 3 hours continuous (exceeds limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id);

    // Day 1: 2 hours continuous (within limit)
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
