// الحصول على معرف الدورة من URL
const urlParams = new URLSearchParams(window.location.search);
const courseId = parseInt(urlParams.get('id'));

let currentCourse = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCourseDetails();
});

function loadCourseDetails() {
    currentCourse = coursesData.find(c => c.id === courseId);
    
    if (!currentCourse) {
        window.location.href = 'courses.html';
        return;
    }
    
    const lessons = lessonsData[courseId] || [];
    const isEnrolled = currentUser && currentUser.enrolledCourses?.includes(courseId);
    const isFirstCourse = courseId === 1;
    
    const container = document.getElementById('courseDetailsContainer');
    
    const levelClass = currentCourse.level === 'beginner' ? 'badge-beginner' : 
                       currentCourse.level === 'intermediate' ? 'badge-intermediate' : 'badge-advanced';
    const levelName = currentCourse.level === 'beginner' ? 'مبتدئ' : 
                      currentCourse.level === 'intermediate' ? 'متوسط' : 'متقدم';
    
    container.innerHTML = `
        <div class="hero" style="background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 40px; margin: 40px 0; border-radius: 28px;">
            <h1 style="font-size: 36px;">${currentCourse.title}</h1>
            <p style="font-size: 18px;">${currentCourse.description}</p>
            <div style="display: flex; gap: 16px; justify-content: center; margin-top: 24px; flex-wrap: wrap;">
                <span>📚 ${currentCourse.lessonsCount} درس</span>
                <span>👥 ${currentCourse.studentsCount} طالب</span>
                <span>⭐ ${currentCourse.rating}/5</span>
                <span class="card-badge ${levelClass}">${levelName}</span>
            </div>
            ${!isEnrolled && !currentCourse.isFree ? `
                <button onclick="window.location.href='payment.html'" class="btn-primary" style="margin-top: 24px;">اشترك الآن - ${currentCourse.price} ريال</button>
            ` : ''}
            ${currentCourse.isFree && !isEnrolled && currentUser ? `
                <button onclick="enrollCourse()" class="btn-primary" style="margin-top: 24px;">تسجيل في الدورة مجاناً</button>
            ` : ''}
            ${!currentUser ? `
                <button onclick="window.location.href='login.html'" class="btn-primary" style="margin-top: 24px;">سجل دخول للتسجيل</button>
            ` : ''}
        </div>
        
        <div class="card" style="padding: 24px;">
            <h2 style="margin-bottom: 24px;">📖 محتويات الدورة</h2>
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
    `;
}

function enrollCourse() {
    if (!currentUser) {
        window.location.href = 'login.html';
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
        loadCourseDetails();
    }
}

function viewLesson(lessonId) {
    localStorage.setItem('currentLessonId', lessonId);
    localStorage.setItem('currentCourseId', courseId);
    window.location.href = `lesson.html?id=${lessonId}&course=${courseId}`;
}
