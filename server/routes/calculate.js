const express = require('express');
const router = express.Router();
const pricingService = require('../services/pricingService');
const recommendationService = require('../services/recommendationService');

router.post('/calculate', async (req, res) => {
  try {
    const { cpu, ram, storage, duration, region } = req.body;

    if (!cpu || !ram || !storage || !duration || !region) {
      return res.status(400).json({
        error: 'Будь ласка, заповніть всі поля: CPU, RAM, Storage, Duration, Region'
      });
    }

    const azureCost = pricingService.calculateAzureCost(cpu, ram, storage, duration, region);
    const awsCost = pricingService.calculateAWSCost(cpu, ram, storage, duration, region);
    const gcpCost = pricingService.calculateGCPCost(cpu, ram, storage, duration, region);

    const results = [
      {
        provider: 'Azure',
        cost: azureCost.totalCost,
        breakdown: azureCost.breakdown,
        vmType: azureCost.vmType
      },
      {
        provider: 'AWS',
        cost: awsCost.totalCost,
        breakdown: awsCost.breakdown,
        vmType: awsCost.vmType
      },
      {
        provider: 'GCP',
        cost: gcpCost.totalCost,
        breakdown: gcpCost.breakdown,
        vmType: gcpCost.vmType
      }
    ];

    const recommendation = recommendationService.getRecommendation(results, {
      cpu,
      ram,
      storage,
      duration,
      region
    });

    res.json({
      success: true,
      results,
      recommendation
    });

  } catch (error) {
    console.error('Error calculating costs:', error);
    res.status(500).json({
      error: 'Помилка при розрахунку вартості',
      details: error.message
    });
  }
});

router.get('/regions', (req, res) => {
  const regions = [
    { value: 'us-east', label: 'США (Східне узбережжя)' },
    { value: 'us-west', label: 'США (Західне узбережжя)' },
    { value: 'europe-west', label: 'Європа (Західна)' },
    { value: 'europe-north', label: 'Європа (Північна)' },
    { value: 'asia-east', label: 'Азія (Східна)' },
    { value: 'asia-south', label: 'Азія (Південна)' }
  ];

  res.json({ regions });
});

module.exports = router;
