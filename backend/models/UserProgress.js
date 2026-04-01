const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    completedLessons: [{
        lessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson',
            required: true
        },
        completedAt: {
            type: Date,
            default: Date.now
        },
        assignmentScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    }],
    midtermScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100
    },
    finalScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100
    },
    certificateIssued: {
        type: Boolean,
        default: false
    },
    certificateUrl: {
        type: String,
        default: null
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    },
    totalScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, {
    timestamps: true // يضيف createdAt و updatedAt تلقائياً
});

// إنشاء فهرس مركب لضمان عدم تكرار السجلات
userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// حساب النسبة المئوية للتقدم في الدورة
userProgressSchema.virtual('completionPercentage').get(function() {
    if (!this.courseId) return 0;
    // هذا سيكون محسوباً من عدد الدروس المكتملة مقسوماً على إجمالي الدروس
    return this.completedLessons.length;
});

// تحديث totalScore تلقائياً عند تغيير الدرجات
userProgressSchema.pre('save', function(next) {
    let total = 0;
    let count = 0;
    
    // إضافة درجات الواجبات
    this.completedLessons.forEach(lesson => {
        if (lesson.assignmentScore > 0) {
            total += lesson.assignmentScore;
            count++;
        }
    });
    
    // إضافة درجة الاختبار النصفي
    if (this.midtermScore !== null) {
        total += this.midtermScore;
        count++;
    }
    
    // إضافة درجة الاختبار النهائي
    if (this.finalScore !== null) {
        total += this.finalScore;
        count++;
    }
    
    // حساب المتوسط
    if (count > 0) {
        this.totalScore = Math.round(total / count);
    } else {
        this.totalScore = 0;
    }
    
    next();
});

// طريقة للتحقق من اكتمال الدورة
userProgressSchema.methods.isCourseCompleted = function(totalLessons) {
    return this.completedLessons.length >= totalLessons && 
           this.midtermScore !== null && 
           this.finalScore !== null;
};

// طريقة لإضافة درس مكتمل
userProgressSchema.methods.addCompletedLesson = function(lessonId, score = 100) {
    const alreadyCompleted = this.completedLessons.some(
        lesson => lesson.lessonId.toString() === lessonId.toString()
    );
    
    if (!alreadyCompleted) {
        this.completedLessons.push({
            lessonId: lessonId,
            completedAt: new Date(),
            assignmentScore: score
        });
        this.lastAccessed = new Date();
    }
    
    return this.save();
};

// طريقة لتحديث درجة الاختبار
userProgressSchema.methods.updateQuizScore = function(quizType, score) {
    if (quizType === 'midterm') {
        this.midtermScore = score;
    } else if (quizType === 'final') {
        this.finalScore = score;
    }
    this.lastAccessed = new Date();
    return this.save();
};

module.exports = mongoose.model('UserProgress', userProgressSchema);
