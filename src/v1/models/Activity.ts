import { Period } from '../types/core';
import { ActivityTag } from './ActivityTag';
import { StudentSet } from './StudentSet';
import Subject from './Subject';
import { Teacher } from './Teacher';

export class Activity {
  id: string;
  name: string;
  subject: Subject;
  teachers: Teacher[] = [];
  studentSets: StudentSet[] = [];
  totalDurationInMinutes: number;
  activityTags: ActivityTag[] = [];
  preferredStartingTime?: Period;
  preferredStartingTimes: Period[] = [];
  preferredTimeSlots: Period[] = [];
  minDaysBetween?: number;
  maxDaysBetween?: number;
  endsStudentsDay: boolean = false;
  preferredRooms: string[] = [];
  subActivities: Activity[] = [];

  constructor(id: string, name: string, subject: Subject, totalDurationInMinutes: number) {
    this.id = id;
    this.name = name;
    this.subject = subject;
    this.totalDurationInMinutes = totalDurationInMinutes;
  }
}
