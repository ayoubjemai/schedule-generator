import payload from '../../data-test/test6.json';
import { validatePayload } from '../helpers/validatePayload';
import {
  MaxConsecutiveHoursForTeacher,
  PreferredRoomsForActivity,
  PreferredStartingTimesForActivity,
  StudentSetNotAvailablePeriods,
  TeacherMaxDaysPerWeek,
  TeacherMaxGapPerDayBetweenActivities,
  TeacherMaxMinutesPerDay,
  TeacherMaxSpanPerDay,
  TeacherMinDaysPerWeek,
  TeacherMinGapPerDayBetweenActivities,
  TeacherMinHoursDaily,
  TeacherMinRestingHours,
  TeacherNotAvailablePeriods,
  StudentSetMaxHoursPerDay,
  RoomNotOverlapping,
  StudentSetMaxConsecutiveHours,
  StudentSetMaxGapPerDay,
  StudentSetMinHoursDaily,
  StudentSetNotOverlapping,
  TeachersNotOverlapping,
  RoomNotAvailable,
  ActivitiesNotOverlapping,
  MinGapsBetweenActivities,
  StudentSetMaxDaysPerWeek,
  StudentSetMaxHoursContinuouslyInActivityTag,
  StudentSetMaxSpanPerDay,
  StudentSetMinDaysPerWeek,
  StudentSetMinGap,
  StudentSetMinHoursContinouslyInActivityTag,
  StudentSetMinSpanPerDay,
  MinConsecutiveHoursForTeacher,
  TeacherMaxDayInIntervalHours,
  TeacherMaxHoursContinouslyInActivityTag,
  TeacherMinGapBetweenActivityTags,
  TeacherMinHourContinouslyInActivityTag,
  TeacherMinHoursDailyInActivityTag,
} from './constraints';
import { Activity } from './models/Activity';
import { Room } from './models/Room';
import { StudentSet } from './models/StudentSet';
import Subject from './models/Subject';
import { Teacher } from './models/Teacher';
import { TimetableScheduler } from './scheduler/TimetableScheduler';
import { Constraint } from './types/constraints';
import { logToFile } from './utils/logToFile';
import { renderConsoleTimetable } from './utils/renderConsoleTimetable';
import { ValidationError } from './utils/ValidationError';

