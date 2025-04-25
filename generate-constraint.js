#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Base paths
const BASE_DIR = path.join(__dirname, 'src', 'v1', 'constraints');
const ENUM_FILE = path.join(BASE_DIR, 'constraintType.enum.ts');

// Parse command line arguments
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Main function to generate constraint
async function generateConstraint() {
  const constraintName = await promptUser('Enter constraint name (e.g. PreferredRoomsForActivity): ');

  const typeOptions = ['time', 'space'];
  const constraintType = await promptChoices('Select constraint type:', typeOptions);

  const entityOptions = ['activity', 'room', 'studentSet', 'teacher'];
  const entityType = await promptChoices('Select entity this constraint applies to:', entityOptions);

  // Create directory path
  const constraintDir = path.join(BASE_DIR, constraintType, entityType, constraintName);

  console.log(`Generating constraint in: ${constraintDir}`);

  // Create directory structure
  if (!fs.existsSync(constraintDir)) {
    fs.mkdirSync(constraintDir, { recursive: true });
  }

  // Create constraint class file
  createConstraintFile(constraintDir, constraintName, constraintType, entityType);

  // Create test file
  createTestFile(constraintDir, constraintName, constraintType, entityType);

  // Update the enum file
  updateEnumFile(constraintName, constraintType, entityType);

  console.log('Constraint successfully generated!');
  console.log(`Don't forget to export your constraint in src/v1/constraints/index.ts`);

  readline.close();
}

function promptUser(question) {
  return new Promise(resolve => {
    readline.question(question, answer => resolve(answer));
  });
}

function promptChoices(question, choices) {
  return new Promise(resolve => {
    console.log(question);
    choices.forEach((choice, index) => {
      console.log(`${index + 1}. ${choice}`);
    });

    readline.question('Enter your choice (number): ', answer => {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < choices.length) {
        resolve(choices[index]);
      } else {
        console.log('Invalid choice, please try again.');
        resolve(promptChoices(question, choices));
      }
    });
  });
}

function createConstraintFile(dirPath, constraintName, constraintType, entityType) {
  const filePath = path.join(dirPath, `${constraintName}.ts`);

  const imports = [
    `import { Activity } from '../../../../models/Activity';`,
    `import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';`,
    `import { Constraint } from '../../../../types/constraints';`,
    `import { DEFAULT_WEIGHT } from '../../../../utils/defaultWeight';`,
    `import { ConstraintType } from '../../../constraintType.enum';`,
  ];

  if (entityType === 'teacher') {
    imports.push(`import { Teacher } from '../../../../models/Teacher';`);
  }

  if (entityType === 'studentSet') {
    imports.push(`import { StudentSet } from '../../../../models/StudentSet';`);
  }

  if (entityType === 'room') {
    imports.push(`import { Room } from '../../../../models/Room';`);
  }

  if (['time', 'space'].includes(constraintType)) {
    imports.push(`import { Period } from '../../../../types/core';`);
    imports.push(`import { ActivityHelper } from '../../../../../helpers/activity.helper';`);
  }

  const entityParam =
    entityType === 'activity'
      ? 'activity: Activity'
      : entityType === 'teacher'
      ? 'teacher: Teacher'
      : entityType === 'room'
      ? 'room: Room'
      : 'studentSet: StudentSet';

  const entityProp = entityType === 'activity' ? 'activity' : entityType;

  const content = `${imports.join('\n')}

export class ${constraintName} implements Constraint {
  type = ConstraintType.${constraintType}.${entityType}.${constraintName};
  weight: number;
  active: boolean;
  ${entityType}: ${
    entityType === 'activity'
      ? 'Activity'
      : entityType === 'teacher'
      ? 'Teacher'
      : entityType === 'room'
      ? 'Room'
      : 'StudentSet'
  };
  activities: Activity[] = [];

  constructor(${entityParam}, weight = DEFAULT_WEIGHT, active = true) {
    this.${entityProp} = ${entityProp};
    this.weight = weight;
    this.active = active;
    ${entityType === 'activity' ? 'this.addActivity(activity);' : ''}
  }

  addActivity(activity: Activity): void {
    if (this.activities.includes(activity)) return;
    this.activities.push(activity);
  }

  isSatisfied(assignment: TimetableAssignment): boolean {
    if (!this.active) return true;

    ${
      entityType === 'teacher'
        ? `const ${entityType}Activities = assignment.getActivitiesFor${
            entityType.charAt(0).toUpperCase() + entityType.slice(1)
          }(this.${entityType}.id);
    
    for (const activity of ${entityType}Activities) {
      this.addActivity(activity);
      // Add your constraint logic here
    }`
        : entityType === 'studentSet'
        ? `const ${entityType}Activities = assignment.getActivitiesFor${
            entityType.charAt(0).toUpperCase() + entityType.slice(1)
          }(this.${entityType}.id);
    
    for (const activity of ${entityType}Activities) {
      this.addActivity(activity);
      // Add your constraint logic here
    }`
        : entityType === 'room'
        ? `const roomActivities = assignment.getAllActivitiesInRoom(this.room.id);

    for (const activity of roomActivities) {
      this.addActivity(activity);
      // Add your constraint logic here
    }`
        : `// For activity-based constraints
    const slot = assignment.getSlotForActivity(this.activity.id);
    if (!slot) return true; // Not yet assigned
    
    // Add your constraint logic here`
    }

    return true; // Return true if constraint is satisfied
  }
}
`;

  fs.writeFileSync(filePath, content);
  console.log(`Created constraint file: ${filePath}`);
}

function createTestFile(dirPath, constraintName, constraintType, entityType) {
  const filePath = path.join(dirPath, `${constraintName}.test.ts`);

  const imports = [
    `import { Activity } from '../../../../models/Activity';`,
    `import { TimetableAssignment } from '../../../../scheduler/TimetableAssignment';`,
    `import { Period } from '../../../../types/core';`,
    `import Subject from '../../../../models/Subject';`,
    `import { ${constraintName} } from './${constraintName}';`,
    `import { Room } from '../../../../models/Room';`,
  ];

  if (entityType === 'teacher') {
    imports.push(`import { Teacher } from '../../../../models/Teacher';`);
  }

  if (entityType === 'studentSet') {
    imports.push(`import { StudentSet } from '../../../../models/StudentSet';`);
  }

  const setupVars = ['assignment', 'activity', 'subject', 'constraint', 'room'];

  if (entityType === 'teacher') {
    setupVars.push('teacher');
  }

  if (entityType === 'studentSet') {
    setupVars.push('studentSet');
  }

  if (constraintType === 'time') {
    setupVars.push('slot');
  }

  const slotCreation =
    constraintType === 'time'
      ? `    // Create a time slot
    slot = { day: 0, hour: 9, minute: 0 };`
      : '';

  const entitySetup =
    entityType === 'teacher'
      ? `    // Create a teacher
    teacher = new Teacher('t1', 'John Doe');
    
    // Add teacher to activity
    activity.teachers.push(teacher);`
      : entityType === 'studentSet'
      ? `    // Create a student set
    studentSet = new StudentSet('s1', 'Class 1A');
    
    // Add student set to activity
    activity.studentSets.push(studentSet);`
      : '';

  const entityParam =
    entityType === 'activity'
      ? 'activity'
      : entityType === 'teacher'
      ? 'teacher'
      : entityType === 'room'
      ? 'room'
      : 'studentSet';

  const content = `${imports.join('\n')}

