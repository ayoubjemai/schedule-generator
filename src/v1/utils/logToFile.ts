import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const currentTimestamp = Date.now();
export const logToFile = (
  fileSuffix = 'timetable',
  data: object,
  pathDir = `/examples/${currentTimestamp}`
) => {
  const examplesDir = path.resolve(__dirname, `../../../${pathDir}`);
  mkdirSync(examplesDir, { recursive: true }); // Create the directory if it doesn't exist
  writeFileSync(path.join(examplesDir, `${fileSuffix}.json`), JSON.stringify(data, null, 2));
};
