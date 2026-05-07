
const fs = require('fs');
const content = fs.readFileSync('src/pages/PainSignalPage.tsx', 'utf8');

let balance = 0;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let char of line) {
        if (char === '{') balance++;
        if (char === '}') balance--;
    }
    if (balance < 0) {
        console.log(`Mismatch on line ${i + 1}: balance is ${balance}`);
        break;
    }
}
console.log(`Final balance: ${balance}`);
