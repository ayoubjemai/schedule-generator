"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinGapsBetweenActivities = void 0;
class MinGapsBetweenActivities {
    constructor(minGaps, weight = 100, active = true) {
        this.type = 'MinGapsBetweenActivities';
        this.minGaps = minGaps;
        this.weight = weight;
        this.active = active;
    }
    isSatisfied(assignment) {
        if (!this.active)
            return true;
        const activities = assignment.getAllActivityAssignments();
        for (let i = 0; i < activities.length; i++) {
            const activityA = activities[i];
            const slotA = assignment.getSlotForActivity(activityA.id);
            if (!slotA)
                continue;
            for (let j = i + 1; j < activities.length; j++) {
                const activityB = activities[j];
                const slotB = assignment.getSlotForActivity(activityB.id);
                if (!slotB)
                    continue;
                const gap = Math.abs(slotA.hour - slotB.hour);
                if (gap < this.minGaps) {
                    return false;
                }
            }
        }
        return true;
    }
}
exports.MinGapsBetweenActivities = MinGapsBetweenActivities;
//# sourceMappingURL=MinGapsBetweenActivities.js.map