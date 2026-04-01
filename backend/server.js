// backend/server.js - بدون dotenv
const express = require('express');
const cors = require('cors');

// إزالة سطر require('dotenv').config();
// سنستخدم process.env مباشرة (ستأتي من المنصة)

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes الأساسية
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '✅ Education Platform API is running!',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime()
    });
});

// محاولة استيراد routes إذا كانت موجودة
try {
    const authRoutes = require('./routes/auth');
    const courseRoutes = require('./routes/courses');
    const adminRoutes = require('./routes/admin');
    
    app.use('/api/auth', authRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/admin', adminRoutes);
    console.log('✅ Routes loaded successfully');
} catch (error) {
    console.log('⚠️ Routes not found yet:', error.message);
}

// MongoDB connection (اختياري)
if (process.env.MONGODB_URI) {
    try {
        const mongoose = require('mongoose');
        mongoose.connect(process.env.MONGODB_URI)
            .then(() => console.log('✅ MongoDB connected'))
            .catch(err => console.log('⚠️ MongoDB error:', err.message));
    } catch (error) {
        console.log('⚠️ MongoDB not installed yet');
    }
}

// تشغيل الخادم
app.listen(PORT, () => {
    console.log('=================================');
    console.log('🚀 Server is running!');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('=================================');
});

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error.message);
});
