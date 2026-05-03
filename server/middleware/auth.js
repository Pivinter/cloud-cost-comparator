const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Отримуємо токен з заголовка
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Немає токена авторизації' 
      });
    }

    // Перевіряємо токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Знаходимо користувача
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Користувача не знайдено' 
      });
    }

    // Додаємо користувача до запиту
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Невалідний токен' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Токен прострочений' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Помилка авторизації' 
    });
  }
};

module.exports = auth;