describe('${entityType} ${constraintName}', () => {
  const DAYS_COUNT = 5;
  const PERIODS_PER_DAY = 8;
  
  let ${setupVars.join(': any;\n  let ')}: any;

  beforeEach(() => {
    assignment = new TimetableAssignment(DAYS_COUNT, PERIODS_PER_DAY);
    subject = new Subject('sub1', 'Mathematics');
    
    // Create an activity
    activity = new Activity('a1', 'Math Lecture', subject, 60);
    
    // Create a room
    room = new Room('r1', 'Classroom 101', 30);
${entitySetup}
${slotCreation}

    // Create the constraint
    constraint = new ${constraintName}(${entityParam});
  });

  it('should be satisfied when no activities are assigned', () => {
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should be satisfied when conditions are met', () => {
    // Set up a scenario where the constraint should be satisfied
    assignment.assignActivity(activity, ${
      constraintType === 'time' ? 'slot' : '{ day: 0, hour: 9, minute: 0 }'
    }, room.id);
    
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should not be satisfied when conditions are not met', () => {
    // Set up a scenario where the constraint should not be satisfied
    // assignment.assignActivity(activity, { day: 0, hour: 9, minute: 0 }, room.id);
    
    // TODO: Implement this test after completing the constraint logic
    // expect(constraint.isSatisfied(assignment)).toBe(false);
    expect(true).toBe(true); // Placeholder
  });

  it('should always be satisfied when constraint is inactive', () => {
    constraint.active = false;
    
    // Set up a scenario that would normally violate the constraint
    // assignment.assignActivity(activity, { day: 0, hour: 9, minute: 0 }, room.id);
    
    expect(constraint.isSatisfied(assignment)).toBe(true);
  });

  it('should maintain a list of activities that the constraint applies to', () => {
    assignment.assignActivity(activity, ${
      constraintType === 'time' ? 'slot' : '{ day: 0, hour: 9, minute: 0 }'
    }, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity);
    expect(constraint.activities.length).toBe(1);

    const activity2 = new Activity('a2', 'Another Math Lecture', subject, 60);
    ${entityType === 'teacher' ? 'activity2.teachers.push(teacher);' : ''}
    ${entityType === 'studentSet' ? 'activity2.studentSets.push(studentSet);' : ''}
    assignment.assignActivity(activity2, ${
      constraintType === 'time' ? 'slot' : '{ day: 0, hour: 10, minute: 0 }'
    }, room.id);
    constraint.isSatisfied(assignment);

    expect(constraint.activities).toContain(activity);
    expect(constraint.activities).toContain(activity2);
    expect(constraint.activities.length).toBe(2);
  });

  it('should not add duplicate activities', () => {
    constraint.addActivity(activity);
    constraint.addActivity(activity);

    expect(constraint.activities.length).toBe(1);
  });
});
`;

  fs.writeFileSync(filePath, content);
  console.log(`Created test file: ${filePath}`);
}

function updateEnumFile(constraintName, constraintType, entityType) {
  let enumContent = fs.readFileSync(ENUM_FILE, 'utf-8');

  // Find the location to add the new constraint
  const regexPattern = new RegExp(`(${constraintType}: \\{[\\s\\S]*?${entityType}: \\{[\\s\\S]*?)\\}`, 'g');

  const replacement = (match, p1) => {
    // Check if the constraint already exists
    if (match.includes(`${constraintName}: '${constraintName}'`)) {
      console.log(`Constraint ${constraintName} already exists in enum.`);
      return match;
    }

    // Add new constraint to the entity section
    return `${p1}  ${constraintName}: '${constraintName}',\n}`;
  };

  const updatedContent = enumContent.replace(regexPattern, replacement);

  fs.writeFileSync(ENUM_FILE, updatedContent);
  console.log(`Updated enum file with new constraint: ${constraintName}`);
}

// Run the function
generateConstraint();
