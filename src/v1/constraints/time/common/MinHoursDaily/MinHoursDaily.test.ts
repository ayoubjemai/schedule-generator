import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { MinHoursDaily } from './MinHoursDaily';

// Create a test implementation of MinHoursDaily for testing
class TestMinHoursDaily extends MinHoursDaily {
  constructor(minHoursDaily: number) {
    super(minHoursDaily);
  }

  // Expose protected method for testing
  public testIsValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    return this.isValid(assignment, activities);
  }
}

describe('MinHoursDaily', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_HOURS_DAILY = 3; // 3 hours minimum per day

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let room: Room;
  let minHoursDaily: TestMinHoursDaily;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');

    // Create activities with different durations
    activities = [
      new Activity('a1', 'Activity 1', subject, 60), // 1 hour
      new Activity('a2', 'Activity 2', subject, 90), // 1.5 hours
      new Activity('a3', 'Activity 3', subject, 120), // 2 hours
      new Activity('a4', 'Activity 4', subject, 45), // 0.75 hours
      new Activity('a5', 'Activity 5', subject, 30), // 0.5 hours
      new Activity('a6', 'Activity 6', subject, 30), // 0.5 hours
    ];

    room = new Room('r1', 'Classroom 101', 30);

    minHoursDaily = new TestMinHoursDaily(MIN_HOURS_DAILY);
  });

  it('should be valid when no activities are assigned', () => {
    // Empty array means no days with activities, so the constraint is satisfied
    expect(minHoursDaily.testIsValid(assignment, [])).toBe(true);
  });

  it('should not be valid when total hours per day are less than minimum', () => {
    // Assign activities totaling 2.5 hours (below 3 hour minimum)
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 1 hour
    assignment.assignActivity(activities[4], { day: 0, hour: 11, minute: 0 }, room.id); // 0.5 hours
    assignment.assignActivity(activities[3], { day: 0, hour: 13, minute: 0 }, room.id); // 0.75 hours

    expect(minHoursDaily.testIsValid(assignment, activities.slice(0, 3))).toBe(false);
  });

  it('should be valid when total hours per day equal minimum', () => {
    // Assign activities totaling exactly 3 hours
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 1 hour
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); // 1.5 hours
    assignment.assignActivity(activities[4], { day: 0, hour: 13, minute: 0 }, room.id); // 0.5 hours

    expect(minHoursDaily.testIsValid(assignment, [activities[0], activities[1], activities[4]])).toBe(true);
  });

  it('should be valid when total hours per day exceed minimum', () => {
    // Assign activities totaling 4.25 hours (above 3 hour minimum)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // 1 hour
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); // 1.5 hours
    assignment.assignActivity(activities[2], { day: 0, hour: 12, minute: 0 }, room.id); // 2 hours

    // Total: 4.5 hours
    expect(minHoursDaily.testIsValid(assignment, activities.slice(0, 3))).toBe(true);
  });

  it('should check all days with activities separately', () => {
    // Day 0: 3.5 hours (meets minimum)
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 1 hour
    assignment.assignActivity(activities[2], { day: 0, hour: 11, minute: 0 }, room.id); // 2 hours

    // Day 1: 2.25 hours (below minimum)
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id); // 1.5 hours
    assignment.assignActivity(activities[3], { day: 1, hour: 11, minute: 0 }, room.id); // 0.75 hours

    // Day 2: 3 hours (meets minimum)
    assignment.assignActivity(activities[2], { day: 2, hour: 9, minute: 0 }, room.id); // 2 hours
    assignment.assignActivity(activities[4], { day: 2, hour: 11, minute: 0 }, room.id); // 0.5 hours
    assignment.assignActivity(activities[4], { day: 2, hour: 12, minute: 0 }, room.id); // 0.5 hours

    // Should fail because Day 1 is below minimum
    expect(minHoursDaily.testIsValid(assignment, activities)).toBe(false);
  });

  it('should ignore days with no activities', () => {
    // Only assign activities on some days

    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // Day 0
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); // Day 0
    assignment.assignActivity(activities[2], { day: 2, hour: 9, minute: 0 }, room.id); // Day 2
    assignment.assignActivity(activities[3], { day: 2, hour: 11, minute: 0 }, room.id); // Day 2

    // Day 0: 2.5 hours (below minimum)
    // Day 1: No activities, should be ignored
    // Day 2: 2.75 hours (below minimum)

    expect(minHoursDaily.testIsValid(assignment, activities.slice(0, 4))).toBe(false);

    // Add more activities to meet minimum
    assignment.assignActivity(activities[4], { day: 0, hour: 13, minute: 0 }, room.id); // Day 0
    assignment.assignActivity(activities[5], { day: 2, hour: 13, minute: 0 }, room.id); // Day 2

    // Now both days meet the minimum
    expect(minHoursDaily.testIsValid(assignment, activities)).toBe(true);
  });

  it('should work with different minimum hours settings', () => {
    // Create a more restrictive constraint
    const strictConstraint = new TestMinHoursDaily(4);

    // Assign 3.5 hours (below 4-hour minimum)
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 1 hour
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); // 1.5 hours
    assignment.assignActivity(activities[4], { day: 0, hour: 13, minute: 0 }, room.id); // 0.5 hours
    assignment.assignActivity(activities[4], { day: 0, hour: 14, minute: 0 }, room.id); // 0.5 hours

    // Should fail with 4-hour minimum
    expect(strictConstraint.testIsValid(assignment, activities)).toBe(false);

    // Create a more permissive constraint
    const relaxedConstraint = new TestMinHoursDaily(2);

    // Should pass with 2-hour minimum
    expect(relaxedConstraint.testIsValid(assignment, activities)).toBe(true);
  });

  it('should handle activities with unusual durations', () => {
    // Create an activity with non-standard duration
    const unusualActivity = new Activity('unusual', 'Unusual Activity', subject, 175); // 2.92 hours

    // Just this activity should meet a 2.5 hour minimum
    assignment.assignActivity(unusualActivity, { day: 0, hour: 9, minute: 0 }, room.id);

    expect(new TestMinHoursDaily(2.5).testIsValid(assignment, [unusualActivity])).toBe(true);
    expect(new TestMinHoursDaily(3).testIsValid(assignment, [unusualActivity])).toBe(false);
  });

  it('should handle unassigned activities correctly', () => {
    // Create assigned and unassigned activities
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); // 1 hour, assigned
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); // 1.5 hours, assigned
    const unassignedActivity = new Activity('unassigned', 'Unassigned Activity', subject, 180); // 3 hours, unassigned

    // Total assigned: 2.5 hours (below 3-hour minimum)
    const allActivities = [...activities.slice(0, 2), unassignedActivity];
    expect(minHoursDaily.testIsValid(assignment, allActivities)).toBe(false);

    // Assign the previously unassigned activity
    assignment.assignActivity(unassignedActivity, { day: 0, hour: 13, minute: 0 }, room.id);

    // Now total is 5.5 hours (above minimum)
    expect(minHoursDaily.testIsValid(assignment, allActivities)).toBe(true);
  });
});
