// server.js - النسخة الكاملة
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
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
const lessonSchema = new mongoose.Schema({
    title: String,
    content: String,
    videoUrl: String,
    audioUrl: String,
    lessonNumber: Number,
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    assignment: {
        type: { type: String, enum: ['sentence_arrangement', 'word_match', 'fill_blank', 'none'], default: 'none' },
        question: String,
        sentences: [String],
        correctOrder: [Number],
        pairs: [{ word: String, meaning: String }],
        text: String,
        correctAnswer: String,
        options: [String]
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

// ==================== Middleware ====================
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

// ==================== Level Test Routes ====================
app.get('/api/level-test', async (req, res) => {
    try {
        const levelTest = await Quiz.findOne({ title: 'level_test' });
        if (!levelTest) {
            // إنشاء اختبار افتراضي
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
        res.json(progress || { completedLessons: [], midtermScore: null, finalScore: null });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

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

// ==================== Serve Pages ====================
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'frontend', 'index.html')); });
app.get('/admin', (req, res) => { res.sendFile(path.join(__dirname, 'frontend', 'admin.html')); });
app.get('/health', (req, res) => { res.json({ status: 'healthy', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }); });

// ==================== Database Connection ====================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Admin panel: https://engo.koyeb.app/admin`);
});
