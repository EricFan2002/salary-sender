
// Creating a copy of the logic to verify without needing full XLSX environment
function detectCompanyNameFromSheet(sheetName = '') {
    // Check for International Company (Proxy/Pay on behalf) FIRST
    if (sheetName.includes('国际公司') && (sheetName.includes('代发') || sheetName.includes('分社代发'))) {
        return {
            zh: '中国船级社国际有限公司（暂由新加坡分社代发）',
            en: 'China Classification Society International Pte Ltd (on behalf of China Classification Society, Singapore Branch)'
        };
    }

    // Then check for International Company
    if (sheetName.includes('国际公司')) {
        return {
            zh: '中国船级社国际有限公司',
            en: 'China Classification Society International Pte Ltd'
        };
    }

    // Lastly check for Branch
    if (sheetName.includes('分社')) {
        return {
            zh: '中国船级社新加坡分社',
            en: 'China Classification Society, Singapore Branch'
        };
    }

    // Default
    return {
        zh: '中国船级社国际有限公司',
        en: 'China Classification Society International Pte Ltd'
    };
}

// Test Cases
const testCases = [
    {
        name: "外派员工-国际公司（分社代发）",
        expectedZh: '中国船级社国际有限公司（暂由新加坡分社代发）',
        desc: "International Proxy (Dispatch)"
    },
    {
        name: "属地员工-国际公司（分社代发）",
        expectedZh: '中国船级社国际有限公司（暂由新加坡分社代发）',
        desc: "International Proxy (Local)"
    },
    {
        name: "属地员工-分社",
        expectedZh: '中国船级社新加坡分社',
        desc: "Branch"
    },
    {
        name: "外派员工-国际公司",
        expectedZh: '中国船级社国际有限公司',
        desc: "International Company"
    }
];

let allPassed = true;
testCases.forEach(test => {
    const result = detectCompanyNameFromSheet(test.name);
    if (result.zh !== test.expectedZh) {
        console.log(`FAIL: ${test.desc} (${test.name})`);
        console.log(`  Expected: ${test.expectedZh}`);
        console.log(`  Got:      ${result.zh}`);
        allPassed = false;
    } else {
        console.log(`PASS: ${test.desc}`);
    }
});

if (allPassed) {
    console.log("ALL TESTS PASSED");
} else {
    console.error("TEST FAILED");
    process.exit(1);
}
