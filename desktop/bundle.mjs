import { mkdir } from "node:fs/promises";
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { join } from 'node:path';
import yazl from 'yazl';

const dir = 'windows-build';
const zip = new yazl.ZipFile();
for (const name of ['Starlight-Hollow-Portable.exe', 'Starlight-Hollow-Setup.exe']) {
  zip.addFile(join(dir, name), name, { compress: false });
}
zip.addFile('desktop/START-HERE.txt', 'START-HERE.txt');
zip.end();
await mkdir("artifacts", { recursive: true });
await pipeline(zip.outputStream, createWriteStream('artifacts/Starlight-Hollow-Windows-x64.zip'));
