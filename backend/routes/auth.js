const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود بالفعل' });
        }
        
        const user = new User({ name, email, password });
        await user.save();
        
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret-key',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            message: 'تم التسجيل بنجاح',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                level: user.level,
                purchasedCourses: user.purchasedCourses
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret-key',
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'تم تسجيل الدخول بنجاح',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                level: user.level,
                purchasedCourses: user.purchasedCourses
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

module.exports = router;
