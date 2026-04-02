// server.js - نسخة كاملة ومنظمة مع Socket.IO
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

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

app.put('/api/admin/courses/:courseId', auth, adminAuth, async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, { new: true });
        res.json({ message: '✅ تم تحديث الدورة', course });
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

// ==================== Lesson Routes ====================
// Get lessons for a course (admin)
app.get('/api/admin/courses/:courseId/lessons', auth, adminAuth, async (req, res) => {
    try {
        const lessons = await Lesson.find({ courseId: req.params.courseId }).sort({ lessonNumber: 1 });
        res.json(lessons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add lesson
app.post('/api/admin/lessons', auth, adminAuth, async (req, res) => {
    try {
        const { title, content, videoUrl, audioUrl, lessonNumber, courseId, assignment } = req.body;
        if (!title || !content || !lessonNumber || !courseId) {
            return res.status(400).json({ message: 'جميع الحقول المطلوبة غير مكتملة' });
        }

        let cleanAssignment = {
            title: assignment?.title || 'واجب الدرس',
            description: assignment?.description || '',
            questions: [],
            passingScore: assignment?.passingScore || 70
        };

        if (assignment && assignment.questions && Array.isArray(assignment.questions)) {
            cleanAssignment.questions = assignment.questions.map(q => {
                const question = {
                    id: q.id || Date.now().toString() + Math.random(),
                    type: q.type,
                    title: q.title || '',
                    points: q.points || 10
                };

                switch (q.type) {
                    case 'sentence_arrangement':
                        question.sentences = q.sentences || [];
                        question.correctOrder = q.correctOrder || [];
                        break;
                    case 'word_match':
                        question.pairs = q.pairs || [];
                        question.words = q.words || [];
                        break;
                    case 'fill_blank':
                        question.text = q.text || '';
                        question.correctAnswer = q.correctAnswer || '';
                        question.blanks = q.blanks || [];
                        break;
                    case 'multiple_choice':
                        question.question = q.question || '';
                        question.options = q.options || [];
                        question.correctOption = q.correctOption || 0;
                        break;
                    case 'true_false':
                        question.statement = q.statement || '';
                        question.isTrue = q.isTrue || false;
                        break;
                }
                return question;
            });
        }

        const lesson = new Lesson({
            title,
            content,
            videoUrl: videoUrl || null,
            audioUrl: audioUrl || null,
            lessonNumber,
            courseId,
            assignment: cleanAssignment
        });

        await lesson.save();

        await Course.findByIdAndUpdate(courseId, { 
            $push: { lessons: lesson._id }, 
            $inc: { totalLessons: 1 } 
        });

        res.json({ message: '✅ تم إضافة الدرس بنجاح', lesson });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single lesson
app.get('/api/lessons/:lessonId', auth, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId);
        if (!lesson) return res.status(404).json({ message: 'الدرس غير موجود' });
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/admin/lessons/:lessonId', auth, adminAuth, async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndUpdate(req.params.lessonId, req.body, { new: true });
        res.json({ message: '✅ تم تحديث الدرس', lesson });
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

// ==================== Quiz Routes ====================
app.post('/api/admin/quizzes', auth, adminAuth, async (req, res) => {
    try {
        const quiz = new Quiz(req.body);
        await quiz.save();
        res.json({ message: '✅ تم إضافة الاختبار', quiz });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/quizzes/:quizId', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);
        res.json(quiz);
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
        } else {
            await UserProgress.findOneAndUpdate(
                { userId: req.user._id, courseId: quiz.courseId },
                { [quiz.title === 'midterm' ? 'midtermScore' : 'finalScore']: score },
                { upsert: true }
            );
        }

        res.json({ score, passed: score >= quiz.passingScore });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== Level Test ====================
app.get('/api/level-test', async (req, res) => {
    try {
        const levelTest = await Quiz.findOne({ title: 'level_test' });
        if (!levelTest) {
            const defaultTest = new Quiz({
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
            await defaultTest.save();
            res.json(defaultTest);
        } else {
            res.json(levelTest);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== User Progress ====================
app.get('/api/progress/:courseId', auth, async (req, res) => {
    try {
        const progress = await UserProgress.findOne({ userId: req.user._id, courseId: req.params.courseId });
        res.json(progress || { completedLessons: [], midtermScore: null, finalScore: null, levelTestScore: null, certificateIssued: false });
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

    // ========== غرف المحادثة العامة ==========
    socket.on('get_rooms', (callback) => {
        const roomList = Array.from(rooms.values()).filter(r => 
            !r.private || r.members.includes(socket.user._id.toString()) || r.createdBy?.toString() === socket.user._id.toString()
        );
        if (callback) callback(roomList);
        else socket.emit('rooms_list', roomList);
    });

    socket.on('create_room', (data, callback) => {
        const roomId = Date.now().toString();
        const room = {
            id: roomId,
            name: data.name,
            createdBy: socket.user._id,
            creatorName: socket.user.name,
            members: [socket.user._id.toString()],
            messages: [],
            createdAt: new Date(),
            private: data.private || false,
            allowedUsers: data.allowedUsers || []
        };
        rooms.set(roomId, room);
        socket.join(roomId);
        if (callback) callback({ success: true, room });
        else socket.emit('room_created', room);
    });

    socket.on('join_room', (roomId, callback) => {
        const room = rooms.get(roomId);
        if (!room) return callback({ success: false, error: 'الغرفة غير موجودة' });
        if (room.private && !room.allowedUsers.includes(socket.user._id.toString()) && 
            room.createdBy?.toString() !== socket.user._id.toString()) {
            return callback({ success: false, error: 'غير مصرح لك بدخول هذه الغرفة' });
        }
        if (!room.members.includes(socket.user._id.toString())) {
            room.members.push(socket.user._id.toString());
        }
        socket.join(roomId);
        rooms.set(roomId, room);
        io.to(roomId).emit('user_joined', { userId: socket.user._id, name: socket.user.name });
        callback({ success: true, room, messages: room.messages });
    });

    socket.on('send_message', (data, callback) => {
        const room = rooms.get(data.roomId);
        if (!room) return callback({ success: false, error: 'الغرفة غير موجودة' });
        const message = {
            id: Date.now().toString(),
            userId: socket.user._id,
            userName: socket.user.name,
            text: data.text,
            timestamp: new Date(),
            readBy: [socket.user._id.toString()]
        };
        room.messages.push(message);
        rooms.set(data.roomId, room);
        io.to(data.roomId).emit('new_message', message);
        callback({ success: true });
    });

    // ========== المحادثات الخاصة ==========
    socket.on('start_private_chat', async (targetUserId, callback) => {
        try {
            const targetUser = await User.findById(targetUserId);
            if (!targetUser) return callback({ success: false, error: 'المستخدم غير موجود' });
            
            const conversationId = [socket.user._id, targetUserId].sort().join('_');
            let conversation = privateConversations.get(conversationId);
            
            if (!conversation) {
                conversation = {
                    id: conversationId,
                    participants: [socket.user._id.toString(), targetUserId],
                    messages: [],
                    createdAt: new Date()
                };
                privateConversations.set(conversationId, conversation);
            }
            
            socket.join(`private_${conversationId}`);
            
            callback({ 
                success: true, 
                conversation: {
                    id: conversation.id,
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
            callback({ success: false, error: error.message });
        }
    });

    socket.on('send_private_message', async (data, callback) => {
        try {
            const { targetUserId, message } = data;
            const conversationId = [socket.user._id, targetUserId].sort().join('_');
            
            let conversation = privateConversations.get(conversationId);
            if (!conversation) {
                conversation = {
                    id: conversationId,
                    participants: [socket.user._id.toString(), targetUserId],
                    messages: [],
                    createdAt: new Date()
                };
                privateConversations.set(conversationId, conversation);
            }
            
            const newMessage = {
                id: Date.now().toString(),
                from: socket.user._id,
                fromName: socket.user.name,
                text: message,
                timestamp: new Date(),
                read: false
            };
            
            conversation.messages.push(newMessage);
            privateConversations.set(conversationId, conversation);
            
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
            callback({ success: true, message: newMessage });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    socket.on('get_users_for_chat', async (callback) => {
        try {
            const users = await User.find({ 
                _id: { $ne: socket.user._id },
                role: { $ne: 'admin' }
            }).select('_id name email');
            callback({ success: true, users });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    socket.on('get_my_conversations', async (callback) => {
        try {
            const myConversations = [];
            for (const [key, conv] of privateConversations) {
                if (conv.participants.includes(socket.user._id.toString())) {
                    const otherUserId = conv.participants.find(p => p !== socket.user._id.toString());
                    const otherUser = await User.findById(otherUserId).select('name email');
                    const unreadCount = conv.messages.filter(m => 
                        m.from.toString() !== socket.user._id.toString() && !m.read
                    ).length;
                    myConversations.push({
                        id: conv.id,
                        participant: { id: otherUser._id, name: otherUser.name, email: otherUser.email },
                        lastMessage: conv.messages[conv.messages.length - 1],
                        unreadCount,
                        createdAt: conv.createdAt
                    });
                }
            }
            myConversations.sort((a, b) => {
                const aTime = a.lastMessage?.timestamp || a.createdAt;
                const bTime = b.lastMessage?.timestamp || b.createdAt;
                return new Date(bTime) - new Date(aTime);
            });
            callback({ success: true, conversations: myConversations });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    socket.on('mark_messages_read', async (conversationId, callback) => {
        try {
            const conversation = privateConversations.get(conversationId);
            if (conversation) {
                conversation.messages.forEach(msg => {
                    if (msg.from.toString() !== socket.user._id.toString()) msg.read = true;
                });
                privateConversations.set(conversationId, conversation);
                callback({ success: true });
            } else {
                callback({ success: false, error: 'المحادثة غير موجودة' });
            }
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    socket.on('leave_room', (roomId, callback) => {
        const room = rooms.get(roomId);
        if (room) {
            room.members = room.members.filter(m => m !== socket.user._id.toString());
            rooms.set(roomId, room);
            socket.leave(roomId);
            io.to(roomId).emit('user_left', { userId: socket.user._id, name: socket.user.name });
        }
        if (callback) callback({ success: true });
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.user?.name);
        onlineUsers.delete(socket.user._id.toString());
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// ==================== Connect to MongoDB ====================
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/elearning';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch((err) => {
    console.error('❌ MongoDB connection error:', err);
});

// ==================== Serve Frontend ====================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});
app.get('/chat', (req, res) => { 
    res.sendFile(path.join(__dirname, 'frontend', 'chat.html')); 
});
app.get('/admin', (req, res) => { 
    res.sendFile(path.join(__dirname, 'frontend', 'admin.html')); 
});

// ==================== Start Server ====================
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
