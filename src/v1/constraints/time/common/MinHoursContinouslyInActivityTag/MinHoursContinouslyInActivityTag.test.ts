import { Activity } from '../../../../models/Activity';
import { Room } from '../../../../models/Room';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { ActivityTag } from '../../../../models/ActivityTag';
import { MinHoursContinouslyInActivityTag } from './MinHoursContinouslyInActivityTag';
class TestMinHoursContinouslyInActivityTag extends MinHoursContinouslyInActivityTag {
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
describe('MinHoursContinouslyInActivityTag', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_HOURS_CONTINUOUSLY = 2;
  const ACTIVITY_TAG_ID = 'lab';
  const MIN_GAP_MINUTES = 30;
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let constraint: TestMinHoursContinouslyInActivityTag;
  let room: Room;
  let labTag: ActivityTag;
  let otherTag: ActivityTag;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Chemistry');
    labTag = new ActivityTag(ACTIVITY_TAG_ID, 'Laboratory');
    otherTag = new ActivityTag('lecture', 'Lecture');
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`a${i + 1}`, `Chemistry Activity ${i + 1}`, subject, 60);
      activity.activityTags.push(labTag);
      activities.push(activity);
    }
    for (let i = 5; i < 8; i++) {
      const activity = new Activity(`a${i + 1}`, `Chemistry Lecture ${i - 4}`, subject, 60);
      activity.activityTags.push(otherTag);
      activities.push(activity);
    }
    room = new Room('r1', 'Laboratory 101', 30);
    constraint = new TestMinHoursContinouslyInActivityTag(ACTIVITY_TAG_ID, MAX_HOURS_CONTINUOUSLY);
    constraint.minGapMinutes = MIN_GAP_MINUTES;
    constraint.activities = [...activities];
  });
  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isValid(assignment)).toBe(true);
  });
  it('should be satisfied when activities with the tag are below the max continuous hours', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    expect(constraint.isValid(assignment)).toBe(true);
  });
  it('should not be satisfied when activities with the tag exceed min continuous hours', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    expect(constraint.isValid(assignment)).toBe(false);
  });
  it('should handle activities with sufficient gaps as separate sequences', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 11, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 12, minute: 0 }, room.id);
    expect(constraint.isValid(assignment)).toBe(true);
  });
  it('should treat activities with insufficient gaps as a continuous sequence', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    const gapActivity = new Activity('gap', 'Short Gap Activity', subject, 60);
    gapActivity.activityTags.push(otherTag);
    constraint.activities.push(gapActivity);
    assignment.assignActivity(gapActivity, { day: 0, hour: 9, minute: 20 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 20 }, room.id);
    expect(constraint.isValid(assignment)).toBe(false);
  });
  it('should check each day independently', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[4], { day: 1, hour: 9, minute: 0 }, room.id);
    expect(constraint.isValid(assignment)).toBe(false);
  });
  it('should ignore non-tagged activities when calculating continuous hours', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    expect(constraint.isValid(assignment)).toBe(false);
  });
});
