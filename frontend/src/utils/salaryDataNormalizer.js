import {
    EXPATRIATE_LABELS,
    LOCAL_LABELS,
    formatBilingualLabel,
    formatCurrency,
    safeParseNumber,
    shouldDisplayValue,
    UNITLESS_FIELDS
} from './salaryMappings.js';

/**
 * Normalize employee data for unified rendering
 * Returns a structure:
 * {
 *   meta: { ... },
 *   groups: [
 *     {
 *       title: "Group Name",
 *       items: [
 *         { label: "Item Label", value: "100.00", unit: "SGD", isBold: false, isHighlight: false }
 *       ]
 *     }
 *   ],
 *   footer: { ... }
 * }
 */
export function normalizeSalaryData(employee, month, options = {}) {
    const {
        payPeriod = '',
        paymentDate = '',
        companyName = '',
        companyNameEn = ''
    } = options;

    const employeeType = employee.type || 'local';

    // Meta Information
    const meta = {
        name: employee.name,
        email: employee.email,
        employeeNo: employee.rowNumber,
        payPeriod: payPeriod || month || employee.metadata?.payPeriod || '',
        paymentDate: paymentDate || employee.metadata?.paymentDate || '',
        employer: {
            zh: employee.metadata?.companyName || companyName,
            en: employee.metadata?.companyNameEn || companyNameEn
        },
        currency: employee.metadata?.currency || (employeeType === 'expatriate' ? 'SGD' : 'RMB'),
        isExpatriate: employeeType === 'expatriate',
        remarks: employee.remarks
    };

    let groups = [];

    if (employeeType === 'expatriate') {
        groups = normalizeExpatriateData(employee, meta.currency);
    } else {
        groups = normalizeLocalData(employee, meta.currency);
    }

    return { meta, groups };
}

/**
 * Normalize Expatriate Data
 * Uses structure defined in EXPATRIATE_LABELS
 */
function normalizeExpatriateData(employee, defaultCurrency) {
    const breakdown = employee.breakdown || {};
    const groups = {};

    // Helper to detect currency specific to item label
    const detectCurrency = (label) => {
        if (label.includes('(RMB)')) return 'RMB';
        if (label.includes('(SGD)')) return 'SGD';
        return defaultCurrency;
    };

    const sanitizeLabel = (label) => label.replace(/\s*\((RMB|SGD)\)\s*/g, '').trim();

    // Iterate over breakdown keys
    Object.entries(breakdown).forEach(([key, value]) => {
        if (!shouldDisplayValue(value)) return;
        if (['序号', '邮箱', '备注', 'EP符合性'].includes(key) || key.includes('加班小时')) return;

        // Split "Group - Item"
        const parts = key.split(' - ');
        const groupName = parts.length > 1 ? parts[0] : '项目';
        const itemName = parts.length > 1 ? parts[1] : key;

        if (!groups[groupName]) {
            groups[groupName] = {
                title: groupName === '项目' ? formatBilingualLabel(EXPATRIATE_LABELS.item) : groupName,
                items: []
            };
        }

        const isEmphasis = ['小计', '合计', '应发工资', '实发工资', '扣发合计'].some(k => itemName.includes(k));
        let unit = detectCurrency(itemName);

        // Check if field should be unitless
        if (UNITLESS_FIELDS.includes(itemName)) {
            unit = '';
        }

        // Try to find a nice bilingual label if possible, otherwise use raw
        // For Expatriates, the excel keys are usually already human readable or mapped in parsers.
        // The current logic in emailService just uses the key directly. We keep that for flexibility.

        groups[groupName].items.push({
            label: sanitizeLabel(itemName),
            originalLabel: itemName,
            value: value,
            formattedValue: formatCurrency(value, unit),
            unit: unit,
            isBold: isEmphasis,
            isHighlight: isEmphasis
        });
    });

    return Object.values(groups);
}

/**
 * Normalize Local Data
 * Uses structure defined in LOCAL_LABELS
 */
function normalizeLocalData(employee, currency) {
    const breakdown = employee.breakdown || {};
    const groups = {};

    // Find translation helper
    const findTranslation = (text) => {
        for (const [key, val] of Object.entries(LOCAL_LABELS)) {
            if (val.zh === text) return val;
        }
        return null;
    };

    const formatGroupLabel = (name) => {
        // Check known groups
        const known = findTranslation(name);
        if (known) return formatBilingualLabel(known);
        return name; // Fallback
    };

    Object.entries(breakdown).forEach(([key, value]) => {
        if (!shouldDisplayValue(value)) return;
        if (['序号', '邮箱', '备注'].includes(key) || key.includes('加班小时')) return;

        // Logic from helper function in emailService: "Group > Column" or "Group - Column"
        // The emailService used `key.split(' - ')` but pdfGenerator used `key.split(' > ')` fallback.
        // Let's standardized on what excelParser produces.
        // excelParser produces keys based on mapping. LOCAL_MAPPING uses "Group - Item" format or just "Item".

        let groupName = '项目';
        let itemName = key;

        if (key.includes(' - ')) {
            const parts = key.split(' - ');
            groupName = parts[0];
            itemName = parts[1];
        }

        if (!groups[groupName]) {
            groups[groupName] = {
                title: formatGroupLabel(groupName),
                originalTitle: groupName,
                items: []
            };
        }

        const isEmphasis = ['小计', '合计', '应发工资', '实发工资', '扣发合计', '应发工资合计', '其他扣发'].some(k => itemName.includes(k));

        // Formatting Label
        let label = itemName;
        const knownItem = findTranslation(itemName);
        if (knownItem) {
            label = isEmphasis ? formatBilingualLabel(knownItem) : `${itemName} / ${knownItem.en}`;
        } else {
            // Try specific handling for Overtime
            if (itemName.includes('加班费')) {
                const overtimeLabel = LOCAL_LABELS.overtime;
                const hours = employee.overtimeHours || 0;
                label = `${itemName} (${hours}小时) / ${overtimeLabel.en} (${hours} hrs)`;
            }
        }

        groups[groupName].items.push({
            label: label,
            originalLabel: itemName,
            value: value,
            formattedValue: formatCurrency(value, currency),
            unit: currency,
            isBold: isEmphasis,
            isHighlight: isEmphasis
        });
    });

    // Sort groups if needed? 
    // Local mapping order: Fixed, Bonus, Deductions.
    // The object iteration order usually follows insertion order which follows mapping order. 
    // So we should be good relying on object insertion order.

    return Object.values(groups);
}
