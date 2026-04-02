// server.js - نسخة مصححة
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== Middleware ====================
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'frontend')));

// ==================== Models ====================

// User Model
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'user' },
    level: { type: String, enum: ['beginner', 'advanced', null], default: null },
    levelScore: { type: Number, default: 0 },
    purchasedCourses: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Course Model
const courseSchema = new mongoose.Schema({
    title: String,
    description: String,
    level: { type: String, enum: ['beginner', 'advanced'] },
    price: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    totalLessons: { type: Number, default: 0 },
    freeLessons: { type: Number, default: 5 },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    image: String,
    createdAt: { type: Date, default: Date.now }
});
const Course = mongoose.model('Course', courseSchema);

// ==================== Models ====================
// أضف هذا النموذج مع باقي النماذج

// Private Message Model
const privateMessageSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, index: true },
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

const PrivateConversation = mongoose.model('PrivateConversation', privateMessageSchema);

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

// Lesson Model
const assignmentQuestionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ['sentence_arrangement', 'word_match', 'fill_blank', 'multiple_choice', 'true_false'], required: true },
    title: { type: String, default: '' },
    points: { type: Number, default: 10 },
    sentences: [{ type: String }],
    correctOrder: [{ type: Number }],
    pairs: [{ word: String, meaning: String }],
    words: [{ type: String }],
    text: { type: String },
    correctAnswer: { type: String },
    blanks: [{ type: String }],
    question: { type: String },
    options: [{ type: String }],
    correctOption: { type: Number },
    statement: { type: String },
    isTrue: { type: Boolean }
});

const lessonImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    caption: { type: String, default: '' },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 }
});

const lessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    videoUrl: { type: String, default: null },
    audioUrl: { type: String, default: null },
    images: [lessonImageSchema],
    lessonNumber: { type: Number, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    assignment: {
        title: { type: String, default: 'واجب الدرس' },
        description: { type: String, default: '' },
        questions: [assignmentQuestionSchema],
        passingScore: { type: Number, default: 70 }
    },
    createdAt: { type: Date, default: Date.now }
});
const Lesson = mongoose.model('Lesson', lessonSchema);

// Quiz Model
const quizSchema = new mongoose.Schema({
    title: { type: String, enum: ['midterm', 'final', 'level_test'] },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    questions: [{
        question: String,
        options: [String],
        correctAnswer: Number,
        type: { type: String, enum: ['multiple_choice', 'true_false', 'fill_blank'], default: 'multiple_choice' }
    }],
    passingScore: { type: Number, default: 70 },
    createdAt: { type: Date, default: Date.now }
});
const Quiz = mongoose.model('Quiz', quizSchema);

// UserProgress Model
const userProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    completedLessons: [{ lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }, score: { type: Number, default: 0 } }],
    midtermScore: { type: Number, default: null },
    finalScore: { type: Number, default: null },
    levelTestScore: { type: Number, default: null },
    certificateIssued: { type: Boolean, default: false }
});
const UserProgress = mongoose.model('UserProgress', userProgressSchema);

// ==================== Helper Functions ====================
async function addNotification(userId, notifData) {
    try {
        const user = await User.findById(userId);
        if (user) {
            if (!user.notifications) user.notifications = [];
            user.notifications.push({
                id: Date.now().toString(),
                ...notifData,
                createdAt: new Date(),
                read: false
            });
            await user.save();
        }
    } catch (error) {
        console.error('Error adding notification:', error);
    }
}

// ==================== Auth Middleware ====================
const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized' });
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ message: 'User not found' });
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const adminAuth = async (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    next();
};

// ==================== Auth Routes ====================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'البريد موجود بالفعل' });

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

        res.json({ message: 'تم التسجيل بنجاح', token, user: { id: user._id, name: user.name, email: user.email, role: user.role, purchasedCourses: [] } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'بيانات غير صحيحة' });

        const bcrypt = require('bcryptjs');
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ message: 'بيانات غير صحيحة' });

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

        res.json({ message: 'تم تسجيل الدخول', token, user: { id: user._id, name: user.name, email: user.email, role: user.role, level: user.level, purchasedCourses: user.purchasedCourses || [] } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== Course Routes ====================
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        res.json([]);
    }
});

app.get('/api/courses/:courseId', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId).populate('lessons');
        if (!course) return res.status(404).json({ message: 'Course not found' });

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
        const course = new Course(req.body);
        await course.save();
        res.json({ message: '✅ تم إضافة الدورة بنجاح', course });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        res.json({ message: '✅ تم إضافة الدرس بنجاح', lesson });
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

