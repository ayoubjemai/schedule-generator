import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { MaxConsecutiveHours } from './MaxConsecutiveHours';
class TestMaxConsecutiveHours extends MaxConsecutiveHours {
  constructor(maxHours: number, minGapBeteweenActivity = 0) {
    super(maxHours, minGapBeteweenActivity);
  }
  public testIsValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    return this.isValid(assignment, activities);
  }
}
describe('MaxConsecutiveHours', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_CONSECUTIVE_HOURS = 4; 
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let room: Room;
  let maxConsecutiveHours: TestMaxConsecutiveHours;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    activities = [
      new Activity('a1', 'Activity 1', subject, 60), 
      new Activity('a2', 'Activity 2', subject, 120), 
      new Activity('a3', 'Activity 3', subject, 90), 
      new Activity('a4', 'Activity 4', subject, 180), 
      new Activity('a5', 'Activity 5', subject, 45), 
    ];
    room = new Room('r1', 'Classroom 101', 30);
    maxConsecutiveHours = new TestMaxConsecutiveHours(MAX_CONSECUTIVE_HOURS);
  });
  it('should be valid when no activities are assigned', () => {
    expect(maxConsecutiveHours.testIsValid(assignment, [])).toBe(true);
  });
  it('should be valid when only one activity is assigned', () => {
    assignment.assignActivity(activities[3], { day: 0, hour: 9, minute: 0 }, room.id);
    expect(maxConsecutiveHours.testIsValid(assignment, [activities[3]])).toBe(true);
  });
  it('should be valid when consecutive activities are within limit', () => {
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(maxConsecutiveHours.testIsValid(assignment, [activities[1], activities[2]])).toBe(true);
  });
  it('should be valid when consecutive activities equal the limit', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 0, hour: 9, minute: 0 }, room.id); 
    expect(maxConsecutiveHours.testIsValid(assignment, [activities[0], activities[3]])).toBe(true);
  });
  it('should not be valid when consecutive activities exceed the limit', () => {
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(maxConsecutiveHours.testIsValid(assignment, [activities[1], activities[3]])).toBe(false);
  });
  it('should be valid when activities have gaps between them', () => {
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 0, hour: 11, minute: 0 }, room.id); 
    expect(maxConsecutiveHours.testIsValid(assignment, [activities[1], activities[3]])).toBe(true);
  });
  it('should handle multiple sets of consecutive activities in a day', () => {
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[0], { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 13, minute: 0 }, room.id); 
    assignment.assignActivity(activities[4], { day: 0, hour: 14, minute: 30 }, room.id); 
    expect(maxConsecutiveHours.testIsValid(assignment, activities.slice(0, 5))).toBe(true);
  });
  it('should handle activities on different days', () => {
    assignment.assignActivity(activities[3], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 1, hour: 11, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 2, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 2, hour: 12, minute: 0 }, room.id);
    expect(maxConsecutiveHours.testIsValid(assignment, activities)).toBe(false);
  });
  it('should consider minGapBetweenActivity parameter', () => {
    const constraintWithGap = new TestMaxConsecutiveHours(MAX_CONSECUTIVE_HOURS, 30);
    assignment.assignActivity(activities[1], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 0, hour: 10, minute: 30 }, room.id); 
    expect(constraintWithGap.testIsValid(assignment, [activities[1], activities[3]])).toBe(false);
    expect(maxConsecutiveHours.testIsValid(assignment, [activities[1], activities[3]])).toBe(true);
  });
  it('should handle activities with different starting times', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 15 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 9, minute: 15 }, room.id); 
    assignment.assignActivity(activities[4], { day: 0, hour: 10, minute: 45 }, room.id); 
    expect(maxConsecutiveHours.testIsValid(assignment, [activities[0], activities[2], activities[4]])).toBe(
      true
    );
  });
  it('should handle overlapping activities correctly', () => {
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[0], { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(maxConsecutiveHours.testIsValid(assignment, [activities[0], activities[1]])).toBe(true);
  });
});