try {
  const data = validatePayload.parse(payload);
  const { dayCount, periodsPerDay } = data;
  const constraints: Constraint[] = [];

  const teachers = data.teachers.map(teacher => {
    const { id, name } = teacher;
    return new Teacher(id, name, teacher);
  });

  const subjects = data.subjects.map(subject => {
    const { id, name } = subject;
    return new Subject(id, name);
  });

  const classes = data.classes.map(classData => {
    const { id } = classData;
    return new StudentSet(id, classData);
  });

  const rooms = data.rooms.map(room => {
    const { id, name } = room;
    return new Room(id, name, 20);
  });

  const activities = data.activities.map(activity => {
    const {
      id,
      name,
      preferredStartingTimes,
      teachers: teacherIds,
      classes: studentSetIds,
      preferredRooms,
    } = activity;
    const teacherInActivities = teacherIds.map(teacherId => {
      const teacher = teachers.find(teacher => teacher.get('id') === teacherId);
      if (!teacher) throw new ValidationError(`Teacher with id ${teacherId} not found`);
      return teacher;
    });
    const studentSets = studentSetIds.map(studentSetId => {
      const selectedClass = classes.find(classData => classData.id === studentSetId);
      if (!selectedClass) throw new ValidationError(`StudentSet with id ${studentSetId} not found`);
      return selectedClass;
    });

    const subject = subjects.find(subject => subject.id === activity.subject);
    if (!subject) throw new ValidationError(`Subject with id ${activity.subject} not found`);

    preferredRooms?.forEach(roomId => {
      const room = rooms.find(room => room.id === roomId);
      if (!room) throw new ValidationError(`Room with id ${roomId} not found`);
    });

    const activityInstance = new Activity(id, name, subject, activity.totalDurationInMinutes);

    activityInstance.teachers.push(...teacherInActivities);
    activityInstance.studentSets.push(...studentSets);
    activityInstance.preferredRooms.push(...(preferredRooms || []));

    preferredStartingTimes && activityInstance.preferredStartingTimes.push(...preferredStartingTimes);

    return activityInstance;
  });

  const scheduler = new TimetableScheduler(data.dayCount, data.periodsPerDay, 1234, 1);

  rooms.forEach(room => {
    constraints.push(new RoomNotOverlapping(room));
    if (room.notAvailablePeriods?.length) {
      constraints.push(new RoomNotAvailable(room));
    }
    scheduler.addRoom(room);
  });

  teachers.forEach(teacher => {
    // Existing constraints
    constraints.push(new TeachersNotOverlapping(teacher));

    // Handle both notAvailablePeriods and notAvailableTimes
    if (teacher.get('notAvailablePeriods')?.length || teacher.notAvailablePeriods?.length) {
      constraints.push(new TeacherNotAvailablePeriods(teacher));
    }

    if (teacher.minDaysPerWeek) {
      constraints.push(new TeacherMinDaysPerWeek(teacher, teacher.minDaysPerWeek));
    }

    if (teacher.maxDaysPerWeek) {
      constraints.push(new TeacherMaxDaysPerWeek(teacher, teacher.maxDaysPerWeek));
    }

    if (teacher.maxHoursContinuously) {
      constraints.push(new MaxConsecutiveHoursForTeacher(teacher, teacher.maxHoursContinuously));
    }

    if (teacher.maxHoursDaily) {
      constraints.push(new TeacherMaxMinutesPerDay(teacher, teacher.maxHoursDaily * 60));
    }

    if (teacher.maxHoursDaily) {
      constraints.push(new TeacherMaxMinutesPerDay(teacher, teacher.maxHoursDaily * 60));
    }

    if (teacher.minHoursDaily) {
      constraints.push(new TeacherMinHoursDaily(teacher, teacher.minHoursDaily));
    }

    if (teacher.maxGapsPerDay) {
      constraints.push(new TeacherMaxGapPerDayBetweenActivities(teacher, teacher.maxGapsPerDay * 60));
    }

    if (teacher.minGapsPerDay) {
      constraints.push(new TeacherMinGapPerDayBetweenActivities(teacher, teacher.minGapsPerDay * 60));
    }

    if (teacher.maxSpanPerDay) {
      constraints.push(new TeacherMaxSpanPerDay(teacher, teacher.maxSpanPerDay));
    }

    if (teacher.minRestingHours) {
      constraints.push(new TeacherMinRestingHours(teacher, teacher.minRestingHours));
    }

    if (teacher.activityTagMaxHoursContinuously) {
      teacher.activityTagMaxHoursContinuously.forEach((maxHours, activityTag) => {
        constraints.push(new TeacherMaxHoursContinouslyInActivityTag(teacher, activityTag, maxHours));
      });
    }

    if (teacher.activityTagMinHoursContinuously) {
      teacher.activityTagMinHoursContinuously.forEach((minHours, activityTag) => {
        constraints.push(new TeacherMinHourContinouslyInActivityTag(teacher, minHours, activityTag));
      });
    }

    if (teacher.activityTagMinHoursDaily) {
      teacher.activityTagMinHoursDaily.forEach((minHours, activityTag) => {
        constraints.push(new TeacherMinHoursDailyInActivityTag(teacher, activityTag, minHours));
      });
    }

    if (teacher.minGapsBetweenActivityTags) {
      teacher.minGapsBetweenActivityTags.forEach((minGapInMinutes, [firstActivityTag, secondActivityTag]) => {
        constraints.push(
          new TeacherMinGapBetweenActivityTags(teacher, firstActivityTag, secondActivityTag, minGapInMinutes)
        );
      });
    }
  });

  classes.forEach(classData => {
    constraints.push(new StudentSetNotOverlapping(classData));
    if (classData.get('notAvailablePeriods').length) {
      constraints.push(new StudentSetNotAvailablePeriods(classData));
    }

    if (classData.get('maxHoursDaily')) {
      constraints.push(new StudentSetMaxHoursPerDay(classData, classData.get('maxHoursDaily')!));
    }
    if (classData.get('minHoursDaily')) {
      constraints.push(new StudentSetMinHoursDaily(classData, classData.get('minHoursDaily')!));
    }

    if (classData.get('maxGapsPerDay')) {
      constraints.push(new StudentSetMaxGapPerDay(classData, classData.get('maxGapsPerDay')! * 60));
    }

    if (classData.get('maxHoursContinuously')) {
      constraints.push(new StudentSetMaxConsecutiveHours(classData, classData.get('maxHoursContinuously')!));
    }

    if (classData.maxDaysPerWeek) {
      constraints.push(new StudentSetMaxDaysPerWeek(classData, classData.maxDaysPerWeek!));
    }

    if (classData.minDaysPerWeek) {
      constraints.push(new StudentSetMinDaysPerWeek(classData, classData.minDaysPerWeek));
    }

    if (classData.maxSpanPerDay) {
      constraints.push(new StudentSetMaxSpanPerDay(classData, classData.maxSpanPerDay));
    }

    if (classData.minSpanPerDay) {
      constraints.push(new StudentSetMinSpanPerDay(classData, classData.minSpanPerDay));
    }

    if (classData.minGapsPerDay) {
      constraints.push(new StudentSetMinGap(classData, classData.minGapsPerDay * 60));
    }

    //    if (classData.get('maxHoursContinuouslyInActivityTag')) {
    if (classData.activityTagMaxHoursContinuously) {
      classData.activityTagMaxHoursContinuously.forEach((maxHour, activityTag) => {
        constraints.push(new StudentSetMaxHoursContinuouslyInActivityTag(classData, maxHour, activityTag));
      });
    }

    if (classData.activityTagMinHoursContinuously) {
      classData.activityTagMinHoursContinuously.forEach((minHour, activityTag) => {
        constraints.push(new StudentSetMinHoursContinouslyInActivityTag(classData, minHour, activityTag));
      });
    }
  });

  activities.forEach(activity => {
    constraints.push(new PreferredRoomsForActivity(activity, activity.preferredRooms));
    constraints.push(new PreferredStartingTimesForActivity(activity, activity.preferredStartingTimes));
    scheduler.addActivity(activity);
  });

  //console.log('Number  of constraints: ', constraints.length);

  const constraintType = Array.from(new Set(constraints.map(constraint => constraint.type)));
  //console.log('Number of constraint types: ', constraintType.length);
  //console.log('Percentage to succes of generation ', (constraintType.length / constraints.length) * 100);
  constraints.forEach(constraint => {
    scheduler.addTimeConstraint(constraint);
  });

  const assignment = scheduler.generateSchedule();
  console.log('\nGenerated Timetable:');

  renderConsoleTimetable(assignment, dayCount, periodsPerDay);
  const { teacherSchedules, studentSetSchedules, roomSchedules } = scheduler.exportSchedule(assignment);
  logToFile('schedule', { teacherSchedules, studentSetSchedules, roomSchedules });

  const violations = scheduler.analyzeConstraintViolations(assignment);
  if (Object.keys(violations).length > 0) {
    console.log('\nConstraint Violations:');
    console.log(violations);
  } else {
    console.log('\nNo constraint violations detected!');
  }
} catch (error) {
  console.dir(error, { depth: 10, colors: true });
}
