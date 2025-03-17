"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = void 0;
class Activity {
    constructor(id, name, subject, totalDuration) {
        this.teachers = [];
        this.studentSets = [];
        this.activityTags = [];
        this.preferredStartingTimes = [];
        this.preferredTimeSlots = [];
        this.endsStudentsDay = false;
        this.preferredRooms = [];
        this.subActivities = [];
        this.id = id;
        this.name = name;
        this.subject = subject;
        this.totalDuration = totalDuration;
    }
}
exports.Activity = Activity;
//# sourceMappingURL=Activity.js.map