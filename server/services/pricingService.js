/**
 * Сервіс для розрахунку вартості віртуальних машин
 * на різних хмарних платформах
 */

// Базові ціни за годину (у доларах США)
// ОНОВЛЕНО: Жовтень 2025 - ціни наближені до реальних на основі Azure Pricing Calculator
// Базовані на середніх цінах для D-series (General Purpose) VM у регіоні West Europe
// Реальні ціни для конкретних SKU можуть відрізнятися ±15-25%
// 
// Джерела да// GET /api/regions - отримання доступних регіонівних (жовтень 2025):
//   - Azure D2s_v5 (2 vCPU, 8GB): ~$0.096/hr pay-as-you-go
//   - AWS t3.large (2 vCPU, 8GB): ~$0.0832/hr on-demand  
//   - GCP n2-standard-2 (2 vCPU, 8GB): ~$0.0776/hr on-demand
//
// Для точних цін використовуйте офіційні калькулятори:
//   - Azure: https://azure.microsoft.com/pricing/calculator/
//   - AWS: https://calculator.aws/
//   - GCP: https://cloud.google.com/products/calculator
// Детальна методологія: docs/PRICING_METHODOLOGY.md
const PRICING = {
  azure: {
    // Базовано на D-series pricing (West Europe, жовтень 2025)
    // D2s_v5: $0.096/hr = 2 vCPU ($0.048/vCPU) + 8GB RAM ($0.006/GB)
    cpuPerHour: 0.048,      // $0.048 за vCPU/годину
    ramPerHour: 0.006,      // $0.006 за GB RAM/годину  
    // Premium SSD P20 (512GB): ~$75/місяць = $0.146/GB/місяць
    storagePerMonth: 0.146,
    // Регіональні коефіцієнти (базовані на Azure Pricing Calculator, жовтень 2025)
    // Базовий регіон: East US (множник 1.0)
    // Приклад D2s_v5: East US $0.087/hr, West Europe $0.096/hr (1.10x), Southeast Asia $0.104/hr (1.20x)
    regionMultiplier: {
      'us-east': 1.0,       // East US - найдешевший регіон (базовий)
      'us-west': 1.03,      // West US +3%
      'europe-west': 1.10,  // West Europe +10%
      'europe-north': 1.05, // North Europe +5%
      'asia-east': 1.20,    // Southeast Asia +20%
      'asia-south': 1.18    // India +18%
    }
  },
  aws: {
    // Базовано на t3/m5 pricing (EU Ireland, жовтень 2025)
    // t3.large: $0.0832/hr = 2 vCPU ($0.0416/vCPU) + 8GB RAM ($0.0052/GB)
    cpuPerHour: 0.0416,     // $0.0416 за vCPU/годину
    ramPerHour: 0.0052,     // $0.0052 за GB RAM/годину
    // EBS gp3 SSD: ~$0.08/GB/місяць
    storagePerMonth: 0.08,  // EBS gp3 SSD
    // Регіональні коефіцієнти AWS (базовані на EC2 Pricing, жовтень 2025)
    // Базовий регіон: US East (N. Virginia) - найдешевший
    regionMultiplier: {
      'us-east': 1.0,       // US East (N. Virginia) - базовий
      'us-west': 1.07,      // US West +7%
      'europe-west': 1.13,  // EU (Ireland) +13%
      'europe-north': 1.08, // EU (Stockholm) +8%
      'asia-east': 1.19,    // Asia Pacific (Singapore) +19%
      'asia-south': 1.16    // Asia Pacific (Mumbai) +16%
    }
  },
  gcp: {
    // Базовано на n2-standard pricing (europe-west1, жовтень 2025)
    // n2-standard-2: $0.0776/hr = 2 vCPU ($0.0388/vCPU) + 8GB RAM ($0.0485/GB)
    cpuPerHour: 0.0388,     // $0.0388 за vCPU/годину
    ramPerHour: 0.00485,    // $0.00485 за GB RAM/годину
    // Persistent SSD: ~$0.17/GB/місяць
    storagePerMonth: 0.17,  // Persistent SSD
    // Регіональні коефіцієнти GCP (базовані на Compute Engine Pricing, жовтень 2025)
    // Базовий регіон: us-central1 (Iowa) - найдешевший
    regionMultiplier: {
      'us-east': 1.04,      // us-east1 (South Carolina) +4%
      'us-west': 1.07,      // us-west1 (Oregon) +7%
      'europe-west': 1.09,  // europe-west1 (Belgium) +9%
      'europe-north': 1.01, // europe-north1 (Finland) +1%
      'asia-east': 1.21,    // asia-east1 (Taiwan) +21%
      'asia-south': 1.15    // asia-south1 (Mumbai) +15%
    }
  }
};

