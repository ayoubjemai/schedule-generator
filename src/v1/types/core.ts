// filepath: /generate-schedule/generate-schedule/src/types/core.ts
export interface Period {
  day: number;
  hour: number;
  minute: number;
}

export interface ActivityScheduleItem {
  activityId: string;
  activityName: string;
  subjectName: string;
  startTime: {
    hour: number;
    minute: number;
  };
  endTime: {
    hour: number;
    minute: number;
  };
  roomName?: string;
  teachers?: string[];
  studentSets?: string[];
}

export interface TeacherScheduleExport {
  teacherName: string;
  schedule: Record<string, ActivityScheduleItem[]>;
}

export interface StudentSetScheduleExport {
  studentSetName: string;
  schedule: Record<string, ActivityScheduleItem[]>;
}

export interface RoomScheduleExport {
  roomName: string;
  building?: string;
  capacity: number;
  schedule: Record<string, ActivityScheduleItem[]>;
}

export interface ScheduleExport {
  teacherSchedules: Record<string, TeacherScheduleExport>;
  studentSetSchedules: Record<string, StudentSetScheduleExport>;
  roomSchedules: Record<string, RoomScheduleExport>;
}
