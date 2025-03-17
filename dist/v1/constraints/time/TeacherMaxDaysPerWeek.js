"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherMaxDaysPerWeek = void 0;
class TeacherMaxDaysPerWeek {
    constructor(teacher, maxDays, weight = 100, active = true) {
        this.type = 'TeacherMaxDaysPerWeek';
        this.teacher = teacher;
        this.maxDays = maxDays;
        this.weight = weight;
        this.active = active;
    }
    isSatisfied(assignment) {
        if (!this.active)
            return true;
        const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
        const workingDays = new Set();
        for (const activity of teacherActivities) {
            const slot = assignment.getSlotForActivity(activity.id);
            if (slot) {
                workingDays.add(slot.day);
            }
        }
        return workingDays.size <= this.maxDays;
    }
}
exports.TeacherMaxDaysPerWeek = TeacherMaxDaysPerWeek;
//# sourceMappingURL=TeacherMaxDaysPerWeek.js.map