"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentSetNotAvailablePeriods = void 0;
class StudentSetNotAvailablePeriods {
    constructor(studentSet, weight = 100, active = true) {
        this.type = 'StudentSetNotAvailablePeriods';
        this.studentSet = studentSet;
        this.weight = weight;
        this.active = active;
        this.periods = [...studentSet.notAvailablePeriods];
    }
    isSatisfied(assignment) {
        if (!this.active)
            return true;
        const studentSetActivities = assignment.getActivitiesForStudentSet(this.studentSet.id);
        for (const activity of studentSetActivities) {
            const slot = assignment.getSlotForActivity(activity.id);
            if (!slot)
                continue;
            for (let i = 0; i < activity.totalDuration; i++) {
                const period = {
                    day: slot.day,
                    hour: slot.hour + i,
                };
                if (this.periods.some(p => p.day === period.day && p.hour === period.hour)) {
                    return false;
                }
            }
        }
        return true;
    }
}
exports.StudentSetNotAvailablePeriods = StudentSetNotAvailablePeriods;
//# sourceMappingURL=StudentSetNotAvailablePeriods.js.map