import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { ActivityTag } from '../../../../models/ActivityTag';
import { MaxHoursContinouslyInActivityTag } from './MaxHoursContinouslyInActivityTag';

class TestMaxHoursContinouslyInActivityTag extends MaxHoursContinouslyInActivityTag {
  activities: Activity[] = [];
  minGapMinutes: number = 30;

  constructor(activityTagId: string, maxHourContinously: number) {
    super(maxHourContinously, activityTagId);
  }

  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isValid(assignment: TimetableAssignment): boolean {
    return super.isValid(assignment, this.activities, this.addActivity.bind(this), this.minGapMinutes);
  }
}

describe('MaxHoursContinouslyInActivityTag', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_HOURS_CONTINUOUSLY = 2;
  const ACTIVITY_TAG_ID = 'lab';
  const MIN_GAP_MINUTES = 30;

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let constraint: TestMaxHoursContinouslyInActivityTag;
  let room: Room;
  let labTag: ActivityTag;
  let otherTag: ActivityTag;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Chemistry');

    labTag = new ActivityTag(ACTIVITY_TAG_ID, 'Laboratory');
    otherTag = new ActivityTag('lecture', 'Lecture');

    // Create activities with lab tag
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`a${i + 1}`, `Chemistry Activity ${i + 1}`, subject, 60);
      activity.activityTags.push(labTag);
      activities.push(activity);
    }

    // Create activities with different tag
    for (let i = 5; i < 8; i++) {
      const activity = new Activity(`a${i + 1}`, `Chemistry Lecture ${i - 4}`, subject, 60);
      activity.activityTags.push(otherTag);
      activities.push(activity);
    }

    room = new Room('r1', 'Laboratory 101', 30);

    constraint = new TestMaxHoursContinouslyInActivityTag(ACTIVITY_TAG_ID, MAX_HOURS_CONTINUOUSLY);
    constraint.minGapMinutes = MIN_GAP_MINUTES;
    constraint.activities = [...activities];
  });

  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isValid(assignment)).toBe(true);
  });

  it('should be satisfied when activities with the tag are below the max continuous hours', () => {
    // Assign 2 consecutive activities with lab tag (2 hours total, equal to MAX_HOURS_CONTINUOUSLY)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    expect(constraint.isValid(assignment)).toBe(true);
  });

  it('should not be satisfied when activities with the tag exceed max continuous hours', () => {
    // Assign 3 consecutive activities with lab tag (3 hours total, exceeds MAX_HOURS_CONTINUOUSLY)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id);

    expect(constraint.isValid(assignment)).toBe(false);
  });

  it('should handle activities with sufficient gaps as separate sequences', () => {
    // First sequence: 2 hours (under limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    // Gap of more than minGapMinutes (30 minutes)

    // Second sequence: 2 hours (under limit)
    assignment.assignActivity(activities[2], { day: 0, hour: 11, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 12, minute: 0 }, room.id);

    expect(constraint.isValid(assignment)).toBe(true);
  });

  it('should treat activities with insufficient gaps as a continuous sequence', () => {
    // First activity
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);

    // Gap of less than minGapMinutes (only 20 minutes)
    // Activity that starts 1h20m after previous activity started (so 20min gap)
    const gapActivity = new Activity('gap', 'Short Gap Activity', subject, 60);
    gapActivity.activityTags.push(labTag);
    constraint.activities.push(gapActivity);
    assignment.assignActivity(gapActivity, { day: 0, hour: 9, minute: 20 }, room.id);

    // Another activity right after
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 20 }, room.id);

    // Total continuous time: 3h20m (exceeds MAX_HOURS_CONTINUOUSLY)
    expect(constraint.isValid(assignment)).toBe(false);
  });

  it('should check each day independently', () => {
    // Day 0: 3 hours continuous (exceeds limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id);

    // Day 1: 2 hours continuous (within limit)
    assignment.assignActivity(activities[3], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[4], { day: 1, hour: 9, minute: 0 }, room.id);

    expect(constraint.isValid(assignment)).toBe(false);
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
    expect(constraint.isValid(assignment)).toBe(true);
  });
});
