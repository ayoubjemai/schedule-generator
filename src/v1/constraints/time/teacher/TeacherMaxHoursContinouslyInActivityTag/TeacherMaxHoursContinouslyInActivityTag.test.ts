import { Activity } from "../../../../models/Activity";
import { Room } from "../../../../models/Room";
import { Teacher } from "../../../../models/Teacher";
import { TimetableAssignment } from "../../../../scheduler/TimetableAssignment";
import { Period } from "../../../../types/core";
import Subject from "../../../../models/Subject";
import { ActivityTag } from "../../../../models/ActivityTag";
import { TeacherMaxHoursContinouslyInActivityTag } from "./TeacherMaxHoursContinouslyInActivityTag";

describe("TeacherMaxHoursContinouslyInActivityTag", () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  const MAX_HOURS_CONTINUOUSLY = 2;
  const ACTIVITY_TAG_ID = "lab";

  let assignment: TimetableAssignment;
  let activities: Activity[];
  let subject: Subject;
  let teacher: Teacher;
  let constraint: TeacherMaxHoursContinouslyInActivityTag;
  let room: Room;
  let labTag: ActivityTag;
  let otherTag: ActivityTag;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject("sub1", "Chemistry");

    teacher = new Teacher("t1", "John Doe");
    teacher["minGapsPerDay"] = 30; // 30 minutes gap considered as break

    labTag = new ActivityTag(ACTIVITY_TAG_ID, "Laboratory");
    otherTag = new ActivityTag("lecture", "Lecture");

    // Create activities for different days
    activities = [];
    for (let i = 0; i < 5; i++) {
      const activity = new Activity(`a${i + 1}`, `Chemistry Activity ${i + 1}`, subject, 60);
      activity.teachers.push(teacher);
      activity.activityTags.push(labTag);
      activities.push(activity);
    }

    // Create activities with different tag
    for (let i = 5; i < 8; i++) {
      const activity = new Activity(`a${i + 1}`, `Chemistry Lecture ${i - 4}`, subject, 60);
      activity.teachers.push(teacher);
      activity.activityTags.push(otherTag);
      activities.push(activity);
    }

    room = new Room("r1", "Laboratory 101", 30);

    constraint = new TeacherMaxHoursContinouslyInActivityTag(teacher, ACTIVITY_TAG_ID, MAX_HOURS_CONTINUOUSLY);
  });

  it("should be satisfied when no activities are assigned to the teacher", () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when teacher has no activities with the specified tag", () => {
    // Assign activities with other tags
    for (let i = 5; i < 8; i++) {
      assignment.assignActivity(activities[i], { day: 0, hour: i - 5, minute: 0 }, room.id);
    }

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should be satisfied when teacher has activities with the tag below the max continuous hours", () => {
    // Assign 2 consecutive activities with lab tag (2 hours total, equal to MAX_HOURS_CONTINUOUSLY)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should not be satisfied when teacher has activities with the tag exceeding max continuous hours", () => {
    // Assign 3 consecutive activities with lab tag (3 hours total, exceeds MAX_HOURS_CONTINUOUSLY)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should handle activities with sufficient gaps as separate sequences", () => {
    // First sequence: 2 hours (under limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    // Gap of more than minGapsPerDay (30 minutes)

    // Second sequence: 2 hours (under limit)
    assignment.assignActivity(activities[2], { day: 0, hour: 11, minute: 0 }, room.id);
    assignment.assignActivity(activities[3], { day: 0, hour: 12, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should treat activities with insufficient gaps as a continuous sequence", () => {
    // First activity
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);

    // Gap of less than minGapsPerDay (only 20 minutes)
    // Activity that starts 1h20m after previous activity started (so 20min gap)
    const gapActivity = new Activity("gap", "Short Gap Activity", subject, 60);
    gapActivity.teachers.push(teacher);
    gapActivity.activityTags.push(labTag);
    assignment.assignActivity(gapActivity, { day: 0, hour: 9, minute: 20 }, room.id);

    // Another activity right after
    assignment.assignActivity(activities[1], { day: 0, hour: 10, minute: 20 }, room.id);

    // Total continuous time: 3h20m (exceeds MAX_HOURS_CONTINUOUSLY)
    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should check each day independently", () => {
    // Day 0: 3 hours continuous (exceeds limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);
    assignment.assignActivity(activities[2], { day: 0, hour: 10, minute: 0 }, room.id);

    // Day 1: 2 hours continuous (within limit)
    assignment.assignActivity(activities[3], { day: 1, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[4], { day: 1, hour: 9, minute: 0 }, room.id);

    expect(constraint.isSatisfied(assignment)).toBe(false);
  });

  it("should ignore non-tagged activities when calculating continuous hours", () => {
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

  it("should always be satisfied when constraint is inactive", () => {
    constraint.active = false;

    // Assign 4 consecutive lab activities (exceeds MAX_HOURS_CONTINUOUSLY)
    for (let i = 0; i < 4; i++) {
      assignment.assignActivity(activities[i], { day: 0, hour: 8 + i, minute: 0 }, room.id);
    }

    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it("should maintain a list of activities with the specified tag that the constraint applies to", () => {
    // Assign both lab and lecture activities
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id); // Lab
    assignment.assignActivity(activities[5], { day: 0, hour: 9, minute: 0 }, room.id); // Lecture

    constraint.isSatisfied(assignment);

    // Only lab activities should be in the constraint's list
    expect(constraint.activities).toContain(activities[0]);
    expect(constraint.activities).not.toContain(activities[5]);
    expect(constraint.activities.length).toBe(1);
  });

  it("should not add duplicate activities", () => {
    constraint.addActivity(activities[0]);
    constraint.addActivity(activities[0]);

    expect(constraint.activities.length).toBe(1);
  });

  it("should ignore activities for other teachers", () => {
    const otherTeacher = new Teacher("t2", "Jane Smith");
    const otherTeacherActivity = new Activity("oa1", "Other Teacher Lab", subject, 60);
    otherTeacherActivity.teachers.push(otherTeacher);
    otherTeacherActivity.activityTags.push(labTag);

    // Assign 3 consecutive lab activities for other teacher
    for (let i = 0; i < 3; i++) {
      const clonedActivity = new Activity(`oa${i + 1}`, `Other Lab ${i + 1}`, subject, 60);
      clonedActivity.teachers.push(otherTeacher);
      clonedActivity.activityTags.push(labTag);
      assignment.assignActivity(clonedActivity, { day: 0, hour: 8 + i, minute: 0 }, room.id);
    }

    // Assign 2 consecutive lab activities for main teacher (within limit)
    assignment.assignActivity(activities[0], { day: 0, hour: 8, minute: 0 }, room.id);
    assignment.assignActivity(activities[1], { day: 0, hour: 9, minute: 0 }, room.id);

    // Should be satisfied for main teacher, despite other teacher exceeding limit
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });
});
