// ============================================
// بيانات المستخدمين (تخزين محلي)
// ============================================

let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// ============================================
// بيانات التقدم (الدروس المكتملة، الشهادات)
// ============================================

let userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
let userCertificates = JSON.parse(localStorage.getItem('userCertificates')) || [];

// ============================================
// تهيئة الصفحة
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadPage('home');
});

// ============================================
// عرض الصفحات
// ============================================

function showPage(pageId) {
    // إخفاء كل الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // إظهار الصفحة المطلوبة
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // تحميل محتوى الصفحة
    loadPage(pageId);
    
    // تحديث الرابط النشط
    updateActiveNavLink(pageId);
}

function loadPage(pageId) {
    switch(pageId) {
        case 'home':
            renderHome();
            break;
        case 'courses':
            renderCourses();
            break;
        case 'courseDetails':
            renderCourseDetails();
            break;
        case 'lesson':
            renderLesson();
            break;
        case 'assignment':
            renderAssignment();
            break;
        case 'exam':
            renderExam();
            break;
        case 'login':
            renderLogin();
            break;
        case 'register':
            renderRegister();
            break;
        case 'levelTest':
            renderLevelTest();
            break;
        case 'dashboard':
            renderDashboard();
            break;
        case 'profile':
            renderProfile();
            break;
        case 'myCertificates':
            renderMyCertificates();
            break;
        case 'certificate':
            renderCertificate();
            break;
        case 'paymentInfo':
            renderPaymentInfo();
            break;
    }
}

function updateActiveNavLink(pageId) {
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        const onclick = link.getAttribute('onclick');
        if (onclick && onclick.includes(pageId)) {
            link.style.color = '#3b82f6';
        } else {
            link.style.color = '#475569';
        }
    });
}

// ============================================
// تحديث واجهة المستخدم حسب حالة الدخول
// ============================================

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userNameSpan = document.getElementById('userName');
    const dashboardLink = document.getElementById('dashboardLink');
    const adminLink = document.getElementById('adminLink');
    
    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userNameSpan.textContent = currentUser.name;
        
        if (dashboardLink) dashboardLink.style.display = 'inline-block';
        
        // إظهار رابط الأدمن إذا كان المستخدم أدمن
        if (currentUser.role === 'admin' && adminLink) {
            adminLink.style.display = 'inline-block';
        }
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

// ============================================
// تسجيل الخروج
// ============================================

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    showPage('home');
    showMessage('تم تسجيل الخروج بنجاح', 'success');
}

// ============================================
// عرض رسائل
// ============================================

function showMessage(message, type) {
    // إزالة أي رسائل موجودة
    const oldAlert = document.querySelector('.alert');
    if (oldAlert) oldAlert.remove();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => alertDiv.remove(), 3000);
}

// ============================================
// الصفحة الرئيسية
// ============================================

