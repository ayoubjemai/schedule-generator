"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentSet = void 0;
class StudentSet {
    constructor(id, name) {
        this.notAvailablePeriods = [];
        this.activityTagMaxHoursDaily = new Map();
        this.activityTagMaxHoursContinuously = new Map();
        this.activityTagMinHoursDaily = new Map();
        this.minGapsBetweenActivityTags = new Map();
        this.maxDaysPerWeekForHourlyInterval = new Map();
        this.homeRooms = [];
        this.id = id;
        this.name = name;
    }
}
exports.StudentSet = StudentSet;
//# sourceMappingURL=StudentSet.js.map