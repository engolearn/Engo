// server.js - النسخة النهائية الكاملة
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
    notifications: [{
        id: String,
        title: String,
        message: String,
        type: String,
        link: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
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

// Lesson Model
const lessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    videoUrl: { type: String, default: null },
    audioUrl: { type: String, default: null },
    images: [{ url: String, caption: String, description: String, order: Number }],
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

// ==================== Helper Functions ====================
async function addNotification(userId, notifData) {
    try {
        const user = await User.findById(userId);
        if (!user) return;
        
        if (!user.notifications) user.notifications = [];
        
        user.notifications.push({
            id: Date.now().toString(),
            title: notifData.title,
            message: notifData.message,
            type: notifData.type,
            link: notifData.link || '/',
            read: false,
            createdAt: new Date()
        });
        
        if (user.notifications.length > 50) {
            user.notifications = user.notifications.slice(-50);
        }
        
        await user.save();
        console.log(`📢 Notification sent to ${user.name}: ${notifData.title}`);
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
        res.json({ message: '✅ تم إضافة الدورة', course });
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

app.get('/api/admin/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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

// ==================== Level Test Routes ====================
app.get('/api/level-tests', async (req, res) => {
    try {
        const tests = await Quiz.find({ quizType: 'level_test', isActive: true }).select('-questions');
        res.json(tests);
    } catch (error) {
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
        
        // حفظ النتيجة
        const QuizResult = mongoose.model('QuizResult');
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
            const users = await User.find({ _id: { $ne: socket.user._id } }).select('_id name email');
            if (callback && typeof callback === 'function') {
                callback({ success: true, users });
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