/**
 * Вибір типу VM на основі параметрів
 */
function selectVMType(cpu, ram, provider) {
  if (provider === 'azure') {
    if (cpu <= 2 && ram <= 8) return 'Standard_B2s';
    if (cpu <= 4 && ram <= 16) return 'Standard_D4s_v3';
    if (cpu <= 8 && ram <= 32) return 'Standard_D8s_v3';
    return 'Standard_D16s_v3';
  } else if (provider === 'aws') {
    if (cpu <= 2 && ram <= 8) return 't3.large';
    if (cpu <= 4 && ram <= 16) return 'm5.xlarge';
    if (cpu <= 8 && ram <= 32) return 'm5.2xlarge';
    return 'm5.4xlarge';
  } else if (provider === 'gcp') {
    if (cpu <= 2 && ram <= 8) return 'n2-standard-2';
    if (cpu <= 4 && ram <= 16) return 'n2-standard-4';
    if (cpu <= 8 && ram <= 32) return 'n2-standard-8';
    return 'n2-standard-16';
  }
  return 'custom';
}

/**
 * Розрахунок вартості Azure з урахуванням резервування
 */
function calculateAzureCost(cpu, ram, storage, durationHours, region) {
  const pricing = PRICING.azure;
  const regionMultiplier = pricing.regionMultiplier[region] || 1.0;

  const computeCostPerHour = (cpu * pricing.cpuPerHour + ram * pricing.ramPerHour) * regionMultiplier;
  
  // Azure Reserved Instances - знижки за резервування
  // Джерело: https://learn.microsoft.com/azure/cost-management-billing/reservations/
  // Офіційні дані: до 72% знижки (1Y: 40-42%, 3Y: 58-62% для D-series)
  let reservedDiscount = 1.0;
  let reservedType = 'Pay-as-you-go';
  
  if (durationHours >= 8760 && durationHours < 26280) {
    // 1 рік резервування - 41% знижка (середнє для D-series)
    reservedDiscount = 0.59;
    reservedType = '1-year Reserved (41% знижка)';
  }
  
  if (durationHours >= 26280) {
    // 3 роки резервування - 60% знижка (середнє для D-series)
    reservedDiscount = 0.40;
    reservedType = '3-year Reserved (60% знижка)';
  }
  
  const computeTotalCost = computeCostPerHour * durationHours * reservedDiscount;

  const storageCostPerMonth = storage * pricing.storagePerMonth * regionMultiplier;
  const hoursInMonth = 730;
  const storageTotalCost = (storageCostPerMonth / hoursInMonth) * durationHours;

  const totalCost = computeTotalCost + storageTotalCost;
  
  const breakdown = {
    compute: parseFloat(computeTotalCost.toFixed(2)),
    storage: parseFloat(storageTotalCost.toFixed(2)),
    computeHourly: parseFloat(computeCostPerHour.toFixed(4)),
    storageMonthly: parseFloat(storageCostPerMonth.toFixed(2))
  };
  
  // Додаємо інформацію про резервування, якщо є знижка
  if (reservedDiscount < 1.0) {
    breakdown.reservedDiscount = `${((1 - reservedDiscount) * 100).toFixed(0)}%`;
    breakdown.reservedType = reservedType;
  }

  return {
    totalCost: parseFloat(totalCost.toFixed(2)),
    breakdown,
    vmType: selectVMType(cpu, ram, 'azure')
  };
}

/**
 * Розрахунок вартості AWS з урахуванням Reserved Instances
 */
