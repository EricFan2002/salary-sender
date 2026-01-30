
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
    console.log(JSON.stringify(result, null, 2));
} catch (e) {
    console.error("Caught error:");
    console.error(e);
}
