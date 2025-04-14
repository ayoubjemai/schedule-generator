import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import { Period } from '../../../../types/core';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { MaxGapPerDay } from './MaxGapPerDay';

// Create a test implementation of MaxGapPerDay for testing
class TestMaxGapPerDay extends MaxGapPerDay {
  constructor(maxGapInMinutes: number) {
    super(maxGapInMinutes);
  }

  // Expose protected method for testing
  public testIsValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    return this.isValid(assignment, activities);
  }
}

describe('MaxGapPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_GAP_MINUTES = 120; // 2 hours maximum gap

  let assignment: TimetableAssignment;
  let activity1: Activity;
  let activity2: Activity;
  let activity3: Activity;
  let subject: Subject;
  let room: Room;
  let maxGapPerDay: TestMaxGapPerDay;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create activities with 1-hour duration
    activity1 = new Activity('a1', 'Math Lecture 1', subject, 60);
    activity2 = new Activity('a2', 'Math Lecture 2', subject, 60);
    activity3 = new Activity('a3', 'Math Lecture 3', subject, 60);

    room = new Room('r1', 'Classroom 101', 30);

    maxGapPerDay = new TestMaxGapPerDay(MAX_GAP_MINUTES);
  });

  it('should be valid when activities list is empty', () => {
    expect(maxGapPerDay.testIsValid(assignment, [])).toBe(true);
  });

  it('should be valid when there is only one activity', () => {
    assignment.assignActivity(activity1, { day: 0, hour: 9, minute: 0 }, room.id);

    expect(maxGapPerDay.testIsValid(assignment, [activity1])).toBe(true);
  });

  it('should be valid when activities have small gaps', () => {
    // First activity at 8:00-9:00, second activity at 10:00-11:00 (1-hour gap)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);

    expect(maxGapPerDay.testIsValid(assignment, [activity1, activity2])).toBe(true);
  });

  it('should be valid when activities have gaps equal to the maximum', () => {
    // First activity at 8:00-9:00, second activity at 11:00-12:00 (2-hour gap, equal to MAX_GAP_MINUTES)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 11, minute: 0 }, room.id);

    expect(maxGapPerDay.testIsValid(assignment, [activity1, activity2])).toBe(true);
  });

  it('should not be valid when activities have gaps exceeding the maximum', () => {
    // First activity at 8:00-9:00, second activity at 12:00-13:00 (3-hour gap, exceeds MAX_GAP_MINUTES)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 12, minute: 0 }, room.id);

    expect(maxGapPerDay.testIsValid(assignment, [activity1, activity2])).toBe(false);
  });

  it('should check each day independently', () => {
    // Day 0: 1-hour gap (valid)
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id);

    // Day 1: 3-hour gap (exceeds maximum)
    assignment.assignActivity(activity3, { day: 1, hour: 8, minute: 0 }, room.id);
    const activity4 = new Activity('a4', 'Math Lecture 4', subject, 60);
    assignment.assignActivity(activity4, { day: 1, hour: 12, minute: 0 }, room.id);

    expect(maxGapPerDay.testIsValid(assignment, [activity1, activity2, activity3, activity4])).toBe(false);
  });

  it('should consider all combinations of activities within a day', () => {
    // Three activities in a day
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 0 }, room.id); // 10:00-11:00 (1h gap after act1)
    assignment.assignActivity(activity3, { day: 0, hour: 14, minute: 0 }, room.id); // 14:00-15:00 (3h gap after act2)

    // Gap between activity2 and activity3 exceeds maximum
    expect(maxGapPerDay.testIsValid(assignment, [activity1, activity2, activity3])).toBe(false);
  });

  it('should handle activities with overlapping times', () => {
    // Two activities that partially overlap
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); // 8:00-9:00
    assignment.assignActivity(activity2, { day: 0, hour: 8, minute: 30 }, room.id); // 8:30-9:30 (overlaps with activity1)

    // No gap between overlapping activities
    expect(maxGapPerDay.testIsValid(assignment, [activity1, activity2])).toBe(true);
  });

  it('should handle activities on different days', () => {
    // Activities on different days should be checked separately
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 0 }, room.id); // Monday
    assignment.assignActivity(activity2, { day: 1, hour: 14, minute: 0 }, room.id); // Tuesday

    expect(maxGapPerDay.testIsValid(assignment, [activity1, activity2])).toBe(true);
  });

  it('should handle activities with different durations', () => {
    // Create an activity with longer duration
    const longActivity = new Activity('long', 'Long Activity', subject, 180); // 3 hours

    // First activity at 8:00-11:00, second activity at 14:00-15:00 (3-hour gap)
    assignment.assignActivity(longActivity, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activity1, { day: 0, hour: 14, minute: 0 }, room.id);

    expect(maxGapPerDay.testIsValid(assignment, [longActivity, activity1])).toBe(false);
  });

  it('should handle activities with non-standard starting times', () => {
    // Activities with odd starting times
    assignment.assignActivity(activity1, { day: 0, hour: 8, minute: 15 }, room.id); // 8:15-9:15
    assignment.assignActivity(activity2, { day: 0, hour: 10, minute: 45 }, room.id); // 10:45-11:45

    // Gap is 90 minutes (within limit)
    expect(maxGapPerDay.testIsValid(assignment, [activity1, activity2])).toBe(true);
  });
});
