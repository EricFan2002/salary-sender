
import { normalizeSalaryData } from './salaryDataNormalizer.js';

const mockEmployee = {
    name: "Test Employee",
    type: "expatriate",
    breakdown: {
        "档案工资-岗级": "1.00",
        "档案工资-薪级": "3.00",
        "固定工资 (RMB)": "5000"
    }
};

console.log("Running verification...");
const result = normalizeSalaryData(mockEmployee, "2023-10");

// Find the group with Fixed Salary
const fixedGroup = result.groups.find(g => g.title.includes('Fixed Salary') || g.title.includes('固定工资'));

if (!fixedGroup) {
    console.error("Could not find Fixed Salary group in:", result.groups.map(g => g.title));
    process.exit(1);
}

// Check Post Level
const postItem = fixedGroup.items.find(i => i.originalLabel === 'postLevel');
if (!postItem) {
    console.error("Could not find item with originalLabel 'postLevel'");
} else {
    console.log(`[postLevel] Label: "${postItem.label}" (Expected: contains 'Post Level' and '岗级')`);
    console.log(`[postLevel] Unit: "${postItem.unit}" (Expected: "")`);
    
    if (postItem.unit === '') console.log("PASS: Unit is empty");
    else console.error("FAIL: Unit is NOT empty");
    
    if (postItem.label.includes('Post Level') && postItem.label.includes('岗级')) console.log("PASS: Label is correct");
    else console.error("FAIL: Label is incorrect");
}

// Check Salary Level
const salaryItem = fixedGroup.items.find(i => i.originalLabel === 'salaryLevel');
if (!salaryItem) {
    console.error("Could not find item with originalLabel 'salaryLevel'");
} else {
    console.log(`[salaryLevel] Label: "${salaryItem.label}" (Expected: contains 'Salary Level' and '薪级')`);
    console.log(`[salaryLevel] Unit: "${salaryItem.unit}" (Expected: "")`);
    
    if (salaryItem.unit === '') console.log("PASS: Unit is empty");
    else console.error("FAIL: Unit is NOT empty");

    if (salaryItem.label.includes('Salary Level') && salaryItem.label.includes('薪级')) console.log("PASS: Label is correct");
    else console.error("FAIL: Label is incorrect");
}
