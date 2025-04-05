import { Period } from '../types/core';

type ID = string;

interface ITeacher {
  id: ID;
  name: string;
  notAvailablePeriods?: Period[];
  maxDaysPerWeek?: number;
  minDaysPerWeek?: number;
  maxGapsPerDay?: number;
  minGapsPerDay?: number;
  maxGapsPerWeek?: number;
  maxHoursDaily?: number;
  maxHoursContinuously?: number;
  minHoursContinuously?: number;
  maxSpanPerDay?: number;
  minHoursDaily?: number;
  activityTagMaxHoursDaily?: Map<string, number>;
  activityTagMaxHoursContinuously?: Map<string, number>;
  activityTagMinHoursDaily?: Map<string, number>;
  minGapsBetweenActivityTags?: Map<[string, string], number>;
  maxDaysPerWeekForHourlyInterval?: Map<[number, number], number>;
  minRestingHours?: number;
  homeRooms?: ID[];
  maxRoomChangesPerDay?: number;
  maxRoomChangesPerWeek?: number;
  maxBuildingChangesPerDay?: number;
  maxBuildingChangesPerWeek?: number;
  minGapsBetweenRoomChanges?: number;
  minGapsBetweenBuildingChanges?: number;
}

export class Teacher {
  id: ID;
  name: string;
  protected notAvailablePeriods: Period[] = [];
  protected maxDaysPerWeek?: number;
  protected minDaysPerWeek?: number;
  protected maxGapsPerDay?: number;
  protected minGapsPerDay?: number;
  protected maxGapsPerWeek?: number;
  protected maxHoursDaily?: number;
  protected maxHoursContinuously?: number;
  protected minHoursContinuously?: number;
  protected maxSpanPerDay?: number;
  protected minHoursDaily?: number;
  protected activityTagMaxHoursDaily: Map<string, number> = new Map();
  protected activityTagMaxHoursContinuously: Map<string, number> = new Map();
  protected activityTagMinHoursDaily: Map<string, number> = new Map();
  protected minGapsBetweenActivityTags: Map<[string, string], number> = new Map();
  protected maxDaysPerWeekForHourlyInterval: Map<[number, number], number> = new Map();
  protected minRestingHours?: number;
  protected homeRooms: ID[] = [];
  protected maxRoomChangesPerDay?: number;
  protected maxRoomChangesPerWeek?: number;
  protected maxBuildingChangesPerDay?: number;
  protected maxBuildingChangesPerWeek?: number;
  protected minGapsBetweenRoomChanges?: number;
  protected minGapsBetweenBuildingChanges?: number;

  constructor(
    id: ID,
    name: string,
    payload?: Partial<{
      notAvailablePeriods: Period[];
      maxDaysPerWeek: number;
      minDaysPerWeek: number;
      maxGapsPerDay: number;
      minGapsPerDay: number;
      maxGapsPerWeek: number;
      maxHoursDaily: number;
      maxHoursContinuously: number;
      minHoursContinuously: number;
      maxSpanPerDay: number;
      minHoursDaily: number;
      minRestingHours: number;
      maxRoomChangesPerDay: number;
      maxRoomChangesPerWeek: number;
      maxBuildingChangesPerDay: number;
      maxBuildingChangesPerWeek: number;
      minGapsBetweenRoomChanges: number;
      minGapsBetweenBuildingChanges: number;
      activityTagMaxHoursDaily: Map<string, number>;
      activityTagMaxHoursContinuously: Map<string, number>;
      activityTagMinHoursDaily: Map<string, number>;
      minGapsBetweenActivityTags: Map<[string, string], number>;
      maxDaysPerWeekForHourlyInterval: Map<[number, number], number>;
      homeRooms: string[];
    }>
  ) {
    this.id = id;
    this.name = name;
    if (!payload) return;
    const {
      notAvailablePeriods,
      maxDaysPerWeek,
      minDaysPerWeek,
      maxGapsPerDay,
      minGapsPerDay,
      maxGapsPerWeek,
      maxHoursDaily,
      maxHoursContinuously,
      minHoursContinuously,
      maxSpanPerDay,
      minHoursDaily,
      minRestingHours,
      maxRoomChangesPerDay,
      maxRoomChangesPerWeek,
      maxBuildingChangesPerDay,
      maxBuildingChangesPerWeek,
      minGapsBetweenRoomChanges,
      minGapsBetweenBuildingChanges,
      activityTagMaxHoursDaily,
      activityTagMaxHoursContinuously,
      activityTagMinHoursDaily,
      minGapsBetweenActivityTags,
      maxDaysPerWeekForHourlyInterval,
      homeRooms,
    } = payload;
    if (notAvailablePeriods) this.notAvailablePeriods = notAvailablePeriods;
    this.maxDaysPerWeek = maxDaysPerWeek;
    this.minDaysPerWeek = minDaysPerWeek;
    this.maxGapsPerDay = maxGapsPerDay;
    this.minGapsPerDay = minGapsPerDay;
    this.maxGapsPerWeek = maxGapsPerWeek;
    this.maxHoursDaily = maxHoursDaily;
    this.maxHoursContinuously = maxHoursContinuously;
    this.minHoursContinuously = minHoursContinuously;
    this.maxSpanPerDay = maxSpanPerDay;
    this.minHoursDaily = minHoursDaily;
    this.minRestingHours = minRestingHours;
    this.maxRoomChangesPerDay = maxRoomChangesPerDay;
    this.maxRoomChangesPerWeek = maxRoomChangesPerWeek;
    this.maxBuildingChangesPerDay = maxBuildingChangesPerDay;
    this.maxBuildingChangesPerWeek = maxBuildingChangesPerWeek;
    this.minGapsBetweenRoomChanges = minGapsBetweenRoomChanges;
    this.minGapsBetweenBuildingChanges = minGapsBetweenBuildingChanges;
    if (activityTagMaxHoursDaily) this.activityTagMaxHoursDaily = activityTagMaxHoursDaily;
    if (activityTagMaxHoursContinuously)
      this.activityTagMaxHoursContinuously = activityTagMaxHoursContinuously;
    if (activityTagMinHoursDaily) this.activityTagMinHoursDaily = activityTagMinHoursDaily;

    if (minGapsBetweenActivityTags) this.minGapsBetweenActivityTags = minGapsBetweenActivityTags;

    if (maxDaysPerWeekForHourlyInterval)
      this.maxDaysPerWeekForHourlyInterval = maxDaysPerWeekForHourlyInterval;
    if (homeRooms) this.homeRooms = homeRooms;
  }

  get<T extends keyof ITeacher>(fileName: T): ITeacher[T] {
    //@ts-ignore
    return this[fileName];
  }
}
