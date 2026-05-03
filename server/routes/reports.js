const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const auth = require('../middleware/auth');

// Зберегти звіт (потребує авторизації)
router.post('/save', auth, [
  body('name').notEmpty().withMessage('Назва звіту обов\'язкова'),
  body('parameters').notEmpty().withMessage('Параметри обов\'язкові'),
  body('results').notEmpty().withMessage('Результати обов\'язкові')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, description, parameters, results, recommendation } = req.body;

    const report = new Report({
      userId: req.userId,
      name,
      description,
      parameters,
      results,
      recommendation
    });

    await report.save();

    res.status(201).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Save report error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Помилка при збереженні звіту' 
    });
  }
});

// Отримати всі звіти користувача
router.get('/list', auth, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('name description parameters.cpu parameters.ram parameters.storage parameters.region recommendation.provider createdAt');

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('List reports error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Помилка при отриманні звітів' 
    });
  }
});

// Отримати детальний звіт
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Звіт не знайдено' 
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Помилка при отриманні звіту' 
    });
  }
});

// Видалити звіт
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Звіт не знайдено' 
      });
    }

    res.json({
      success: true,
      message: 'Звіт видалено'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Помилка при видаленні звіту' 
    });
  }
});

// Порівняти декілька звітів
router.post('/compare', auth, [
  body('reportIds').isArray({ min: 2 }).withMessage('Потрібно мінімум 2 звіти для порівняння')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { reportIds } = req.body;

    const reports = await Report.find({ 
      _id: { $in: reportIds }, 
      userId: req.userId 
    });

    if (reports.length !== reportIds.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Деякі звіти не знайдено' 
      });
    }

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Compare reports error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Помилка при порівнянні звітів' 
    });
  }
});

module.exports = router;
