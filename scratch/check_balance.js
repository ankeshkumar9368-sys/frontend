
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\Admin\\S2Dent\\ExamHero-Next\\app\\page.tsx', 'utf8');

function checkBalance(text) {
    let brackets = { '{': 0, '[': 0, '(': 0, '<': 0 };
    let antiBrackets = { '}': '{', ']': '[', ')': '(', '>': '<' };
    let stack = [];
    
    // Simple state machine to skip strings and comments
    let inString = false;
    let inComment = false;
    let inMultiComment = false;
    
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        let nextChar = text[i+1];
        
        if (inComment) {
            if (char === '\n') inComment = false;
            continue;
        }
        if (inMultiComment) {
            if (char === '*' && nextChar === '/') {
                inMultiComment = false;
                i++;
            }
            continue;
        }
        if (inString) {
            if (char === inString && text[i-1] !== '\\') inString = false;
            continue;
        }
        
        if (char === '/' && nextChar === '/') { inComment = true; i++; continue; }
        if (char === '/' && nextChar === '*') { inMultiComment = true; i++; continue; }
        if (char === "'" || char === '"' || char === '`') { inString = char; continue; }
        
        if (brackets[char] !== undefined) {
            stack.push({ char, line: text.substring(0, i).split('\n').length });
            brackets[char]++;
        } else if (antiBrackets[char] !== undefined) {
            let last = stack.pop();
            if (!last || last.char !== antiBrackets[char]) {
                console.log(`Mismatch: found ${char} on line ${text.substring(0, i).split('\n').length}, expected ${last ? antiBrackets[last.char] : 'nothing'}`);
            }
            brackets[antiBrackets[char]]--;
        }
    }
    
    console.log('Final counts:', brackets);
    if (stack.length > 0) {
        console.log('Unclosed brackets:', stack.slice(-5));
    }
}

checkBalance(content);
