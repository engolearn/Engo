// تحميل الدورات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    
    // إضافة مستمع لرابط الدورات
    const coursesLink = document.getElementById('coursesLink');
    if (coursesLink) {
        coursesLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('coursesSection').scrollIntoView({ behavior: 'smooth' });
        });
    }
});

// تحميل جميع الدورات
async function loadCourses() {
    try {
        const courses = await getAllCourses();
        displayCourses(courses);
    } catch (error) {
        console.error('خطأ في تحميل الدورات:', error);
        document.getElementById('coursesGrid').innerHTML = `
            <div class="error-message">
                <p>حدث خطأ في تحميل الدورات</p>
                <button onclick="loadCourses()" class="btn-primary">إعادة المحاولة</button>
            </div>
        `;
    }
}

// عرض الدورات في الصفحة
function displayCourses(courses) {
    const coursesGrid = document.getElementById('coursesGrid');
    
    if (!courses || courses.length === 0) {
        coursesGrid.innerHTML = `
            <div class="no-courses">
                <p>📚 لا توجد دورات متاحة حالياً</p>
                <p>سيتم إضافة دورات قريباً</p>
            </div>
        `;
        return;
    }
    
    coursesGrid.innerHTML = courses.map(course => `
        <div class="course-card" onclick="viewCourseDetails('${course._id}')">
            <img src="${course.image || '/assets/images/default-course.jpg'}" alt="${course.title}" class="course-image">
            <div class="course-info">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description.substring(0, 100)}...</p>
                <div class="course-meta">
                    <span>📚 ${course.totalLessons || 0} درس</span>
                    <span>⭐ ${course.level === 'beginner' ? 'مبتدئ' : 'متقدم'}</span>
                </div>
                <div class="course-price">
                    ${course.isPremium ? `${course.price} ريال` : 'مجاني'}
                </div>
                ${renderCourseButton(course)}
            </div>
        </div>
    `).join('');
}

// عرض زر مناسب حسب حالة الدورة
function renderCourseButton(course) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isPurchased = user.purchasedCourses?.includes(course._id);
    
    if (!user.id) {
        return `<button class="btn-enroll" onclick="event.stopPropagation(); showLoginModal()">تسجيل للاشتراك</button>`;
    }
    
    if (isPurchased) {
        return `<button class="btn-enroll" onclick="event.stopPropagation(); viewCourseDetails('${course._id}')">مشاهدة الدورة</button>`;
    }
    
    if (!course.isPremium) {
        return `<button class="btn-enroll" onclick="event.stopPropagation(); viewCourseDetails('${course._id}')">بدء التعلم</button>`;
    }
    
    return `<button class="btn-enroll" onclick="event.stopPropagation(); showPaymentModal('${course._id}', '${course.title}', '${course.price}')">شراء الدورة</button>`;
}

// عرض تفاصيل الدورة
function viewCourseDetails(courseId) {
    window.location.href = `course-details.html?id=${courseId}`;
}

// التمرير إلى قسم الدورات
function scrollToCourses() {
    document.getElementById('coursesSection').scrollIntoView({ behavior: 'smooth' });
}
