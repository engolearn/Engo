const express = require('express');
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const router = express.Router();

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

module.exports = router;