function renderHome() {
    const homeDiv = document.getElementById('home');
    homeDiv.innerHTML = `
        <div class="container">
            <div class="hero">
                <h1>🌟 تعلم اللغة الإنجليزية بسهولة مع EnGo</h1>
                <p>دورات شاملة، واجبات تفاعلية، وشهادات معتمدة</p>
                <div class="hero-buttons">
                    <button onclick="showPage('courses')" class="btn-primary">ابدأ الآن</button>
                    <button onclick="showPage('levelTest')" class="btn-outline">اختبر مستواك</button>
                </div>
            </div>
            
            <div class="cards-grid">
                <div class="card">
                    <div class="card-icon"><i class="fas fa-book"></i></div>
                    <h3>دورات متكاملة</h3>
                    <p>30 درس لكل دورة مع واجبات تفاعلية واختبارات نصفي ونهائي</p>
                </div>
                <div class="card">
                    <div class="card-icon"><i class="fas fa-certificate"></i></div>
                    <h3>شهادات معتمدة</h3>
                    <p>احصل على شهادة PDF باسمك بعد إكمال كل دورة بنجاح</p>
                </div>
                <div class="card">
                    <div class="card-icon"><i class="fas fa-users"></i></div>
                    <h3>مجتمع تعليمي</h3>
                    <p>تواصل مع متعلمين آخرين وشارك تجربتك</p>
                </div>
                <div class="card">
                    <div class="card-icon"><i class="fas fa-headset"></i></div>
                    <h3>دعم فني</h3>
                    <p>فريق دعم جاهز للإجابة على استفساراتك</p>
                </div>
            </div>
            
            <div class="cards-grid">
                <div class="card">
                    <div class="card-icon"><i class="fas fa-chart-line"></i></div>
                    <h3>تتبع التقدم</h3>
                    <p>تابع تقدمك في الدروس والواجبات والاختبارات</p>
                </div>
                <div class="card">
                    <div class="card-icon"><i class="fas fa-language"></i></div>
                    <h3>قاموس مدمج</h3>
                    <p>قاموس عربي إنجليزي لترجمة الكلمات بسهولة</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// صفحة الدورات
// ============================================

function renderCourses() {
    const coursesDiv = document.getElementById('courses');
    
    let coursesHtml = `
        <div class="container">
            <h1 style="text-align: center; margin-bottom: 16px;">📚 الدورات المتاحة</h1>
            <p style="text-align: center; margin-bottom: 40px; color: #64748b;">اختر الدورة المناسبة لمستواك وابدأ التعلم</p>
            <div class="cards-grid">
    `;
    
    coursesData.forEach(course => {
        const levelClass = course.level === 'beginner' ? 'badge-beginner' : 
                           course.level === 'intermediate' ? 'badge-intermediate' : 'badge-advanced';
        const levelName = course.level === 'beginner' ? 'مبتدئ' : 
                          course.level === 'intermediate' ? 'متوسط' : 'متقدم';
        
        coursesHtml += `
            <div class="card">
                <div class="card-icon">${course.image}</div>
                <span class="card-badge ${levelClass}">${levelName}</span>
                <h3>${course.title}</h3>
                <p>${course.description.substring(0, 100)}...</p>
                <p><strong>${course.lessonsCount}</strong> درس | <strong>${course.studentsCount}</strong> طالب</p>
                <p style="font-size: 20px; font-weight: bold; color: #3b82f6; margin: 16px 0;">
                    ${course.isFree ? 'مجاناً' : course.price + ' ريال'}
                </p>
                <button onclick="viewCourse(${course.id})" class="btn-primary">${course.isFree ? 'ابدأ الآن' : 'تفاصيل الدورة'}</button>
            </div>
        `;
    });
    
    coursesHtml += `</div></div>`;
    coursesDiv.innerHTML = coursesHtml;
}

function viewCourse(courseId) {
    const course = coursesData.find(c => c.id === courseId);
    if (course) {
        currentCourse = course;
        showPage('courseDetails');
    }
}

let currentCourse = null;
let currentLesson = null;
let currentAssignment = null;
let currentExam = null;

function renderCourseDetails() {
    if (!currentCourse) {
        showPage('courses');
        return;
    }
    
    const course = currentCourse;
    const lessons = lessonsData[course.id] || [];
    const isEnrolled = currentUser && currentUser.enrolledCourses?.includes(course.id);
    
    // التحقق من الدروس المجانية (أول 5 دروس من أول دورة)
    const isFirstCourse = course.id === 1;
    
    const detailsDiv = document.getElementById('courseDetails');
    detailsDiv.innerHTML = `
        <div class="container">
            <div class="hero" style="background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 40px; margin-bottom: 30px;">
                <h1 style="font-size: 36px;">${course.title}</h1>
                <p style="font-size: 18px;">${course.description}</p>
                <div style="display: flex; gap: 16px; justify-content: center; margin-top: 24px;">
                    <span>📚 ${course.lessonsCount} درس</span>
                    <span>👥 ${course.studentsCount} طالب</span>
                    <span>⭐ ${course.rating}/5</span>
                </div>
                ${!isEnrolled && !course.isFree ? `
                    <button onclick="showPage('paymentInfo')" class="btn-primary" style="margin-top: 24px;">اشترك الآن - ${course.price} ريال</button>
                ` : ''}
                ${course.isFree && !isEnrolled && currentUser ? `
                    <button onclick="enrollCourse(${course.id})" class="btn-primary" style="margin-top: 24px;">تسجيل في الدورة</button>
                ` : ''}
            </div>
            
            <div class="card" style="padding: 24px;">
                <h2 style="margin-bottom: 24px;">محتويات الدورة</h2>
                <div class="lessons-list">
                    ${lessons.map((lesson, index) => {
                        const isCompleted = userProgress[lesson.id]?.completed;
                        const isLocked = !isEnrolled && !lesson.isFree && !(isFirstCourse && lesson.order <= 5);
                        return `
                            <div class="lesson-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e2e8f0; cursor: ${!isLocked ? 'pointer' : 'not-allowed'}; opacity: ${isLocked ? 0.6 : 1}" onclick="${!isLocked ? `viewLesson(${lesson.id})` : ''}">
                                <div style="display: flex; align-items: center; gap: 16px;">
                                    <span style="font-weight: bold;">${lesson.order}</span>
                                    ${isCompleted ? '<i class="fas fa-check-circle" style="color: #22c55e;"></i>' : 
                                      isLocked ? '<i class="fas fa-lock" style="color: #94a3b8;"></i>' : 
                                      '<i class="fas fa-play" style="color: #3b82f6;"></i>'}
                                    <span>${lesson.title}</span>
                                    ${lesson.isFree ? '<span class="card-badge badge-beginner" style="font-size: 10px;">مجاني</span>' : ''}
                                </div>
                                <span style="color: #64748b;">${lesson.duration} دقيقة</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

function enrollCourse(courseId) {
    if (!currentUser) {
        showMessage('يرجى تسجيل الدخول أولاً', 'error');
        showPage('login');
        return;
    }
    
    if (!currentUser.enrolledCourses) currentUser.enrolledCourses = [];
    if (!currentUser.enrolledCourses.includes(courseId)) {
        currentUser.enrolledCourses.push(courseId);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // تحديث في قائمة المستخدمين
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].enrolledCourses = currentUser.enrolledCourses;
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        showMessage('تم التسجيل في الدورة بنجاح!', 'success');
    }
    
    renderCourseDetails();
}

function viewLesson(lessonId) {
    // البحث عن الدرس
    let foundLesson = null;
    for (let courseId in lessonsData) {
        const lesson = lessonsData[courseId].find(l => l.id === lessonId);
        if (lesson) {
            foundLesson = lesson;
            currentLesson = lesson;
            break;
        }
    }
    
    if (foundLesson) {
        showPage('lesson');
    }
}

function renderLesson() {
    if (!currentLesson) {
        showPage('courses');
        return;
    }
    
    const lesson = currentLesson;
    const isCompleted = userProgress[lesson.id]?.completed;
    
    const lessonDiv = document.getElementById('lesson');
    lessonDiv.innerHTML = `
        <div class="container">
            <button onclick="showPage('courseDetails')" class="btn-secondary" style="margin-bottom: 20px;">
                <i class="fas fa-arrow-right"></i> العودة للدورة
            </button>
            
            <div class="lesson-container">
                <h1>${lesson.title}</h1>
                
                ${lesson.videoUrl ? `
                    <div class="video-container">
                        <iframe src="${lesson.videoUrl}" frameborder="0" allowfullscreen></iframe>
                    </div>
                ` : ''}
                
                <div class="lesson-content">
                    ${lesson.content || `<p>${lesson.description || 'محتوى الدرس سيتم إضافته قريباً'}</p>`}
                </div>
                
                ${lesson.audioUrls && lesson.audioUrls.length ? `
                    <div class="audio-player">
                        <h3>المقاطع الصوتية</h3>
                        ${lesson.audioUrls.map(url => `
                            <audio controls>
                                <source src="${url}" type="audio/mpeg">
                                متصفحك لا يدعم تشغيل الصوت
                            </audio>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${!isCompleted ? `
                    <button onclick="completeLesson(${lesson.id})" class="btn-success" style="width: 100%; margin-top: 30px;">
                        <i class="fas fa-check-circle"></i> إكمال الدرس والانتقال للواجب
                    </button>
                ` : `
                    <div style="background: #dcfce7; padding: 16px; border-radius: 16px; text-align: center; margin-top: 30px;">
                        <i class="fas fa-check-circle" style="color: #22c55e; font-size: 24px;"></i>
                        <p style="color: #166534;">تم إكمال هذا الدرس بنجاح!</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function completeLesson(lessonId) {
    if (!currentUser) {
        showMessage('يرجى تسجيل الدخول أولاً', 'error');
        showPage('login');
        return;
    }
    
    // تحديث التقدم
    if (!userProgress[lessonId]) {
        userProgress[lessonId] = { completed: true, completedAt: new Date().toISOString() };
    } else {
        userProgress[lessonId].completed = true;
    }
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
    
    // تحديث نقاط المستخدم
    const lesson = currentLesson;
    if (lesson && lesson.points) {
        currentUser.levelScore = (currentUser.levelScore || 0) + lesson.points;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    showMessage('تم إكمال الدرس بنجاح!', 'success');
    
    // عرض الواجب إذا كان موجوداً
    const assignment = assignmentsData[lessonId];
    if (assignment) {
        currentAssignment = assignment;
        showPage('assignment');
    } else {
        renderLesson();
    }
}

// ============================================
// صفحة الواجب
// ============================================

let assignmentAnswers = {};

function renderAssignment() {
    if (!currentAssignment) {
        showPage('courses');
        return;
    }
    
    const assignment = currentAssignment;
    assignmentAnswers = {};
    
    const assignmentDiv = document.getElementById('assignment');
    assignmentDiv.innerHTML = `
        <div class="container">
            <button onclick="showPage('lesson')" class="btn-secondary" style="margin-bottom: 20px;">
                <i class="fas fa-arrow-right"></i> العودة للدرس
            </button>
            
            <div class="lesson-container">
                <h1>${assignment.title}</h1>
                <p>${assignment.description || 'أجب على الأسئلة التالية'}</p>
                
                <div id="assignmentQuestions">
                    ${assignment.questions.map((q, idx) => renderQuestion(q, idx)).join('')}
                </div>
                
                <button onclick="submitAssignment()" class="btn-primary" style="width: 100%; margin-top: 30px;">
                    تسليم الواجب
                </button>
            </div>
        </div>
    `;
}

function renderQuestion(question, idx) {
    switch(question.type) {
        case 'sentence_order':
            return `
                <div class="question-card" data-qid="${idx}">
                    <div class="question-header">
                        <span>السؤال ${idx + 1}</span>
                        <span class="question-points">${question.points} نقطة</span>
                    </div>
                    <p>${question.question}</p>
                    <div class="sentence-order-words" id="order-${idx}">
                        ${question.correctOrder.map((word, i) => `
                            <div class="order-word" draggable="true" data-word="${word}">${word}</div>
                        `).join('')}
                    </div>
                </div>
            `;
        case 'word_match':
            return `
                <div class="question-card" data-qid="${idx}">
                    <div class="question-header">
                        <span>السؤال ${idx + 1}</span>
                        <span class="question-points">${question.points} نقطة</span>
                    </div>
                    <p>${question.question}</p>
                    <div class="word-match-grid" id="match-${idx}">
                        <div class="match-words">
                            ${question.matches.map(m => `
                                <div class="match-item" data-word="${m.word}">${m.word}</div>
                            `).join('')}
                        </div>
                        <div class="match-meanings">
                            ${question.matches.map(m => `
                                <div class="match-item" data-meaning="${m.meaning}">${m.meaning}</div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        case 'fill_blank':
            return `
                <div class="question-card" data-qid="${idx}">
                    <div class="question-header">
                        <span>السؤال ${idx + 1}</span>
                        <span class="question-points">${question.points} نقطة</span>
                    </div>
                    <p>${question.question}</p>
                    <div class="fill-blank-text">
                        ${question.text.replace(/___/g, '<input type="text" class="fill-blank-input" data-blank>')}
                    </div>
                </div>
            `;
        default:
            return '';
    }
}

function submitAssignment() {
    // حساب النتيجة
    let totalScore = 0;
    let totalPoints = 0;
    
    currentAssignment.questions.forEach((q, idx) => {
        totalPoints += q.points;
        // هنا يمكن إضافة منطق التصحيح
        totalScore += q.points; // مؤقتاً نعطي كل النقاط
    });
    
    const percentage = (totalScore / totalPoints) * 100;
    showMessage(`تم تسليم الواجب! حصلت على ${totalScore}/${totalPoints} (${percentage}%)`, 'success');
    
    showPage('lesson');
}

// ============================================
// صفحة الاختبار
// ============================================

let examAnswers = {};
let examTimer = null;

function renderExam() {
    if (!currentExam) {
        showPage('courses');
        return;
    }
    
    const exam = currentExam;
    examAnswers = {};
    
    const examDiv = document.getElementById('exam');
    examDiv.innerHTML = `
        <div class="container">
            <div class="lesson-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h1>${exam.title}</h1>
                    <div class="timer" style="font-size: 24px; font-weight: bold; color: #ef4444;">
                        <i class="fas fa-clock"></i> <span id="timer">${exam.timeLimit}:00</span>
                    </div>
                </div>
                
                <div id="examQuestions">
                    ${exam.questions.map((q, idx) => `
                        <div class="question-card">
                            <div class="question-header">
                                <span>السؤال ${idx + 1}</span>
                                <span class="question-points">${q.points} نقطة</span>
                            </div>
                            <p>${q.text}</p>
                            <div class="options">
                                ${q.options.map(opt => `
                                    <label style="display: block; margin: 10px 0;">
                                        <input type="radio" name="q${idx}" value="${opt}"> ${opt}
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <button onclick="submitExam()" class="btn-primary" style="width: 100%; margin-top: 30px;">
                    إنهاء الاختبار
                </button>
            </div>
        </div>
    `;
    
    // بدء المؤقت
    let timeLeft = exam.timeLimit * 60;
    examTimer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(examTimer);
            submitExam();
        } else {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function submitExam() {
    clearInterval(examTimer);
    
    // جمع الإجابات وتصحيحها
    let totalScore = 0;
    let totalPoints = 0;
    
    currentExam.questions.forEach((q, idx) => {
        totalPoints += q.points;
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        if (selected && selected.value === q.correct) {
            totalScore += q.points;
        }
    });
    
    const percentage = (totalScore / totalPoints) * 100;
    const passed = percentage >= (currentExam.passingScore || 60);
    
    showMessage(`نتيجة الاختبار: ${totalScore}/${totalPoints} (${percentage}%) - ${passed ? 'ناجح' : 'راسب'}`, passed ? 'success' : 'error');
    
    if (passed && currentExam.type === 'final') {
        generateCertificate(currentExam.courseId, percentage);
    }
    
    showPage('courseDetails');
}

// ============================================
// صفحة تسجيل الدخول
// ============================================

function renderLogin() {
    const loginDiv = document.getElementById('login');
    loginDiv.innerHTML = `
        <div class="form-container">
            <h2>🔐 تسجيل الدخول</h2>
            <form onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label>البريد الإلكتروني</label>
                    <input type="email" id="loginEmail" required>
                </div>
                <div class="form-group">
                    <label>كلمة المرور</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <button type="submit" class="btn-primary" style="width: 100%;">دخول</button>
            </form>
            <p style="text-align: center; margin-top: 20px;">
                ليس لديك حساب؟ <a href="#" onclick="showPage('register')">سجل الآن</a>
            </p>
        </div>
    `;
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateAuthUI();
        showMessage(`مرحباً ${user.name}، تم تسجيل الدخول بنجاح!`, 'success');
        showPage('dashboard');
    } else {
        showMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
    }
}

// ============================================
// صفحة التسجيل
// ============================================

function renderRegister() {
    const registerDiv = document.getElementById('register');
    registerDiv.innerHTML = `
        <div class="form-container">
            <h2>📝 إنشاء حساب جديد</h2>
            <form onsubmit="handleRegister(event)">
                <div class="form-group">
                    <label>الاسم الكامل</label>
                    <input type="text" id="regName" required>
                </div>
                <div class="form-group">
                    <label>البريد الإلكتروني</label>
                    <input type="email" id="regEmail" required>
                </div>
                <div class="form-group">
                    <label>كلمة المرور</label>
                    <input type="password" id="regPassword" required minlength="6">
                </div>
                <div class="form-group">
                    <label>تأكيد كلمة المرور</label>
                    <input type="password" id="regConfirm" required>
                </div>
                <button type="submit" class="btn-primary" style="width: 100%;">إنشاء حساب</button>
            </form>
            <p style="text-align: center; margin-top: 20px;">
                لديك حساب؟ <a href="#" onclick="showPage('login')">سجل دخول</a>
            </p>
        </div>
    `;
}

function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    
    if (password !== confirm) {
        showMessage('كلمة المرور غير متطابقة', 'error');
        return;
    }
    
    if (users.find(u => u.email === email)) {
        showMessage('البريد الإلكتروني مسجل مسبقاً', 'error');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        role: 'user',
        level: 'beginner',
        levelScore: 0,
        enrolledCourses: [],
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showMessage('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن', 'success');
    showPage('login');
}

// ============================================
// اختبار تحديد المستوى
// ============================================

let levelTestAnswers = {};

function renderLevelTest() {
    const test = examsData.levelTest;
    currentExam = test;
    
    const testDiv = document.getElementById('levelTest');
    testDiv.innerHTML = `
        <div class="container">
            <div class="form-container" style="max-width: 700px;">
                <h2>📝 اختبار تحديد المستوى</h2>
                <p style="text-align: center; margin-bottom: 30px;">أجب على الأسئلة التالية لتحديد مستواك في اللغة الإنجليزية</p>
                
                <div id="testQuestions">
                    ${test.questions.map((q, idx) => `
                        <div class="question-card" style="margin-bottom: 20px;">
                            <p><strong>${idx + 1}. ${q.text}</strong></p>
                            <div class="options">
                                ${q.options.map(opt => `
                                    <label style="display: block; margin: 8px 0;">
                                        <input type="radio" name="q${idx}" value="${opt}"> ${opt}
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <button onclick="submitLevelTest()" class="btn-primary" style="width: 100%;">إظهار النتيجة</button>
            </div>
        </div>
    `;
}

function submitLevelTest() {
    const test = examsData.levelTest;
    let score = 0;
    
    test.questions.forEach((q, idx) => {
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        if (selected && selected.value === q.correct) {
            score++;
        }
    });
    
    const percentage = (score / test.questions.length) * 100;
    let level = 'beginner';
    let levelName = 'مبتدئ';
    
    if (percentage >= 70) {
        level = 'advanced';
        levelName = 'متقدم';
    } else if (percentage >= 40) {
        level = 'intermediate';
        levelName = 'متوسط';
    }
    
    showMessage(`نتيجتك: ${score}/${test.questions.length} (${percentage}%) - مستواك: ${levelName}`, 'success');
    
    if (currentUser) {
        currentUser.level = level;
        currentUser.levelScore = percentage;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].level = level;
            users[userIndex].levelScore = percentage;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
}

// ============================================
// لوحة التحكم
// ============================================

function renderDashboard() {
    if (!currentUser) {
        showPage('home');
        return;
    }
    
    const completedCount = Object.keys(userProgress).filter(id => userProgress[id]?.completed).length;
    const certificateCount = userCertificates.filter(c => c.userId === currentUser.id).length;
    
    const dashboardDiv = document.getElementById('dashboard');
    dashboardDiv.innerHTML = `
        <div class="container">
            <div class="hero" style="background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 40px;">
                <h1 style="font-size: 32px;">👋 مرحباً ${currentUser.name}</h1>
                <p>هذه لوحة تحكمك الشخصية. تابع تقدمك في تعلم اللغة الإنجليزية</p>
            </div>
            
            <div class="cards-grid">
                <div class="card">
                    <div class="card-icon"><i class="fas fa-chart-line"></i></div>
                    <h3>مستواك الحالي</h3>
                    <p style="font-size: 32px; font-weight: bold; color: #3b82f6;">
                        ${currentUser.level === 'beginner' ? 'مبتدئ' : currentUser.level === 'intermediate' ? 'متوسط' : 'متقدم'}
                    </p>
                </div>
                <div class="card">
                    <div class="card-icon"><i class="fas fa-check-circle"></i></div>
                    <h3>الدروس المكتملة</h3>
                    <p style="font-size: 32px; font-weight: bold; color: #22c55e;">${completedCount}</p>
                </div>
                <div class="card">
                    <div class="card-icon"><i class="fas fa-certificate"></i></div>
                    <h3>الشهادات</h3>
                    <p style="font-size: 32px; font-weight: bold; color: #f59e0b;">${certificateCount}</p>
                </div>
                <div class="card">
                    <div class="card-icon"><i class="fas fa-trophy"></i></div>
                    <h3>نقاط المستوى</h3>
                    <p style="font-size: 32px; font-weight: bold; color: #ef4444;">${currentUser.levelScore || 0}</p>
                </div>
            </div>
            
            <div class="card" style="margin-top: 20px;">
                <h2 style="margin-bottom: 20px;">الدورات المسجل فيها</h2>
                ${currentUser.enrolledCourses && currentUser.enrolledCourses.length ? `
                    <div class="courses-list">
                        ${currentUser.enrolledCourses.map(courseId => {
                            const course = coursesData.find(c => c.id === courseId);
                            return course ? `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e2e8f0;">
                                    <div>
                                        <h3>${course.title}</h3>
                                        <p style="color: #64748b; font-size: 14px;">${course.lessonsCount} درس</p>
                                    </div>
                                    <button onclick="viewCourse(${course.id})" class="btn-primary" style="padding: 8px 16px;">متابعة</button>
                                </div>
                            ` : '';
                        }).join('')}
                    </div>
                ` : '<p style="text-align: center; color: #64748b;">لم تسجل في أي دورة بعد. <a href="#" onclick="showPage(\'courses\')">تصفح الدورات</a></p>'}
            </div>
            
            ${userCertificates.filter(c => c.userId === currentUser.id).length ? `
                <div class="card" style="margin-top: 20px;">
                    <h2 style="margin-bottom: 20px;">شهاداتي</h2>
                    <div class="certificates-list">
                        ${userCertificates.filter(c => c.userId === currentUser.id).map(cert => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e2e8f0;">
                                <div>
                                    <h3>${cert.courseTitle}</h3>
                                    <p style="color: #64748b; font-size: 14px;">${new Date(cert.issuedAt).toLocaleDateString('ar')}</p>
                                </div>
                                <button onclick="viewCertificate('${cert.id}')" class="btn-outline" style="padding: 8px 16px;">عرض الشهادة</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================
// الملف الشخصي
// ============================================

function renderProfile() {
    if (!currentUser) {
        showPage('home');
        return;
    }
    
    const profileDiv = document.getElementById('profile');
    profileDiv.innerHTML = `
        <div class="container">
            <div class="form-container" style="max-width: 500px;">
                <h2>👤 الملف الشخصي</h2>
                <div class="form-group">
                    <label>الاسم</label>
                    <input type="text" id="profileName" value="${currentUser.name}">
                </div>
                <div class="form-group">
                    <label>البريد الإلكتروني</label>
                    <input type="email" id="profileEmail" value="${currentUser.email}">
                </div>
                <div class="form-group">
                    <label>المستوى</label>
                    <input type="text" value="${currentUser.level === 'beginner' ? 'مبتدئ' : currentUser.level === 'intermediate' ? 'متوسط' : 'متقدم'}" disabled>
                </div>
                <button onclick="updateProfile()" class="btn-primary" style="width: 100%;">حفظ التغييرات</button>
                <button onclick="showPage('dashboard')" class="btn-secondary" style="width: 100%; margin-top: 12px;">عودة</button>
            </div>
        </div>
    `;
}

function updateProfile() {
    const newName = document.getElementById('profileName').value;
    const newEmail = document.getElementById('profileEmail').value;
    
    currentUser.name = newName;
    currentUser.email = newEmail;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].name = newName;
        users[userIndex].email = newEmail;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    updateAuthUI();
    showMessage('تم تحديث الملف الشخصي بنجاح', 'success');
    showPage('dashboard');
}

// ============================================
// الشهادات
// ============================================

function renderMyCertificates() {
    const myCerts = userCertificates.filter(c => c.userId === currentUser?.id);
    
    const certDiv = document.getElementById('myCertificates');
    certDiv.innerHTML = `
        <div class="container">
            <h1 style="text-align: center; margin-bottom: 40px;">🎓 شهاداتي</h1>
            ${myCerts.length ? `
                <div class="cards-grid">
                    ${myCerts.map(cert => `
                        <div class="card">
                            <div class="card-icon"><i class="fas fa-certificate"></i></div>
                            <h3>${cert.courseTitle}</h3>
                            <p>التقدير: ${cert.grade}</p>
                            <p>التقييم: ${cert.evaluation}</p>
                            <p>تاريخ الإصدار: ${new Date(cert.issuedAt).toLocaleDateString('ar')}</p>
                            <button onclick="viewCertificate('${cert.id}')" class="btn-primary" style="margin-top: 16px;">عرض الشهادة</button>
                        </div>
                    `).join('')}
                </div>
            ` : '<p style="text-align: center;">لا توجد شهادات بعد. أكمل الدورات للحصول على شهاداتك</p>'}
        </div>
    `;
}

function viewCertificate(certId) {
    const cert = userCertificates.find(c => c.id === certId);
    if (cert) {
        currentCertificate = cert;
        showPage('certificate');
    }
}

let currentCertificate = null;

function renderCertificate() {
    if (!currentCertificate) {
        showPage('myCertificates');
        return;
    }
    
    const cert = currentCertificate;
    const certDiv = document.getElementById('certificate');
    certDiv.innerHTML = `
        <div class="container">
            <div class="certificate" id="certificateContent">
                <h1>EnGo</h1>
                <p>منصة تعلم اللغة الإنجليزية</p>
                <hr>
                <h2>شهادة إنجاز</h2>
                <p>تشهد هذه الشهادة بأن</p>
                <h3>${cert.userName}</h3>
                <p>قد اجتاز بنجاح دورة</p>
                <h2>${cert.courseTitle}</h2>
                <div class="grade">
                    التقدير: ${cert.grade}
                </div>
                <p>التقييم: ${cert.evaluation}</p>
                <div class="certificate-footer">
                    <div>
                        <p>تاريخ الإصدار</p>
                        <p><strong>${new Date(cert.issuedAt).toLocaleDateString('ar')}</strong></p>
                    </div>
                    <div>
                        <p>رقم الشهادة</p>
                        <p><strong>${cert.certificateNumber}</strong></p>
                    </div>
                    <div>
                        <p>الختم والتوقيع</p>
                        <p><i class="fas fa-check-circle" style="color: #3b82f6; font-size: 32px;"></i></p>
                    </div>
                </div>
                <div class="qr-code" style="margin-top: 20px; text-align: center;">
                    <p>للتحقق من صحة الشهادة: engo.com/verify/${cert.certificateNumber}</p>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="downloadCertificate()" class="btn-primary">تحميل PDF</button>
                <button onclick="showPage('myCertificates')" class="btn-secondary">عودة</button>
            </div>
        </div>
    `;
}

function generateCertificate(courseId, percentage) {
    const course = coursesData.find(c => c.id === courseId);
    if (!course) return;
    
    let grade, evaluation;
    if (percentage >= 90) { grade = 'A'; evaluation = 'ممتاز'; }
    else if (percentage >= 80) { grade = 'B'; evaluation = 'جيد جداً'; }
    else if (percentage >= 70) { grade = 'C'; evaluation = 'جيد'; }
    else if (percentage >= 60) { grade = 'D'; evaluation = 'مقبول'; }
    else { grade = 'F'; evaluation = 'راسب'; }
    
    const certificate = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        courseId: course.id,
        courseTitle: course.title,
        certificateNumber: `ENGO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        score: percentage,
        grade: grade,
        evaluation: evaluation,
        issuedAt: new Date().toISOString()
    };
    
    userCertificates.push(certificate);
    localStorage.setItem('userCertificates', JSON.stringify(userCertificates));
    
    showMessage('تهانينا! حصلت على شهادة إتمام الدورة', 'success');
}

function downloadCertificate() {
    const element = document.getElementById('certificateContent');
    if (!element) return;
    
    showMessage('جاري تحميل الشهادة...', 'info');
    
    // استخدام html2pdf لتحويل الشهادة إلى PDF
    if (typeof html2pdf !== 'undefined') {
        html2pdf().from(element).save();
    } else {
        // بديل: فتح طباعة
        const printWindow = window.open('', '_blank');
        printWindow.document.write(element.outerHTML);
        printWindow.print();
    }
}

// ============================================
// معلومات الدفع
// ============================================

function renderPaymentInfo() {
    const paymentDiv = document.getElementById('paymentInfo');
    paymentDiv.innerHTML = `
        <div class="container">
            <div class="form-container" style="max-width: 500px;">
                <h2>💳 معلومات الدفع</h2>
                <div class="card" style="margin: 20px 0; text-align: center;">
                    <h3>🏦 التحويل البنكي</h3>
                    <p><strong>بنك الرياض</strong></p>
                    <p><strong>اسم المستفيد:</strong> EnGo Educational Platform</p>
                    <p><strong>رقم الحساب:</strong> SA1234567890123456</p>
                    <p><strong>الآيبان:</strong> SA1234567890123456789012</p>
                </div>
                <div class="card" style="margin: 20px 0; text-align: center;">
                    <h3>📱 المحفظة الإلكترونية</h3>
                    <p><strong>STC Pay / UrPay</strong></p>
                    <p><strong>الرقم:</strong> 0512345678</p>
                </div>
                <div class="alert-info" style="background: #fef9c3; color: #854d0e; padding: 16px; border-radius: 16px; text-align: center;">
                    <p><strong>تعليمات هامة:</strong></p>
                    <p>يرجى إرسال صورة التحويل عبر واتساب على الرقم 0512345678 مع ذكر اسم المستخدم والبريد الإلكتروني</p>
                </div>
                <button onclick="showPage('courses')" class="btn-primary" style="width: 100%;">العودة للدورات</button>
            </div>
        </div>
    `;
}
