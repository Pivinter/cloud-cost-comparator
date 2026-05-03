const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Реєстрація
router.post('/register', [
  body('email').isEmail().withMessage('Невалідний email'),
  body('password').isLength({ min: 6 }).withMessage('Пароль має бути мінімум 6 символів'),
  body('name').notEmpty().withMessage('Ім\'я обов\'язкове')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, name } = req.body;

    // Перевіряємо чи існує користувач
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Користувач з таким email вже існує' 
      });
    }

    // Створюємо користувача
    const user = new User({ email, password, name });
    await user.save();

    // Створюємо токен
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Помилка при реєстрації' 
    });
  }
});

// Логін
router.post('/login', [
  body('email').isEmail().withMessage('Невалідний email'),
  body('password').notEmpty().withMessage('Пароль обов\'язковий')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Знаходимо користувача
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Невірний email або пароль' 
      });
    }

    // Перевіряємо пароль
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Невірний email або пароль' 
      });
    }

    // Створюємо токен
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Помилка при вході' 
    });
  }
});

// Отримання профілю (потребує авторизації)
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Помилка при отриманні профілю' 
    });
  }
});

module.exports = router;
