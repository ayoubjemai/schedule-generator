import { Period } from '../types/core';
import { ValidationError } from '../utils/ValidationError';
import { Model } from './model';

type ID = string;

interface IStudentSet {
  id: ID;
  name: string;
  notAvailablePeriods: Period[];
  maxDaysPerWeek?: number;
  maxEarlyBeginnings?: number;
  maxGapsPerDay?: number;
  minGapsPerDay?: number;
  maxGapsPerWeek?: number;
  maxHoursDaily?: number;
  maxHoursContinuously?: number;
  maxSpanPerDay?: number;
  minSpanPerDay?: number;
  minHoursDaily?: number;
  activityTagMaxHoursDaily: Map<string, number>;
  activityTagMaxHoursContinuously: Map<string, number>;
  activityTagMinHoursContinuously: Map<string, number>;
  activityTagMinHoursDaily: Map<string, number>;
  minGapsBetweenActivityTags: Map<[string, string], number>;
  maxDaysPerWeekForHourlyInterval: Map<[number, number], number>;
  minRestingHours?: number;
  homeRooms: string[];
  maxRoomChangesPerDay?: number;
  maxRoomChangesPerWeek?: number;
  maxBuildingChangesPerDay?: number;
  maxBuildingChangesPerWeek?: number;
  minGapsBetweenRoomChanges?: number;
  minGapsBetweenBuildingChanges?: number;
  minDaysPerWeek?: number;
}

export class StudentSet extends Model {
  id: string;
  name: string;
  notAvailablePeriods: Period[] = [];
  maxDaysPerWeek?: number;
  maxEarlyBeginnings?: number;
  maxGapsPerDay?: number;
  minGapsPerDay?: number;
  maxGapsPerWeek?: number;
  maxHoursDaily?: number;
  maxHoursContinuously?: number;
  maxSpanPerDay?: number;
  minSpanPerDay?: number;
  minHoursDaily?: number;
  activityTagMaxHoursDaily: Map<string, number> = new Map();
  activityTagMaxHoursContinuously: Map<string, number> = new Map();
  activityTagMinHoursContinuously: Map<string, number> = new Map();
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
  minDaysPerWeek?: number;

