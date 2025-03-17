"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferredStartingTimesForActivity = void 0;
class PreferredStartingTimesForActivity {
    constructor(activity, preferredTimes, weight = 50, active = true) {
        this.type = 'PreferredStartingTimesForActivity';
        this.activity = activity;
        this.preferredTimes = preferredTimes;
        this.weight = weight;
        this.active = active;
    }
    isSatisfied(assignment) {
        if (!this.active || this.preferredTimes.length === 0)
            return true;
        const assignedSlot = assignment.getSlotForActivity(this.activity.id);
        if (!assignedSlot)
            return true; // Not yet assigned
        return this.preferredTimes.some(preferredTime => preferredTime.day === assignedSlot.day &&
            preferredTime.hour === assignedSlot.hour);
    }
}
exports.PreferredStartingTimesForActivity = PreferredStartingTimesForActivity;
//# sourceMappingURL=PreferredStartingTimesForActivity.js.map