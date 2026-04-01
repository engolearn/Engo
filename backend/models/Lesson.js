const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['sentence_arrangement', 'word_match', 'fill_blank'],
        required: true
    },
    question: String,
    sentences: [String],
    correctOrder: [Number],
    pairs: [{
        word: String,
        meaning: String
    }],
    questions: [String],
    text: String,
    correctAnswer: String
});

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    videoUrl: {
        type: String,
        default: null
    },
    audioUrl: {
        type: String,
        default: null
    },
    lessonNumber: {
        type: Number,
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    assignment: assignmentSchema,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Lesson', lessonSchema);
