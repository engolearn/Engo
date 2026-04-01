// server.js - الملف الرئيسي للخادم
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
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

// ==================== Static Files ====================

// خدمة الملفات الثابتة من مجلد frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// ==================== Routes ====================

// استخدام الروUTES المستوردة
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminRoutes);

// Route رئيسي - يعرض صفحة index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Route للتحقق من صحة الخادم (API)
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: '✅ Education Platform API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Route للتحقق من الصحة (لـ Koyeb)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        port: PORT
    });
});

// Route لصفحة الأدمن
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'admin.html'));
});

// Route لصفحات أخرى (إذا كانت موجودة)
app.get('/courses', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'courses.html'));
});

app.get('/course-details', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'course-details.html'));
});

app.get('/lesson', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'lesson.html'));
});

app.get('/level-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'level-test.html'));
});

app.get('/certificate', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'certificate.html'));
});

// ==================== Database Connection ====================

// الاتصال بقاعدة البيانات
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            console.error('❌ MONGODB_URI is not defined in environment variables');
            console.log('⚠️ Please set MONGODB_URI in .env file or Koyeb environment variables');
            process.exit(1);
        }
        
        console.log('📡 Connecting to MongoDB...');
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`📍 Host: ${mongoose.connection.host}`);
        
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.log('⚠️ Retrying in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

// معالجة أخطاء الاتصال بعد الاتصال
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected, attempting to reconnect...');
    setTimeout(connectDB, 5000);
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

// تشغيل الخادم
const startServer = async () => {
    await connectDB();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log('========================================');
        console.log('🚀 Server is running!');
        console.log(`📍 Port: ${PORT}`);
        console.log(`🌐 URL: http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('========================================');
        console.log('📁 Frontend: http://localhost:' + PORT);
        console.log('🔗 API: http://localhost:' + PORT + '/api/status');
        console.log('❤️ Health: http://localhost:' + PORT + '/health');
        console.log('========================================');
    });
    
    // إعدادات timeout للخادم
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
};

startServer();

// معالجة الأخطاء غير المتوقعة
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // لا نغلق الخادم، فقط نسجل الخطأ
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
    // لا نغلق الخادم، فقط نسجل الخطأ
});

// إغلاق نظيف عند إنهاء العملية
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, closing server...');
    mongoose.connection.close(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT received, closing server...');
    mongoose.connection.close(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    });
});
