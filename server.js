// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ إعدادات CORS الصحيحة
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ تسجيل جميع الطلبات للتصحيح
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
});

// خدمة الملفات الثابتة
app.use(express.static(path.join(__dirname, 'frontend')));

// ==================== Routes ====================

// استيراد الموديلات
const User = require('./backend/models/User');
const Course = require('./backend/models/Course');
const Lesson = require('./backend/models/Lesson');
const UserProgress = require('./backend/models/UserProgress');

// استيراد routes
const authRoutes = require('./backend/routes/auth');
const courseRoutes = require('./backend/routes/courses');
const adminRoutes = require('./backend/routes/admin');

// استخدام routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminRoutes);

// ✅ Route رئيسي
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ✅ Route للتحقق من صحة الخادم
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        time: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// ✅ Route لاختبار API
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// ==================== Database Connection ====================

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            console.error('❌ MONGODB_URI not set');
            return;
        }
        
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Error:', error.message);
        setTimeout(connectDB, 5000);
    }
};

// تشغيل الخادم
connectDB();

app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 URL: https://engo.koyeb.app`);
    console.log('========================================');
});
