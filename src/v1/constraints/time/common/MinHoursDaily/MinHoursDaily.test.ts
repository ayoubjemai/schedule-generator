import { Activity } from '../../../../models/Activity';
import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';
import Subject from '../../../../models/Subject';
import { Room } from '../../../../models/Room';
import { MinHoursDaily } from './MinHoursDaily';
class TestMinHoursDaily extends MinHoursDaily {
  constructor(minHoursDaily: number) {
    super(minHoursDaily);
  }
  public testIsValid(assignment: TimetableAssignment, activities: Activity[]): boolean {
    return this.isValid(assignment, activities);
  }
}
describe('MinHoursDaily', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_HOURS_DAILY = 3; 
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let room: Room;
  let minHoursDaily: TestMinHoursDaily;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    activities = [
      new Activity('a1', 'Activity 1', subject, 60), 
      new Activity('a2', 'Activity 2', subject, 90), 
      new Activity('a3', 'Activity 3', subject, 120), 
      new Activity('a4', 'Activity 4', subject, 45), 
      new Activity('a5', 'Activity 5', subject, 30), 
      new Activity('a6', 'Activity 6', subject, 30), 
    ];
    room = new Room('r1', 'Classroom 101', 30);
    minHoursDaily = new TestMinHoursDaily(MIN_HOURS_DAILY);
  });
  it('should be valid when no activities are assigned', () => {
    expect(minHoursDaily.testIsValid(assignment, [])).toBe(true);
  });
  it('should not be valid when total hours per day are less than minimum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[4], { day: 0, hour: 11, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 0, hour: 13, minute: 0 }, room.id); 
    expect(minHoursDaily.testIsValid(assignment, activities.slice(0, 3))).toBe(false);
  });
  it('should be valid when total hours per day equal minimum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); 
    assignment.assignActivity(activities[4], { day: 0, hour: 13, minute: 0 }, room.id); 
    expect(minHoursDaily.testIsValid(assignment, [activities[0], activities[1], activities[4]])).toBe(true);
  });
  it('should be valid when total hours per day exceed minimum', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 12, minute: 0 }, room.id); 
    expect(minHoursDaily.testIsValid(assignment, activities.slice(0, 3))).toBe(true);
  });
  it('should check all days with activities separately', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 11, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 1, hour: 11, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 2, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[4], { day: 2, hour: 11, minute: 0 }, room.id); 
    assignment.assignActivity(activities[4], { day: 2, hour: 12, minute: 0 }, room.id); 
    expect(minHoursDaily.testIsValid(assignment, activities)).toBe(false);
  });
  it('should ignore days with no activities', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 2, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 2, hour: 11, minute: 0 }, room.id); 
    expect(minHoursDaily.testIsValid(assignment, activities.slice(0, 4))).toBe(false);
    assignment.assignActivity(activities[4], { day: 0, hour: 13, minute: 0 }, room.id); 
    assignment.assignActivity(activities[5], { day: 2, hour: 13, minute: 0 }, room.id); 
    expect(minHoursDaily.testIsValid(assignment, activities)).toBe(true);
  });
  it('should work with different minimum hours settings', () => {
    const strictConstraint = new TestMinHoursDaily(4);
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); 
    assignment.assignActivity(activities[4], { day: 0, hour: 13, minute: 0 }, room.id); 
    assignment.assignActivity(activities[4], { day: 0, hour: 14, minute: 0 }, room.id); 
    expect(strictConstraint.testIsValid(assignment, activities)).toBe(false);
    const relaxedConstraint = new TestMinHoursDaily(2);
    expect(relaxedConstraint.testIsValid(assignment, activities)).toBe(true);
  });
  it('should handle activities with unusual durations', () => {
    const unusualActivity = new Activity('unusual', 'Unusual Activity', subject, 175); 
    assignment.assignActivity(unusualActivity, { day: 0, hour: 9, minute: 0 }, room.id);
    expect(new TestMinHoursDaily(2.5).testIsValid(assignment, [unusualActivity])).toBe(true);
    expect(new TestMinHoursDaily(3).testIsValid(assignment, [unusualActivity])).toBe(false);
  });
  it('should handle unassigned activities correctly', () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 11, minute: 0 }, room.id); 
    const unassignedActivity = new Activity('unassigned', 'Unassigned Activity', subject, 180); 
    const allActivities = [...activities.slice(0, 2), unassignedActivity];
    expect(minHoursDaily.testIsValid(assignment, allActivities)).toBe(false);
    assignment.assignActivity(unassignedActivity, { day: 0, hour: 13, minute: 0 }, room.id);
    expect(minHoursDaily.testIsValid(assignment, allActivities)).toBe(true);
  });
});
