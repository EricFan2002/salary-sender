# 工资条发送系统 (Salary Slip Email Sender)

一个用于批量发送工资条邮件的全栈应用，支持Excel文件上传、SMTP配置和进度跟踪。

## 功能特点

✅ **Excel文件解析**
- 支持多工作表Excel文件(.xlsx, .xls)
- 自动检测表头和数据行
- 智能跳过合计行
- 支持灵活的列位置（邮箱列在备注列之后）

✅ **SMTP配置管理**
- 支持主流邮件服务商(Gmail, Outlook, QQ, 163等)
- 配置测试功能
- 本地存储(localStorage)

✅ **批量发送**
- 选择性发送工资条
- 进度实时跟踪
- 发送结果统计
- PDF附件自动生成

✅ **数据管理**
- 查看发送历史
- 导出历史记录
- 清除本地数据

## 项目结构

```
salary-slip-app/
├── backend/                # Node.js后端
│   ├── server.js          # Express服务器
│   └── package.json
├── frontend/              # React前端
│   ├── src/
│   │   ├── components/    # UI组件
│   │   ├── services/      # API服务
│   │   ├── utils/         # 工具函数
│   │   ├── App.jsx        # 主应用
│   │   └── main.jsx       # 入口文件
│   └── package.json
└── README.md
```

## 安装和运行

### 1. 启动后端服务器

```bash
cd backend
npm install  # 如果还没安装
npm start    # 或 npm run dev 使用nodemon
```

后端将运行在 `http://localhost:3001`

### 2. 启动前端开发服务器

```bash
cd frontend
npm install  # 如果还没安装
npm run dev
```

前端将运行在 `http://localhost:3000`

### 3. 访问应用

在浏览器中打开 `http://localhost:3000`

## Excel文件格式要求

### 文件结构

- **第3行**: 表头（姓名、各项工资、备注等）
- **第5行开始**: 员工数据
- **合计行**: 包含"合计"文字的行会自动跳过

### 必需列

1. **姓名列**: 包含员工姓名
2. **邮箱列**: 员工邮箱地址（需要在备注列之后添加）
3. **工资明细列**: 各项工资、扣款、补贴等

### 示例结构

```
| 序号 | 姓名 | 固定工资 | 补贴 | ... | 备注 | Email |
|------|------|----------|------|-----|------|-------|
| 1    | 张三 | 5000     | 500  | ... | -    | abc@gmail.com |
| 2    | 李四 | 6000     | 600  | ... | -    | xyz@gmail.com |
```

## SMTP配置示例

### Gmail
```
服务器: smtp.gmail.com
端口: 587
SSL/TLS: 否
邮箱: your-email@gmail.com
密码: 应用专用密码 (需在Google账户中生成)
```

### QQ邮箱
```
服务器: smtp.qq.com
端口: 587 (或 465 with SSL)
SSL/TLS: 是 (端口465时)
邮箱: your-email@qq.com
密码: 授权码 (需在QQ邮箱设置中生成)
```

### 163邮箱
```
服务器: smtp.163.com
端口: 465
SSL/TLS: 是
邮箱: your-email@163.com
密码: 授权码
```

## 使用流程

1. **上传Excel文件**
   - 点击"上传文件"标签
   - 选择或拖拽Excel文件
   - 系统自动解析并显示预览

2. **配置SMTP**
   - 点击"SMTP设置"标签
   - 填写邮件服务器信息
   - 点击"测试连接"验证配置
   - 点击"保存配置"

3. **发送工资条**
   - 点击"发送工资条"标签
   - 选择要发送的员工
   - 设置工资月份和公司名称
   - 点击"发送工资条"开始批量发送
   - 查看发送进度和结果

4. **数据管理**
   - 点击"数据管理"标签
   - 查看发送历史
   - 导出或清除数据

## 技术栈

### 后端
- Node.js + Express
- Nodemailer (邮件发送)
- CORS

### 前端
- React 18
- Vite (构建工具)
- TailwindCSS (样式)
- SheetJS (Excel解析)
- jsPDF + jspdf-autotable (PDF生成)
- Lucide React (图标)

## 安全注意事项

⚠️ **重要安全提示**

1. SMTP密码以明文形式存储在localStorage中
2. 建议使用应用专用密码，而非主密码
3. 仅在安全的环境中使用此应用
4. 定期清除浏览器数据
5. 不要在公共电脑上保存配置

## 常见问题

### 1. SMTP连接失败

- 检查服务器地址和端口是否正确
- 确认是否需要开启SSL/TLS
- 对于Gmail，确保使用应用专用密码
- 对于QQ/163，确保使用授权码而非登录密码

### 2. Excel解析失败

- 确保文件格式为.xlsx或.xls
- 检查表头是否在第3行
- 确保数据从第5行开始
- 确认有"姓名"列和"邮箱"列

### 3. 邮件发送慢

- 系统在邮件之间有1秒延迟，避免触发SMTP限制
- 大批量发送时请耐心等待
- 可以在代码中调整`delayBetweenEmails`参数

## 开发和部署

### 开发模式

```bash
# 后端
cd backend && npm run dev

# 前端
cd frontend && npm run dev
```

### 生产构建

```bash
# 前端构建
cd frontend
npm run build

# 构建产物在 frontend/dist
```

### 部署建议

- 后端可部署到任何支持Node.js的服务器
- 前端可构建后部署到静态托管服务
- 建议使用HTTPS保护数据传输
- 考虑添加身份验证机制

## License

MIT

## 支持

如有问题或建议，请提交Issue。
