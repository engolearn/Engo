// server.js - الملف الرئيسي للخادم
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// استيراد الموديلات والروUTES من مجلد backend
const User = require('./backend/models/User');
const Course = require('./backend/models/Course');
const Lesson = require('./backend/models/Lesson');
const UserProgress = require('./backend/models/UserProgress');

// استيراد الروUTES
const authRoutes = require('./backend/routes/auth');
const courseRoutes = require('./backend/routes/courses');
const adminRoutes = require('./backend/routes/admin');

// استيراد middleware
const auth = require('./backend/middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== Routes ====================

// استخدام الروUTES المستوردة
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminRoutes);

// Route رئيسي للاختبار
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '✅ Education Platform API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT
    });
});

// Route للتحقق من الصحة
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// ==================== Database Connection ====================

// الاتصال بقاعدة البيانات
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/education_platform';
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// تشغيل الخادم
const startServer = async () => {
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log('========================================');
        console.log('🚀 Server is running!');
        console.log(`📍 Port: ${PORT}`);
        console.log(`🌐 URL: http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('========================================');
    });
};

startServer();

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
});
