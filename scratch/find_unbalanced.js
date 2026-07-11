const fs = require('fs');
const content = fs.readFileSync('c:/Users/Admin/S2Dent/ExamHero-Next/lib/content.ts', 'utf8');

const lines = content.split('\n');
let balance = 0;

for (let i = 107; i < 255; i++) {
  const line = lines[i];
  if (!line) continue;
  let lineOpen = 0;
  let lineClose = 0;
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') {
      balance++;
      lineOpen++;
    } else if (line[j] === '}') {
      balance--;
      lineClose++;
    }
  }
  console.log(`Line ${i + 1} (balance: ${balance}, +${lineOpen}, -${lineClose}): ${line.trim()}`);
}
