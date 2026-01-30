#!/bin/bash

# Salary Slip App Startup Script

echo "🚀 启动工资条发送系统..."
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未找到，请先安装Node.js"
    exit 1
fi

echo "📦 Node版本: $(node --version)"
echo "📦 npm版本: $(npm --version)"
echo ""

# Start backend
echo "🔧 启动后端服务器 (端口 3001)..."
cd backend
npm start &
BACKEND_PID=$!
echo "✅ 后端PID: $BACKEND_PID"
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend
echo ""
echo "🎨 启动前端开发服务器 (端口 3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ 前端PID: $FRONTEND_PID"
cd ..

echo ""
echo "✅ 应用启动成功！"
echo ""
echo "📍 访问地址: http://localhost:3000"
echo "📍 API地址: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# Wait for user interrupt
wait
