import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
const currentTimestamp = Date.now();
export const logToFile = (fileSuffix = 'timetable', data: object) => {
  const examplesDir = path.resolve(__dirname, `../../../examples/${currentTimestamp}`);
  mkdirSync(examplesDir, { recursive: true }); 
  writeFileSync(path.join(examplesDir, `${fileSuffix}.json`), JSON.stringify(data, null, 2));
};
