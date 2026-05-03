/**
 * Сервіс рекомендацій на основі багатокритеріального аналізу
 * Використовує метод TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)
 */

/**
 * Критерії оцінки (ваги)
 */
const CRITERIA_WEIGHTS = {
  cost: 0.5,           // Вартість (50% важливості)
  reliability: 0.2,    // Надійність (20% важливості)
  performance: 0.15,   // Продуктивність (15% важливості)
  support: 0.15        // Підтримка (15% важливості)
};

/**
 * Рейтинги провайдерів за різними критеріями (крім вартості)
 * Шкала: 1-10 (10 = найкраще)
 */
const PROVIDER_RATINGS = {
  azure: {
    reliability: 9,
    performance: 8,
    support: 9
  },
  aws: {
    reliability: 10,
    performance: 9,
    support: 8
  },
  gcp: {
    reliability: 8,
    performance: 10,
    support: 7
  }
};

/**
 * Нормалізація значень вартості (менша вартість = краще)
 * Перетворюємо так, щоб більше значення було кращим
 */
function normalizeCosts(results) {
  const costs = results.map(r => r.cost);
  const maxCost = Math.max(...costs);
  
  return results.map(r => ({
    provider: r.provider.toLowerCase(),
    costScore: maxCost > 0 ? ((maxCost - r.cost) / maxCost) * 10 : 10,
    actualCost: r.cost
  }));
}

/**
 * Розрахунок оцінки за методом TOPSIS
 */
function calculateTOPSISScore(provider, costScore) {
  const ratings = PROVIDER_RATINGS[provider];
  
  // Зважена сума критеріїв
  const weightedScore = 
    (costScore * CRITERIA_WEIGHTS.cost) +
    (ratings.reliability * CRITERIA_WEIGHTS.reliability) +
    (ratings.performance * CRITERIA_WEIGHTS.performance) +
    (ratings.support * CRITERIA_WEIGHTS.support);
  
  return weightedScore;
}

/**
 * Генерація детального пояснення
 */
function generateExplanation(rankedProviders, parameters) {
  const winner = rankedProviders[0];
  const savings = rankedProviders[rankedProviders.length - 1].actualCost - winner.actualCost;
  const savingsPercent = ((savings / rankedProviders[rankedProviders.length - 1].actualCost) * 100).toFixed(1);
  
  let explanation = `На основі багатокритеріального аналізу (метод TOPSIS), `;
  explanation += `для конфігурації ${parameters.cpu} vCPU, ${parameters.ram} GB RAM, `;
  explanation += `${parameters.storage} GB storage протягом ${parameters.duration} годин `;
  explanation += `у регіоні "${parameters.region}", `;
  explanation += `рекомендується використати ${winner.provider.toUpperCase()}.\n\n`;
  
  explanation += `Економія: $${savings.toFixed(2)} (${savingsPercent}%) порівняно з найдорожчим варіантом.\n\n`;
  
  explanation += `Оцінки:\n`;
  rankedProviders.forEach((p, idx) => {
    explanation += `${idx + 1}. ${p.provider.toUpperCase()}: $${p.actualCost} (оцінка: ${p.score.toFixed(2)}/10)\n`;
  });
  
  explanation += `\nПереваги ${winner.provider.toUpperCase()}:\n`;
  const ratings = PROVIDER_RATINGS[winner.provider];
  if (ratings.reliability >= 9) explanation += `• Висока надійність (${ratings.reliability}/10)\n`;
  if (ratings.performance >= 9) explanation += `• Відмінна продуктивність (${ratings.performance}/10)\n`;
  if (ratings.support >= 8) explanation += `• Якісна підтримка (${ratings.support}/10)\n`;
  if (winner.costScore >= 8) explanation += `• Найкраща ціна\n`;
  
  return explanation;
}

/**
 * Головна функція отримання рекомендації
 */
function getRecommendation(results, parameters) {
  // Нормалізація вартості
  const normalizedCosts = normalizeCosts(results);
  
  // Розрахунок TOPSIS оцінки для кожного провайдера
  const scoredProviders = normalizedCosts.map(p => ({
    provider: p.provider,
    score: calculateTOPSISScore(p.provider, p.costScore),
    actualCost: p.actualCost,
    costScore: p.costScore,
    ratings: PROVIDER_RATINGS[p.provider]
  }));
  
  // Сортування за оцінкою (від найкращого до найгіршого)
  const rankedProviders = scoredProviders.sort((a, b) => b.score - a.score);
  
  // Формування відповіді
  return {
    recommended: rankedProviders[0].provider.toUpperCase(),
    ranking: rankedProviders.map((p, idx) => ({
      rank: idx + 1,
      provider: p.provider.toUpperCase(),
      cost: p.actualCost,
      score: parseFloat(p.score.toFixed(2)),
      details: {
        costScore: parseFloat(p.costScore.toFixed(2)),
        reliability: p.ratings.reliability,
        performance: p.ratings.performance,
        support: p.ratings.support
      }
    })),
    explanation: generateExplanation(rankedProviders, parameters),
    method: 'TOPSIS (Багатокритеріальний аналіз)'
  };
}

module.exports = {
  getRecommendation
};