  constructor(id: string, data: Partial<Omit<IStudentSet, 'name'>> & { name: string }) {
    super(id, data.name);
    this.id = id;
    const {
      name,
      notAvailablePeriods,
      maxDaysPerWeek,
      maxEarlyBeginnings,
      maxGapsPerDay,
      minGapsPerDay,
      maxGapsPerWeek,
      maxHoursDaily,
      maxHoursContinuously,
      maxSpanPerDay,
      minSpanPerDay,
      minHoursDaily,
      activityTagMaxHoursDaily,
      activityTagMaxHoursContinuously,
      activityTagMinHoursContinuously,
      activityTagMinHoursDaily,
      minGapsBetweenActivityTags,
      maxDaysPerWeekForHourlyInterval,
      minRestingHours,
      homeRooms,
      maxRoomChangesPerDay,
      maxRoomChangesPerWeek,
      maxBuildingChangesPerDay,
      maxBuildingChangesPerWeek,
      minGapsBetweenRoomChanges,
      minGapsBetweenBuildingChanges,
      minDaysPerWeek,
    } = data;
    this.name = name;
    notAvailablePeriods && (this.notAvailablePeriods = notAvailablePeriods);
    this.maxDaysPerWeek = maxDaysPerWeek;
    this.minDaysPerWeek = minDaysPerWeek;
    this.maxEarlyBeginnings = maxEarlyBeginnings;
    this.maxGapsPerDay = maxGapsPerDay;
    this.minGapsPerDay = minGapsPerDay;
    this.maxGapsPerWeek = maxGapsPerWeek;
    this.maxHoursDaily = maxHoursDaily;
    this.maxHoursContinuously = maxHoursContinuously;
    this.maxSpanPerDay = maxSpanPerDay;
    this.minSpanPerDay = minSpanPerDay;
    this.minHoursDaily = minHoursDaily;
    activityTagMaxHoursDaily && (this.activityTagMaxHoursDaily = activityTagMaxHoursDaily);
    activityTagMaxHoursContinuously &&
      (this.activityTagMaxHoursContinuously = activityTagMaxHoursContinuously);
    activityTagMinHoursContinuously &&
      (this.activityTagMinHoursContinuously = activityTagMinHoursContinuously);
    activityTagMinHoursDaily && (this.activityTagMinHoursDaily = activityTagMinHoursDaily);
    minGapsBetweenActivityTags && (this.minGapsBetweenActivityTags = minGapsBetweenActivityTags);
    maxDaysPerWeekForHourlyInterval &&
      (this.maxDaysPerWeekForHourlyInterval = maxDaysPerWeekForHourlyInterval);
    this.minRestingHours = minRestingHours;
    homeRooms && (this.homeRooms = homeRooms);
    this.maxRoomChangesPerDay = maxRoomChangesPerDay;
    this.maxRoomChangesPerWeek = maxRoomChangesPerWeek;
    this.maxBuildingChangesPerDay = maxBuildingChangesPerDay;
    this.maxBuildingChangesPerWeek = maxBuildingChangesPerWeek;
    this.minGapsBetweenRoomChanges = minGapsBetweenRoomChanges;
    this.minGapsBetweenBuildingChanges = minGapsBetweenBuildingChanges;

    try {
      this.validate();
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      } else if (error instanceof Error) {
        throw new Error(`Error initializing StudentSet ${name}: ${error.message}`);
      }
    }
  }

  get<T extends keyof IStudentSet>(fieldName: T): IStudentSet[T] {
    //@ts-ignore
    return this[fieldName];
  }

  set<T extends keyof IStudentSet>(fieldName: T, value: IStudentSet[T]): void {
    //@ts-ignore
    this[fieldName] = value;
  }

  // ...existing code...

  protected validate(): void {
    this.validateMinMaxRelationships();
    this.validateDaysConstraints();
    this.validateHoursConstraints();
    this.validateGapsConstraints();
    this.validateActivityTagConstraints();
    this.validateRoomBuildingConstraints();
  }

  /**
   * Validates min/max relationships
   */
  private validateMinMaxRelationships(): void {
    // Gaps per day
    if (
      this.minGapsPerDay !== undefined &&
      this.maxGapsPerDay !== undefined &&
      this.minGapsPerDay > this.maxGapsPerDay
    ) {
      throw new ValidationError(
        `StudentSet ${this.name}: minGapsPerDay (${this.minGapsPerDay}) cannot be greater than maxGapsPerDay (${this.maxGapsPerDay})`
      );
    }

    // Hours daily
    if (
      this.minHoursDaily !== undefined &&
      this.maxHoursDaily !== undefined &&
      this.minHoursDaily > this.maxHoursDaily
    ) {
      throw new ValidationError(
        `StudentSet ${this.name}: minHoursDaily (${this.minHoursDaily}) cannot be greater than maxHoursDaily (${this.maxHoursDaily})`
      );
    }

    // Hours continuously
    if (
      this.maxHoursContinuously !== undefined &&
      this.maxHoursDaily !== undefined &&
      this.maxHoursContinuously > this.maxHoursDaily
    ) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxHoursContinuously (${this.maxHoursContinuously}) cannot be greater than maxHoursDaily (${this.maxHoursDaily})`
      );
    }
  }

  /**
   * Validates day-related constraints
   */
  private validateDaysConstraints(): void {
    // Days per week should be between 1-7
    if (this.maxDaysPerWeek !== undefined && (this.maxDaysPerWeek < 1 || this.maxDaysPerWeek > 7)) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxDaysPerWeek (${this.maxDaysPerWeek}) must be between 1 and 7`
      );
    }

    // Validate maxDaysPerWeekForHourlyInterval
    this.maxDaysPerWeekForHourlyInterval.forEach((days, interval) => {
      if (days < 0 || days > 7) {
        throw new ValidationError(
          `StudentSet ${this.name}: Days per week for hourly interval must be between 0 and 7`
        );
      }

      const [start, end] = interval;
      if (start < 0 || start > 23 || end < 0 || end > 23 || start > end) {
        throw new ValidationError(`StudentSet ${this.name}: Invalid hourly interval [${start}, ${end}]`);
      }
    });
  }

  /**
   * Validates hour-related constraints
   */
  private validateHoursConstraints(): void {
    // Reasonable limits for hours
    if (this.maxHoursDaily !== undefined && (this.maxHoursDaily < 0 || this.maxHoursDaily > 24)) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxHoursDaily (${this.maxHoursDaily}) must be between 0 and 24`
      );
    }

    if (this.minHoursDaily !== undefined && (this.minHoursDaily < 0 || this.minHoursDaily > 24)) {
      throw new ValidationError(
        `StudentSet ${this.name}: minHoursDaily (${this.minHoursDaily}) must be between 0 and 24`
      );
    }

    // Span per day should be reasonable
    if (this.maxSpanPerDay !== undefined && (this.maxSpanPerDay < 0 || this.maxSpanPerDay > 24)) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxSpanPerDay (${this.maxSpanPerDay}) must be between 0 and 24`
      );
    }

    // Rest hours should be reasonable
    if (this.minRestingHours !== undefined && (this.minRestingHours < 0 || this.minRestingHours > 24)) {
      throw new ValidationError(
        `StudentSet ${this.name}: minRestingHours (${this.minRestingHours}) must be between 0 and 24`
      );
    }

    // Early beginnings
    if (this.maxEarlyBeginnings !== undefined && this.maxEarlyBeginnings < 0) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxEarlyBeginnings (${this.maxEarlyBeginnings}) must be non-negative`
      );
    }
  }

  /**
   * Validates gap-related constraints
   */
  private validateGapsConstraints(): void {
    // Gaps should be non-negative
    if (this.maxGapsPerDay !== undefined && this.maxGapsPerDay < 0) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxGapsPerDay (${this.maxGapsPerDay}) must be non-negative`
      );
    }

    if (this.minGapsPerDay !== undefined && this.minGapsPerDay < 0) {
      throw new ValidationError(
        `StudentSet ${this.name}: minGapsPerDay (${this.minGapsPerDay}) must be non-negative`
      );
    }

    if (this.maxGapsPerWeek !== undefined && this.maxGapsPerWeek < 0) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxGapsPerWeek (${this.maxGapsPerWeek}) must be non-negative`
      );
    }

    // Max gaps per week should be at least maxGapsPerDay
    if (
      this.maxGapsPerDay !== undefined &&
      this.maxGapsPerWeek !== undefined &&
      this.maxGapsPerWeek < this.maxGapsPerDay
    ) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxGapsPerWeek (${this.maxGapsPerWeek}) should be at least maxGapsPerDay (${this.maxGapsPerDay})`
      );
    }
  }

  /**
   * Validates activity tag-related constraints
   */
  private validateActivityTagConstraints(): void {
    // For each activity tag, validate min/max relationships
    for (const [tag, minHours] of this.activityTagMinHoursDaily.entries()) {
      const maxHours = this.activityTagMaxHoursDaily.get(tag);
      if (maxHours !== undefined && minHours > maxHours) {
        throw new ValidationError(
          `StudentSet ${this.name}: For activity tag "${tag}", minHoursDaily (${minHours}) cannot exceed maxHoursDaily (${maxHours})`
        );
      }

      // Also check against global maxHoursDaily
      if (this.maxHoursDaily !== undefined && minHours > this.maxHoursDaily) {
        throw new ValidationError(
          `StudentSet ${this.name}: For activity tag "${tag}", minHoursDaily (${minHours}) cannot exceed StudentSet's maxHoursDaily (${this.maxHoursDaily})`
        );
      }
    }

    // Check max continuously constraints
    for (const [tag, maxHours] of this.activityTagMaxHoursContinuously.entries()) {
      const maxDailyForTag = this.activityTagMaxHoursDaily.get(tag);
      if (maxDailyForTag !== undefined && maxHours > maxDailyForTag) {
        throw new ValidationError(
          `StudentSet ${this.name}: For activity tag "${tag}", maxHoursContinuously (${maxHours}) cannot exceed maxHoursDaily (${maxDailyForTag}) for the same tag`
        );
      }
    }
  }

  /**
   * Validates room and building-related constraints
   */
  private validateRoomBuildingConstraints(): void {
    // Room changes should be non-negative
    if (this.maxRoomChangesPerDay !== undefined && this.maxRoomChangesPerDay < 0) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxRoomChangesPerDay (${this.maxRoomChangesPerDay}) must be non-negative`
      );
    }

    if (this.maxRoomChangesPerWeek !== undefined && this.maxRoomChangesPerWeek < 0) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxRoomChangesPerWeek (${this.maxRoomChangesPerWeek}) must be non-negative`
      );
    }

    // Building changes should be non-negative
    if (this.maxBuildingChangesPerDay !== undefined && this.maxBuildingChangesPerDay < 0) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxBuildingChangesPerDay (${this.maxBuildingChangesPerDay}) must be non-negative`
      );
    }

    if (this.maxBuildingChangesPerWeek !== undefined && this.maxBuildingChangesPerWeek < 0) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxBuildingChangesPerWeek (${this.maxBuildingChangesPerWeek}) must be non-negative`
      );
    }

    // Weekly changes should be at least the daily maximum
    if (
      this.maxRoomChangesPerDay !== undefined &&
      this.maxRoomChangesPerWeek !== undefined &&
      this.maxRoomChangesPerWeek < this.maxRoomChangesPerDay
    ) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxRoomChangesPerWeek (${this.maxRoomChangesPerWeek}) should be at least maxRoomChangesPerDay (${this.maxRoomChangesPerDay})`
      );
    }

    if (
      this.maxBuildingChangesPerDay !== undefined &&
      this.maxBuildingChangesPerWeek !== undefined &&
      this.maxBuildingChangesPerWeek < this.maxBuildingChangesPerDay
    ) {
      throw new ValidationError(
        `StudentSet ${this.name}: maxBuildingChangesPerWeek (${this.maxBuildingChangesPerWeek}) should be at least maxBuildingChangesPerDay (${this.maxBuildingChangesPerDay})`
      );
    }

    // Gaps between changes should be non-negative
    if (this.minGapsBetweenRoomChanges !== undefined && this.minGapsBetweenRoomChanges < 0) {
      throw new ValidationError(
        `StudentSet ${this.name}: minGapsBetweenRoomChanges (${this.minGapsBetweenRoomChanges}) must be non-negative`
      );
    }

    if (this.minGapsBetweenBuildingChanges !== undefined && this.minGapsBetweenBuildingChanges < 0) {
      throw new ValidationError(
        `StudentSet ${this.name}: minGapsBetweenBuildingChanges (${this.minGapsBetweenBuildingChanges}) must be non-negative`
      );
    }
  }
}
