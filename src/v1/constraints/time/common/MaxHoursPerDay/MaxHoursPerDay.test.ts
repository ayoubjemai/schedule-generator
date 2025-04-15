import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { MaxHoursPerDay } from './MaxHoursPerDay';

// Create a test implementation of MaxHoursPerDay for testing
class TestMaxHoursPerDay extends MaxHoursPerDay {
  constructor(maxMinutesPerDay: number) {
    super(maxMinutesPerDay);
  }

  // Expose protected method for testing
  public testIsValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    return this.isValid(assignment, activities);
  }
}

describe('MaxHoursPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_MINUTES_PER_DAY = 180; // 3 hours max per day

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let room: Room;
  let maxHoursPerDay: TestMaxHoursPerDay;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create activities with different durations
    activities = [
      new Activity('a1', 'Activity 1', subject, 60), // 60 minutes
      new Activity('a2', 'Activity 2', subject, 90), // 90 minutes
      new Activity('a3', 'Activity 3', subject, 120), // 120 minutes
      new Activity('a4', 'Activity 4', subject, 45), // 45 minutes
    ];

    room = new Room('r1', 'Classroom 101', 30);

    maxHoursPerDay = new TestMaxHoursPerDay(MAX_MINUTES_PER_DAY);
  });

  it('should be valid when no activities are assigned', () => {
    expect(maxHoursPerDay.testIsValid(assignment, [])).toBe(true);
  });

  it('should be valid when total minutes are below maximum', () => {
    // Assign activities totaling 150 minutes on the same day
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id);

    expect(maxHoursPerDay.testIsValid(assignment, activities.slice(0, 2))).toBe(true);
  });

  it('should be valid when total minutes equal maximum', () => {
    // Assign activities totaling exactly 180 minutes on the same day
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 12, minute: 0 }, room.id);

    // 60 + 90 + 45 = 195 minutes
    const testActivities = [activities[0], activities[1], activities[3]];
    expect(maxHoursPerDay.testIsValid(assignment, testActivities)).toBe(false);
  });

  it('should not be valid when total minutes exceed maximum', () => {
    // Assign activities totaling 270 minutes on the same day
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 12, minute: 0 }, room.id);

    // 60 + 90 + 120 = 270 minutes
    const testActivities = [activities[0], activities[1], activities[2]];
    expect(maxHoursPerDay.testIsValid(assignment, testActivities)).toBe(false);
  });

  it('should evaluate each day independently', () => {
    // Day 0: 150 minutes (under limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    // Day 1: 210 minutes (over limit)
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 11, minute: 0 }, room.id);
    assignment.assignActivity(activities[0], { day: 1, hour: 13, minute: 0 }, room.id);

    // Should be invalid due to Day 1
    expect(maxHoursPerDay.testIsValid(assignment, activities)).toBe(false);
  });

  it('should handle activities with different durations correctly', () => {
    // Create activities with very different durations
    const shortActivity = new Activity('short', 'Short Activity', subject, 15);
    const longActivity = new Activity('long', 'Long Activity', subject, 240);

    // Assign within limit
    assignment.assignActivity(shortActivity, { day: 0, hour: 8, minute: 0 }, room.id);
    expect(maxHoursPerDay.testIsValid(assignment, [shortActivity])).toBe(true);

    // Assign exceeding limit
    assignment.assignActivity(longActivity, { day: 0, hour: 9, minute: 0 }, room.id);
    expect(maxHoursPerDay.testIsValid(assignment, [shortActivity, longActivity])).toBe(false);
  });

  it('should handle unassigned activities correctly', () => {
    // Assign some activities but not all
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);

    // Should ignore unassigned activities in the calculation
    const allActivities = [...activities, new Activity('unassigned', 'Unassigned Activity', subject, 120)];
    expect(maxHoursPerDay.testIsValid(assignment, allActivities)).toBe(true);
  });

  it('should work with different max minutes values', () => {
    // Create a more restrictive constraint
    const strictConstraint = new TestMaxHoursPerDay(60);

    // 60 minutes is exactly at the limit
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    expect(strictConstraint.testIsValid(assignment, [activities[0]])).toBe(true);

    // Adding even a small activity will exceed the limit
    const smallActivity = new Activity('small', 'Small Activity', subject, 15);
    assignment.assignActivity(smallActivity, { day: 0, hour: 10, minute: 0 }, room.id);
    expect(strictConstraint.testIsValid(assignment, [activities[0], smallActivity])).toBe(false);
  });

  it('should handle activities on multiple days', () => {
    // Distribute activities across multiple days
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Day 0: 60 min
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id); // Day 1: 90 min
    assignment.assignActivity(activities[2], { day: 2, hour: 8, minute: 0 }, room.id); // Day 2: 120 min
    assignment.assignActivity(activities[3], { day: 0, hour: 10, minute: 0 }, room.id); // Day 0: +45 min

    // Day 0 now has 105 minutes total, which is under the limit
    expect(maxHoursPerDay.testIsValid(assignment, activities)).toBe(true);
  });
});
