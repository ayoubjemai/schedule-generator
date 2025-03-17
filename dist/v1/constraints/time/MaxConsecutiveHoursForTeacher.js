"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxConsecutiveHoursForTeacher = void 0;
class MaxConsecutiveHoursForTeacher {
    constructor(teacher, maxHours, weight = 100, active = true) {
        this.type = 'MaxConsecutiveHoursForTeacher';
        this.teacher = teacher;
        this.maxHours = maxHours;
        this.weight = weight;
        this.active = active;
    }
    isSatisfied(assignment) {
        if (!this.active)
            return true;
        const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
        let consecutiveHours = 0;
        for (const activity of teacherActivities) {
            const slot = assignment.getSlotForActivity(activity.id);
            if (slot) {
                for (let i = 0; i < activity.totalDuration; i++) {
                    const hour = slot.hour + i;
                    if (assignment.getActivityAtSlot(slot.day, hour)) {
                        consecutiveHours++;
                    }
                    else {
                        consecutiveHours = 0; // Reset if there's a gap
                    }
                    if (consecutiveHours > this.maxHours) {
                        return false; // Exceeds max consecutive hours
                    }
                }
            }
        }
        return true;
    }
}
exports.MaxConsecutiveHoursForTeacher = MaxConsecutiveHoursForTeacher;
//# sourceMappingURL=MaxConsecutiveHoursForTeacher.js.map