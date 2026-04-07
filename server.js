const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');        // ✅ أضف هذا
const bcrypt = require('bcryptjs');         // ✅ أضف هذا
require('dotenv').config();
// ==================== AI Chat Models ====================
const aiConversationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [{
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);
const app = express();
const PORT = process.env.PORT || 5000;

// ==================== Middleware ====================
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'frontend')));
// ==================== منع الكاش بشكل نهائي ====================
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});
// ==================== Models ====================

// User Model (محدث لاستخدام username)
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, default: null },
    password: { type: String, required: true },
    fullName: { type: String, required: true }, // ✅ الاسم الكامل - إلزامي للشهادة
    role: { type: String, default: 'user', enum: ['user', 'admin'] },
    level: { type: String, enum: ['beginner', 'advanced', null], default: null },
    levelScore: { type: Number, default: 0 },
    purchasedCourses: { type: [String], default: [] },
    avatar: { type: String, default: '👤' },
    bio: { type: String, default: '' },
    notifications: [{
        id: { type: String, required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: { type: String, default: 'info' },
        link: { type: String, default: '/' },
        image: { type: String, default: null },
        expiry: { type: Date, default: null },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Course Model (مع إضافة حقل المستخدمين المسموح لهم)
const courseSchema = new mongoose.Schema({
    title: String,
    description: String,
    level: { type: String, enum: ['beginner', 'advanced'] },
    price: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    totalLessons: { type: Number, default: 0 },
    freeLessons: { type: Number, default: 5 },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // ✅ أضف هذا الحقل
    createdAt: { type: Date, default: Date.now }
});
const Course = mongoose.model('Course', courseSchema);

// Private Conversation Model
const privateConversationSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, unique: true, index: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        fromName: String,
        text: String,
        timestamp: { type: Date, default: Date.now },
        read: { type: Boolean, default: false }
    }],
    lastActivity: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});
const PrivateConversation = mongoose.model('PrivateConversation', privateConversationSchema);

// Room Model
const roomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    creatorName: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: String,
        text: String,
        timestamp: { type: Date, default: Date.now },
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    isPrivate: { type: Boolean, default: false },
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now }
});
const Room = mongoose.model('Room', roomSchema);

// Lesson Model (محدث لدعم الفقرات المتسلسلة)
const lessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: mongoose.Schema.Types.Mixed, default: [] },  // ✅ يدعم الفقرات المتسلسلة (array)
    lessonNumber: { type: Number, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    assignment: {
        title: { type: String, default: 'واجب الدرس' },
        description: { type: String, default: '' },
        questions: [mongoose.Schema.Types.Mixed],
        passingScore: { type: Number, default: 70 }
    },
    createdAt: { type: Date, default: Date.now }
});

const Lesson = mongoose.model('Lesson', lessonSchema);
// Quiz Models
const quizQuestionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['multiple_choice', 'true_false', 'word_match', 'matching', 'essay', 'fill_blank'],
        required: true 
    },
    title: { type: String, default: '' },
    points: { type: Number, default: 10 },
    
    // للاختيار من متعدد
    question: { type: String },
    options: [{ type: String }],
    correctOption: { type: Number },
    
    // للصح/خطأ
    statement: { type: String },
    isTrue: { type: Boolean },
    
    // للكلمة ومعناها
    word: { type: String },
    meaning: { type: String },
    wordOptions: [{ type: String }],
    correctMeaning: { type: String },
    
    // للتوصيل
    matchingPairs: [{
        left: { type: String },
        right: { type: String }
    }],
    
    // للمقال
    essayTopic: { type: String },
    essayGuidelines: { type: String },
    essayKeywords: [{ type: String }],
    
    // لملء الفراغات
    text: { type: String },
    blanks: [{ type: String }],
    correctAnswers: [{ type: String }]
});

const quizSchema = new mongoose.Schema({
    quizType: { 
        type: String, 
        enum: ['level_test', 'midterm', 'final'], 
        required: true 
    },
    level: { type: String, enum: ['beginner', 'advanced'] },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    duration: { type: Number, default: 30 },
    passingScore: { type: Number, default: 70 },
    questions: [quizQuestionSchema],
    totalPoints: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Quiz = mongoose.model('Quiz', quizSchema);

// Quiz Result Model
const quizResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    answers: [{
        questionId: String,
        userAnswer: mongoose.Schema.Types.Mixed,
        isCorrect: { type: Boolean, default: false },
        pointsEarned: { type: Number, default: 0 }
    }],
    timeSpent: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: Date.now }
});

const QuizResult = mongoose.model('QuizResult', quizResultSchema);

// UserProgress Model
const userProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    completedLessons: [{ lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }, score: { type: Number, default: 0 } }],
    midtermScore: { type: Number, default: null },
    finalScore: { type: Number, default: null }
});
const UserProgress = mongoose.model('UserProgress', userProgressSchema);
// نموذج الشهادات
const certificateSchema = new mongoose.Schema({
    certificateId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    userName: { type: String, required: true },
    courseTitle: { type: String, required: true },
    courseLevel: { type: String, required: true },
    issueDate: { type: Date, default: Date.now },
    finalScore: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 }
});
const Certificate = mongoose.model('Certificate', certificateSchema);

// ==================== Helper Functions ====================
// دالة إضافة إشعار للمستخدم
async function addNotification(userId, notifData) {
    try {
        const user = await User.findById(userId);
        if (!user) return false;
        
        // إنشاء كائن الإشعار
        const notification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
            title: notifData.title,
            message: notifData.message,
            type: notifData.type || 'info',
            link: notifData.link || '/',
            image: notifData.image || null,
            expiry: notifData.expiry || null,
            read: false,
            createdAt: new Date()
        };
        
        // إضافة الإشعار إلى بداية المصفوفة
        if (!user.notifications) user.notifications = [];
        user.notifications.unshift(notification);
        
        // الاحتفاظ بآخر 50 إشعار فقط
        if (user.notifications.length > 50) {
            user.notifications = user.notifications.slice(0, 50);
        }
        
        await user.save();
        
        // إرسال إشعار فوري عبر Socket.IO إذا كان المستخدم متصلاً
        const onlineUsers = global.onlineUsers || new Map();
        const socketId = onlineUsers.get(userId.toString());
        if (socketId && global.io) {
            global.io.to(socketId).emit('new_notification', notification);
        }
        
        console.log(`📢 Notification sent to ${user.name}: ${notifData.title}`);
        return true;
    } catch (error) {
        console.error('Error adding notification:', error);
        return false;
    }
}

// Auth Middleware
const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'secret123';
        const decoded = jwt.verify(token, secret);
        
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('❌ Auth error:', error.message);
        res.status(401).json({ message: 'Invalid token: ' + error.message });
    }
};

const adminAuth = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// ==================== Fake Users Bot System - كامل ====================

// نموذج البوتات (معدل)
const botSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    avatar: { type: String, default: '🤖' },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    isActive: { type: Boolean, default: true },
    messages: [{ type: String }],
    messageInterval: { type: Number, default: 3600000 },
    createdAt: { type: Date, default: Date.now }
});

const Bot = mongoose.model('Bot', botSchema);

// نموذج سجل رسائل البوتات
const botMessageLogSchema = new mongoose.Schema({
    botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot' },
    botName: String,
    roomId: String,
    roomName: String,
    message: String,
    sentAt: { type: Date, default: Date.now }
});
const BotMessageLog = mongoose.model('BotMessageLog', botMessageLogSchema);

// متغير لتخزين المؤقتات النشطة
let activeBotIntervals = new Map();

// دالة إنشاء بوت جديد (معدلة)
async function createBot(botData) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('botpassword123', 10);
    
    // ✅ استخدام username و fullName
    const user = new User({
        username: botData.username,
        fullName: botData.fullName,
        password: hashedPassword,
        role: 'user',
        level: botData.level,
        avatar: botData.avatar || '🤖',
        createdAt: new Date()
    });
    await user.save();
    
    const bot = new Bot({
        username: botData.username,
        fullName: botData.fullName,
        avatar: botData.avatar || '🤖',
        level: botData.level,
        messages: botData.messages || [],
        messageInterval: botData.messageInterval || 60000,
        isActive: true
    });
    await bot.save();
    
    return { bot, user };
}

// دالة إرسال رسالة من بوت (معدلة)
async function sendBotMessage(bot, user, roomId, io) {
    if (!bot.isActive) return;
    if (!bot.messages || bot.messages.length === 0) return;
    
    const randomMessage = bot.messages[Math.floor(Math.random() * bot.messages.length)];
    
    const room = await Room.findOne({ roomId });
    if (!room) return;
    
    const message = {
        userId: user._id,
        userName: bot.username,  // ✅ استخدام username بدلاً من name
        userFullName: bot.fullName,
        text: randomMessage,
        timestamp: new Date(),
        readBy: []
    };
    
    room.messages.push(message);
    room.lastActivity = new Date();
    await room.save();
    
    const log = new BotMessageLog({
        botId: bot._id,
        botName: bot.username,
        roomId: roomId,
        roomName: room.name,
        message: randomMessage
    });
    await log.save();
    
    io.to(roomId).emit('new_message', message);
    console.log(`🤖 Bot ${bot.username} sent: "${randomMessage}" in room ${room.name}`);
}

// دالة تشغيل بوت في غرفة (معدلة)
async function startBotInRoom(botId, roomId, io) {
    const bot = await Bot.findById(botId);
    if (!bot || !bot.isActive) return false;
    
    // ✅ البحث باستخدام username
    const user = await User.findOne({ username: bot.username });
    if (!user) return false;
    
    const room = await Room.findOne({ roomId });
    if (!room) return false;
    
    if (!room.members.includes(user._id)) {
        room.members.push(user._id);
        await room.save();
    }
    
    const existingInterval = activeBotIntervals.get(`${botId}_${roomId}`);
    if (existingInterval) {
        clearInterval(existingInterval);
    }
    
    const interval = setInterval(async () => {
        await sendBotMessage(bot, user, roomId, io);
    }, bot.messageInterval);
    
    activeBotIntervals.set(`${botId}_${roomId}`, interval);
    
    return true;
}

// دالة إيقاف بوت في غرفة
function stopBotInRoom(botId, roomId) {
    const key = `${botId}_${roomId}`;
    const interval = activeBotIntervals.get(key);
    if (interval) {
        clearInterval(interval);
        activeBotIntervals.delete(key);
        return true;
    }
    return false;
}

// دالة إيقاف جميع بوتات غرفة
function stopAllBotsInRoom(roomId) {
    let count = 0;
    for (const [key, interval] of activeBotIntervals.entries()) {
        if (key.endsWith(`_${roomId}`)) {
            clearInterval(interval);
            activeBotIntervals.delete(key);
            count++;
        }
    }
    return count;
}


                        
                             // ==================== التحقق من صحة الشهادة ====================
