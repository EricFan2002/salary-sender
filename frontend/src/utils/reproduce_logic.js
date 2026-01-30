
// Mocking the structure and functions from salaryMappings.js and salaryDataNormalizer.js

const EXPATRIATE_LABELS = {
    item: { en: 'Item', zh: '项目' }
};

function formatBilingualLabel(labelDef) {
    return `${labelDef.zh} / ${labelDef.en}`;
}

function safeParseNumber(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '' || value === '-') {
        return defaultValue;
    }
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
}

function formatCurrency(value, currency = 'SGD') {
    const num = safeParseNumber(value);
    return num.toFixed(2);
}

function shouldDisplayValue(value) {
    return true; // Simplify
}

function normalizeSalaryData(employee, month, options = {}) {
    const {
        payPeriod = '',
        paymentDate = '',
        companyName = '',
        companyNameEn = ''
    } = options;

    const employeeType = employee.type || 'local';

    const meta = {
        name: employee.name,
        currency: employee.metadata?.currency || (employeeType === 'expatriate' ? 'SGD' : 'RMB'),
        isExpatriate: employeeType === 'expatriate'
    };

    let groups = [];

    if (employeeType === 'expatriate') {
        groups = normalizeExpatriateData(employee, meta.currency);
    } else {
        // groups = normalizeLocalData(employee, meta.currency);
    }

    return { meta, groups };
}

function normalizeExpatriateData(employee, currency) {
    const breakdown = employee.breakdown || {};
    const groups = {};

    const detectCurrency = (label) => {
        if (label.includes('(RMB)')) return 'RMB';
        if (label.includes('(SGD)')) return 'SGD';
        return currency;
    };

    const sanitizeLabel = (label) => label.replace(/\s*\((RMB|SGD)\)\s*/g, '').trim();

    Object.entries(breakdown).forEach(([key, value]) => {
        const parts = key.split(' - ');
        const groupName = parts.length > 1 ? parts[0] : '项目';
        const itemName = parts.length > 1 ? parts[1] : key;

        if (!groups[groupName]) {
            groups[groupName] = {
                title: groupName === '项目' ? formatBilingualLabel(EXPATRIATE_LABELS.item) : groupName,
                items: []
            };
        }

        const unit = detectCurrency(itemName);

        // HERE is where the logic from original file is
        // We want to see if this throws ReferenceError: currency is not defined

        groups[groupName].items.push({
            label: sanitizeLabel(itemName),
            originalLabel: itemName,
            value: value,
            formattedValue: formatCurrency(value, unit),
            unit: unit,
            isBold: false
        });
    });

    return Object.values(groups);
}

// TEST EXECUTION
const mockEmployee = {
    name: "Test Employee",
    type: "expatriate",
    metadata: {
        currency: "SGD"
    },
    breakdown: {
        "固定工资 - A": "100"
    }
};

try {
    console.log("Running normalize...");
    normalizeSalaryData(mockEmployee, "2023-10");
    console.log("Done without error.");
} catch (e) {
    console.log("Caught error:", e);
}
