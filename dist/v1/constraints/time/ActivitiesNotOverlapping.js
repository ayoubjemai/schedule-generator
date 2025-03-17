"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesNotOverlapping = void 0;
//import { TimetableAssignment } from '../../scheduler/TimetableAssignment';
class ActivitiesNotOverlapping {
    constructor(weight = 100, active = true) {
        this.type = 'ActivitiesNotOverlapping';
        this.weight = weight;
        this.active = active;
    }
    isSatisfied(assignment) {
        if (!this.active)
            return true;
        const activityAssignments = assignment.getAllActivityAssignments();
        for (let i = 0; i < activityAssignments.length; i++) {
            for (let j = i + 1; j < activityAssignments.length; j++) {
                const activityA = activityAssignments[i];
                const activityB = activityAssignments[j];
                if (this.activitiesOverlap(assignment, activityA, activityB)) {
                    return false;
                }
            }
        }
        return true;
    }
    activitiesOverlap(assignment, activityA, activityB) {
        const slotA = assignment.getSlotForActivity(activityA.id);
        const slotB = assignment.getSlotForActivity(activityB.id);
        if (!slotA || !slotB)
            return false;
        const endA = slotA.hour + activityA.totalDuration;
        const endB = slotB.hour + activityB.totalDuration;
        return (slotA.day === slotB.day &&
            ((slotA.hour < endB && endA > slotB.hour) || (slotB.hour < endA && endB > slotA.hour)));
    }
}
exports.ActivitiesNotOverlapping = ActivitiesNotOverlapping;
//# sourceMappingURL=ActivitiesNotOverlapping.js.map