// صفحة التحقق من الشهادة (تعرض HTML)
app.get('/verify-certificate/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // البحث عن الشهادة في قاعدة البيانات
        const certificate = await Certificate.findOne({ certificateId: id });
        
        // إذا لم يتم العثور على الشهادة
        if (!certificate) {
            return res.send(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>شهادة غير صالحة - EnGo</title>
                    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: 'Cairo', sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            min-height: 100vh;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            padding: 20px;
                        }
                        .card {
                            background: white;
                            border-radius: 20px;
                            padding: 2rem;
                            max-width: 500px;
                            width: 100%;
                            text-align: center;
                            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                        }
                        .invalid-icon { font-size: 4rem; color: #e53e3e; margin-bottom: 1rem; }
                        h2 { color: #e53e3e; margin-bottom: 1rem; }
                        p { color: #4a5568; margin-bottom: 1rem; line-height: 1.6; }
                        .btn {
                            background: #667eea;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 30px;
                            cursor: pointer;
                            font-size: 1rem;
                            margin-top: 1rem;
                        }
                        .btn:hover { background: #5a67d8; transform: scale(1.02); }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="invalid-icon">❌</div>
                        <h2>شهادة غير صالحة</h2>
                        <p>لم يتم العثور على هذه الشهادة في قاعدة البيانات.</p>
                        <p>يرجى التأكد من الرابط أو التواصل مع الدعم الفني.</p>
                        <button class="btn" onclick="window.location.href='/'">🏠 العودة للرئيسية</button>
                    </div>
                </body>
                </html>
            `);
        }
        
        // ✅ عرض صفحة التحقق من الشهادة (شهادة صالحة)
        res.send(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>شهادة صالحة - EnGo</title>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Cairo', sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 20px;
                    }
                    .certificate-verify {
                        background: white;
                        border-radius: 20px;
                        padding: 2rem;
                        max-width: 600px;
                        width: 100%;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                        text-align: center;
                    }
                    .valid-icon { font-size: 4rem; color: #48bb78; margin-bottom: 1rem; }
                    h2 { color: #2d3748; margin-bottom: 0.5rem; }
                    .verified-badge {
                        display: inline-block;
                        background: #48bb78;
                        color: white;
                        padding: 5px 15px;
                        border-radius: 30px;
                        font-size: 0.8rem;
                        margin-bottom: 1.5rem;
                    }
                    .info-box {
                        background: #f7fafc;
                        border-radius: 15px;
                        padding: 1.5rem;
                        text-align: right;
                        margin: 1.5rem 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .info-row:last-child { border-bottom: none; }
                    .info-label { font-weight: bold; color: #4a5568; }
                    .info-value { color: #2d3748; }
                    .btn {
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 30px;
                        cursor: pointer;
                        font-size: 1rem;
                        margin-top: 1rem;
                        transition: 0.3s;
                    }
                    .btn:hover { transform: scale(1.02); background: #5a67d8; }
                    .footer { margin-top: 1.5rem; font-size: 0.75rem; color: #a0aec0; }
                    @media (max-width: 600px) {
                        .certificate-verify { padding: 1.5rem; }
                        .info-row { flex-direction: column; gap: 5px; text-align: center; }
                    }
                </style>
            </head>
            <body>
                <div class="certificate-verify">
                    <div class="valid-icon">✅</div>
                    <span class="verified-badge">✓ شهادة صالحة ومعتمدة</span>
                    <h2>شهادة إتمام دورة</h2>
                    <p style="color: #718096;">صادرة من منصة EnGo لتعليم اللغة الإنجليزية</p>
                    
                    <div class="info-box">
                        <div class="info-row">
                            <span class="info-label">📜 رقم الشهادة:</span>
                            <span class="info-value">${certificate.certificateId}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">👤 اسم الحاصل على الشهادة:</span>
                            <span class="info-value">${certificate.userName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">📚 اسم الدورة:</span>
                            <span class="info-value">${certificate.courseTitle}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">⭐ المستوى:</span>
                            <span class="info-value">${certificate.courseLevel}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">📅 تاريخ الإصدار:</span>
                            <span class="info-value">${certificate.issueDate.toLocaleDateString('ar-EG')}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">🎯 نسبة الإنجاز:</span>
                            <span class="info-value">${certificate.finalScore || '100'}%</span>
                        </div>
                    </div>
                    
                    <p style="color: #48bb78; margin: 1rem 0;">
                        <i class="fas fa-check-circle"></i> هذه الشهادة صالحة وصادرة من منصة EnGo
                    </p>
                    
                    <button class="btn" onclick="window.location.href='/'">🏠 العودة للرئيسية</button>
                    
                    <div class="footer">
                        <p>للتحقق من صحة الشهادة، يرجى مسح الرمز أو زيارة الرابط أعلاه</p>
                        <p>© 2026 EnGo - منصة تعلم اللغة الإنجليزية</p>
                    </div>
                </div>
            </body>
            </html>
        `);
        
    } catch (error) {
        console.error('Verification page error:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head><meta charset="UTF-8"><title>خطأ</title></head>
            <body style="font-family:Cairo;text-align:center;padding:2rem;">
                <h2>❌ حدث خطأ</h2>
                <p>حدث خطأ في التحقق من الشهادة. يرجى المحاولة مرة أخرى لاحقاً.</p>
                <button onclick="window.location.href='/'">العودة للرئيسية</button>
            </body>
            </html>
        `);
    }
});

// API للتحقق من صحة الشهادة (يرجع JSON)
app.get('/api/verify-certificate/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🔍 API Verification - Searching for certificate:', id);
        
        const certificate = await Certificate.findOne({ certificateId: id });
        
        if (!certificate) {
            console.log('❌ API Verification - Certificate not found');
            return res.json({ 
                valid: false, 
                message: 'لم يتم العثور على هذه الشهادة في قاعدة البيانات' 
            });
        }
        
        console.log('✅ API Verification - Certificate found:', certificate.certificateId);
        
        res.json({
            valid: true,
            certificateId: certificate.certificateId,
            userName: certificate.userName,
            courseTitle: certificate.courseTitle,
            courseLevel: certificate.courseLevel,
            issueDate: certificate.issueDate.toLocaleDateString('ar-EG'),
            finalScore: certificate.finalScore || 100
        });
        
    } catch (error) {
        console.error('API Verification error:', error);
        res.status(500).json({ 
            valid: false, 
            message: 'حدث خطأ في التحقق: ' + error.message 
        });
    }
});
                             
                             
                             
                        
// ==================== API Routes للبوتات ====================

// جلب جميع البوتات
app.get('/api/admin/bots', auth, adminAuth, async (req, res) => {
    try {
        const bots = await Bot.find().sort({ createdAt: -1 });
        res.json(bots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// جلب الغرف مع حالة البوتات
app.get('/api/admin/rooms-with-bots', auth, adminAuth, async (req, res) => {
    try {
        const rooms = await Room.find({}).sort({ lastActivity: -1 });
        const roomsWithBots = rooms.map(room => ({
            ...room.toObject(),
            botsActive: false, // يمكن تحديثها لاحقاً
            botCount: 0
        }));
        res.json(roomsWithBots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// إنشاء بوت جديد
app.post('/api/admin/bots', auth, adminAuth, async (req, res) => {
    try {
        const { username, fullName, avatar, level, messages, messageInterval } = req.body;
        
        // ✅ التحقق من البيانات
        if (!username) {
            return res.status(400).json({ message: 'اسم المستخدم مطلوب' });
        }
        
        if (!fullName || fullName.length < 3) {
            return res.status(400).json({ message: 'الاسم الكامل مطلوب (3 أحرف على الأقل)' });
        }
        
        // ✅ التأكد من عدم وجود اسم مستخدم مكرر
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
        }
        
        const bot = await createBot({
            username: username.toLowerCase(),
            fullName: fullName,
            avatar: avatar || '🤖',
            level: level || 'beginner',
            messages: messages || [],
            messageInterval: messageInterval || 60000
        });
        
        res.json({ success: true, bot: bot.bot, user: bot.user });
    } catch (error) {
        console.error('Error creating bot:', error);
        res.status(500).json({ message: error.message });
    }
});

// تحديث بوت
app.put('/api/admin/bots/:botId', auth, adminAuth, async (req, res) => {
    try {
        const { name, avatar, level, messages, messageInterval, isActive } = req.body;
        
        const bot = await Bot.findByIdAndUpdate(req.params.botId, {
            name,
            avatar,
            level,
            messages,
            messageInterval,
            isActive
        }, { new: true });
        
        // تحديث المستخدم المرتبط
        await User.findOneAndUpdate({ email: bot.email }, {
            name: name,
            level: level
        });
        
        res.json({ success: true, bot });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// حذف بوت
app.delete('/api/admin/bots/:botId', auth, adminAuth, async (req, res) => {
    try {
        const bot = await Bot.findById(req.params.botId);
        if (bot) {
            await User.deleteOne({ email: bot.email });
            await Bot.findByIdAndDelete(req.params.botId);
            await BotMessageLog.deleteMany({ botId: req.params.botId });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// تشغيل بوت في غرفة
app.post('/api/admin/bots/:botId/start', auth, adminAuth, async (req, res) => {
    try {
        const { roomId } = req.body;
        const result = await startBotInRoom(req.params.botId, roomId, io);
        res.json({ success: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// إيقاف بوت في غرفة
app.post('/api/admin/bots/:botId/stop', auth, adminAuth, async (req, res) => {
    try {
        const { roomId } = req.body;
        const result = stopBotInRoom(req.params.botId, roomId);
        res.json({ success: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// جلب البوتات النشطة في غرفة
app.get('/api/admin/rooms/:roomId/active-bots', auth, adminAuth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const activeBots = [];
        
        for (const [key, interval] of activeBotIntervals.entries()) {
            if (key.endsWith(`_${roomId}`)) {
                const botId = key.split('_')[0];
                const bot = await Bot.findById(botId);
                if (bot) {
                    activeBots.push(bot);
                }
            }
        }
        
        res.json(activeBots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// جلب سجل رسائل البوتات
app.get('/api/admin/bots/logs', auth, adminAuth, async (req, res) => {
    try {
        const logs = await BotMessageLog.find().sort({ sentAt: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// جلب جميع الغرف للتشغيل عليها
app.get('/api/admin/rooms', auth, adminAuth, async (req, res) => {
    try {
        const rooms = await Room.find({}).sort({ lastActivity: -1 });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== Auth Routes ====================
// تسجيل مستخدم جديد (باستخدام username فقط)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, fullName, password } = req.body;
        
        if (!username) {
            return res.status(400).json({ message: 'اسم المستخدم مطلوب' });
        }
        
        if (!fullName || fullName.trim().length < 3) {
            return res.status(400).json({ message: 'الاسم الكامل مطلوب (3 أحرف على الأقل)' });
        }
        
        // ✅ التحقق من عدم تكرار اسم المستخدم فقط (بدون بريد)
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
        }
        
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({ 
            username: username.toLowerCase(),
            fullName: fullName.trim(),
            password: hashedPassword,
            role: 'user'
            // ✅ لا نرسل بريد إلكتروني
        });
        
        await user.save();
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { userId: user._id, role: user.role, username: user.username }, 
            process.env.JWT_SECRET || 'secret123', 
            { expiresIn: '7d' }
        );
        
        res.json({ 
            message: 'تم التسجيل بنجاح', 
            token, 
            user: { 
                id: user._id, 
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                level: user.level,
                purchasedCourses: user.purchasedCourses || [] 
            } 
        });
        
    } catch (error) {
        console.error('Register error:', error);
        
        // ✅ معالجة خطأ التكرار
        if (error.code === 11000) {
            return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
        }
        
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        
        const bcrypt = require('bcryptjs');
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { userId: user._id, role: user.role, username: user.username }, 
            process.env.JWT_SECRET || 'secret123', 
            { expiresIn: '7d' }
        );
        
        res.json({ 
            message: 'تم تسجيل الدخول', 
            token, 
            user: { 
                id: user._id, 
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                level: user.level,
                purchasedCourses: user.purchasedCourses || [] 
            } 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// ==================== إدارة صلاحيات المستخدمين للدورات ====================

// جلب المستخدمين المسموح لهم بدورة محددة
app.get('/api/admin/courses/:courseId/allowed-users', auth, adminAuth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId).populate('allowedUsers', 'username fullName email');
        if (!course) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }
        res.json(course.allowedUsers || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// إضافة مستخدم إلى قائمة المسموح لهم بدورة
app.post('/api/admin/courses/:courseId/add-user', auth, adminAuth, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { userId } = req.body;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }
        
        // التحقق من عدم تكرار المستخدم
        if (!course.allowedUsers.includes(userId)) {
            course.allowedUsers.push(userId);
            await course.save();
        }
        
        res.json({ success: true, message: 'تم إضافة المستخدم بنجاح' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// إزالة مستخدم من قائمة المسموح لهم بدورة
app.delete('/api/admin/courses/:courseId/remove-user/:userId', auth, adminAuth, async (req, res) => {
    try {
        const { courseId, userId } = req.params;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }
        
        course.allowedUsers = course.allowedUsers.filter(id => id.toString() !== userId);
        await course.save();
        
        res.json({ success: true, message: 'تم إزالة المستخدم بنجاح' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// جلب قائمة المستخدمين (للعرض في واجهة الإدارة)
app.get('/api/admin/users-list', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('_id username fullName email');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== Course Routes ====================
// جلب الدورات للواجهة الرئيسية (النشطة فقط)
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        res.json([]);
    }
});



app.get('/api/courses/:courseId', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId).populate('lessons');
        if (!course) return res.status(404).json({ message: 'Course not found' });
        
        // ✅ التحقق من صلاحية المستخدم
        const isAllowed = course.allowedUsers.includes(req.user._id) || course.isActive;
        
        if (!isAllowed) {
            return res.status(403).json({ message: 'غير مصرح لك بالوصول إلى هذه الدورة' });
        }
        
        const isPurchased = req.user.purchasedCourses.includes(course._id.toString());
        const lessonsWithStatus = course.lessons.map((lesson, index) => ({
            ...lesson.toObject(),
            isLocked: !isPurchased && index >= course.freeLessons
        }));
        
        res.json({ ...course.toObject(), lessons: lessonsWithStatus, isPurchased });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// تحديث حالة الدورة (تفعيل/تعطيل)
app.put('/api/admin/courses/:courseId/toggle-status', auth, adminAuth, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { isActive } = req.body;
        
        const course = await Course.findByIdAndUpdate(
            courseId,
            { isActive: isActive },
            { new: true }
        );
        
        if (!course) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }
        
        res.json({ 
            success: true, 
            message: `تم ${isActive ? 'تفعيل' : 'تعطيل'} الدورة بنجاح`,
            course 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== Notifications ====================
// جلب إشعارات المستخدم
app.get('/api/notifications', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
        
        // ترتيب الإشعارات من الأحدث إلى الأقدم
        const notifications = (user.notifications || []).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: error.message });
    }
});

// تحديث حالة قراءة الإشعار
app.put('/api/notifications/:notifId/read', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
        
        const notification = user.notifications.find(n => n.id === req.params.notifId);
        if (notification) {
            notification.read = true;
            await user.save();
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification read:', error);
        res.status(500).json({ message: error.message });
    }
});

// حذف إشعار (اختياري)
app.delete('/api/notifications/:notifId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
        
        user.notifications = user.notifications.filter(n => n.id !== req.params.notifId);
        await user.save();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: error.message });
    }
});

// تحديث جميع الإشعارات كمقروءة
app.put('/api/notifications/read-all', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
        
        user.notifications.forEach(n => n.read = true);
        await user.save();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications read:', error);
        res.status(500).json({ message: error.message });
    }
});
// ==================== Certificate Generation ====================
const QRCode = require('qrcode');

        // إنشاء شهادة وإعادة التوجيه إلى صفحة العرض
app.get('/api/certificate/:courseId', auth, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;
        
        console.log('📝 Generating certificate for course:', courseId);
        
        // جلب بيانات الدورة
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }
        
        // جلب تقدم المستخدم
        const progress = await UserProgress.findOne({ userId, courseId });
        const completedLessons = progress?.completedLessons?.length || 0;
        const totalLessons = course.totalLessons;
        
        if (completedLessons < totalLessons) {
            return res.status(403).json({ 
                message: 'يجب إكمال جميع الدروس أولاً للحصول على الشهادة',
                progress: `${completedLessons}/${totalLessons}`
            });
        }
        
        // التحقق من اجتياز الاختبار النهائي
        const finalQuiz = await Quiz.findOne({ courseId, quizType: 'final' });
        let finalScore = null;
        if (finalQuiz) {
            const quizResult = await QuizResult.findOne({ userId, quizId: finalQuiz._id });
            finalScore = quizResult?.percentage || 0;
            if (finalScore < 60) {
                return res.status(403).json({ 
                    message: 'يجب اجتياز الاختبار النهائي بنسبة 60% على الأقل',
                    score: finalScore
                });
            }
        }
        
        // التحقق من وجود شهادة سابقة
        let certificate = await Certificate.findOne({ userId, courseId });
        let certificateId;
        
        if (certificate) {
            certificateId = certificate.certificateId;
            console.log('✅ Using existing certificate:', certificateId);
        } else {
            certificateId = `ENGO-${Date.now()}-${userId.toString().slice(-6)}`;
            console.log('📝 Creating new certificate:', certificateId);
            
            certificate = new Certificate({
                certificateId: certificateId,
                userId: userId,
                courseId: courseId,
                userName: req.user.fullName,
                courseTitle: course.title,
                courseLevel: course.level === 'beginner' ? 'المستوى المبتدئ' : 'المستوى المتقدم',
                issueDate: new Date(),
                finalScore: finalScore || 0,
                totalLessons: totalLessons
            });
            
            await certificate.save();
            console.log('✅ Certificate saved to database');
        }
        
        // ✅ إرجاع certificateId بدلاً من إعادة التوجيه
        res.json({ 
            success: true, 
            certificateId: certificateId,
            message: 'تم إنشاء الشهادة بنجاح'
        });
        
    } catch (error) {
        console.error('❌ Certificate Error:', error);
        res.status(500).json({ message: error.message });
    }
});


// API لجلب بيانات الشهادة
app.get('/api/certificate-data/:certId', async (req, res) => {
    try {
        const { certId } = req.params;
        
        console.log('🔍 Searching for certificate:', certId);
        
        const certificate = await Certificate.findOne({ certificateId: certId });
        
        if (!certificate) {
            return res.json({ 
                valid: false, 
                message: 'لم يتم العثور على هذه الشهادة' 
            });
        }
        
        const verifyUrl = `https://engo.koyeb.app/verify-certificate/${certificate.certificateId}`;
        const QRCode = require('qrcode');
        const qrCode = await QRCode.toDataURL(verifyUrl);
        
        res.json({
            valid: true,
            userName: certificate.userName,
            courseTitle: certificate.courseTitle,
            courseLevel: certificate.courseLevel,
            completionDate: certificate.issueDate.toLocaleDateString('ar-EG'),
            totalLessons: certificate.totalLessons || 'جميع الدروس',
            finalScore: certificate.finalScore ? certificate.finalScore + '%' : 'اجتاز',
            certificateId: certificate.certificateId,
            qrCode: qrCode
        });
        
    } catch (error) {
        console.error('Certificate data error:', error);
        res.json({ valid: false, message: error.message });
    }
});

// ==================== إدارة الإشعارات (Admin) ====================

// إرسال إشعار
app.post('/api/admin/notifications/send', auth, adminAuth, async (req, res) => {
    try {
        const { target, specificUserId, type, title, message, link, expiry, image } = req.body;
        
        let targetUsers = [];
        
        // تحديد المستخدمين المستهدفين
        switch(target) {
    case 'all':
        targetUsers = await User.find({ role: 'user' }).select('_id');
        break;
    case 'specific':
        if (specificUserId) {
            targetUsers = [{ _id: specificUserId }];
        }
        break;
    case 'beginner':
        targetUsers = await User.find({ level: 'beginner', role: 'user' }).select('_id');
        break;
    case 'advanced':
        targetUsers = await User.find({ level: 'advanced', role: 'user' }).select('_id');
        break;
        }
        
        // إنشاء الإشعار
        const notification = {
            id: Date.now().toString(),
            title: title,
            message: message,
            type: type,
            link: link || '/',
            image: image || null,
            expiry: expiry || null,
            read: false,
            createdAt: new Date()
        };
        
        // إرسال الإشعار لكل مستخدم
        let sentCount = 0;
        for (const user of targetUsers) {
            await addNotification(user._id, notification);
            sentCount++;
        }
        
        // تسجيل الإشعار في سجل الأدمن
        const adminLog = {
            target: target,
            targetCount: sentCount,
            type: type,
            title: title,
            message: message,
            sentBy: req.user.name,
            sentAt: new Date(),
            link: link
        };
        
        // حفظ السجل (يمكن تخزينه في قاعدة بيانات منفصلة)
        // هنا نستخدم مؤقتاً متغير في الذاكرة
        if (!global.notificationsHistory) global.notificationsHistory = [];
        global.notificationsHistory.unshift(adminLog);
        if (global.notificationsHistory.length > 50) global.notificationsHistory = global.notificationsHistory.slice(0, 50);
        
        res.json({ 
            success: true, 
            message: `تم إرسال الإشعار إلى ${sentCount} مستخدم`,
            sentCount: sentCount
        });
        
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: error.message });
    }
});

// جلب سجل الإشعارات
app.get('/api/admin/notifications/history', auth, adminAuth, (req, res) => {
    try {
        const history = global.notificationsHistory || [];
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// ==================== Admin Routes ====================
app.get('/api/admin/courses', auth, adminAuth, async (req, res) => {
    try {
        const courses = await Course.find().populate('lessons');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/admin/courses', auth, adminAuth, async (req, res) => {
    try {
        console.log('📝 Received course data:', req.body);
        
        const { title, description, level, price, isPremium, freeLessons } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({ 
                message: '⚠️ العنوان والوصف مطلوبان'
            });
        }
        
        const course = new Course({
            title: title.trim(),
            description: description.trim(),
            level: level || 'beginner',
            price: price || 0,
            isPremium: isPremium || false,
            freeLessons: freeLessons || 5,
            createdAt: new Date()
        });
        
        await course.save();
        console.log('✅ Course saved:', course._id);
        
        res.status(201).json({ 
            message: '✅ تم إضافة الدورة بنجاح', 
            course 
        });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            message: 'خطأ: ' + error.message 
        });
    }
});

app.delete('/api/admin/courses/:courseId', auth, adminAuth, async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.courseId);
        res.json({ message: '✅ تم حذف الدورة' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/admin/courses/:courseId/lessons', auth, adminAuth, async (req, res) => {
    try {
        const lessons = await Lesson.find({ courseId: req.params.courseId }).sort({ lessonNumber: 1 });
        res.json(lessons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/admin/lessons', auth, adminAuth, async (req, res) => {
    try {
        const lesson = new Lesson(req.body);
        await lesson.save();
        await Course.findByIdAndUpdate(lesson.courseId, { $push: { lessons: lesson._id }, $inc: { totalLessons: 1 } });
        res.json({ message: '✅ تم إضافة الدرس', lesson });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/admin/lessons/:lessonId', auth, adminAuth, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId);
        await Course.findByIdAndUpdate(lesson.courseId, { $pull: { lessons: lesson._id }, $inc: { totalLessons: -1 } });
        await Lesson.findByIdAndDelete(req.params.lessonId);
        res.json({ message: '✅ تم حذف الدرس' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// جلب جميع المستخدمين (للوحة الأدمن) - بدون إظهار البريد
app.get('/api/admin/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password -email'); // ✅ إخفاء البريد
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/ai-assistant.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'ai-assistant.html'));
});

// ==================== Privacy Policy Page ====================
app.get('/privacy-policy', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
            <title>سياسة الخصوصية - EnGo</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Cairo', sans-serif;
                    background: #f7fafc;
                    color: #2d3748;
                    line-height: 1.6;
                }
                .navbar {
                    background: white;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 1rem 0;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }
                .navbar .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .logo {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #667eea;
                }
                .btn-back {
                    background: #e2e8f0;
                    color: #4a5568;
                    padding: 8px 20px;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                }
                .container {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 2rem 20px;
                }
                .privacy-card {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    margin-bottom: 2rem;
                }
                h1 {
                    color: #667eea;
                    margin-bottom: 1rem;
                    font-size: 1.8rem;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 0.5rem;
                }
                h2 {
                    color: #764ba2;
                    margin: 1.5rem 0 1rem 0;
                    font-size: 1.3rem;
                }
                h3 {
                    color: #4a5568;
                    margin: 1rem 0 0.5rem 0;
                    font-size: 1.1rem;
                }
                p {
                    margin-bottom: 1rem;
                    color: #4a5568;
                }
                ul {
                    margin: 0.5rem 0 1rem 1.5rem;
                    padding-right: 1rem;
                }
                li {
                    margin-bottom: 0.5rem;
                    color: #4a5568;
                }
                .last-updated {
                    background: #f7fafc;
                    padding: 0.75rem;
                    border-radius: 10px;
                    text-align: center;
                    color: #718096;
                    font-size: 0.85rem;
                    margin-top: 1rem;
                }
                .footer {
                    text-align: center;
                    padding: 1.5rem;
                    background: #2d3748;
                    color: white;
                    margin-top: 2rem;
                }
                @media (max-width: 768px) {
                    .privacy-card { padding: 1.2rem; }
                    h1 { font-size: 1.4rem; }
                    h2 { font-size: 1.1rem; }
                }
            </style>
        </head>
        <body>
            <nav class="navbar">
                <div class="container">
                    <div class="logo"><i class="fas fa-language"></i> EnGo</div>
                    <button class="btn-back" onclick="window.location.href='/'">← العودة للرئيسية</button>
                </div>
            </nav>

            <div class="container">
                <div class="privacy-card">
                    <h1>🔒 سياسة الخصوصية</h1>
                    <p>نحن في <strong>EnGo</strong> نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام منصتنا.</p>

                    <div class="last-updated">
                        📅 آخر تحديث: 1 أبريل 2026
                    </div>

                    <h2>📋 المعلومات التي نجمعها</h2>
                    <p>عند استخدام منصة EnGo، قد نقوم بجمع المعلومات التالية:</p>
                    <ul>
                        <li><strong>معلومات الحساب:</strong> اسم المستخدم، الاسم الكامل، البريد الإلكتروني، كلمة المرور المشفرة.</li>
                        <li><strong>بيانات التعلم:</strong> الدروس المكتملة، نتائج الاختبارات، التقدم في الدورات، الشهادات المحصل عليها.</li>
                        <li><strong>بيانات التفاعل:</strong> الرسائل في غرف الدردشة، التعليقات، المشاركات.</li>
                        <li><strong>بيانات تقنية:</strong> عنوان IP، نوع المتصفح، نظام التشغيل، مدة الجلسة.</li>
                    </ul>

                    <h2>🎯 كيف نستخدم معلوماتك</h2>
                    <ul>
                        <li>تقديم وتحسين خدمات التعلم في المنصة.</li>
                        <li>تخصيص تجربة التعلم حسب مستواك وتقدمك.</li>
                        <li>إصدار الشهادات وإثبات الإنجازات.</li>
                        <li>تحسين أداء المنصة وحل المشكلات التقنية.</li>
                        <li>إرسال إشعارات مهمة حول دوراتك واختباراتك.</li>
                    </ul>

                    <h2>🔐 حماية البيانات</h2>
                    <p>نتخذ إجراءات أمنية متقدمة لحماية بياناتك:</p>
                    <ul>
                        <li>تشفير كلمات المرور باستخدام bcrypt.</li>
                        <li>استخدام بروتوكول HTTPS لنقل البيانات بشكل آمن.</li>
                        <li>تقييد الوصول إلى البيانات الشخصية.</li>
                        <li>مراقبة منتظمة للأنظمة لاكتشاف الثغرات.</li>
                    </ul>

                    <h2>📤 مشاركة البيانات</h2>
                    <p>نحن لا نبيع أو نؤجر بياناتك الشخصية لأطراف ثالثة. قد نشارك بياناتك في الحالات التالية فقط:</p>
                    <ul>
                        <li>بموافقتك الصريحة.</li>
                        <li>للأغراض القانونية أو لحماية حقوقنا.</li>
                        <li>مع مقدمي الخدمات الذين يعملون نيابة عنا (مثل استضافة الخادم).</li>
                    </ul>

                    <h2>🍪 ملفات تعريف الارتباط (Cookies)</h2>
                    <p>نستخدم ملفات تعريف الارتباط لتحسين تجربتك:</p>
                    <ul>
                        <li>تذكر تفضيلاتك وإعداداتك.</li>
                        <li>تحليل أداء المنصة وتحسينه.</li>
                        <li>الحفاظ على حالة تسجيل الدخول الخاصة بك.</li>
                    </ul>
                    <p>يمكنك تعطيل ملفات تعريف الارتباط من إعدادات المتصفح، لكن قد يؤثر ذلك على بعض وظائف المنصة.</p>

                    <h2>👦 خصوصية الأطفال</h2>
                    <p>منصة EnGo غير موجهة للأطفال دون سن 13 عاماً. إذا كان عمرك أقل من 13 عاماً، لا يجوز لك استخدام المنصة دون موافقة ولي الأمر.</p>

                    <h2>📧 التواصل معنا</h2>
                    <p>إذا كان لديك أي استفسار حول سياسة الخصوصية، يمكنك التواصل معنا عبر:</p>
                    <ul>
                        <li><i class="fas fa-envelope"></i> البريد الإلكتروني: engolearningsupport@gmail.com</li>
                        <li><i class="fab fa-whatsapp"></i> واتساب: 737373627</li>
                        <li><i class="fas fa-phone"></i> الهاتف: 773041464</li>
                    </ul>

                    <h2>🔄 التغييرات على سياسة الخصوصية</h2>
                    <p>قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم إعلامك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.</p>

                    <div class="last-updated">
                        باستخدامك لمنصة EnGo، فإنك توافق على هذه السياسة.
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>&copy; 2026 EnGo - جميع الحقوق محفوظة</p>
            </div>
        </body>
        </html>
    `);
});
// ==================== Quiz Routes (متكاملة) ====================

// جلب اختبارات الدورة (نصفي ونهائي)
app.get('/api/courses/:courseId/quizzes', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
        
        const userProgress = await UserProgress.findOne({ 
            userId: req.user._id, 
            courseId: course._id 
        });
        
        const completedLessons = userProgress?.completedLessons?.length || 0;
        
        const midterm = await Quiz.findOne({ 
            courseId: course._id, 
            quizType: 'midterm',
            isActive: true 
        });
        
        const final = await Quiz.findOne({ 
            courseId: course._id, 
            quizType: 'final',
            isActive: true 
        });
        
        const midtermUnlocked = completedLessons >= 15;
        const finalUnlocked = completedLessons >= course.totalLessons;
        
        const midtermResult = midterm ? await QuizResult.findOne({ 
            userId: req.user._id, 
            quizId: midterm._id 
        }) : null;
        
        const finalResult = final ? await QuizResult.findOne({ 
            userId: req.user._id, 
            quizId: final._id 
        }) : null;
        
        res.json({
            midterm: midterm ? {
                id: midterm._id,
                name: midterm.name,
                description: midterm.description,
                duration: midterm.duration,
                passingScore: midterm.passingScore,
                totalPoints: midterm.totalPoints,
                questionsCount: midterm.questions.length,
                unlocked: midtermUnlocked,
                completed: !!midtermResult,
                score: midtermResult?.percentage || null,
                passed: midtermResult?.passed || false
            } : null,
            final: final ? {
                id: final._id,
                name: final.name,
                description: final.description,
                duration: final.duration,
                passingScore: final.passingScore,
                totalPoints: final.totalPoints,
                questionsCount: final.questions.length,
                unlocked: finalUnlocked,
                completed: !!finalResult,
                score: finalResult?.percentage || null,
                passed: finalResult?.passed || false
            } : null,
            progress: {
                completedLessons,
                totalLessons: course.totalLessons,
                remainingForMidterm: Math.max(0, 15 - completedLessons),
                remainingForFinal: Math.max(0, course.totalLessons - completedLessons)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// جلب أسئلة اختبار الدورة
app.get('/api/courses/:courseId/quizzes/:quizType/questions', auth, async (req, res) => {
    try {
        const { courseId, quizType } = req.params;
        
        if (!['midterm', 'final'].includes(quizType)) {
            return res.status(400).json({ message: 'نوع اختبار غير صحيح' });
        }
        
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
        
        const userProgress = await UserProgress.findOne({ 
            userId: req.user._id, 
            courseId: course._id 
        });
        
        const completedLessons = userProgress?.completedLessons?.length || 0;
        
        if (quizType === 'midterm' && completedLessons < 15) {
            return res.status(403).json({ 
                message: `الاختبار النصفي متاح بعد إكمال 15 درساً. لديك ${completedLessons} دروس مكتملة` 
            });
        }
        
        if (quizType === 'final' && completedLessons < course.totalLessons) {
            return res.status(403).json({ 
                message: `الاختبار النهائي متاح بعد إكمال جميع الدروس (${course.totalLessons} درساً)` 
            });
        }
        
        const quiz = await Quiz.findOne({ courseId: course._id, quizType, isActive: true });
        if (!quiz) {
            return res.status(404).json({ message: 'الاختبار غير متوفر حالياً' });
        }
        
        const existingResult = await QuizResult.findOne({ 
            userId: req.user._id, 
            quizId: quiz._id 
        });
        
        if (existingResult) {
            return res.status(403).json({ 
                message: 'لقد قمت بالفعل بإجراء هذا الاختبار',
                result: {
                    score: existingResult.percentage,
                    passed: existingResult.passed,
                    completedAt: existingResult.completedAt
                }
            });
        }
        
        const safeQuestions = quiz.questions.map(q => ({
            id: q.id,
            type: q.type,
            title: q.title,
            points: q.points,
            question: q.question,
            options: q.options,
            statement: q.statement,
            word: q.word,
            wordOptions: q.wordOptions,
            matchingPairs: q.matchingPairs,
            text: q.text,
            blanks: q.blanks,
            essayTopic: q.essayTopic,
            essayGuidelines: q.essayGuidelines
        }));
        
        res.json({
            id: quiz._id,
            name: quiz.name,
            description: quiz.description,
            duration: quiz.duration,
            passingScore: quiz.passingScore,
            totalPoints: quiz.totalPoints,
            questions: safeQuestions
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// تقديم الاختبار
app.post('/api/quizzes/:quizId/submit', auth, async (req, res) => {
    try {
        const { answers, timeSpent } = req.body;
        const quiz = await Quiz.findById(req.params.quizId);
        
        if (!quiz) return res.status(404).json({ message: 'الاختبار غير موجود' });
        
        const existingResult = await QuizResult.findOne({ 
            userId: req.user._id, 
            quizId: quiz._id 
        });
        
        if (existingResult) {
            return res.status(403).json({ message: 'لقد قمت بالفعل بإجراء هذا الاختبار' });
        }
        
        let totalScore = 0;
        let maxScore = 0;
        const results = [];
        
        quiz.questions.forEach(question => {
            const points = question.points || 10;
            maxScore += points;
            const userAnswer = answers[question.id];
            let isCorrect = false;
            let pointsEarned = 0;
            
            switch(question.type) {
                case 'multiple_choice':
                    isCorrect = userAnswer === question.correctOption;
                    break;
                case 'true_false':
                    isCorrect = userAnswer === question.isTrue;
                    break;
                case 'fill_blank':
                    if (question.correctAnswers) {
                        const userAns = String(userAnswer).toLowerCase().trim();
                        isCorrect = question.correctAnswers.some(a => 
                            String(a).toLowerCase().trim() === userAns
                        );
                    }
                    break;
                case 'word_match':
                    isCorrect = userAnswer?.toLowerCase().trim() === question.correctMeaning?.toLowerCase().trim();
                    break;
                case 'matching':
                    if (question.matchingPairs) {
                        const userSorted = JSON.stringify(userAnswer?.sort());
                        const correctSorted = JSON.stringify(question.matchingPairs.map((p, i) => i).sort());
                        isCorrect = userSorted === correctSorted;
                    }
                    break;
                case 'essay':
                    if (question.essayKeywords && userAnswer) {
                        let matched = 0;
                        question.essayKeywords.forEach(keyword => {
                            if (String(userAnswer).toLowerCase().includes(keyword.toLowerCase())) matched++;
                        });
                        pointsEarned = Math.floor((matched / question.essayKeywords.length) * points);
                        isCorrect = pointsEarned > points / 2;
                    }
                    break;
            }
            
            if (isCorrect && pointsEarned === 0) {
                pointsEarned = points;
            }
            
            totalScore += pointsEarned;
            results.push({
                questionId: question.id,
                userAnswer: userAnswer,
                isCorrect,
                pointsEarned
            });
        });
        
        const percentage = (totalScore / maxScore) * 100;
        const passed = percentage >= quiz.passingScore;
        
        const quizResult = new QuizResult({
            userId: req.user._id,
            quizId: quiz._id,
            score: totalScore,
            percentage,
            passed,
            answers: results,
            timeSpent
        });
        
        await quizResult.save();
        
        if (quiz.quizType === 'midterm') {
            await UserProgress.findOneAndUpdate(
                { userId: req.user._id, courseId: quiz.courseId },
                { midtermScore: percentage },
                { upsert: true }
            );
        } else if (quiz.quizType === 'final') {
            await UserProgress.findOneAndUpdate(
                { userId: req.user._id, courseId: quiz.courseId },
                { finalScore: percentage },
                { upsert: true }
            );
        } else if (quiz.quizType === 'level_test') {
            await User.findByIdAndUpdate(req.user._id, { 
                level: quiz.level, 
                levelScore: percentage 
            });
        }
        
        res.json({
            success: true,
            score: totalScore,
            maxScore,
            percentage: Math.round(percentage),
            passed,
            passingScore: quiz.passingScore,
            message: passed ? '🎉 تهانينا! لقد اجتزت الاختبار' : '📚 للأسف لم تجتز الاختبار، حاول مرة أخرى'
        });
        
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ message: error.message });
    }
});
// ==================== User Stats ====================
app.get('/api/user/stats', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // جلب عدد الدروس المكتملة
        const userProgress = await UserProgress.find({ userId });
        let totalLessonsCompleted = 0;
        let totalCoursesCompleted = 0;
        const coursesCompleted = new Set();
        
        for (const progress of userProgress) {
            totalLessonsCompleted += progress.completedLessons?.length || 0;
            if (progress.completedLessons?.length === progress.totalLessons) {
                coursesCompleted.add(progress.courseId.toString());
            }
        }
        totalCoursesCompleted = coursesCompleted.size;
        
        // نظام النقاط والمستويات
        const xpPerLesson = 100;
        const xpForNextLevel = 1000;
        const totalXP = totalLessonsCompleted * xpPerLesson;
        const level = Math.floor(totalXP / xpForNextLevel) + 1;
        const levelProgress = totalXP % xpForNextLevel;
        
        // الشارات
        const badges = [];
        if (totalLessonsCompleted >= 5) {
            badges.push({ name: 'بداية رائعة', description: 'أكملت 5 دروس', icon: 'fa-star', earnedAt: new Date() });
        }
        if (totalLessonsCompleted >= 20) {
            badges.push({ name: 'متعلم نشط', description: 'أكملت 20 درس', icon: 'fa-fire', earnedAt: new Date() });
        }
        if (totalCoursesCompleted >= 1) {
            badges.push({ name: 'أول دورة', description: 'أكملت أول دورة', icon: 'fa-trophy', earnedAt: new Date() });
        }
        
        res.json({
            points: {
                totalXP: totalXP,
                level: level,
                levelProgress: levelProgress
            },
            nextLevel: {
                level: level + 1,
                needed: xpForNextLevel
            },
            badges: badges,
            totalLessonsCompleted: totalLessonsCompleted,
            totalCoursesCompleted: totalCoursesCompleted
        });
        
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==================== Level Test Routes ====================
app.get('/api/level-tests', async (req, res) => {
    try {
        const tests = await Quiz.find({ quizType: 'level_test', isActive: true }).select('-questions');
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// ==================== Level Test Routes ====================
// جلب اختبار تحديد المستوى (للصفحة الرئيسية)
app.get('/api/level-test', async (req, res) => {
    try {
        // جلب أول اختبار مستوى نشط
        const test = await Quiz.findOne({ 
            quizType: 'level_test', 
            isActive: true 
        }).select('-questions.correctAnswer -questions.correctOption -questions.isTrue -questions.correctAnswers');
        
        if (!test) {
            return res.status(404).json({ message: 'لا توجد اختبارات مستوى متاحة حالياً' });
        }
        
        // تنسيق الأسئلة للعرض (إخفاء الإجابات الصحيحة)
        const safeQuestions = test.questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            type: q.type
        }));
        
        res.json({
            _id: test._id,
            name: test.name,
            description: test.description,
            duration: test.duration,
            questions: safeQuestions,
            totalQuestions: test.questions.length
        });
        
    } catch (error) {
        console.error('Error fetching level test:', error);
        res.status(500).json({ message: error.message });
    }
});

// تقديم اختبار تحديد المستوى
app.post('/api/level-tests/:testId/submit', auth, async (req, res) => {
    try {
        const { answers, timeSpent, startedAt } = req.body;
        const test = await Quiz.findById(req.params.testId);
        
        if (!test) return res.status(404).json({ message: 'الاختبار غير موجود' });
        
        let totalScore = 0;
        let maxScore = 0;
        const results = [];
        
        for (const question of test.questions) {
            const points = question.points || 10;
            maxScore += points;
            const userAnswer = answers[question.id];
            let isCorrect = false;
            let pointsEarned = 0;
            
            switch(question.type) {
                case 'multiple_choice':
                    isCorrect = userAnswer == question.correctOption;
                    break;
                case 'true_false':
                    isCorrect = userAnswer === true || userAnswer === 'true' ? 
                        (question.isTrue === true) : (question.isTrue === false);
                    break;
                case 'fill_blank':
                    if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
                        const userAns = String(userAnswer).toLowerCase().trim();
                        isCorrect = question.correctAnswers.some(a => 
                            String(a).toLowerCase().trim() === userAns
                        );
                    } else if (question.correctAnswer) {
                        isCorrect = String(userAnswer).toLowerCase().trim() === 
                                   String(question.correctAnswer).toLowerCase().trim();
                    }
                    break;
                case 'essay':
                    if (question.essayKeywords && userAnswer) {
                        let matched = 0;
                        question.essayKeywords.forEach(keyword => {
                            if (String(userAnswer).toLowerCase().includes(keyword.toLowerCase())) {
                                matched++;
                            }
                        });
                        pointsEarned = Math.floor((matched / question.essayKeywords.length) * points);
                        isCorrect = pointsEarned > points / 2;
                    }
                    break;
                case 'audio':
                case 'image':
                    isCorrect = String(userAnswer).toLowerCase().trim() === 
                               String(question.correctAnswer).toLowerCase().trim();
                    break;
                case 'matching':
                    if (question.correctAnswer) {
                        isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
                    }
                    break;
                default:
                    isCorrect = false;
            }
            
            if (isCorrect && pointsEarned === 0) {
                pointsEarned = points;
            }
            
            totalScore += pointsEarned;
            results.push({
                questionId: question.id,
                userAnswer: userAnswer,
                isCorrect: isCorrect,
                pointsEarned: pointsEarned
            });
        }
        
        const percentage = (totalScore / maxScore) * 100;
        const passed = percentage >= test.passingScore;
        
        // حفظ النتيجة - استخدم النموذج الموجود
const quizResult = new QuizResult({
    userId: req.user._id,
    quizId: test._id,
    score: totalScore,
    percentage: percentage,
    passed: passed,
    answers: results,
    timeSpent: timeSpent,
    startedAt: new Date(startedAt),
    completedAt: new Date(),
    ipAddress: req.ip,
    deviceInfo: req.headers['user-agent']
});
        
        await quizResult.save();
        
        // تحديث مستوى المستخدم
        if (passed) {
            await User.findByIdAndUpdate(req.user._id, { 
                level: test.level, 
                levelScore: percentage 
            });
            
            // تحديث localStorage للمستخدم
            const user = await User.findById(req.user._id);
            // الإشعار سيرسل عبر Socket.io
        }
        
        res.json({
            success: true,
            score: totalScore,
            maxScore: maxScore,
            percentage: Math.round(percentage),
            passed: passed,
            passingScore: test.passingScore,
            message: passed ? 
                '🎉 تهانينا! لقد اجتزت الاختبار بنجاح' : 
                '📚 للأسف لم تجتز الاختبار، حاول مرة أخرى بعد المراجعة'
        });
        
    } catch (error) {
        console.error('Error submitting test:', error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/level-tests/:testId', auth, async (req, res) => {
    try {
        const test = await Quiz.findOne({ _id: req.params.testId, quizType: 'level_test' });
        if (!test) return res.status(404).json({ message: 'الاختبار غير موجود' });
        
        const safeQuestions = test.questions.map(q => ({
            id: q.id,
            type: q.type,
            title: q.title,
            points: q.points,
            question: q.question,
            options: q.options,
            statement: q.statement,
            word: q.word,
            wordOptions: q.wordOptions,
            matchingPairs: q.matchingPairs,
            text: q.text,
            blanks: q.blanks,
            essayTopic: q.essayTopic,
            essayGuidelines: q.essayGuidelines
        }));
        
        res.json({ ...test.toObject(), questions: safeQuestions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== Admin Quiz Management ====================
app.get('/api/admin/quizzes', auth, adminAuth, async (req, res) => {
    try {
        const quizzes = await Quiz.find().sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/admin/quizzes/:quizId', auth, adminAuth, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) return res.status(404).json({ message: 'الاختبار غير موجود' });
        res.json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/admin/quizzes', auth, adminAuth, async (req, res) => {
    try {
        const quiz = new Quiz(req.body);
        let totalPoints = 0;
        quiz.questions.forEach(q => totalPoints += q.points || 10);
        quiz.totalPoints = totalPoints;
        await quiz.save();
        res.json({ message: '✅ تم إنشاء الاختبار بنجاح', quiz });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/admin/quizzes/:quizId', auth, adminAuth, async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(
            req.params.quizId,
            req.body,
            { new: true }
        );
        res.json({ message: '✅ تم تحديث الاختبار', quiz });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/admin/quizzes/:quizId', auth, adminAuth, async (req, res) => {
    try {
        await Quiz.findByIdAndDelete(req.params.quizId);
        await QuizResult.deleteMany({ quizId: req.params.quizId });
        res.json({ message: '✅ تم حذف الاختبار' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== Lesson Routes ====================
app.get('/api/lessons/:lessonId', auth, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId);
        if (!lesson) return res.status(404).json({ message: 'الدرس غير موجود' });
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== Notifications ====================
app.get('/api/notifications', auth, async (req, res) => {
    try {
        res.json(req.user.notifications || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/notifications/:notifId/read', auth, async (req, res) => {
    try {
        const notif = req.user.notifications?.find(n => n.id === req.params.notifId);
        if (notif) notif.read = true;
        await req.user.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== User Progress ====================
app.post('/api/progress/:courseId/lessons/:lessonId/complete', auth, async (req, res) => {
    try {
        const { score } = req.body;
        let progress = await UserProgress.findOne({ userId: req.user._id, courseId: req.params.courseId });
        if (!progress) {
            progress = new UserProgress({ userId: req.user._id, courseId: req.params.courseId, completedLessons: [] });
        }
        const exists = progress.completedLessons.some(l => l.lessonId.toString() === req.params.lessonId);
        if (!exists) {
            progress.completedLessons.push({ lessonId: req.params.lessonId, score: score || 100 });
            await progress.save();
        }
        res.json({ message: '✅ تم إكمال الدرس', progress });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/progress/:courseId', auth, async (req, res) => {
    try {
        const progress = await UserProgress.findOne({ userId: req.user._id, courseId: req.params.courseId });
        res.json(progress || { completedLessons: [], midtermScore: null, finalScore: null });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

        // ==================== AI Chatbot Routes ====================

// بدء محادثة جديدة مع AI
app.post('/api/ai/chat/start', auth, async (req, res) => {
    try {
        const conversation = new AIConversation({
            userId: req.user._id,
            messages: [{
                role: 'assistant',
                content: 'مرحباً! أنا EnGo AI، مساعدك الذكي لتعلم اللغة الإنجليزية. كيف يمكنني مساعدتك اليوم؟',
                timestamp: new Date()
            }]
        });
        
        await conversation.save();
        
        res.json({
            success: true,
            conversationId: conversation._id,
            message: 'مرحباً! أنا EnGo AI، مساعدك الذكي لتعلم اللغة الإنجليزية. كيف يمكنني مساعدتك اليوم؟'
        });
        
    } catch (error) {
        console.error('Error starting AI chat:', error);
        res.status(500).json({ message: error.message });
    }
});

// إرسال رسالة إلى AI
app.post('/api/ai/chat/:conversationId/message', auth, async (req, res) => {
    try {
        const { message } = req.body;
        const conversation = await AIConversation.findOne({
            _id: req.params.conversationId,
            userId: req.user._id
        });
        
        if (!conversation) {
            return res.status(404).json({ message: 'المحادثة غير موجودة' });
        }
        
        // إضافة رسالة المستخدم
        conversation.messages.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });
        
        // توليد رد ذكي (بدون API خارجي)
        const aiResponse = generateAIResponse(message, req.user.name);
        
        // إضافة رد AI
        conversation.messages.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
        });
        
        conversation.updatedAt = new Date();
        await conversation.save();
        
        res.json({
            success: true,
            message: aiResponse
        });
        
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// جلب جميع محادثات AI للمستخدم
app.get('/api/ai/conversations', auth, async (req, res) => {
    try {
        const conversations = await AIConversation.find({ userId: req.user._id })
            .sort({ updatedAt: -1 })
            .select('_id updatedAt messages');
        
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// جلب محادثة AI محددة
app.get('/api/ai/conversations/:conversationId', auth, async (req, res) => {
    try {
        const conversation = await AIConversation.findOne({
            _id: req.params.conversationId,
            userId: req.user._id
        });
        
        if (!conversation) {
            return res.status(404).json({ message: 'المحادثة غير موجودة' });
        }
        
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// دالة توليد ردود ذكية
function generateAIResponse(message, userName) {
    const msg = message.toLowerCase();
    
    // ردود الترحيب
    if (msg.includes('مرحب') || msg.includes('السلام') || msg.includes('hi') || msg.includes('hello')) {
        return `👋 وعليكم السلام ورحمة الله ${userName || 'صديقي'}! أنا سعيد بمساعدتك. كيف يمكنني مساعدتك في تعلم اللغة الإنجليزية اليوم؟ 📚`;
    }
    
    // شرح القواعد
    if (msg.includes('قاعدة') || msg.includes('grammar')) {
        if (msg.includes('present simple') || msg.includes('مضارع بسيط')) {
            return `📖 **قاعدة Present Simple (المضارع البسيط):**
            
✅ نستخدمه لوصف:
• حقائق عامة: The sun rises in the east
• عادات روتينية: I wake up at 7 AM
• مشاعر وأفكار: I like coffee

🔹 التكوين:
• I/You/We/They + الفعل الأساسي
• He/She/It + الفعل+s/es

📝 أمثلة:
• I play football every Friday
• She plays tennis on weekends

هل تريد تدريبات على هذه القاعدة؟`;
        }
        
        return `📚 بالتأكيد! القواعد مهمة جداً في اللغة الإنجليزية.
        
يمكنني مساعدتك في شرح:
• Present Simple (المضارع البسيط)
• Past Simple (الماضي البسيط)
• Future Tense (المستقبل)
• Comparative & Superlative (المقارنة والتفضيل)

أي قاعدة تريد أن أشرحها لك؟`;
    }
    
    // معنى كلمة
    if (msg.includes('معنى') || msg.includes('كلمة')) {
        return `📖 **شرح الكلمة:**

الكلمة التي تسأل عنها تعني حسب السياق. هل يمكنك كتابة الكلمة بشكل أوضح؟

💡 **نصيحة:** استخدم القاموس المدمج في المنصة للحصول على معاني دقيقة مع أمثلة!`;
    }
    
    // تحسين النطق
    if (msg.includes('نطق') || msg.includes('pronunciation')) {
        return `🗣️ **نصائح لتحسين النطق:**

1️⃣ **استمع ثم كرر** - استمع للمتحدثين الأصليين وكرر ما يقولونه
2️⃣ **سجل صوتك** - سجل نفسك وقارن بالنطق الصحيح
3️⃣ **تعلم الأصوات الصعبة** - ركز على الأصوات مثل 'th' و 'r'
4️⃣ **استخدم تطبيقات النطق** - مثل YouGlish

💡 **نصيحة ذهبية:** النطق يحتاج إلى ممارسة يومية لمدة 10-15 دقيقة فقط!`;
    }
    
    // اختبارات
    if (msg.includes('اختبار') || msg.includes('exam') || msg.includes('test')) {
        return `📝 **الاستعداد للاختبارات:**

🎯 **نصائح للنجاح:**
1. راجع الدروس أولاً
2. حل الواجبات والتمارين
3. ركز على النقاط التي تجدها صعبة
4. خذ قسطاً كافياً من الراحة قبل الاختبار

📚 **الاختبارات المتوفرة في EnGo:**
• اختبار تحديد المستوى
• اختبارات نصفية
• اختبارات نهائية

هل تريد مساعدة في التحضير لاختبار معين؟`;
    }
    
    // شهادة
    if (msg.includes('شهادة') || msg.includes('certificate')) {
        return `🏆 **شهادات EnGo:**

✅ تحصل على شهادة عند إكمال دورة بنجاح (نسبة 70% فأكثر)
✅ يمكنك مشاركة شهادتك على LinkedIn
✅ الشهادة قابلة للتحقق عبر رابط فريد

استمر في التعلم لتحصل على شهاداتك! 🚀`;
    }
    
    // رد عام
    return `📚 سؤال ممتاز يا ${userName || 'صديقي'}!

أنا هنا لمساعدتك في تعلم اللغة الإنجليزية. يمكنني:

✅ **شرح قواعد اللغة** (اسألني عن أي قاعدة)
✅ **تصحيح جملتك** (أرسل لي الجملة وأصححها)
✅ **شرح معاني الكلمات** (قل لي الكلمة)
✅ **تقديم نصائح للتعلم** (كيف تحسن مستواك)
✅ **مساعدتك للاستعداد للاختبارات**

ما الذي تود أن تتعلمه اليوم؟ 🎓`;
}
    
// ==================== AI Assistant API (مدمج مع تقدم المستخدم) ====================
app.post('/api/ai/chat', auth, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user._id;
        
        if (!message) {
            return res.status(400).json({ success: false, message: 'الرسالة مطلوبة' });
        }
        
        // ========== جلب بيانات تقدم المستخدم ==========
        
        // جلب المستخدم ومستواه
        const user = await User.findById(userId);
        
        // جلب تقدم المستخدم في جميع الدورات
        const userProgress = await UserProgress.find({ userId: userId }).populate('courseId completedLessons.lessonId');
        
        // جلب الدروس المكتملة
        let completedLessons = [];
        let completedLessonsIds = [];
        
        for (const progress of userProgress) {
            for (const lesson of progress.completedLessons) {
                if (lesson.lessonId) {
                    completedLessons.push({
                        id: lesson.lessonId._id,
                        title: lesson.lessonId.title,
                        lessonNumber: lesson.lessonId.lessonNumber,
                        courseTitle: progress.courseId?.title || 'غير معروف',
                        score: lesson.score
                    });
                    completedLessonsIds.push(lesson.lessonId._id.toString());
                }
            }
        }
        
        // جلب الدروس المتاحة (غير مكتملة)
        const allLessons = await Lesson.find({});
        const availableLessons = allLessons.filter(l => !completedLessonsIds.includes(l._id.toString()));
        
        // مستوى المستخدم
        const userLevel = user.level || 'beginner';
        const levelName = userLevel === 'beginner' ? 'مبتدئ' : 'متقدم';
        
        // إحصائيات سريعة
        const stats = {
            totalCompleted: completedLessons.length,
            level: levelName,
            recentLessons: completedLessons.slice(-3).reverse()
        };
        
        console.log(`📊 User Stats: ${stats.totalCompleted} lessons completed, Level: ${stats.level}`);
        
        // ========== بناء التعليمات للنظام ==========
        
        const systemInstruction = `أنت مساعد ذكي اسمك "EnGo AI". أنت متخصص في مساعدة طالب اللغة الإنجليزية.

📋 **معلومات عن المستخدم**:
- المستوى: ${stats.level}
- عدد الدروس المكتملة: ${stats.totalCompleted} درس
- آخر الدروس التي أكملها: ${stats.recentLessons.map(l => l.title).join(', ') || 'لا يوجد'}

🚫 **قواعد صارمة - ممنوع تماماً**:
1. شرح أي قاعدة نحوية أو درس لم يسبق للمستخدم أن أخذه
2. إعطاء معلومات جديدة خارج ما تعلمه المستخدم
3. تقديم أمثلة متقدمة لا تناسب مستوى المستخدم

✅ **مسموح فقط**:
1. الإجابة عن أسئلة حول الدروس التي أخذها المستخدم (المذكورة أعلاه)
2. تقديم نصائح عامة لتحسين التعلم (بدون محتوى تعليمي جديد)
3. تذكير المستخدم بمراجعة الدروس التي أكملها
4. اقتراح مراجعة دروس محددة موجودة في قائمة الدروس المكتملة

⚠️ **إذا سأل المستخدم عن شيء لم يدرسه بعد**:
قل له: "هذا الموضوع لم تدرسه بعد. أكمل دروسك أولاً، ثم سأتمكن من مساعدتك فيه."

⚠️ **إذا طلب شرح قاعدة جديدة**:
قل له: "هذا الدرس سيأتي لاحقاً في المنهج. استمر في تعلم الدروس الحالية أولاً."

📝 **أسلوب الإجابة**:
- كن مختصراً (سطرين كحد أقصى)
- استخدم لغة بسيطة
- ركز على مراجعة ما تعلمه المستخدم فقط`;

        // ========== استخدام Gemini API مع تعليمات مخصصة ==========
        
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            // إذا لم يكن هناك API، استخدم ردود محلية ذكية
            const localReply = getLocalSmartReply(message, stats, completedLessons);
            return res.json({ success: true, reply: localReply });
        }
        
        const MODEL = 'gemini-2.5-flash';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemInstruction}\n\nسؤال المستخدم: ${message}\n\nتذكر: أجيب فقط بناءً على الدروس التي أخذها المستخدم (${stats.totalCompleted} درس مكتمل). لا تشرح أي شيء جديد.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 250,
                    topP: 0.9
                }
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.candidates && data.candidates[0]) {
            let reply = data.candidates[0].content.parts[0].text;
            
            // تأكد من أن الرد قصير
            if (reply.length > 300) {
                reply = reply.substring(0, 300) + "...\n\n📚 راجع دروسك المكتملة للحصول على التفاصيل.";
            }
            
            console.log('✅ AI response sent');
            res.json({ success: true, reply: reply });
        } else {
            console.error('Gemini API Error:', data.error);
            // استخدم الردود المحلية كبديل
            const localReply = getLocalSmartReply(message, stats, completedLessons);
            res.json({ success: true, reply: localReply });
        }
        
    } catch (error) {
        console.error('AI Error:', error);
        const localReply = getLocalSmartReply(req.body.message, { totalCompleted: 0, level: 'مبتدئ' }, []);
        res.json({ success: true, reply: localReply });
    }
});
// ==================== جلب تقدم المستخدم للـ AI ====================
app.get('/api/user/progress-summary', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // جلب المستخدم
        const user = await User.findById(userId);
        
        // جلب التقدم
        const userProgress = await UserProgress.find({ userId: userId }).populate('courseId completedLessons.lessonId');
        
        let completedLessons = [];
        for (const progress of userProgress) {
            for (const lesson of progress.completedLessons) {
                if (lesson.lessonId) {
                    completedLessons.push({
                        id: lesson.lessonId._id,
                        title: lesson.lessonId.title,
                        lessonNumber: lesson.lessonId.lessonNumber,
                        courseTitle: progress.courseId?.title || 'غير معروف',
                        score: lesson.score,
                        completedAt: lesson.completedAt
                    });
                }
            }
        }
        
        res.json({
            success: true,
            stats: {
                level: user.level || 'beginner',
                levelName: user.level === 'beginner' ? 'مبتدئ' : 'متقدم',
                totalLessonsCompleted: completedLessons.length,
                recentLessons: completedLessons.slice(-5).reverse(),
                allLessons: completedLessons
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== ردود ذكية محلية (بدون API) ==========
function getLocalSmartReply(message, stats, completedLessons) {
    const msg = message.toLowerCase();
    const completedTitles = completedLessons.map(l => l.title.toLowerCase());
    
    // التحقق مما إذا كان المستخدم يسأل عن درس أكمله
    for (const lesson of completedLessons) {
        if (msg.includes(lesson.title.toLowerCase())) {
            return `📘 **${lesson.title}**\n\nهذا الدرس موجود في سجل إنجازاتك. حصلت على ${lesson.score || '?'}% فيه.\n\nهل تريد مراجعة الدرس مرة أخرى؟`;
        }
    }
    
    // نصائح عامة حسب المستوى
    if (msg.includes('نصيحة') || msg.includes('tip') || msg.includes('كيف أتعلم')) {
        if (stats.totalCompleted < 5) {
            return "📖 **نصيحة للمبتدئين**: ركز على إكمال الدروس الأولى. خصص 15 دقيقة يومياً للتعلم. استمر ولا تتوقف!";
        } else if (stats.totalCompleted < 15) {
            return "📖 **نصيحة لك**: أنت في منتصف الطريق! راجع الدروس السابقة كل 3 أيام لتثبيت المعلومات.";
        } else {
            return "📖 **نصيحة للمتقدمين**: حاول استخدام ما تعلمته في محادثات يومية. التطبيق العملي هو مفتاح الإتقان!";
        }
    }
    
    // مراجعة عامة
    if (msg.includes('مراجعة') || msg.includes('review')) {
        if (completedLessons.length > 0) {
            const lastLesson = completedLessons[completedLessons.length - 1];
            return `📚 **مراجعة سريعة**\n\nآخر درس أكملته: "${lastLesson.title}"\n\nنقاط مهمة في هذا الدرس:\n• راجع التمارين التي حللتها\n• حاول إعادة حل الواجب\n\nهل تريد مساعدة في مراجعة درس محدد؟`;
        } else {
            return "📚 لم تكمل أي درس بعد. ابدأ بتعلم الدروس الأولى في المنصة!";
        }
    }
    
    // سؤال عن درس غير مكتمل
    if (msg.includes('شرح') || msg.includes('قاعدة') || msg.includes('grammar')) {
        return "📚 **تنبيه**: هذا الدرس لم تدرسه بعد في منصتنا.\n\nأكمل الدروس بالترتيب أولاً، ثم سأتمكن من مساعدتك في مراجعة ما تعلمته.\n\n💡 نصيحة: راجع قائمة الدروس في صفحة الدورات وابدأ من البداية.";
    }
    
    // رد ترحيبي
    if (msg.includes('مرحب') || msg.includes('السلام')) {
        return `👋 وعليكم السلام! أنا EnGo AI.\n\n📊 **تقدمك**:\n• عدد الدروس المكتملة: ${stats.totalCompleted}\n• مستواك: ${stats.level}\n\nاسألني عن:\n• 📖 مراجعة درس معين أخذته\n• 💡 نصائح لتحسين تعلمك\n• 📚 تذكير بدروسك المكتملة`;
    }
    
    // رد عام
    return `📚 **EnGo AI**\n\nلقد أكملت ${stats.totalCompleted} درساً حتى الآن في المستوى ${stats.level}.\n\nاسألني عن:\n• مراجعة درس محدد أخذته\n• نصائح لتحسين تعلمك\n• تقدمك في المنصة\n\nما الذي تريد معرفته عن دروسك؟`;
}

// ==================== Socket.IO ====================
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const onlineUsers = new Map();

io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.userId);
        if (!user) return next(new Error('User not found'));
        socket.user = user;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.user?.name || socket.id);
    onlineUsers.set(socket.user._id.toString(), socket.id);

    socket.on('get_rooms', async (callback) => {
        try {
            const rooms = await Room.find({
                $or: [
                    { isPrivate: false },
                    { members: socket.user._id },
                    { createdBy: socket.user._id }
                ]
            }).sort({ lastActivity: -1 });
            
            const roomList = rooms.map(room => ({
                id: room.roomId,
                name: room.name,
                members: room.members,
                private: room.isPrivate,
                lastMessage: room.messages[room.messages.length - 1]
            }));
            
            if (callback && typeof callback === 'function') {
                callback(roomList);
            } else {
                socket.emit('rooms_list', roomList);
            }
        } catch (error) {
            console.error('Error getting rooms:', error);
            if (callback) callback([]);
        }
    });

    socket.on('create_room', async (data, callback) => {
        try {
            const roomId = Date.now().toString();
            const newRoom = new Room({
                roomId: roomId,
                name: data.name,
                createdBy: socket.user._id,
                creatorName: socket.user.username,
                members: [socket.user._id],
                messages: [],
                isPrivate: data.private || false,
                allowedUsers: data.allowedUsers || [],
                createdAt: new Date(),
                lastActivity: new Date()
            });
            
            await newRoom.save();
            socket.join(roomId);
            
            const roomData = {
                id: newRoom.roomId,
                name: newRoom.name,
                members: newRoom.members,
                private: newRoom.isPrivate,
                messages: []
            };
            
            if (callback && typeof callback === 'function') {
                callback({ success: true, room: roomData });
            }
            
            if (data.allowedUsers && data.allowedUsers.length) {
                data.allowedUsers.forEach(async (userId) => {
                    const targetSocket = onlineUsers.get(userId);
                    if (targetSocket) {
                        io.to(targetSocket).emit('room_invite', {
                            roomId,
                            roomName: data.name,
                            invitedBy: socket.user.name
                        });
                    }
                    await addNotification(userId, {
                        title: '📢 دعوة لغرفة',
                        message: `${socket.user.name} دعاك للانضمام إلى غرفة "${data.name}"`,
                        type: 'room_invite',
                        link: `/chat?room=${roomId}`
                    });
                });
            }
        } catch (error) {
            console.error('Error creating room:', error);
            if (callback) callback({ success: false, error: error.message });
        }
    });

    socket.on('join_room', async (roomId, callback) => {
        try {
            const room = await Room.findOne({ roomId: roomId });
            if (!room) {
                return callback({ success: false, error: 'الغرفة غير موجودة' });
            }
            
            if (room.isPrivate && !room.allowedUsers.includes(socket.user._id) && 
                room.createdBy.toString() !== socket.user._id.toString()) {
                return callback({ success: false, error: 'غير مصرح لك بدخول هذه الغرفة' });
            }
            
            if (!room.members.includes(socket.user._id)) {
                room.members.push(socket.user._id);
                await room.save();
            }
            
            socket.join(roomId);
            io.to(roomId).emit('user_joined', { userId: socket.user._id, name: socket.user.name });
            
            callback({ 
                success: true, 
                room: {
                    id: room.roomId,
                    name: room.name,
                    members: room.members,
                    private: room.isPrivate
                },
                messages: room.messages 
            });
        } catch (error) {
            console.error('Error joining room:', error);
            callback({ success: false, error: error.message });
        }
    });

    socket.on('send_message', async (data, callback) => {
    try {
        const room = await Room.findOne({ roomId: data.roomId });
        if (!room) {
            return callback({ success: false, error: 'الغرفة غير موجودة' });
        }
        
        const message = {
            userId: socket.user._id,
            userName: socket.user.username,
            userAvatar: socket.user.avatar || '👤',
            text: data.text,
            timestamp: new Date(),
            readBy: [socket.user._id]
        };
        
        room.messages.push(message);
        room.lastActivity = new Date();
        await room.save();
        
        io.to(data.roomId).emit('new_message', message);
        if (callback) callback({ success: true });
    } catch (error) {
        console.error('Error sending message:', error);
        callback({ success: false, error: error.message });
    }
});

    socket.on('start_private_chat', async (targetUserId, callback) => {
        try {
            const targetUser = await User.findById(targetUserId);
            if (!targetUser) {
                return callback({ success: false, error: 'المستخدم غير موجود' });
            }
            
            const participants = [socket.user._id, targetUserId].sort();
            const conversationId = `${participants[0]}_${participants[1]}`;
            
            let conversation = await PrivateConversation.findOne({ conversationId });
            if (!conversation) {
                conversation = new PrivateConversation({
                    conversationId: conversationId,
                    participants: participants,
                    messages: [],
                    createdAt: new Date()
                });
                await conversation.save();
            }
            
            socket.join(`private_${conversationId}`);
            
            callback({ 
                success: true, 
                conversation: {
                    id: conversation.conversationId,
                    participant: {
                        id: targetUser._id,
                        name: targetUser.name,
                        email: targetUser.email
                    },
                    messages: conversation.messages
                }
            });
            
            const targetSocket = onlineUsers.get(targetUserId);
            if (targetSocket) {
                io.to(targetSocket).emit('private_chat_request', {
                    from: { id: socket.user._id, name: socket.user.name },
                    conversationId
                });
            }
        } catch (error) {
            console.error('Error starting private chat:', error);
            callback({ success: false, error: error.message });
        }
    });

    socket.on('send_private_message', async (data, callback) => {
        try {
            const { targetUserId, message } = data;
            const participants = [socket.user._id, targetUserId].sort();
            const conversationId = `${participants[0]}_${participants[1]}`;
            
            let conversation = await PrivateConversation.findOne({ conversationId });
            if (!conversation) {
                conversation = new PrivateConversation({
                    conversationId: conversationId,
                    participants: participants,
                    messages: [],
                    createdAt: new Date()
                });
            }
            
            const newMessage = {
                from: socket.user._id,
                fromName: socket.user.name,
                text: message,
                timestamp: new Date(),
                read: false
            };
            
            conversation.messages.push(newMessage);
            conversation.lastActivity = new Date();
            await conversation.save();
            
            socket.emit('private_message_received', newMessage);
            
            const recipientSocket = onlineUsers.get(targetUserId);
            if (recipientSocket) {
                io.to(recipientSocket).emit('private_message_received', { ...newMessage, conversationId });
                
                await addNotification(targetUserId, {
                    title: '💬 رسالة خاصة',
                    message: `لديك رسالة جديدة من ${socket.user.name}`,
                    type: 'private_message',
                    link: `/chat?private=${conversationId}&with=${socket.user._id}`
                });
            }
            
            if (callback && typeof callback === 'function') {
                callback({ success: true, message: newMessage });
            }
        } catch (error) {
            console.error('Error sending private message:', error);
            if (callback && typeof callback === 'function') {
                callback({ success: false, error: error.message });
            }
        }
    });

    socket.on('get_users_for_chat', async (callback) => {
    try {
        // ✅ جلب المستخدمين بدون بريد إلكتروني
        const users = await User.find({ _id: { $ne: socket.user._id } })
            .select('_id username name avatar level'); // ✅ فقط username و name
        
        // تنسيق البيانات للإرسال
        const formattedUsers = users.map(user => ({
            id: user._id,
            username: user.username,
            name: user.name || user.username,
            avatar: user.avatar || '👤',
            level: user.level
        }));
        
        if (callback && typeof callback === 'function') {
            callback({ success: true, users: formattedUsers });
        }
    } catch (error) {
        console.error('Error getting users:', error);
        if (callback) callback({ success: false, error: error.message });
    }
});

    socket.on('get_my_conversations', async (callback) => {
        try {
            const conversations = await PrivateConversation.find({
                participants: socket.user._id
            }).sort({ lastActivity: -1 });
            
            const myConversations = [];
            for (const conv of conversations) {
                const otherUserId = conv.participants.find(p => p.toString() !== socket.user._id.toString());
                const otherUser = await User.findById(otherUserId).select('name email');
                const isOnline = onlineUsers.has(otherUserId);
                const unreadCount = conv.messages.filter(m => 
                    m.from.toString() !== socket.user._id.toString() && !m.read
                ).length;
                
                myConversations.push({
                    id: conv.conversationId,
                    participant: { 
                        id: otherUser._id, 
                        name: otherUser.name, 
                        email: otherUser.email,
                        isOnline: isOnline
                    },
                    lastMessage: conv.messages[conv.messages.length - 1],
                    unreadCount: unreadCount,
                    createdAt: conv.createdAt
                });
            }
            
            if (callback && typeof callback === 'function') {
                callback({ success: true, conversations: myConversations });
            } else {
                socket.emit('private_conversations_list', myConversations);
            }
        } catch (error) {
            console.error('Error getting conversations:', error);
            if (callback && typeof callback === 'function') {
                callback({ success: false, error: error.message });
            }
        }
    });

    socket.on('mark_messages_read', async (conversationId, callback) => {
        try {
            const conversation = await PrivateConversation.findOne({ conversationId });
            if (conversation) {
                conversation.messages.forEach(msg => {
                    if (msg.from.toString() !== socket.user._id.toString()) {
                        msg.read = true;
                    }
                });
                await conversation.save();
                if (callback && typeof callback === 'function') {
                    callback({ success: true });
                }
            } else {
                if (callback) callback({ success: false, error: 'المحادثة غير موجودة' });
            }
        } catch (error) {
            console.error('Error marking messages read:', error);
            if (callback) callback({ success: false, error: error.message });
        }
    });

    socket.on('leave_room', async (roomId, callback) => {
        try {
            const room = await Room.findOne({ roomId: roomId });
            if (room) {
                room.members = room.members.filter(m => m.toString() !== socket.user._id.toString());
                await room.save();
                socket.leave(roomId);
                io.to(roomId).emit('user_left', { userId: socket.user._id, name: socket.user.name });
            }
            if (callback) callback({ success: true });
        } catch (error) {
            console.error('Error leaving room:', error);
            if (callback) callback({ success: false, error: error.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.user?.name);
        onlineUsers.delete(socket.user._id.toString());
    });
});

// ==================== Serve Frontend ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'chat.html'));
});

app.get('/level-tests.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'level-tests.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'admin.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ==================== Connect to MongoDB ====================
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elearning';
mongoose.connect(mongoURI).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch((err) => {
    console.error('❌ MongoDB connection error:', err);
});

// ==================== Start Server ====================
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Admin: http://localhost:${PORT}/admin`);
    console.log(`📍 Chat: http://localhost:${PORT}/chat`);
});
