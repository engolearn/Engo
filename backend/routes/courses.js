const express = require('express');
const Course = require('../models/Course');
const UserProgress = require('../models/UserProgress'); // ✅ يجب أن تكون في البداية مع باقي الـ requires
const auth = require('../middleware/auth');
const router = express.Router();

// ==================== Routes ====================

// جلب جميع الدورات (بدون تسجيل دخول)
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find()
            .select('title description level price isPremium totalLessons image')
            .sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب الدورات', error: error.message });
    }
});

// جلب دورة محددة مع دروسها (يتطلب تسجيل دخول)
router.get('/:courseId', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId)
            .populate({
                path: 'lessons',
                select: 'title lessonNumber assignment videoUrl audioUrl content',
                options: { sort: { lessonNumber: 1 } }
            });
        
        if (!course) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }
        
        const isPurchased = req.user.purchasedCourses.includes(course._id);
        
        const lessonsWithStatus = course.lessons.map((lesson, index) => ({
            ...lesson.toObject(),
            isLocked: !isPurchased && index >= course.freeLessons
        }));
        
        res.json({
            ...course.toObject(),
            lessons: lessonsWithStatus,
            isPurchased
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب الدورة', error: error.message });
    }
});

// جلب تقدم المستخدم في دورة معينة
router.get('/:courseId/progress', auth, async (req, res) => {
    try {
        const progress = await UserProgress.findOne({
            userId: req.user._id,
            courseId: req.params.courseId
        }).populate('completedLessons.lessonId', 'title lessonNumber');
        
        res.json(progress || { completedLessons: [], midtermScore: null, finalScore: null });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب التقدم', error: error.message });
    }
});

// تحديث تقدم درس (تسجيل إكمال درس)
router.post('/:courseId/lessons/:lessonId/complete', auth, async (req, res) => {
    try {
        const { score } = req.body;
        
        let progress = await UserProgress.findOne({
            userId: req.user._id,
            courseId: req.params.courseId
        });
        
        if (!progress) {
            progress = new UserProgress({
                userId: req.user._id,
                courseId: req.params.courseId,
                completedLessons: []
            });
        }
        
        await progress.addCompletedLesson(req.params.lessonId, score || 100);
        
        res.json({ message: 'تم تحديث التقدم بنجاح', progress });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في تحديث التقدم', error: error.message });
    }
});

module.exports = router;
