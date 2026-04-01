// ============================================
// بيانات الدورات
// ============================================

const coursesData = [
    {
        id: 1,
        title: "English for Beginners",
        slug: "english-for-beginners",
        description: "دورة شاملة للمبتدئين تشمل أساسيات اللغة الإنجليزية من الصفر. ستتعلم الحروف، الأرقام، المفردات الأساسية، وقواعد اللغة البسيطة.",
        level: "beginner",
        levelName: "مبتدئ",
        price: 0,
        isFree: true,
        image: "📘",
        lessonsCount: 30,
        studentsCount: 1250,
        rating: 4.8,
        createdAt: "2026-01-01"
    },
    {
        id: 2,
        title: "Intermediate English",
        slug: "intermediate-english",
        description: "دورة للمستوى المتوسط لتحسين مهارات المحادثة والقواعد. ستتعلم كيفية التحدث بطلاقة، كتابة المقالات، وفهم النصوص المعقدة.",
        level: "intermediate",
        levelName: "متوسط",
        price: 99,
        isFree: false,
        image: "📗",
        lessonsCount: 30,
        studentsCount: 890,
        rating: 4.7,
        createdAt: "2026-01-15"
    },
    {
        id: 3,
        title: "Advanced English",
        slug: "advanced-english",
        description: "دورة متقدمة للاحتراف في اللغة الإنجليزية. ستتعلم المصطلحات المتقدمة، الكتابة الأكاديمية، والمحادثات الاحترافية.",
        level: "advanced",
        levelName: "متقدم",
        price: 149,
        isFree: false,
        image: "📕",
        lessonsCount: 30,
        studentsCount: 540,
        rating: 4.9,
        createdAt: "2026-02-01"
    }
];

// ============================================
// بيانات الدروس
// ============================================

const lessonsData = {
    1: [ // دروس دورة المبتدئين
        { id: 101, order: 1, title: "الحروف الإنجليزية", duration: 15, isFree: true, points: 10,
          content: "<h3>الحروف الإنجليزية</h3><p>تتكون اللغة الإنجليزية من 26 حرفاً...</p>",
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          audioUrls: ["audio/alphabet.mp3"] },
        { id: 102, order: 2, title: "الأرقام", duration: 20, isFree: true, points: 10,
          content: "<h3>الأرقام بالإنجليزية</h3><p>الأرقام من 1 إلى 100...</p>",
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
        { id: 103, order: 3, title: "التحيات", duration: 18, isFree: true, points: 10,
          content: "<h3>تحيات اللغة الإنجليزية</h3><p>كيف تلقي التحية...</p>" },
        { id: 104, order: 4, title: "الألوان", duration: 12, isFree: true, points: 10 },
        { id: 105, order: 5, title: "أفراد العائلة", duration: 20, isFree: true, points: 10 },
        { id: 106, order: 6, title: "الأفعال الأساسية", duration: 25, isFree: false, points: 15 },
        { id: 107, order: 7, title: "الأسماء", duration: 22, isFree: false, points: 15 },
        // ... باقي الدروس حتى 30
    ]
};

// ============================================
// بيانات الواجبات
// ============================================

const assignmentsData = {
    101: {
        lessonId: 101,
        title: "واجب الحروف",
        questions: [
            {
                type: "sentence_order",
                question: "رتب الجملة التالية:",
                correctOrder: ["I", "love", "English"],
                points: 10
            },
            {
                type: "word_match",
                question: "طابق الكلمة مع معناها:",
                matches: [
                    { word: "Hello", meaning: "مرحباً" },
                    { word: "Book", meaning: "كتاب" },
                    { word: "Teacher", meaning: "معلم" }
                ],
                points: 15
            },
            {
                type: "fill_blank",
                question: "أكمل الفراغات:",
                text: "I ___ to school every day. She ___ a teacher.",
                blanks: [
                    { position: 0, correctAnswer: "go" },
                    { position: 1, correctAnswer: "is" }
                ],
                points: 10
            }
        ]
    }
};

// ============================================
// بيانات الاختبارات
// ============================================

const examsData = {
    levelTest: {
        id: "levelTest",
        title: "اختبار تحديد المستوى",
        type: "level_test",
        questions: [
            { id: 1, text: "I ___ to school every day.", options: ["go", "goes", "going"], correct: "go", points: 10 },
            { id: 2, text: "She ___ watching TV now.", options: ["is", "am", "are"], correct: "is", points: 10 },
            { id: 3, text: "What ___ your name?", options: ["is", "are", "am"], correct: "is", points: 10 },
            { id: 4, text: "They ___ playing football yesterday.", options: ["was", "were", "is"], correct: "were", points: 10 },
            { id: 5, text: "I have ___ apple.", options: ["a", "an", "the"], correct: "an", points: 10 }
        ],
        passingScore: 60,
        timeLimit: 30
    },
    midterm: {
        id: 1,
        title: "اختبار منتصف الدورة",
        type: "midterm",
        courseId: 1,
        questions: [
            { id: 1, text: "Choose the correct answer...", options: ["A", "B", "C"], correct: "A", points: 5 }
        ]
    },
    final: {
        id: 1,
        title: "الاختبار النهائي",
        type: "final",
        courseId: 1,
        questions: []
    }
};
