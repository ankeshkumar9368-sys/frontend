const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Admin\\.gemini\\antigravity\\brain\\166c9201-d61f-4f97-920c-36b495150ab2\\.system_generated\\logs\\transcript.jsonl', 'utf8');
const regex = /"TargetContent":"(.*?)"/g;
let match;
let chunks = [];
while ((match = regex.exec(content)) !== null) {
  let str = match[1];
  str = str.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\t/g, '\t');
  if(str.includes('export const fetchQuestions') || str.includes('export const fetchContent') || str.includes('generateTest')) {
    chunks.push(str);
  }
}
fs.writeFileSync('found_chunks.txt', chunks.join('\n\n---CHUNK---\n\n'));
console.log('Found chunks:', chunks.length);
