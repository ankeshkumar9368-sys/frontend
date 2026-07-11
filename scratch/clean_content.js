const fs = require('fs');
const path = 'c:/Users/Admin/S2Dent/ExamHero-Next/lib/content.ts';
let content = fs.readFileSync(path, 'utf8');

// Find the first "use client" occurrence
const firstUseClientIndex = content.indexOf('"use client";');
if (firstUseClientIndex === -1) {
  console.log('Error: "use client" not found');
  process.exit(1);
}

// Find the second "use client" occurrence (the duplicate header start)
const secondUseClientIndex = content.indexOf('"use client";', firstUseClientIndex + 12);
if (secondUseClientIndex === -1) {
  console.log('Error: second "use client" not found');
  process.exit(1);
}

// Find where the duplicate fetchChapterNotes body ends
// It ends with:
//   // Enforcement of Regeneration limits: 7 days for Premium, 30 days for Free users
//   if (forceRefresh) {
//     try {
//       ...
//     } catch (dbErr: any) {
//       if (dbErr.message?.startsWith("REGENERATE_LOCK:")) {
//         throw dbErr;
//       }
//       console.warn("Failed to read global_notes for regeneration limit check:", dbErr);
//     }
//   }
// (empty line)
// followed by "try {" (which is the beginning of the non-duplicate try-catch notes body)
const searchStr = 'console.warn("Failed to read global_notes for regeneration limit check:", dbErr);\r\n    }\r\n  }';
const searchStrUnix = 'console.warn("Failed to read global_notes for regeneration limit check:", dbErr);\n    }\n  }';

let matchIndex = content.indexOf(searchStr, secondUseClientIndex);
let matchLength = searchStr.length;
if (matchIndex === -1) {
  matchIndex = content.indexOf(searchStrUnix, secondUseClientIndex);
  matchLength = searchStrUnix.length;
}

if (matchIndex === -1) {
  console.log('Error: search string not found');
  process.exit(1);
}

const duplicateEndIndex = matchIndex + matchLength;

// We want to replace from the second "use client" up to the end of the duplicate section with the correct closing braces:
//           if (ageInDays < requiredDays) {
//             const remainingDays = Math.ceil(requiredDays - ageInDays);
//             throw new Error(`REGENERATE_LOCK:${remainingDays}`);
//           }
//         }
//       }
//     } catch (dbErr: any) {
//       if (dbErr.message?.startsWith("REGENERATE_LOCK:")) {
//         throw dbErr;
//       }
//       console.warn("Failed to read global_notes for regeneration limit check:", dbErr);
//     }
//   }
const replacementText = `          if (ageInDays < requiredDays) {
            const remainingDays = Math.ceil(requiredDays - ageInDays);
            throw new Error(\`REGENERATE_LOCK:\${remainingDays}\`);
          }
        }
      }
    } catch (dbErr: any) {
      if (dbErr.message?.startsWith("REGENERATE_LOCK:")) {
        throw dbErr;
      }
      console.warn("Failed to read global_notes for regeneration limit check:", dbErr);
    }
  }`;

const newContent = content.substring(0, content.lastIndexOf('if (ageInDays < requiredDays) {', secondUseClientIndex)) +
                   'if (ageInDays < requiredDays) {\n' +
                   replacementText +
                   content.substring(duplicateEndIndex);

fs.writeFileSync(path, newContent, 'utf8');
console.log('Successfully cleaned content.ts');
