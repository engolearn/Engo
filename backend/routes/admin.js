const express = require('express');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const auth = require('../middleware/auth');
const router = express.Router();

const adminAuth = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'غير مصرح لك بهذه العملية' });
    }
    next();
};

router.post('/courses', auth, adminAuth, async (req, res) => {
    try {
        const course = new Course(req.body);
        await course.save();
        res.status(201).json({ message: 'تم إضافة الدورة بنجاح', course });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إضافة الدورة', error: error.message });
    }
});

router.post('/lessons', auth, adminAuth, async (req, res) => {
    try {
        const lesson = new Lesson(req.body);
        await lesson.save();
        
        await Course.findByIdAndUpdate(lesson.courseId, {
            $push: { lessons: lesson._id },
            $inc: { totalLessons: 1 }
        });
        
        res.status(201).json({ message: 'تم إضافة الدرس بنجاح', lesson });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إضافة الدرس', error: error.message });
    }
});

router.get('/courses', auth, adminAuth, async (req, res) => {
    try {
        const courses = await Course.find().populate('lessons', 'title lessonNumber');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب الدورات', error: error.message });
    }
});

router.put('/courses/:courseId/status', auth, adminAuth, async (req, res) => {
    try {
        const { isPremium } = req.body;
        const course = await Course.findByIdAndUpdate(
            req.params.courseId,
            { isPremium },
            { new: true }
        );
        res.json({ message: 'تم تحديث حالة الدورة', course });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في التحديث', error: error.message });
    }
});

module.exports = router;
