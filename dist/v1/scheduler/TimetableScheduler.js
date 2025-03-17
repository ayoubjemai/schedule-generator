"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableScheduler = void 0;
// filepath: /generate-schedule/generate-schedule/src/scheduler/TimetableScheduler.ts
const TimetableAssignment_1 = require("./TimetableAssignment");
class TimetableScheduler {
    constructor(daysCount, periodsPerDay, randomSeed = 123456) {
        this.activities = [];
        this.timeConstraints = [];
        this.spaceConstraints = [];
        this.rooms = [];
        this.daysCount = daysCount;
        this.periodsPerDay = periodsPerDay;
        this.randomSeed = randomSeed;
    }
    addActivity(activity) {
        this.activities.push(activity);
    }
    addTimeConstraint(constraint) {
        this.timeConstraints.push(constraint);
    }
    addSpaceConstraint(constraint) {
        this.spaceConstraints.push(constraint);
    }
    addRoom(room) {
        this.rooms.push(room);
    }
    random() {
        this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
        return this.randomSeed / 233280;
    }
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    evaluateConstraint(constraint, assignment) {
        if (!constraint.active)
            return 100;
        return constraint.isSatisfied(assignment) ? 100 : 0;
    }
    evaluateSchedule(assignment) {
        let totalWeight = 0;
        let weightedScore = 0;
        for (const constraint of this.timeConstraints) {
            const weight = constraint.weight;
            totalWeight += weight;
            const score = this.evaluateConstraint(constraint, assignment);
            weightedScore += score * weight;
        }
        for (const constraint of this.spaceConstraints) {
            const weight = constraint.weight;
            totalWeight += weight;
            const score = this.evaluateConstraint(constraint, assignment);
            weightedScore += score * weight;
        }
        return totalWeight > 0 ? weightedScore / totalWeight : 0;
    }
    generateInitialSchedule() {
        const assignment = new TimetableAssignment_1.TimetableAssignment(this.daysCount, this.periodsPerDay);
        const sortedActivities = [...this.activities].sort((a, b) => {
            const aConstraintLevel = a.teachers.length +
                a.studentSets.length +
                a.totalDuration +
                (a.preferredTimeSlots.length > 0 ? 1 : 0);
            const bConstraintLevel = b.teachers.length +
                b.studentSets.length +
                b.totalDuration +
                (b.preferredTimeSlots.length > 0 ? 1 : 0);
            return bConstraintLevel - aConstraintLevel;
        });
        for (const activity of sortedActivities) {
            let placed = false;
            if (activity.preferredStartingTime) {
                const room = this.findSuitableRoom(activity);
                if (room && this.canPlaceActivity(activity, activity.preferredStartingTime, room.id, assignment)) {
                    assignment.assignActivity(activity, activity.preferredStartingTime, room.id);
                    placed = true;
                }
            }
            if (!placed && activity.preferredStartingTimes.length > 0) {
                for (const time of activity.preferredStartingTimes) {
                    const room = this.findSuitableRoom(activity);
                    if (room && this.canPlaceActivity(activity, time, room.id, assignment)) {
                        assignment.assignActivity(activity, time, room.id);
                        placed = true;
                        break;
                    }
                }
            }
            if (!placed && activity.preferredTimeSlots.length > 0) {
                for (const time of activity.preferredTimeSlots) {
                    const room = this.findSuitableRoom(activity);
                    if (room && this.canPlaceActivity(activity, time, room.id, assignment)) {
                        assignment.assignActivity(activity, time, room.id);
                        placed = true;
                        break;
                    }
                }
            }
            if (!placed) {
                const possibleTimes = [];
                for (let day = 0; day < this.daysCount; day++) {
                    for (let hour = 0; hour <= this.periodsPerDay - activity.totalDuration; hour++) {
                        possibleTimes.push({ day, hour });
                    }
                }
                const shuffledTimes = this.shuffle(possibleTimes);
                for (const time of shuffledTimes) {
                    const room = this.findSuitableRoom(activity);
                    if (room && this.canPlaceActivity(activity, time, room.id, assignment)) {
                        assignment.assignActivity(activity, time, room.id);
                        placed = true;
                        break;
                    }
                }
            }
            if (!placed) {
                console.warn(`Could not place activity ${activity.id}: ${activity.name}`);
            }
        }
        return assignment;
    }
    findSuitableRoom(activity) {
        let candidates = [];
        if (activity.preferredRooms.length > 0) {
            candidates = this.rooms.filter(r => activity.preferredRooms.includes(r.id));
        }
        if (candidates.length === 0 && activity.subject.preferredRooms.length > 0) {
            candidates = this.rooms.filter(r => activity.subject.preferredRooms.includes(r.id));
        }
        if (candidates.length === 0) {
            candidates = [...this.rooms];
        }
        return this.shuffle(candidates)[0];
    }
    canPlaceActivity(activity, period, roomId, assignment) {
        for (let i = 0; i < activity.totalDuration; i++) {
            const hourToCheck = period.hour + i;
            if (hourToCheck >= this.periodsPerDay) {
                return false;
            }
            const existingActivity = assignment.getActivityAtSlot(period.day, hourToCheck);
            if (existingActivity) {
                return false;
            }
            const existingActivityInRoom = assignment.getActivityInRoomAtSlot(roomId, period.day, hourToCheck);
            if (existingActivityInRoom) {
                return false;
            }
        }
        const tempResult = assignment.assignActivity(activity, period, roomId);
        if (!tempResult) {
            return false;
        }
        let satisfiesHardConstraints = true;
        for (const constraint of this.timeConstraints) {
            if (constraint.weight === 100 && !constraint.isSatisfied(assignment)) {
                satisfiesHardConstraints = false;
                break;
            }
        }
        if (satisfiesHardConstraints) {
            for (const constraint of this.spaceConstraints) {
                if (constraint.weight === 100 && !constraint.isSatisfied(assignment)) {
                    satisfiesHardConstraints = false;
                    break;
                }
            }
        }
        assignment.removeActivity(activity);
        return satisfiesHardConstraints;
    }
    generateSchedule(maxIterations = 10000, initialTemperature = 100, coolingRate = 0.99) {
        let currentSolution = this.generateInitialSchedule();
        let currentScore = this.evaluateSchedule(currentSolution);
        let bestSolution = currentSolution;
        let bestScore = currentScore;
        console.log(`Initial schedule score: ${currentScore}`);
        let temperature = initialTemperature;
        let iteration = 0;
        while (iteration < maxIterations && temperature > 0.1) {
            const neighborSolution = this.generateNeighbor(currentSolution);
            const neighborScore = this.evaluateSchedule(neighborSolution);
            const acceptanceProbability = this.calculateAcceptanceProbability(currentScore, neighborScore, temperature);
            if (acceptanceProbability > this.random()) {
                currentSolution = neighborSolution;
                currentScore = neighborScore;
                if (currentScore > bestScore) {
                    bestSolution = currentSolution;
                    bestScore = currentScore;
                    console.log(`New best score: ${bestScore} at iteration ${iteration}`);
                }
            }
            temperature *= coolingRate;
            iteration++;
            if (iteration % 100 === 0) {
                console.log(`Iteration ${iteration}, Temperature: ${temperature.toFixed(2)}, Score: ${currentScore.toFixed(2)}`);
            }
        }
        console.log(`Final best score: ${bestScore} after ${iteration} iterations`);
        return bestSolution;
    }
    generateNeighbor(currentSolution) {
        const neighbor = currentSolution; // Placeholder, should be a deep copy
        const modification = Math.floor(this.random() * 3);
        switch (modification) {
            case 0:
                this.moveRandomActivity(neighbor);
                break;
            case 1:
                this.swapRandomActivities(neighbor);
                break;
            case 2:
                this.changeRandomRoom(neighbor);
                break;
        }
        return neighbor;
    }
    moveRandomActivity(solution) {
        // Implement moving a random activity to a new time slot
    }
    swapRandomActivities(solution) {
        // Implement swapping two random activities
    }
    changeRandomRoom(solution) {
        // Implement changing the room of a random activity
    }
    calculateAcceptanceProbability(currentScore, newScore, temperature) {
        if (newScore > currentScore) {
            return 1.0;
        }
        const delta = currentScore - newScore;
        return Math.exp(-delta / temperature);
    }
    analyzeConstraintViolations(assignment) {
        const violations = {};
        for (const constraint of this.timeConstraints) {
            if (!constraint.isSatisfied(assignment)) {
                violations[constraint.type] = (violations[constraint.type] || 0) + 1;
            }
        }
        for (const constraint of this.spaceConstraints) {
            if (!constraint.isSatisfied(assignment)) {
                violations[constraint.type] = (violations[constraint.type] || 0) + 1;
            }
        }
        return violations;
    }
    exportSchedule(assignment) {
        return {
            teacherSchedules: this.exportTeacherSchedules(assignment),
            studentSetSchedules: this.exportStudentSetSchedules(assignment),
            roomSchedules: this.exportRoomSchedules(assignment),
        };
    }
    exportTeacherSchedules(assignment) {
        const result = {};
        const teachers = new Map();
        for (const activity of this.activities) {
            for (const teacher of activity.teachers) {
                teachers.set(teacher.id, teacher);
            }
        }
        for (const [teacherId, teacher] of teachers) {
            const schedule = {};
            for (let day = 0; day < this.daysCount; day++) {
                schedule[day] = [];
            }
            const activities = assignment.getActivitiesForTeacher(teacherId);
            for (const activity of activities) {
                const slot = assignment.getSlotForActivity(activity.id);
                const roomId = assignment.getRoomForActivity(activity.id);
                if (slot && roomId) {
                    const room = this.rooms.find(r => r.id === roomId);
                    schedule[slot.day].push({
                        activityId: activity.id,
                        activityName: activity.name,
                        subjectName: activity.subject.name,
                        startHour: slot.hour,
                        endHour: slot.hour + activity.totalDuration - 1,
                        roomName: room ? room.name : 'Unknown Room',
                        studentSets: activity.studentSets.map(s => s.name),
                    });
                }
            }
            for (let day = 0; day < this.daysCount; day++) {
                schedule[day].sort((a, b) => a.startHour - b.startHour);
            }
            result[teacherId] = {
                teacherName: teacher.name,
                schedule,
            };
        }
        return result;
    }
    exportStudentSetSchedules(assignment) {
        const result = {};
        const studentSets = new Map();
        for (const activity of this.activities) {
            for (const studentSet of activity.studentSets) {
                studentSets.set(studentSet.id, studentSet);
            }
        }
        for (const [studentSetId, studentSet] of studentSets) {
            const schedule = {};
            for (let day = 0; day < this.daysCount; day++) {
                schedule[day] = [];
            }
            const activities = assignment.getActivitiesForStudentSet(studentSetId);
            for (const activity of activities) {
                const slot = assignment.getSlotForActivity(activity.id);
                const roomId = assignment.getRoomForActivity(activity.id);
                if (slot && roomId) {
                    // Add to schedule logic here
                }
            }
            for (let day = 0; day < this.daysCount; day++) {
                // Sort activities by start hour logic here
            }
            result[studentSetId] = {
                studentSetName: studentSet.name,
                schedule,
            };
        }
        return result;
    }
    exportRoomSchedules(assignment) {
        const result = {};
        for (const room of this.rooms) {
            const schedule = {};
            for (let day = 0; day < this.daysCount; day++) {
                schedule[day] = [];
            }
            const activities = assignment.getActivitiesInRoom(room.id);
            for (const activity of activities) {
                // Add to schedule logic here
            }
            for (let day = 0; day < this.daysCount; day++) {
                // Sort activities by start hour logic here
            }
            result[room.id] = {
                roomName: room.name,
                building: room.building,
                capacity: room.capacity,
                schedule,
            };
        }
        return result;
    }
}
exports.TimetableScheduler = TimetableScheduler;
//# sourceMappingURL=TimetableScheduler.js.map