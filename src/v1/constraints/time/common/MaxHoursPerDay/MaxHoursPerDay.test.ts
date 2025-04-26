import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { MaxHoursPerDay } from './MaxHoursPerDay';
class TestMaxHoursPerDay extends MaxHoursPerDay {
  constructor(maxMinutesPerDay: number) {
    super(maxMinutesPerDay);
  }
  public testIsValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    return this.isValid(assignment, activities);
  }
}
describe('MaxHoursPerDay', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_MINUTES_PER_DAY = 180; 
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let room: Room;
  let maxHoursPerDay: TestMaxHoursPerDay;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    activities = [
      new Activity('a1', 'Activity 1', subject, 60), 
      new Activity('a2', 'Activity 2', subject, 90), 
      new Activity('a3', 'Activity 3', subject, 120), 
      new Activity('a4', 'Activity 4', subject, 45), 
    ];
    room = new Room('r1', 'Classroom 101', 30);
    maxHoursPerDay = new TestMaxHoursPerDay(MAX_MINUTES_PER_DAY);
  });
  it('should be valid when no activities are assigned', () => {
    expect(maxHoursPerDay.testIsValid(assignment, [])).toBe(true);
  });
  it('should be valid when total minutes are below maximum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id);
    expect(maxHoursPerDay.testIsValid(assignment, activities.slice(0, 2))).toBe(true);
  });
  it('should be valid when total minutes equal maximum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 12, minute: 0 }, room.id);
    const testActivities = [activities[0], activities[1], activities[3]];
    expect(maxHoursPerDay.testIsValid(assignment, testActivities)).toBe(false);
  });
  it('should not be valid when total minutes exceed maximum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 12, minute: 0 }, room.id);
    const testActivities = [activities[0], activities[1], activities[2]];
    expect(maxHoursPerDay.testIsValid(assignment, testActivities)).toBe(false);
  });
  it('should evaluate each day independently', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 1, hour: 11, minute: 0 }, room.id);
    assignment.assignActivity(activities[0], { day: 1, hour: 13, minute: 0 }, room.id);
    expect(maxHoursPerDay.testIsValid(assignment, activities)).toBe(false);
  });
  it('should handle activities with different durations correctly', () => {
    const shortActivity = new Activity('short', 'Short Activity', subject, 15);
    const longActivity = new Activity('long', 'Long Activity', subject, 240);
    assignment.assignActivity(shortActivity, { day: 0, hour: 8, minute: 0 }, room.id);
    expect(maxHoursPerDay.testIsValid(assignment, [shortActivity])).toBe(true);
    assignment.assignActivity(longActivity, { day: 0, hour: 9, minute: 0 }, room.id);
    expect(maxHoursPerDay.testIsValid(assignment, [shortActivity, longActivity])).toBe(false);
  });
  it('should handle unassigned activities correctly', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id);
    const allActivities = [...activities, new Activity('unassigned', 'Unassigned Activity', subject, 120)];
    expect(maxHoursPerDay.testIsValid(assignment, allActivities)).toBe(true);
  });
  it('should work with different max minutes values', () => {
    const strictConstraint = new TestMaxHoursPerDay(60);
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    expect(strictConstraint.testIsValid(assignment, [activities[0]])).toBe(true);
    const smallActivity = new Activity('small', 'Small Activity', subject, 15);
    assignment.assignActivity(smallActivity, { day: 0, hour: 10, minute: 0 }, room.id);
    expect(strictConstraint.testIsValid(assignment, [activities[0], smallActivity])).toBe(false);
  });
  it('should handle activities on multiple days', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 2, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(maxHoursPerDay.testIsValid(assignment, activities)).toBe(true);
  });
});
