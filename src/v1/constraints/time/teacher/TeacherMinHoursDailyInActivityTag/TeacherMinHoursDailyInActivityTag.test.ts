import { Activity } from "../../../../models/Activity";
import { Room } from "../../../../models/Room";
import { Teacher } from "../../../../models/Teacher";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import Subject from "../../../../models/Subject";
import { ActivityTag } from "../../../../models/ActivityTag";
import { TeacherMinHoursDailyInActivityTag } from "./TeacherMinHoursDailyInActivityTag";
describe("TeacherMinHoursDailyInActivityTag", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MIN_HOURS_DAILY = 2; 
  const TAG_ID = "lecture";
  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMinHoursDailyInActivityTag;
  let room: Room;
  let lectureTag: ActivityTag;
  let labTag: ActivityTag;
  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject("sub1", "Physics");
    teacher = new Teacher("t1", "John Doe");
    lectureTag = new ActivityTag(TAG_ID, "Lecture");
    labTag = new ActivityTag("lab", "Laboratory");
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`lec${i + 1}`, `Physics Lecture ${i + 1}`, subject, 60); 
      activity.teachers.push(teacher);
      activity.activityTags.push(lectureTag);
      activities.push(activity);
    }
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`lab${i + 1}`, `Physics Lab ${i + 1}`, subject, 60); 
      activity.teachers.push(teacher);
      activity.activityTags.push(labTag);
      activities.push(activity);
    }
    room = new Room("r1", "Physics Classroom", 30);
    constraint = new TeacherMinHoursDailyInActivityTag(teacher, TAG_ID, MIN_HOURS_DAILY);
  });
  it("should be satisfied when the teacher has sufficient hours of tagged activities each day", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 1, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 1, hour: 9, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should not be satisfied when the total hours of tagged activities is sufficient but not properly distributed", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 1, hour: 8, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it("should not be satisfied when the total hours of tagged activities is insufficient", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it("should only count activities with the specified tag", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[6], { day: 0, hour: 10, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 1, hour: 9, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it("should handle activities with different durations", () => {
    const shortLecture = new Activity("short", "Short Lecture", subject, 30); 
    shortLecture.teachers.push(teacher);
    shortLecture.activityTags.push(lectureTag);
    const longLecture = new Activity("long", "Long Lecture", subject, 90); 
    longLecture.teachers.push(teacher);
    longLecture.activityTags.push(lectureTag);
    assignment.assignActivity(shortLecture, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(longLecture, { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[0], { day: 1, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 1, hour: 9, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should ignore days with no activities when checking minimum hours", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[2], { day: 2, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[3], { day: 2, hour: 9, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should maintain a list of activities with the tag that the constraint applies to", () => {
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id); 
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 0 }, room.id); 
    constraint.isSatisfied(assignment);
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).toContain(activities[1]);
    expect(constraint.activities).not.toContain(activities[5]);
    expect(constraint.activities.length).toBe(2);
  });
  it("should not add duplicate activities", () => {
    constraint.addActivity(activities[0]);
    constraint.addActivity(activities[0]);
    expect(constraint.activities.length).toBe(1);
  });
  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should ignore activities for other teachers", () => {
    const otherTeacher = new Teacher("t2", "Jane Smith");
    const otherTeacherLecture1 = new Activity("otl1", "Other Teacher Lecture 1", subject, 60);
    otherTeacherLecture1.teachers.push(otherTeacher);
    otherTeacherLecture1.activityTags.push(lectureTag);
    const otherTeacherLecture2 = new Activity("otl2", "Other Teacher Lecture 2", subject, 60);
    otherTeacherLecture2.teachers.push(otherTeacher);
    otherTeacherLecture2.activityTags.push(lectureTag);
    assignment.assignActivity(otherTeacherLecture1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(otherTeacherLecture2, { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[0], { day: 0, hour: 10, minute: 0 }, room.id); 
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });
  it("should handle activities with multiple tags", () => {
    const multiTagActivity1 = new Activity("mt1", "Multi-Tag Activity 1", subject, 60);
    multiTagActivity1.teachers.push(teacher);
    multiTagActivity1.activityTags.push(lectureTag);
    multiTagActivity1.activityTags.push(labTag);
    const multiTagActivity2 = new Activity("mt2", "Multi-Tag Activity 2", subject, 60);
    multiTagActivity2.teachers.push(teacher);
    multiTagActivity2.activityTags.push(lectureTag);
    multiTagActivity2.activityTags.push(labTag);
    assignment.assignActivity(multiTagActivity1, { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(multiTagActivity2, { day: 0, hour: 9, minute: 0 }, room.id);
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
  it("should handle activities spread across many days", () => {
    for (let day = 0; day < 5; day++) {
      assignment.assignActivity(activities[0], { day: day, hour: 8, minute: 0 }, room.id);
      assignment.assignActivity(activities[1], { day: day, hour: 9, minute: 0 }, room.id);
    }
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
