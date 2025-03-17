"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherNotAvailablePeriods = void 0;
class TeacherNotAvailablePeriods {
    constructor(teacher, weight = 100, active = true) {
        this.type = 'TeacherNotAvailablePeriods';
        this.teacher = teacher;
        this.weight = weight;
        this.active = active;
        this.periods = [...teacher.notAvailablePeriods];
    }
    isSatisfied(assignment) {
        if (!this.active)
            return true;
        const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
        for (const activity of teacherActivities) {
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
exports.TeacherNotAvailablePeriods = TeacherNotAvailablePeriods;
//# sourceMappingURL=TeacherNotAvailablePeriods.js.map