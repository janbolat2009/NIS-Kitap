const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/Users');
const router  = express.Router();


const JWT_SECRET = process.env.JWT_SECRET;


router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(400).json({ msg: 'Пользователь с такой почтой уже есть' });
    }
    const user = new User({ name, email, password });
    await user.save();
    res.json({ msg: 'Успешно зарегистрирован' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ msg: 'Неверная почта или пароль' });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    res.json(user);
  } catch {
    res.status(401).json({ msg: 'Неавторизован' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const updates = {};
    if (req.body.password) updates.password = req.body.password;
    if (req.body.avatar)   updates.avatar = req.body.avatar;
    const updated = await User.findByIdAndUpdate(payload.id, updates, { new: true });
    res.json({ msg: 'Профиль обновлён', user: updated });
  } catch {
    res.status(401).json({ msg: 'Неавторизован' });
  }
});

module.exports = router;
