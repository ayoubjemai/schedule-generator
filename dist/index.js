"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableScheduler = exports.TimetableAssignment = exports.PreferredRoomsForActivity = exports.RoomNotAvailable = exports.MinGapsBetweenActivities = exports.ActivitiesNotOverlapping = exports.PreferredStartingTimesForActivity = exports.MaxConsecutiveHoursForTeacher = exports.StudentSetNotAvailablePeriods = exports.TeacherMaxDaysPerWeek = exports.TeacherNotAvailablePeriods = exports.Activity = exports.Room = exports.ActivityTag = exports.Subject = exports.StudentSet = exports.Teacher = void 0;
exports.renderConsoleTimetable = renderConsoleTimetable;
// Main entities
class Teacher {
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
exports.Teacher = Teacher;
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
class Subject {
    constructor(id, name) {
        this.preferredRooms = [];
        this.id = id;
        this.name = name;
    }
}
exports.Subject = Subject;
class ActivityTag {
    constructor(id, name) {
        this.preferredRooms = [];
        this.id = id;
        this.name = name;
    }
}
exports.ActivityTag = ActivityTag;
class Room {
    constructor(id, name, capacity, building) {
        this.notAvailablePeriods = [];
        this.id = id;
        this.name = name;
        this.capacity = capacity;
        this.building = building;
    }
}
exports.Room = Room;
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
// Time constraint implementations
class TeacherNotAvailablePeriods {
    constructor(teacher, weight = 100, active = true) {
        this.type = 'TeacherNotAvailablePeriods';
        this.teacher = teacher;
        this.weight = weight;
        this.active = active;
        this.periods = [...teacher.notAvailablePeriods];
    }
    isSatisfied(assignment) {
        // Check if the assigned activity has this teacher and conflicts with not available periods
        if (!this.active)
            return true;
        const teacherActivities = assignment.getActivitiesForTeacher(this.teacher.id);
        for (const activity of teacherActivities) {
            const slot = assignment.getSlotForActivity(activity.id);
            if (!slot)
                continue;
            // Check if any period of this activity conflicts with not available periods
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
// More time constraints would follow the same pattern
// Space constraint implementations
class RoomNotAvailable {
    constructor(room, weight = 100, active = true) {
        this.type = 'RoomNotAvailable';
        this.room = room;
        this.weight = weight;
        this.active = active;
        this.periods = [...room.notAvailablePeriods];
    }
    isSatisfied(assignment) {
        if (!this.active)
            return true;
        // Check all activities assigned to this room
        const roomActivities = assignment.getActivitiesInRoom(this.room.id);
        for (const activity of roomActivities) {
            const slot = assignment.getSlotForActivity(activity.id);
            if (!slot)
                continue;
            // Check if any period of this activity conflicts with not available periods
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
exports.RoomNotAvailable = RoomNotAvailable;
class PreferredRoomsForActivity {
    constructor(activity, preferredRooms, weight = 100, active = true) {
        this.type = 'PreferredRoomsForActivity';
        this.activity = activity;
        this.preferredRooms = preferredRooms.length > 0 ? preferredRooms : activity.preferredRooms;
        this.weight = weight;
        this.active = active;
    }
    isSatisfied(assignment) {
        if (!this.active || this.preferredRooms.length === 0)
            return true;
        const roomId = assignment.getRoomForActivity(this.activity.id);
        if (!roomId)
            return true; // Not yet assigned a room
        return this.preferredRooms.includes(roomId);
    }
}
exports.PreferredRoomsForActivity = PreferredRoomsForActivity;
// Main timetable data structure
class TimetableAssignment {
    constructor(daysCount, periodsPerDay) {
        this.daysCount = daysCount;
        this.periodsPerDay = periodsPerDay;
        this.activitySlots = new Map();
        this.activityRooms = new Map();
        this.timeMatrix = new Map(); // dayHour -> Activity mapping
        this.roomTimeMatrix = new Map(); // roomDayHour -> Activity mapping
    }
    assignActivity(activity, period, roomId) {
        // Check if the slot is available
        for (let i = 0; i < activity.totalDuration; i++) {
            const slotKey = `${period.day}_${period.hour + i}`;
            if (this.timeMatrix.has(slotKey)) {
                return false; // Time slot already occupied
            }
            const roomSlotKey = `${roomId}_${period.day}_${period.hour + i}`;
            if (this.roomTimeMatrix.has(roomSlotKey)) {
                return false; // Room already occupied at this time
            }
        }
        // Assign the activity
        this.activitySlots.set(activity.id, period);
        this.activityRooms.set(activity.id, roomId);
        // Update the matrices
        for (let i = 0; i < activity.totalDuration; i++) {
            const slotKey = `${period.day}_${period.hour + i}`;
            this.timeMatrix.set(slotKey, activity);
            const roomSlotKey = `${roomId}_${period.day}_${period.hour + i}`;
            this.roomTimeMatrix.set(roomSlotKey, activity);
        }
        return true;
    }
    removeActivity(activity) {
        const period = this.activitySlots.get(activity.id);
        const roomId = this.activityRooms.get(activity.id);
        if (!period || !roomId)
            return;
        // Remove from matrices
        for (let i = 0; i < activity.totalDuration; i++) {
            const slotKey = `${period.day}_${period.hour + i}`;
            this.timeMatrix.delete(slotKey);
            const roomSlotKey = `${roomId}_${period.day}_${period.hour + i}`;
            this.roomTimeMatrix.delete(roomSlotKey);
        }
        // Remove from maps
        this.activitySlots.delete(activity.id);
        this.activityRooms.delete(activity.id);
    }
    getSlotForActivity(activityId) {
        return this.activitySlots.get(activityId);
    }
    getRoomForActivity(activityId) {
        return this.activityRooms.get(activityId);
    }
    getActivityAtSlot(day, hour) {
        const slotKey = `${day}_${hour}`;
        return this.timeMatrix.get(slotKey);
    }
    getActivityInRoomAtSlot(roomId, day, hour) {
        const roomSlotKey = `${roomId}_${day}_${hour}`;
        return this.roomTimeMatrix.get(roomSlotKey);
    }
    getActivitiesForTeacher(teacherId) {
        const activities = [];
        // For each assigned activity, check if the teacher is involved
        for (const [activityId, _] of this.activitySlots) {
            const activity = this.getActivityById(activityId);
            if (activity && activity.teachers.some(t => t.id === teacherId)) {
                activities.push(activity);
            }
        }
        return activities;
    }
    getActivitiesForStudentSet(studentSetId) {
        const activities = [];
        // For each assigned activity, check if the student set is involved
        for (const [activityId, _] of this.activitySlots) {
            const activity = this.getActivityById(activityId);
            if (activity && activity.studentSets.some(s => s.id === studentSetId)) {
                activities.push(activity);
            }
        }
        return activities;
    }
    getActivitiesInRoom(roomId) {
        const activities = new Set();
        // Collect all activities assigned to this room
        for (const [key, activity] of this.roomTimeMatrix.entries()) {
            if (key.startsWith(`${roomId}_`)) {
                activities.add(activity);
            }
        }
        return Array.from(activities);
    }
    getActivityById(activityId) {
        // This would require an activity repository in a real implementation
        // For now, we'll assume we can extract the activity from the matrices
        for (const activity of this.timeMatrix.values()) {
            if (activity.id === activityId) {
                return activity;
            }
        }
        return undefined;
    }
    // Helper to get working days for a teacher
    getWorkingDaysForTeacher(teacherId) {
        const days = new Set();
        const activities = this.getActivitiesForTeacher(teacherId);
        for (const activity of activities) {
            const slot = this.getSlotForActivity(activity.id);
            if (slot) {
                days.add(slot.day);
            }
        }
        return days;
    }
    // Helper to get gaps for a teacher on a specific day
    getGapsForTeacherOnDay(teacherId, day) {
        const activities = this.getActivitiesForTeacher(teacherId);
        const hoursWorking = [];
        // Get all hours the teacher is working on this day
        for (const activity of activities) {
            const slot = this.getSlotForActivity(activity.id);
            if (slot && slot.day === day) {
                for (let i = 0; i < activity.totalDuration; i++) {
                    hoursWorking.push(slot.hour + i);
                }
            }
        }
        if (hoursWorking.length <= 1)
            return 0; // No gaps possible with 0 or 1 hour
        // Sort hours and count gaps
        hoursWorking.sort((a, b) => a - b);
        let gaps = 0;
        for (let i = 1; i < hoursWorking.length; i++) {
            const hourGap = hoursWorking[i] - hoursWorking[i - 1] - 1;
            if (hourGap > 0) {
                gaps += hourGap;
            }
        }
        return gaps;
    }
    // Get total hour span for a teacher on a day (last hour - first hour + 1)
    getSpanForTeacherOnDay(teacherId, day) {
        const activities = this.getActivitiesForTeacher(teacherId);
        const hours = [];
        for (const activity of activities) {
            const slot = this.getSlotForActivity(activity.id);
            if (slot && slot.day === day) {
                hours.push(slot.hour);
                hours.push(slot.hour + activity.totalDuration - 1);
            }
        }
        if (hours.length === 0)
            return 0;
        const firstHour = Math.min(...hours);
        const lastHour = Math.max(...hours);
        return lastHour - firstHour + 1;
    }
    // Similar methods for student sets
    getWorkingDaysForStudentSet(studentSetId) {
        const days = new Set();
        const activities = this.getActivitiesForStudentSet(studentSetId);
        for (const activity of activities) {
            const slot = this.getSlotForActivity(activity.id);
            if (slot) {
                days.add(slot.day);
            }
        }
        return days;
    }
    getGapsForStudentSetOnDay(studentSetId, day) {
        const activities = this.getActivitiesForStudentSet(studentSetId);
        const hoursWorking = [];
        for (const activity of activities) {
            const slot = this.getSlotForActivity(activity.id);
            if (slot && slot.day === day) {
                for (let i = 0; i < activity.totalDuration; i++) {
                    hoursWorking.push(slot.hour + i);
                }
            }
        }
        if (hoursWorking.length <= 1)
            return 0;
        hoursWorking.sort((a, b) => a - b);
        let gaps = 0;
        for (let i = 1; i < hoursWorking.length; i++) {
            const hourGap = hoursWorking[i] - hoursWorking[i - 1] - 1;
            if (hourGap > 0) {
                gaps += hourGap;
            }
        }
        return gaps;
    }
}
exports.TimetableAssignment = TimetableAssignment;
// Scheduler engine using constraint satisfaction
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
    // Random number generator with seed for reproducible results
    random() {
        this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
        return this.randomSeed / 233280;
    }
    // Fisher-Yates shuffle with our seeded random
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    // Evaluates how well a constraint is satisfied (0-100%)
    evaluateConstraint(constraint, assignment) {
        if (!constraint.active)
            return 100;
        return constraint.isSatisfied(assignment) ? 100 : 0;
    }
    // Total weighted score of all constraints (0-100%)
    evaluateSchedule(assignment) {
        let totalWeight = 0;
        let weightedScore = 0;
        // Evaluate time constraints
        for (const constraint of this.timeConstraints) {
            const weight = constraint.weight;
            totalWeight += weight;
            const score = this.evaluateConstraint(constraint, assignment);
            weightedScore += score * weight;
        }
        // Evaluate space constraints
        for (const constraint of this.spaceConstraints) {
            const weight = constraint.weight;
            totalWeight += weight;
            const score = this.evaluateConstraint(constraint, assignment);
            weightedScore += score * weight;
        }
        return totalWeight > 0 ? weightedScore / totalWeight : 0;
    }
    // Generate an initial schedule using a greedy algorithm
    generateInitialSchedule() {
        const assignment = new TimetableAssignment(this.daysCount, this.periodsPerDay);
        const sortedActivities = [...this.activities].sort((a, b) => {
            // Sort by most constrained first:
            // 1. Number of teachers and students involved
            // 2. Duration
            // 3. Preferred time slots
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
        // Try to place each activity
        for (const activity of sortedActivities) {
            let placed = false;
            // First try preferred times if they exist
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
            // If still not placed, try all possible times
            if (!placed) {
                const possibleTimes = [];
                for (let day = 0; day < this.daysCount; day++) {
                    for (let hour = 0; hour <= this.periodsPerDay - activity.totalDuration; hour++) {
                        possibleTimes.push({ day, hour });
                    }
                }
                // Shuffle to avoid bias
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
            // If we still couldn't place it, we might need to relax constraints later
            if (!placed) {
                console.warn(`Could not place activity ${activity.id}: ${activity.name}`);
            }
        }
        return assignment;
    }
    findSuitableRoom(activity) {
        let candidates = [];
        // First check specifically preferred rooms
        if (activity.preferredRooms.length > 0) {
            candidates = this.rooms.filter(r => activity.preferredRooms.includes(r.id));
        }
        // Then check subject preferred rooms
        if (candidates.length === 0 && activity.subject.preferredRooms.length > 0) {
            candidates = this.rooms.filter(r => activity.subject.preferredRooms.includes(r.id));
        }
        // Finally just get any room
        if (candidates.length === 0) {
            candidates = [...this.rooms];
        }
        // Shuffle to avoid bias
        return this.shuffle(candidates)[0];
    }
    canPlaceActivity(activity, period, roomId, assignment) {
        // Check if time slot is available
        for (let i = 0; i < activity.totalDuration; i++) {
            const hourToCheck = period.hour + i;
            if (hourToCheck >= this.periodsPerDay) {
                return false; // Would go beyond the day
            }
            const existingActivity = assignment.getActivityAtSlot(period.day, hourToCheck);
            if (existingActivity) {
                return false; // Time slot already occupied
            }
            const existingActivityInRoom = assignment.getActivityInRoomAtSlot(roomId, period.day, hourToCheck);
            if (existingActivityInRoom) {
                return false; // Room already occupied at this time
            }
        }
        // Temporarily assign to check constraints
        const tempResult = assignment.assignActivity(activity, period, roomId);
        if (!tempResult) {
            return false;
        }
        // Check all hard constraints (weight = 100)
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
        // Remove the temporary assignment
        assignment.removeActivity(activity);
        return satisfiesHardConstraints;
    }
    // Main algorithm: simulated annealing
    generateSchedule(maxIterations = 10000, initialTemperature = 100, coolingRate = 0.99) {
        let currentSolution = this.generateInitialSchedule();
        let currentScore = this.evaluateSchedule(currentSolution);
        let bestSolution = currentSolution; // Deep copy would be needed in real implementation
        let bestScore = currentScore;
        console.log(`Initial schedule score: ${currentScore}`);
        let temperature = initialTemperature;
        let iteration = 0;
        while (iteration < maxIterations && temperature > 0.1) {
            // Create a neighbor solution by making a random change
            const neighborSolution = this.generateNeighbor(currentSolution);
            const neighborScore = this.evaluateSchedule(neighborSolution);
            // Decide whether to accept the new solution
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
            // Cool down the temperature
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
        // Clone current solution
        // In a real implementation, this would create a deep copy
        const neighbor = currentSolution; // Placeholder, should be a deep copy
        // Choose a random modification:
        // 1. Move an activity to a different time
        // 2. Swap two activities
        // 3. Change the room of an activity
        const modification = Math.floor(this.random() * 3);
        switch (modification) {
            case 0: // Move an activity
                this.moveRandomActivity(neighbor);
                break;
            case 1: // Swap two activities
                this.swapRandomActivities(neighbor);
                break;
            case 2: // Change room
                this.changeRandomRoom(neighbor);
                break;
        }
        return neighbor;
    }
    moveRandomActivity(solution) {
        // Implement moving a random activity to a new time slot
        // For brevity, not implemented in this example
    }
    swapRandomActivities(solution) {
        // Implement swapping two random activities
        // For brevity, not implemented in this example
    }
    changeRandomRoom(solution) {
        // Implement changing the room of a random activity
        // For brevity, not implemented in this example
    }
    calculateAcceptanceProbability(currentScore, newScore, temperature) {
        // Always accept better solutions
        if (newScore > currentScore) {
            return 1.0;
        }
        // Calculate probability of accepting worse solution based on temperature
        // As temperature cools, we're less likely to accept worse solutions
        const delta = currentScore - newScore;
        return Math.exp(-delta / temperature);
    }
    // Debugging/analyzing methods
    analyzeConstraintViolations(assignment) {
        const violations = {};
        // Analyze time constraint violations
        for (const constraint of this.timeConstraints) {
            if (!constraint.isSatisfied(assignment)) {
                violations[constraint.type] = (violations[constraint.type] || 0) + 1;
            }
        }
        // Analyze space constraint violations
        for (const constraint of this.spaceConstraints) {
            if (!constraint.isSatisfied(assignment)) {
                violations[constraint.type] = (violations[constraint.type] || 0) + 1;
            }
        }
        return violations;
    }
    // Export schedule to a readable format
    exportSchedule(assignment) {
        return {
            teacherSchedules: this.exportTeacherSchedules(assignment),
            studentSetSchedules: this.exportStudentSetSchedules(assignment),
            roomSchedules: this.exportRoomSchedules(assignment),
        };
    }
    exportTeacherSchedules(assignment) {
        const result = {};
        // Collect all teachers from activities
        const teachers = new Map();
        for (const activity of this.activities) {
            for (const teacher of activity.teachers) {
                teachers.set(teacher.id, teacher);
            }
        }
        // For each teacher, build their schedule
        for (const [teacherId, teacher] of teachers) {
            const schedule = {};
            // Initialize days
            for (let day = 0; day < this.daysCount; day++) {
                schedule[day] = [];
            }
            // Add activities to schedule
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
            // Sort activities by start hour
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
        // Collect all student sets from activities
        const studentSets = new Map();
        for (const activity of this.activities) {
            for (const studentSet of activity.studentSets) {
                studentSets.set(studentSet.id, studentSet);
            }
        }
        // For each student set, build their schedule
        for (const [studentSetId, studentSet] of studentSets) {
            const schedule = {};
            // Initialize days
            for (let day = 0; day < this.daysCount; day++) {
                schedule[day] = [];
            }
            // Add activities to schedule
            const activities = assignment.getActivitiesForStudentSet(studentSetId);
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
                        teachers: activity.teachers.map(t => t.name),
                    });
                }
            }
            // Sort activities by start hour
            for (let day = 0; day < this.daysCount; day++) {
                schedule[day].sort((a, b) => a.startHour - b.startHour);
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
        // For each room, build the schedule
        for (const room of this.rooms) {
            const schedule = {};
            // Initialize days
            for (let day = 0; day < this.daysCount; day++) {
                schedule[day] = [];
            }
            // Get activities in this room
            const activities = assignment.getActivitiesInRoom(room.id);
            for (const activity of activities) {
                const slot = assignment.getSlotForActivity(activity.id);
                if (slot) {
                    schedule[slot.day].push({
                        activityId: activity.id,
                        activityName: activity.name,
                        subjectName: activity.subject.name,
                        startHour: slot.hour,
                        endHour: slot.hour + activity.totalDuration - 1,
                        teachers: activity.teachers.map(t => t.name),
                        studentSets: activity.studentSets.map(s => s.name),
                    });
                }
            }
            // Sort activities by start hour
            for (let day = 0; day < this.daysCount; day++) {
                schedule[day].sort((a, b) => a.startHour - b.startHour);
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
// Additional time constraints
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
            // Check if any period of this activity conflicts with not available periods
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
        // For each day, check max consecutive hours
        for (let day = 0; day < 7; day++) {
            // Assuming a week has 7 days max
            const hours = [];
            // Collect all hours the teacher is working on this day
            for (const activity of teacherActivities) {
                const slot = assignment.getSlotForActivity(activity.id);
                if (slot && slot.day === day) {
                    for (let i = 0; i < activity.totalDuration; i++) {
                        hours.push(slot.hour + i);
                    }
                }
            }
            if (hours.length === 0)
                continue;
            // Sort hours
            hours.sort((a, b) => a - b);
            // Check for consecutive sequence lengths
            let currentSequence = 1;
            let maxSequence = 1;
            for (let i = 1; i < hours.length; i++) {
                if (hours[i] === hours[i - 1] + 1) {
                    currentSequence++;
                    maxSequence = Math.max(maxSequence, currentSequence);
                }
                else {
                    currentSequence = 1;
                }
            }
            if (maxSequence > this.maxHours) {
                return false;
            }
        }
        return true;
    }
}
exports.MaxConsecutiveHoursForTeacher = MaxConsecutiveHoursForTeacher;
class PreferredStartingTimesForActivity {
    constructor(activity, preferredTimes, weight = 50, active = true) {
        this.type = 'PreferredStartingTimesForActivity';
        this.activity = activity;
        this.preferredTimes = preferredTimes.length > 0 ? preferredTimes : activity.preferredStartingTimes;
        this.weight = weight;
        this.active = active;
    }
    isSatisfied(assignment) {
        if (!this.active || this.preferredTimes.length === 0)
            return true;
        const slot = assignment.getSlotForActivity(this.activity.id);
        if (!slot)
            return true; // Not yet assigned
        return this.preferredTimes.some(p => p.day === slot.day && p.hour === slot.hour);
    }
}
exports.PreferredStartingTimesForActivity = PreferredStartingTimesForActivity;
class ActivitiesNotOverlapping {
    constructor(activities, weight = 100, active = true) {
        this.type = 'ActivitiesNotOverlapping';
        this.activities = activities;
        this.weight = weight;
        this.active = active;
    }
    isSatisfied(assignment) {
        if (!this.active || this.activities.length <= 1)
            return true;
        // Check each pair of activities
        for (let i = 0; i < this.activities.length; i++) {
            const activityA = this.activities[i];
            const slotA = assignment.getSlotForActivity(activityA.id);
            if (!slotA)
                continue;
            for (let j = i + 1; j < this.activities.length; j++) {
                const activityB = this.activities[j];
                const slotB = assignment.getSlotForActivity(activityB.id);
                if (!slotB)
                    continue;
                // Check if they overlap
                if (slotA.day === slotB.day) {
                    const endA = slotA.hour + activityA.totalDuration - 1;
                    const endB = slotB.hour + activityB.totalDuration - 1;
                    if ((slotA.hour <= slotB.hour && endA >= slotB.hour) ||
                        (slotB.hour <= slotA.hour && endB >= slotA.hour)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}
exports.ActivitiesNotOverlapping = ActivitiesNotOverlapping;
class MinGapsBetweenActivities {
    constructor(activities, minGaps, weight = 100, active = true) {
        this.type = 'MinGapsBetweenActivities';
        this.activities = activities;
        this.minGaps = minGaps;
        this.weight = weight;
        this.active = active;
    }
    isSatisfied(assignment) {
        if (!this.active || this.activities.length <= 1)
            return true;
        // Check each pair of activities
        for (let i = 0; i < this.activities.length; i++) {
            const activityA = this.activities[i];
            const slotA = assignment.getSlotForActivity(activityA.id);
            if (!slotA)
                continue;
            for (let j = i + 1; j < this.activities.length; j++) {
                const activityB = this.activities[j];
                const slotB = assignment.getSlotForActivity(activityB.id);
                if (!slotB)
                    continue;
                // Only check if they're on the same day
                if (slotA.day === slotB.day) {
                    const endA = slotA.hour + activityA.totalDuration;
                    const endB = slotB.hour + activityB.totalDuration;
                    // Check gap between end of first activity and start of second
                    if (slotB.hour >= endA) {
                        const gap = slotB.hour - endA;
                        if (gap < this.minGaps)
                            return false;
                    }
                    else if (slotA.hour >= endB) {
                        const gap = slotA.hour - endB;
                        if (gap < this.minGaps)
                            return false;
                    }
                }
            }
        }
        return true;
    }
}
exports.MinGapsBetweenActivities = MinGapsBetweenActivities;
// Usage examples
function createSampleTimetable() {
    // Initialize the scheduler
    const scheduler = new TimetableScheduler(5, 8); // 5 days, 8 periods per day
    // Create sample subjects
    const math = new Subject('MATH', 'Mathematics');
    const physics = new Subject('PHYS', 'Physics');
    const literature = new Subject('LIT', 'Literature');
    // Create sample rooms
    const room101 = new Room('R101', 'Room 101', 30, 'Main Building');
    const room102 = new Room('R102', 'Room 102', 30, 'Main Building');
    const lab201 = new Room('L201', 'Lab 201', 25, 'Science Wing');
    scheduler.addRoom(room101);
    scheduler.addRoom(room102);
    scheduler.addRoom(lab201);
    // Associate labs with science subjects
    physics.preferredRooms.push(lab201.id);
    // Create activity tags
    const lectureTags = new ActivityTag('LECT', 'Lecture');
    const labTag = new ActivityTag('LAB', 'Laboratory');
    // Create teachers
    const teacher1 = new Teacher('T1', 'John Smith');
    const teacher2 = new Teacher('T2', 'Mary Johnson');
    // Set teacher constraints
    teacher1.notAvailablePeriods.push({ day: 4, hour: 0 }); // Friday morning
    teacher1.maxHoursDaily = 6;
    teacher1.maxHoursContinuously = 3;
    teacher1.maxDaysPerWeek = 4;
    teacher2.notAvailablePeriods.push({ day: 0, hour: 7 }); // Monday last period
    // Create student sets
    const class9A = new StudentSet('9A', 'Class 9A');
    const class9B = new StudentSet('9B', 'Class 9B');
    // Set student constraints
    class9A.maxHoursDaily = 7;
    class9A.maxHoursContinuously = 4;
    class9B.maxHoursDaily = 7;
    class9B.maxHoursContinuously = 4;
    // Create activities
    const mathLecture9A = new Activity('ML9A', 'Math Lecture 9A', math, 2);
    mathLecture9A.teachers.push(teacher1);
    mathLecture9A.studentSets.push(class9A);
    mathLecture9A.activityTags.push(lectureTags);
    mathLecture9A.preferredStartingTimes.push({ day: 0, hour: 0 }); // Monday first period
    const mathLecture9B = new Activity('ML9B', 'Math Lecture 9B', math, 2);
    mathLecture9B.teachers.push(teacher1);
    mathLecture9B.studentSets.push(class9B);
    mathLecture9B.activityTags.push(lectureTags);
    const physicsLecture9A = new Activity('PL9A', 'Physics Lecture 9A', physics, 2);
    physicsLecture9A.teachers.push(teacher2);
    physicsLecture9A.studentSets.push(class9A);
    physicsLecture9A.activityTags.push(lectureTags);
    const physicsLab9A = new Activity('PLAB9A', 'Physics Lab 9A', physics, 2);
    physicsLab9A.teachers.push(teacher2);
    physicsLab9A.studentSets.push(class9A);
    physicsLab9A.activityTags.push(labTag);
    physicsLab9A.preferredRooms.push(lab201.id);
    const litLecture9A = new Activity('LL9A', 'Literature Lecture 9A', literature, 2);
    litLecture9A.teachers.push(teacher2);
    litLecture9A.studentSets.push(class9A);
    litLecture9A.activityTags.push(lectureTags);
    // Add activities to scheduler
    scheduler.addActivity(mathLecture9A);
    scheduler.addActivity(mathLecture9B);
    scheduler.addActivity(physicsLecture9A);
    scheduler.addActivity(physicsLab9A);
    scheduler.addActivity(litLecture9A);
    // Add constraints
    scheduler.addTimeConstraint(new TeacherNotAvailablePeriods(teacher1));
    scheduler.addTimeConstraint(new TeacherMaxDaysPerWeek(teacher1, teacher1.maxDaysPerWeek));
    scheduler.addTimeConstraint(new MaxConsecutiveHoursForTeacher(teacher1, teacher1.maxHoursContinuously));
    scheduler.addTimeConstraint(new TeacherNotAvailablePeriods(teacher2));
    scheduler.addTimeConstraint(new StudentSetNotAvailablePeriods(class9A));
    // Physics lab should follow physics lecture, with at least 1 gap
    scheduler.addTimeConstraint(new MinGapsBetweenActivities([physicsLecture9A, physicsLab9A], 1));
    // Physics lab should be in a lab
    scheduler.addSpaceConstraint(new PreferredRoomsForActivity(physicsLab9A, [lab201.id]));
    // Make sure activities don't overlap
    scheduler.addTimeConstraint(new ActivitiesNotOverlapping([mathLecture9A, mathLecture9B, physicsLecture9A, physicsLab9A, litLecture9A]));
    // Preferred starting times for math lecture
    scheduler.addTimeConstraint(new PreferredStartingTimesForActivity(mathLecture9A, mathLecture9A.preferredStartingTimes));
    // Add room constraints
    scheduler.addSpaceConstraint(new RoomNotAvailable(lab201));
    return scheduler;
}
// Application entry point
function main() {
    console.log('Creating timetable scheduler...');
    const scheduler = createSampleTimetable();
    console.log('Generating timetable...');
    const timetable = scheduler.generateSchedule(10000, 100, 0.995);
    console.log('Analyzing constraint violations...');
    const violations = scheduler.analyzeConstraintViolations(timetable);
    console.log('Constraint violations:', violations);
    console.log('Exporting schedule...');
    const scheduleExport = scheduler.exportSchedule(timetable);
    console.log('Schedule exported successfully.');
    // In a real application, you might export to JSON or render a UI
    console.log(JSON.stringify(scheduleExport, null, 2));
}
// Debugging and utility functions
/**
 * Renders a simple text-based timetable for console viewing
 */
function renderConsoleTimetable(scheduleExport, daysCount, periodsPerDay) {
    var _a, _b;
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    console.log('\n=== TEACHER SCHEDULES ===');
    for (const teacherId in scheduleExport.teacherSchedules) {
        const teacherSchedule = scheduleExport.teacherSchedules[teacherId];
        console.log(`\n${teacherSchedule.teacherName}'s Schedule:`);
        for (let day = 0; day < daysCount; day++) {
            if (teacherSchedule.schedule[day].length > 0) {
                console.log(`  ${dayNames[day]}:`);
                for (const item of teacherSchedule.schedule[day]) {
                    console.log(`    ${item.startHour + 1}-${item.endHour + 1}: ${item.subjectName} (${item.activityName}) in ${item.roomName}`);
                }
            }
        }
    }
    console.log('\n=== STUDENT SET SCHEDULES ===');
    for (const studentSetId in scheduleExport.studentSetSchedules) {
        const studentSetSchedule = scheduleExport.studentSetSchedules[studentSetId];
        console.log(`\n${studentSetSchedule.studentSetName}'s Schedule:`);
        for (let day = 0; day < daysCount; day++) {
            if (studentSetSchedule.schedule[day].length > 0) {
                console.log(`  ${dayNames[day]}:`);
                for (const item of studentSetSchedule.schedule[day]) {
                    console.log(`    ${item.startHour + 1}-${item.endHour + 1}: ${item.subjectName} (${item.activityName}) with ${(_a = item.teachers) === null || _a === void 0 ? void 0 : _a.join(', ')} in ${item.roomName}`);
                }
            }
        }
    }
    console.log('\n=== ROOM SCHEDULES ===');
    for (const roomId in scheduleExport.roomSchedules) {
        const roomSchedule = scheduleExport.roomSchedules[roomId];
        console.log(`\n${roomSchedule.roomName} (${roomSchedule.building || 'No Building'}):`);
        for (let day = 0; day < daysCount; day++) {
            if (roomSchedule.schedule[day].length > 0) {
                console.log(`  ${dayNames[day]}:`);
                for (const item of roomSchedule.schedule[day]) {
                    console.log(`    ${item.startHour + 1}-${item.endHour + 1}: ${item.subjectName} (${item.activityName}) with ${(_b = item.teachers) === null || _b === void 0 ? void 0 : _b.join(', ')}`);
                }
            }
        }
    }
}
//# sourceMappingURL=index.js.map