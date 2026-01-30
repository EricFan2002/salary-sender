import { normalizeSalaryData } from './src/utils/salaryDataNormalizer.js';

// Mock Employee Data (Local style)
const mockLocalEmployee = {
    name: 'LI HUA',
    email: 'lihua@ccs.org.cn',
    type: 'local',
    overtimeHours: 2,
    breakdown: {
        '序号': 1,
        '姓名': 'LI HUA',
        '固定工资类 - 合同工资': '5000',
        '固定工资类 - 补贴': '200',
        '固定工资类 - 加班费': '100',
        '固定工资类 - 小计': '5300',
        '浮动工资类 - 年终奖': '10000',
        '浮动工资类 - 小计': '10000',
        '应发工资合计': '15300',
        '个人CPF扣除 - 固定工资': '100',
        '个人CPF扣除 - 浮动工资': '200',
        '个人CPF扣除 - 合计': '300',
        '其他扣发': '50',
        '扣发合计': '350',
        '实发工资': '14950'
    }
};

const result = normalizeSalaryData(mockLocalEmployee, '2026-01');

console.log('--- Normalized Groups Order (Local) ---');
result.groups.forEach(g => {
    console.log(`Group: ${g.title}`);
    g.items.forEach(i => console.log(`  - ${i.label}: ${i.formattedValue} ${i.unit}`));
});
