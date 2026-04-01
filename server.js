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
io.on('connection', (socket) => {
    console.log('🔌 A user connected:', socket.id);

    // Example: receive a message
    socket.on('send_message', (data) => {
        console.log('Message received:', data);
        io.emit('receive_message', data); // broadcast to all
    });

    socket.on('disconnect', () => {
        console.log('❌ A user disconnected:', socket.id);
    });
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

// ==================== Start Server ====================
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
