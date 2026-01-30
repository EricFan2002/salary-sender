
import { normalizeSalaryData } from './salaryDataNormalizer.js';

const mockEmployee = {
    name: "Test Employee",
    email: "test@example.com",
    type: "expatriate",
    rowNumber: 1,
    metadata: {
        currency: "SGD"
    },
    breakdown: {
        "固定工资 - 档案工资-岗级": "1.00",
        "固定工资 - 档案工资-薪级": "3.00",
        "固定工资 - 地区系数": "2.00",
        "固定工资 - 驻外岗级": "1.00",
        "补贴": "100"
    }
};

try {
    console.log("Normalizing data...");
    const result = normalizeSalaryData(mockEmployee, "2023-10");
    console.log("Success!");

    // Check for unitless fields
    const fixedSalaryGroup = result.groups.find(g => g.title.includes('固定工资'));
    if (!fixedSalaryGroup) {
        throw new Error("Fixed salary group not found");
    }

    const unitlessFields = [
        '档案工资-岗级',
        '档案工资-薪级',
        '地区系数',
        '驻外岗级'
    ];

    let allCorrect = true;
    unitlessFields.forEach(field => {
        const item = fixedSalaryGroup.items.find(i => i.originalLabel === field);
        if (!item) {
            console.error(`Field ${field} not found in output`);
            allCorrect = false;
            return;
        }
        if (item.unit !== '') {
            console.error(`Field ${field} has unit '${item.unit}', expected empty string`);
            allCorrect = false;
        } else {
            console.log(`Field ${field} correctly has no unit.`);
        }
    });

    if (allCorrect) {
        console.log("VERIFICATION PASSED");
    } else {
        console.log("VERIFICATION FAILED");
    }

} catch (e) {
    console.error("Caught error:");
    console.error(e);
}
