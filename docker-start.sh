#!/bin/bash

# Скрипт для швидкого запуску Docker Compose

echo "🚀 Запуск Cloud Cost Comparator..."
echo ""

# Перевірка чи встановлений Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не встановлений. Встановіть Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Перевірка чи встановлений Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose не встановлений. Встановіть Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Зупинка старих контейнерів
echo "🛑 Зупинка старих контейнерів..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null

# Білд та запуск
echo "🔨 Білд образів..."
docker-compose build || docker compose build

echo "▶️  Запуск контейнерів..."
docker-compose up -d || docker compose up -d

# Очікування запуску
echo ""
echo "⏳ Очікування запуску сервісів..."
sleep 5

# Перевірка статусу
echo ""
echo "📊 Статус контейнерів:"
docker-compose ps || docker compose ps

echo ""
echo "✅ Система запущена!"
echo ""
echo "📦 Сервіси:"
echo "  🗄️  MongoDB:  mongodb://localhost:27017"
echo "  🌐 Frontend:  http://localhost:3000"
echo "  🔌 Backend:   http://localhost:3001/api"
echo ""
echo "📝 Корисні команди:"
echo "  docker-compose logs -f          # Переглянути логи"
echo "  docker-compose logs -f backend  # Логи тільки backend"
echo "  docker-compose logs -f frontend # Логи тільки frontend"
echo "  docker-compose down             # Зупинити все"
echo "  docker-compose restart          # Перезапустити"
echo ""
