// الحصول على معرف الدرس من URL
const urlParams = new URLSearchParams(window.location.search);
const lessonId = parseInt(urlParams.get('id'));
const courseId = parseInt(urlParams.get('course'));

let currentLesson = null;

document.addEventListener('DOMContentLoaded', () => {
    loadLesson();
});

function loadLesson() {
    // البحث عن الدرس
    const lessons = lessonsData[courseId] || [];
    currentLesson = lessons.find(l => l.id === lessonId);
    
    if (!currentLesson) {
        window.location.href = 'courses.html';
        return;
    }
    
    const isCompleted = userProgress[lessonId]?.completed;
    
    const container = document.getElementById('lessonContainer');
    
    container.innerHTML = `
        <button onclick="window.location.href='course-details.html?id=${courseId}'" class="btn-secondary" style="margin: 20px 0;">
            <i class="fas fa-arrow-right"></i> العودة للدورة
        </button>
        
        <div class="lesson-container">
            <h1>${currentLesson.title}</h1>
            
            ${currentLesson.videoUrl ? `
                <div class="video-container">
                    <iframe src="${currentLesson.videoUrl}" frameborder="0" allowfullscreen></iframe>
                </div>
            ` : ''}
            
            <div class="lesson-content" style="margin: 30px 0;">
                ${currentLesson.content || `<p>${currentLesson.description || 'محتوى الدرس سيتم إضافته قريباً'}</p>`}
            </div>
            
            ${currentLesson.audioUrls && currentLesson.audioUrls.length ? `
                <div class="audio-player">
                    <h3>🎵 المقاطع الصوتية</h3>
                    ${currentLesson.audioUrls.map(url => `
                        <audio controls style="width: 100%; margin: 10px 0;">
                            <source src="${url}" type="audio/mpeg">
                            متصفحك لا يدعم تشغيل الصوت
                        </audio>
                    `).join('')}
                </div>
            ` : ''}
            
            ${!isCompleted ? `
                <button onclick="completeLesson()" class="btn-success" style="width: 100%; margin-top: 30px; padding: 16px;">
                    <i class="fas fa-check-circle"></i> إكمال الدرس
                </button>
            ` : `
                <div style="background: #dcfce7; padding: 20px; border-radius: 16px; text-align: center; margin-top: 30px;">
                    <i class="fas fa-check-circle" style="color: #22c55e; font-size: 24px;"></i>
                    <p style="color: #166534; margin-top: 10px;">تم إكمال هذا الدرس بنجاح!</p>
                    ${assignmentsData[lessonId] ? `
                        <button onclick="window.location.href='assignment.html?lesson=${lessonId}'" class="btn-primary" style="margin-top: 16px;">
                            الانتقال للواجب
                        </button>
                    ` : ''}
                </div>
            `}
        </div>
    `;
}

function completeLesson() {
    if (!currentUser) {
        showMessage('يرجى تسجيل الدخول أولاً', 'error');
        window.location.href = 'login.html';
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
    if (currentLesson && currentLesson.points) {
        currentUser.levelScore = (currentUser.levelScore || 0) + currentLesson.points;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    showMessage('تم إكمال الدرس بنجاح!', 'success');
    
    // الانتقال للواجب إذا كان موجوداً
    if (assignmentsData[lessonId]) {
        window.location.href = `assignment.html?lesson=${lessonId}`;
    } else {
        loadLesson();
    }
}
