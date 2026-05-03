#!/bin/bash

echo "🚀 Запуск Cloud Cost Comparator"
echo "================================"
echo ""

# Кольори для виводу
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Перевірка чи встановлені залежності
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Встановлення залежностей backend...${NC}"
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}Встановлення залежностей frontend...${NC}"
    cd client && npm install && cd ..
fi

# Створення .env файлів якщо не існують
if [ ! -f ".env" ]; then
    echo "PORT=3001" > .env
    echo -e "${GREEN}Створено .env файл${NC}"
fi

if [ ! -f "client/.env" ]; then
    echo "REACT_APP_API_URL=http://localhost:3001/api" > client/.env
    echo -e "${GREEN}Створено client/.env файл${NC}"
fi

echo ""
echo -e "${GREEN}✓ Всі залежності встановлені${NC}"
echo ""
echo "================================"
echo "Запуск серверів..."
echo "================================"
echo ""
echo "Backend API: http://localhost:3001"
echo "Frontend:    http://localhost:3000"
echo ""
echo "Натисніть Ctrl+C для зупинки"
echo ""

# Запуск backend у фоні
PORT=3001 node server/index.js &
BACKEND_PID=$!

# Чекаємо 2 секунди щоб backend встиг запуститись
sleep 2

# Запуск frontend
cd client && BROWSER=none npm start &
FRONTEND_PID=$!

# Функція для зупинки процесів
cleanup() {
    echo ""
    echo "Зупинка серверів..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Перехоплення Ctrl+C
trap cleanup INT

# Чекаємо
wait
