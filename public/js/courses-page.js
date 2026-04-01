// عرض الدورات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    renderCoursesPage();
});

function renderCoursesPage() {
    const container = document.getElementById('coursesGrid');
    if (!container) return;
    
    let html = '';
    
    coursesData.forEach(course => {
        const levelClass = course.level === 'beginner' ? 'badge-beginner' : 
                           course.level === 'intermediate' ? 'badge-intermediate' : 'badge-advanced';
        const levelName = course.level === 'beginner' ? 'مبتدئ' : 
                          course.level === 'intermediate' ? 'متوسط' : 'متقدم';
        
        html += `
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
    
    container.innerHTML = html;
}

function viewCourse(courseId) {
    localStorage.setItem('selectedCourse', courseId);
    window.location.href = `course-details.html?id=${courseId}`;
}