function calculateAWSCost(cpu, ram, storage, durationHours, region) {
  const pricing = PRICING.aws;
  const regionMultiplier = pricing.regionMultiplier[region] || 1.0;

  const computeCostPerHour = (cpu * pricing.cpuPerHour + ram * pricing.ramPerHour) * regionMultiplier;
  
  // AWS Reserved Instances - знижки за резервування
  // Джерело: https://aws.amazon.com/ec2/pricing/reserved-instances/
  // Офіційні дані: Standard RI All Upfront (1Y: ~40%, 3Y: ~60% для t3/m5)
  let reservedDiscount = 1.0;
  let reservedType = 'On-Demand';
  
  if (durationHours >= 8760 && durationHours < 26280) {
    // 1 рік резервування - 38% знижка (Standard All Upfront)
    reservedDiscount = 0.62;
    reservedType = '1-year Reserved (38% знижка)';
  }
  
  if (durationHours >= 26280) {
    // 3 роки резервування - 59% знижка (Standard All Upfront)
    reservedDiscount = 0.41;
    reservedType = '3-year Reserved (59% знижка)';
  }
  
  const computeTotalCost = computeCostPerHour * durationHours * reservedDiscount;

  const storageCostPerMonth = storage * pricing.storagePerMonth * regionMultiplier;
  const hoursInMonth = 730;
  const storageTotalCost = (storageCostPerMonth / hoursInMonth) * durationHours;

  const totalCost = computeTotalCost + storageTotalCost;
  
  const breakdown = {
    compute: parseFloat(computeTotalCost.toFixed(2)),
    storage: parseFloat(storageTotalCost.toFixed(2)),
    computeHourly: parseFloat(computeCostPerHour.toFixed(4)),
    storageMonthly: parseFloat(storageCostPerMonth.toFixed(2))
  };
  
  // Додаємо інформацію про резервування, якщо є знижка
  if (reservedDiscount < 1.0) {
    breakdown.reservedDiscount = `${((1 - reservedDiscount) * 100).toFixed(0)}%`;
    breakdown.reservedType = reservedType;
  }

  return {
    totalCost: parseFloat(totalCost.toFixed(2)),
    breakdown,
    vmType: selectVMType(cpu, ram, 'aws')
  };
}

/**
 * Розрахунок вартості GCP з урахуванням Committed Use Discounts
 */
function calculateGCPCost(cpu, ram, storage, durationHours, region) {
  const pricing = PRICING.gcp;
  const regionMultiplier = pricing.regionMultiplier[region] || 1.0;

  // GCP має знижки за sustained use та committed use
  // Джерело: https://cloud.google.com/compute/docs/instances/signing-up-committed-use-discounts
  // Офіційні дані: Sustained Use до 30%, CUD (1Y: 37%, 3Y: 55% для n2-standard)
  let discount = 1.0;
  let discountType = 'On-Demand';
  
  if (durationHours > 730 && durationHours < 8760) {
    // Sustained Use Discount (автоматична знижка за >25% місяця)
    discount = 0.80; // 20% знижка (середнє значення)
    discountType = 'Sustained Use (20% знижка)';
  }
  
  if (durationHours >= 8760 && durationHours < 26280) {
    // 1 рік Committed Use - 37% знижка (n2-standard)
    discount = 0.63;
    discountType = '1-year Committed (37% знижка)';
  }
  
  if (durationHours >= 26280) {
    // 3 роки Committed Use - 55% знижка (n2-standard)
    discount = 0.45;
    discountType = '3-year Committed (55% знижка)';
  }

  const computeCostPerHour = (cpu * pricing.cpuPerHour + ram * pricing.ramPerHour) * regionMultiplier;
  const computeTotalCost = computeCostPerHour * durationHours * discount;

  const storageCostPerMonth = storage * pricing.storagePerMonth * regionMultiplier;
  const hoursInMonth = 730;
  const storageTotalCost = (storageCostPerMonth / hoursInMonth) * durationHours;

  const totalCost = computeTotalCost + storageTotalCost;

  return {
    totalCost: parseFloat(totalCost.toFixed(2)),
    breakdown: {
      compute: parseFloat(computeTotalCost.toFixed(2)),
      storage: parseFloat(storageTotalCost.toFixed(2)),
      computeHourly: parseFloat(computeCostPerHour.toFixed(4)),
      storageMonthly: parseFloat(storageCostPerMonth.toFixed(2)),
      sustainedUseDiscount: discount < 1.0 ? `${((1 - discount) * 100).toFixed(0)}%` : 'N/A',
      discountType: discountType
    },
    vmType: selectVMType(cpu, ram, 'gcp')
  };
}

module.exports = {
  calculateAzureCost,
  calculateAWSCost,
  calculateGCPCost
};
