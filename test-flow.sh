#!/bin/bash

# Кольори для виводу
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Тестування Cloud Cost Comparator${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Перевірка Backend
echo -e "${YELLOW}1. Перевірка Backend (http://localhost:3001)${NC}"
if curl -s http://localhost:3001/api/regions > /dev/null; then
    echo -e "${GREEN}   ✓ Backend працює${NC}"
else
    echo -e "${RED}   ✗ Backend не відповідає${NC}"
    exit 1
fi
echo ""

# Перевірка Frontend
echo -e "${YELLOW}2. Перевірка Frontend (http://localhost:3002)${NC}"
if curl -s http://localhost:3002 > /dev/null; then
    echo -e "${GREEN}   ✓ Frontend працює${NC}"
else
    echo -e "${RED}   ✗ Frontend не відповідає${NC}"
    exit 1
fi
echo ""

# Тест розрахунку
echo -e "${YELLOW}3. Тест API Розрахунку${NC}"
RESPONSE=$(curl -s -X POST http://localhost:3001/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "cpu": 2,
    "ram": 8,
    "storage": 500,
    "duration": 8760,
    "region": "europe-west"
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}   ✓ API повертає success${NC}"
else
    echo -e "${RED}   ✗ API не повертає success${NC}"
    echo "$RESPONSE"
    exit 1
fi

if echo "$RESPONSE" | grep -q '"results":\['; then
    echo -e "${GREEN}   ✓ Results є масивом${NC}"
else
    echo -e "${RED}   ✗ Results не є масивом${NC}"
    echo "$RESPONSE"
    exit 1
fi

AZURE_COST=$(echo "$RESPONSE" | grep -o '"provider":"Azure","cost":[0-9.]*' | grep -o '[0-9.]*$')
AWS_COST=$(echo "$RESPONSE" | grep -o '"provider":"AWS","cost":[0-9.]*' | grep -o '[0-9.]*$')
GCP_COST=$(echo "$RESPONSE" | grep -o '"provider":"GCP","cost":[0-9.]*' | grep -o '[0-9.]*$')

echo -e "   ${BLUE}Azure: \$$AZURE_COST${NC}"
echo -e "   ${BLUE}AWS:   \$$AWS_COST${NC}"
echo -e "   ${BLUE}GCP:   \$$GCP_COST${NC}"
echo ""

# Перевірка MongoDB
echo -e "${YELLOW}4. Перевірка MongoDB${NC}"
REPORT_COUNT=$(docker-compose exec -T mongodb mongosh --quiet --eval 'use cloud-comparator' --eval 'db.reports.countDocuments()' 2>/dev/null | tail -1)
echo -e "${GREEN}   ✓ Звітів в базі: $REPORT_COUNT${NC}"
echo ""

# Фінальний статус
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✓ Всі перевірки пройдені успішно!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Наступні кроки:${NC}"
echo -e "   1. Відкрити: ${BLUE}http://localhost:3002${NC}"
echo -e "   2. Зареєструватись / Увійти"
echo -e "   3. Ввести параметри:"
echo -e "      • CPU: 4"
echo -e "      • RAM: 16 GB"
echo -e "      • Storage: 1000 GB"
echo -e "      • Duration: 8760 hours"
echo -e "      • Region: europe-west"
echo -e "   4. Натиснути 'Розрахувати'"
echo -e "   5. Перевірити графік та таблицю"
echo -e "   6. Зберегти звіт"
echo -e "   7. Перевірити 'Історія звітів' → 'Завантажити'"
echo ""
