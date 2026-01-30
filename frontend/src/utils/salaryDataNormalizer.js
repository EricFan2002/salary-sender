import {
    EXPATRIATE_LABELS,
    LOCAL_LABELS,
    formatBilingualLabel,
    formatCurrency,
    safeParseNumber,
    shouldDisplayValue,
    UNITLESS_FIELDS,
    EXPATRIATE_STRUCTURE,
    LOCAL_STRUCTURE
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
/**
 * Normalize Local Data
 * Uses structure defined in LOCAL_STRUCTURE
 */
function normalizeLocalData(employee, currency) {
    // const { LOCAL_STRUCTURE, LOCAL_LABELS } = require('./salaryMappings'); // Imported at top
    const breakdown = employee.breakdown || {};
    const groups = [];

    const getValue = (key) => {
        if (breakdown[key] !== undefined) return breakdown[key];
        return null;
    };

    // 1. Process Main Sections (Fixed, Bonuses)
    LOCAL_STRUCTURE.sections.forEach(sectionDef => {
        const groupItems = [];

        // Items
        sectionDef.items.forEach(itemDef => {
            const val = getValue(itemDef.key);
            if (shouldDisplayValue(val)) {
                let label = LOCAL_LABELS[itemDef.label] ? formatBilingualLabel(LOCAL_LABELS[itemDef.label]) : itemDef.key;

                // Special handling for Overtime to show hours
                if (itemDef.key.includes('加班费')) {
                    const hours = employee.overtimeHours || 0;
                    const otLabel = LOCAL_LABELS.overtime;
                    label = `${otLabel.zh} (${hours}小时) / ${otLabel.en} (${hours} hrs)`;
                }

                groupItems.push({
                    label: label,
                    originalLabel: itemDef.label,
                    value: val,
                    formattedValue: formatCurrency(val, currency),
                    unit: currency,
                    isBold: false,
                    isHighlight: false
                });
            }
        });

        // Subtotal (if exists and has value)
        if (sectionDef.subtotal) {
            const val = getValue(sectionDef.subtotal.key);
            if (shouldDisplayValue(val)) {
                groupItems.push({
                    label: formatBilingualLabel(LOCAL_LABELS.subtotal),
                    value: val,
                    formattedValue: formatCurrency(val, currency),
                    unit: currency,
                    isBold: true,
                    isHighlight: true
                });
            }
        }

        if (groupItems.length > 0) {
            groups.push({
                title: formatBilingualLabel(LOCAL_LABELS[sectionDef.label]),
                items: groupItems
            });
        }
    });

    // 2. Gross Salary
    const grossVal = getValue(LOCAL_STRUCTURE.grossSalary.key);
    if (shouldDisplayValue(grossVal)) {
        groups.push({
            title: '',
            items: [{
                label: formatBilingualLabel(LOCAL_LABELS.grossSalary),
                value: grossVal,
                formattedValue: formatCurrency(grossVal, currency),
                unit: currency,
                isBold: true,
                isHighlight: true
            }]
        });
    }

    // 3. CPF Deductions (Inserted Here)
    const cpfItems = [];
    LOCAL_STRUCTURE.cpf.items.forEach(itemDef => {
        const val = getValue(itemDef.key);
        // Special case: CPF items might be implicitly 0 or hidden? 
        // User screenshot shows "个人CPF扣除" group.
        if (shouldDisplayValue(val)) {
            // For CPF items, labels might need mapping
            // LOCAL_LABELS doesn't have specific keys for "fixedSalary" inside CPF context, 
            // but we can reuse or just use specific logic.
            // LOCAL_LABELS has: basicSalary (Fixed), bonuses (Bonus)...
            // Actually LOCAL_LABELS has 'fixedSalary' as a Group Name.

            // Check if we have specific labels for CPF sub-items or just use generic
            // The excel keys are "个人CPF扣除 - 固定工资"
            let labelKey = itemDef.label; // 'fixedSalary', 'bonuses', 'subtotal'
            let displayLabel = '';

            if (labelKey === 'fixedSalary') displayLabel = '固定工资 / Fixed Salary'; // Ad-hoc or reuse
            else if (labelKey === 'bonuses') displayLabel = '浮动工资 / Bonus';
            else if (labelKey === 'subtotal') displayLabel = '合计 / Total';
            else displayLabel = itemDef.key;

            cpfItems.push({
                label: displayLabel,
                value: val,
                formattedValue: formatCurrency(val, currency),
                unit: currency,
                isBold: labelKey === 'subtotal',
                isHighlight: labelKey === 'subtotal'
            });
        }
    });

    if (cpfItems.length > 0) {
        groups.push({
            title: formatBilingualLabel(LOCAL_LABELS.cpfDeductions),
            items: cpfItems
        });
    }

    // 4. Other Deductions & Total Deductions
    const deductionItems = [];

    // Other Deductions
    LOCAL_STRUCTURE.deductions.forEach(dedItem => {
        const val = getValue(dedItem.key);
        if (shouldDisplayValue(val)) {
            deductionItems.push({
                label: formatBilingualLabel(LOCAL_LABELS[dedItem.label]),
                value: val,
                formattedValue: formatCurrency(val, currency),
                unit: currency,
                isBold: false
            });
        }
    });

    // Total Deductions
    const totalDedVal = getValue(LOCAL_STRUCTURE.totalDeductions.key);
    if (shouldDisplayValue(totalDedVal)) {
        deductionItems.push({
            label: formatBilingualLabel(LOCAL_LABELS.totalDeductions),
            value: totalDedVal,
            formattedValue: formatCurrency(totalDedVal, currency),
            unit: currency,
            isBold: true
        });
    }

    if (deductionItems.length > 0) {
        groups.push({
            title: '', // Deduction items often just listed? Or define a title? 
            // In screenshot, "其他扣发" is just a line item. 
            // "扣发合计" is a line item.
            items: deductionItems
        });
    }

    // 5. Net Salary
    const netVal = getValue(LOCAL_STRUCTURE.netSalary.key);
    if (shouldDisplayValue(netVal)) {
        groups.push({
            title: '',
            items: [{
                label: formatBilingualLabel(LOCAL_LABELS.netSalary),
                value: netVal,
                formattedValue: formatCurrency(netVal, currency),
                unit: currency,
                isBold: true,
                isHighlight: true
            }]
        });
    }

    return groups;
}
