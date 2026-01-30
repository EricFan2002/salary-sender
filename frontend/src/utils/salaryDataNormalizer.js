import {
    EXPATRIATE_LABELS,
    LOCAL_LABELS,
    formatBilingualLabel,
    formatCurrency,
    safeParseNumber,
    shouldDisplayValue,
    UNITLESS_FIELDS,
    EXPATRIATE_STRUCTURE
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
/**
 * Normalize Expatriate Data
 * Uses structure defined in EXPATRIATE_STRUCTURE to enforce order
 */
function normalizeExpatriateData(employee, defaultCurrency) {
    // const { EXPATRIATE_STRUCTURE } = require('./salaryMappings'); // Imported at top
    const breakdown = employee.breakdown || {};
    const groups = [];

    // Helper to find value (using variations if needed, but here we expect exact keys from parser)
    const getValue = (key) => {
        // Direct match first (simplest since parser uses mapping keys)
        if (breakdown[key] !== undefined) return breakdown[key];
        return null;
    };

    // 1. Process Defined Sections (Fixed, Subsidies, Bonuses/Others)
    EXPATRIATE_STRUCTURE.sections.forEach(sectionDef => {
        const groupItems = [];

        sectionDef.items.forEach(itemDef => {
            const val = getValue(itemDef.key);
            if (shouldDisplayValue(val)) {
                // Determine unit
                let unit = defaultCurrency;
                if (itemDef.key.includes('(RMB)')) unit = 'RMB';
                if (itemDef.key.includes('(SGD)')) unit = 'SGD';
                if (UNITLESS_FIELDS.includes(itemDef.label)) unit = '';

                groupItems.push({
                    label: formatBilingualLabel(EXPATRIATE_LABELS[itemDef.label] || { en: itemDef.label, zh: itemDef.label }),
                    originalLabel: itemDef.label,
                    value: val,
                    formattedValue: formatCurrency(val, unit),
                    unit: unit,
                    isBold: false,
                    isHighlight: false
                });
            }
        });

        if (groupItems.length > 0) {
            groups.push({
                title: formatBilingualLabel(EXPATRIATE_LABELS[sectionDef.label] || { en: sectionDef.label, zh: sectionDef.label }),
                items: groupItems
            });
        }
    });

    // 2. Gross Salary (Standalone)
    const grossVal = getValue(EXPATRIATE_STRUCTURE.grossSalary.key);
    if (shouldDisplayValue(grossVal)) {
        groups.push({
            title: '', // No title for standalone totals
            items: [{
                label: formatBilingualLabel(EXPATRIATE_LABELS.grossSalary),
                value: grossVal,
                formattedValue: formatCurrency(grossVal, 'SGD'),
                unit: 'SGD',
                isBold: true,
                isHighlight: true
            }]
        });
    }

    // 3. Deductions Group
    const deductionItems = [];
    EXPATRIATE_STRUCTURE.deductions.forEach(dedItem => {
        const val = getValue(dedItem.key);
        if (shouldDisplayValue(val)) {
            let unit = 'SGD';
            if (dedItem.key.includes('(RMB)')) unit = 'RMB';

            deductionItems.push({
                label: formatBilingualLabel(EXPATRIATE_LABELS[dedItem.label] || { en: dedItem.label, zh: dedItem.label }),
                value: val,
                formattedValue: formatCurrency(val, unit),
                unit: unit,
                isBold: false
            });
        }
    });

    // Add Total Deductions if available
    const totalDedVal = getValue(EXPATRIATE_STRUCTURE.totalDeductions.key);
    if (shouldDisplayValue(totalDedVal)) {
        deductionItems.push({
            label: formatBilingualLabel(EXPATRIATE_LABELS.totalDeductions),
            value: totalDedVal,
            formattedValue: formatCurrency(totalDedVal, 'SGD'),
            unit: 'SGD',
            isBold: true
        });
    }

    if (deductionItems.length > 0) {
        groups.push({
            title: formatBilingualLabel(EXPATRIATE_LABELS.deductions),
            items: deductionItems
        });
    }

    // 4. Net Salary (Standalone)
    const netVal = getValue(EXPATRIATE_STRUCTURE.netSalary.key);
    if (shouldDisplayValue(netVal)) {
        groups.push({
            title: '',
            items: [{
                label: formatBilingualLabel(EXPATRIATE_LABELS.netSalary),
                value: netVal,
                formattedValue: formatCurrency(netVal, 'SGD'),
                unit: 'SGD',
                isBold: true,
                isHighlight: true
            }]
        });
    }

    return groups;
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
