import payload from '../../test3.json';
import { validatePayload } from '../helpers/validatePayload';
import {
  MaxConsecutiveHoursForTeacher,
  PreferredRoomsForActivity,
  StudentSetNotAvailablePeriods,
  TeacherMaxMinutesPerDay,
  TeacherMinDaysPerWeek,
  TeacherMinHoursDaily,
  TeacherNotAvailablePeriods,
} from './constraints';
import { RoomNotOverlapping } from './constraints/time/room/RoomNotOverlapping/RoomNotOverlapping';
import { StudentSetMaxHoursPerDay } from './constraints/time/room/StudentSetMaxHoursPerDay/StudentSetMaxHoursPerDay';
import { StudentSetMaxConsecutiveHours } from './constraints/time/studentSet/StudentSetMaxConsecutiveHours/StudentSetMaxConsecutiveHours';
import { StudentSetMaxGapPerDay } from './constraints/time/studentSet/StudentSetMaxGapPerDay/StudentSetMaxGapPerDay';
import { StudentSetMinHoursDaily } from './constraints/time/studentSet/StudentSetMinHoursDaily/StudentSetMinHoursDaily';
import { StudentSetNotOverlapping } from './constraints/time/studentSet/StudentSetNotOverlapping/StudentSetNotOverlapping';
import { TeachersNotOverlapping } from './constraints/time/teacher/TeachersNotOverlapping/TeachersNotOverlapping';
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
    const { id, name } = classData;
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

  const scheduler = new TimetableScheduler(data.dayCount, data.periodsPerDay, 12345, 1);

  rooms.forEach(room => {
    constraints.push(new RoomNotOverlapping(room));
    scheduler.addRoom(room);
  });

  teachers.forEach(teacher => {
    constraints.push(new TeachersNotOverlapping(teacher));
    if (teacher.get('notAvailablePeriods')?.length) {
      constraints.push(new TeacherNotAvailablePeriods(teacher));
    }

    if (teacher.get('minDaysPerWeek')) {
      constraints.push(new TeacherMinDaysPerWeek(teacher, teacher.get('minDaysPerWeek')!));
    }
    if (teacher.get('maxHoursContinuously')) {
      constraints.push(new MaxConsecutiveHoursForTeacher(teacher, teacher.get('maxHoursContinuously')!));
    }

    if (teacher.get('maxHoursDaily')) {
      constraints.push(new TeacherMaxMinutesPerDay(teacher, teacher.get('maxHoursDaily')! * 60));
    }

    if (teacher.get('minHoursDaily')) {
      constraints.push(new TeacherMinHoursDaily(teacher, teacher.get('minHoursDaily')!));
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
  });

  activities.forEach(activity => {
    constraints.push(new PreferredRoomsForActivity(activity, activity.preferredRooms));
    scheduler.addActivity(activity);
  });

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
