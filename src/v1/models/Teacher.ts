import { Period } from '../types/core';

export class Teacher {
  id: string;
  name: string;
  notAvailablePeriods: Period[] = [];
  maxDaysPerWeek?: number;
  minDaysPerWeek?: number;
  maxGapsPerDay?: number;
  maxGapsPerWeek?: number;
  maxHoursDaily?: number;
  maxHoursContinuously?: number;
  maxSpanPerDay?: number;
  minHoursDaily?: number;
  activityTagMaxHoursDaily: Map<string, number> = new Map();
  activityTagMaxHoursContinuously: Map<string, number> = new Map();
  activityTagMinHoursDaily: Map<string, number> = new Map();
  minGapsBetweenActivityTags: Map<[string, string], number> = new Map();
  maxDaysPerWeekForHourlyInterval: Map<[number, number], number> = new Map();
  minRestingHours?: number;
  homeRooms: string[] = [];
  maxRoomChangesPerDay?: number;
  maxRoomChangesPerWeek?: number;
  maxBuildingChangesPerDay?: number;
  maxBuildingChangesPerWeek?: number;
  minGapsBetweenRoomChanges?: number;
  minGapsBetweenBuildingChanges?: number;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