app.get('/api/admin/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
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

// ==================== User Stats ====================
app.get('/api/user/stats', auth, async (req, res) => {
    try {
        const progress = await UserProgress.find({ userId: req.user._id });
        const completedLessonsCount = progress.reduce((sum, p) => sum + p.completedLessons.length, 0);
        res.json({
            points: req.user.points || { totalXP: 0, level: 1, levelProgress: 0, nextLevelXP: 100 },
            badges: req.user.badges || [],
            totalLessonsCompleted: completedLessonsCount,
            totalCoursesCompleted: progress.length,
            nextLevel: {
                current: req.user.points?.level || 1,
                next: (req.user.points?.level || 1) + 1,
                progress: req.user.points?.levelProgress || 0,
                needed: req.user.points?.nextLevelXP || 100
            }
        });
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

// ==================== Quiz Routes ====================
app.get('/api/level-test', async (req, res) => {
    try {
        let levelTest = await Quiz.findOne({ title: 'level_test' });
        if (!levelTest) {
            levelTest = new Quiz({
                title: 'level_test',
                questions: [
                    { question: 'What is the correct greeting in English?', options: ['مرحبا', 'Hello', 'السلام عليكم', 'Bonjour'], correctAnswer: 1 },
                    { question: 'What is the word for "كتاب" in English?', options: ['Pen', 'Book', 'Desk', 'Chair'], correctAnswer: 1 },
                    { question: 'Complete: "I ___ a student."', options: ['am', 'is', 'are', 'be'], correctAnswer: 0 },
                    { question: 'What is the opposite of "big"?', options: ['Large', 'Huge', 'Small', 'Tall'], correctAnswer: 2 },
                    { question: 'How do you say "شكراً" in English?', options: ['Please', 'Sorry', 'Thank you', 'Hello'], correctAnswer: 2 }
                ],
                passingScore: 70
            });
            await levelTest.save();
        }
        res.json(levelTest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/quizzes/:quizId/submit', auth, async (req, res) => {
    try {
        const { answers } = req.body;
        const quiz = await Quiz.findById(req.params.quizId);
        let score = 0;
        quiz.questions.forEach((q, i) => {
            if (answers[i] === q.correctAnswer) score += 100 / quiz.questions.length;
        });
        if (quiz.title === 'level_test') {
            await User.findByIdAndUpdate(req.user._id, { levelScore: score, level: score >= 70 ? 'beginner' : null });
        }
        res.json({ score, passed: score >= quiz.passingScore });
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

// ==================== Socket.IO ====================
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const rooms = new Map();
const onlineUsers = new Map();
const privateConversations = new Map();

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

    
                
        // ========== غرف المحادثة العامة (باستخدام قاعدة البيانات) ==========
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
            creatorName: socket.user.name,
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
        
        // إشعار للمستخدمين المدعوين
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
                // إضافة إشعار في قاعدة البيانات
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
        
        io.to(roomId).emit('user_joined', { 
            userId: socket.user._id, 
            name: socket.user.name 
        });
        
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
            userName: socket.user.name,
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

// ========== المحادثات الخاصة (باستخدام قاعدة البيانات) ==========
socket.on('start_private_chat', async (targetUserId, callback) => {
    try {
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            if (callback && typeof callback === 'function') {
                return callback({ success: false, error: 'المستخدم غير موجود' });
            }
            return;
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
        
        if (callback && typeof callback === 'function') {
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
        }
        
        const targetSocket = onlineUsers.get(targetUserId);
        if (targetSocket) {
            io.to(targetSocket).emit('private_chat_request', {
                from: { id: socket.user._id, name: socket.user.name },
                conversationId
            });
        }
    } catch (error) {
        console.error('Error starting private chat:', error);
        if (callback && typeof callback === 'function') {
            callback({ success: false, error: error.message });
        }
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
        
        const targetSocket = onlineUsers.get(targetUserId);
        if (targetSocket) {
            io.to(targetSocket).emit('private_message_received', { ...newMessage, conversationId });
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
        const users = await User.find({ 
            _id: { $ne: socket.user._id }
        }).select('_id name email');
        
        // ✅ التحقق من وجود callback
        if (callback && typeof callback === 'function') {
            callback({ success: true, users });
        }
    } catch (error) {
        console.error('Error getting users:', error);
        if (callback && typeof callback === 'function') {
            callback({ success: false, error: error.message });
        }
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
            const unreadCount = conv.messages.filter(m => 
                m.from.toString() !== socket.user._id.toString() && !m.read
            ).length;
            
            myConversations.push({
                id: conv.conversationId,
                participant: { id: otherUser._id, name: otherUser.name, email: otherUser.email },
                lastMessage: conv.messages[conv.messages.length - 1],
                unreadCount,
                createdAt: conv.createdAt
            });
        }
        
        // ✅ التحقق من وجود callback
        if (callback && typeof callback === 'function') {
            callback({ success: true, conversations: myConversations });
        }
    } catch (error) {
        console.error('Error getting conversations:', error);
        if (callback && typeof callback === 'function') {
            callback({ success: false, error: error.message });
        }
    }
});

// في server.js - داخل io.on('connection')
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
            
            // ✅ التحقق من وجود callback قبل استدعائها
            if (callback && typeof callback === 'function') {
                callback({ success: true });
            }
        } else {
            if (callback && typeof callback === 'function') {
                callback({ success: false, error: 'المحادثة غير موجودة' });
            }
        }
    } catch (error) {
        console.error('Error marking messages read:', error);
        if (callback && typeof callback === 'function') {
            callback({ success: false, error: error.message });
        }
    }
});

socket.on('leave_room', async (roomId, callback) => {
    try {
        const room = await Room.findOne({ roomId: roomId });
        if (room) {
            room.members = room.members.filter(m => m.toString() !== socket.user._id.toString());
            await room.save();
            socket.leave(roomId);
            io.to(roomId).emit('user_left', { 
                userId: socket.user._id, 
                name: socket.user.name 
            });
        }
        if (callback) callback({ success: true });
    } catch (error) {
        console.error('Error leaving room:', error);
        if (callback) callback({ success: false, error: error.message });
    }
});

    // في بداية الاتصال، استعادة الغرف والمحادثات
socket.on('restore_data', async (callback) => {
    try {
        const rooms = await Room.find({ members: socket.user._id });
        const conversations = await PrivateConversation.find({ participants: socket.user._id });
        
        callback({
            success: true,
            rooms: rooms.map(r => ({ id: r.roomId, name: r.name, private: r.isPrivate })),
            conversations: conversations.map(c => ({ id: c.conversationId, lastMessage: c.messages[c.messages.length - 1] }))
        });
    } catch (error) {
        callback({ success: false, error: error.message });
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

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'admin.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ==================== Connect to MongoDB ====================
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elearning';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
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
