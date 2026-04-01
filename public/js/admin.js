// ============================================
// التحقق من صلاحيات الأدمن
// ============================================

function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

// ============================================
// صفحة الأدمن الرئيسية
// ============================================

function renderAdminDashboard() {
    if (!isAdmin()) {
        showPage('home');
        showMessage('غير مصرح لك بالوصول', 'error');
        return;
    }
    
    const adminDiv = document.getElementById('admin');
    adminDiv.innerHTML = `
        <div class="container">
            <h1 style="text-align: center; margin-bottom: 40px;">👑 لوحة تحكم الأدمن</h1>
            
            <div class="cards-grid">
                <div class="card">
                    <div class="card-icon"><i class="fas fa-users"></i></div>
                    <h3>إدارة المستخدمين</h3>
                    <p>عرض وتعديل وحذف المستخدمين</p>
                    <button onclick="showPage('adminUsers')" class="btn-primary" style="margin-top: 16px;">إدارة المستخدمين</button>
                </div>
                <div class="card">
                    <div class="card-icon"><i class="fas fa-book"></i></div>
                    <h3>إدارة الدورات</h3>
                    <p>إضافة وتعديل وحذف الدورات</p>
                    <button onclick="showPage('adminCourses')" class="btn-primary" style="margin-top: 16px;">إدارة الدورات</button>
                </div>
                <div class="card">
                    <div class="card-icon"><i class="fas fa-file-alt"></i></div>
                    <h3>إدارة الدروس</h3>
                    <p>إضافة وتعديل وحذف الدروس</p>
                    <button onclick="showPage('adminLessons')" class="btn-primary" style="margin-top: 16px;">إدارة الدروس</button>
                </div>
                <div class="card">
                    <div class="card-icon"><i class="fas fa-credit-card"></i></div>
                    <h3>تفعيل المدفوعات</h3>
                    <p>تفعيل الدورات للمستخدمين بعد الدفع</p>
                    <button onclick="showPage('adminActivate')" class="btn-primary" style="margin-top: 16px;">تفعيل المدفوعات</button>
                </div>
            </div>
            
            <div class="card" style="margin-top: 30px;">
                <h2>إحصائيات سريعة</h2>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px;">
                    <div style="text-align: center;">
                        <p style="font-size: 32px; font-weight: bold; color: #3b82f6;">${users.length}</p>
                        <p>مستخدم</p>
                    </div>
                    <div style="text-align: center;">
                        <p style="font-size: 32px; font-weight: bold; color: #3b82f6;">${coursesData.length}</p>
                        <p>دورة</p>
                    </div>
                    <div style="text-align: center;">
                        <p style="font-size: 32px; font-weight: bold; color: #3b82f6;">${Object.keys(lessonsData).reduce((sum, c) => sum + (lessonsData[c]?.length || 0), 0)}</p>
                        <p>درس</p>
                    </div>
                    <div style="text-align: center;">
                        <p style="font-size: 32px; font-weight: bold; color: #3b82f6;">${userCertificates.length}</p>
                        <p>شهادة</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// إدارة المستخدمين
// ============================================

function renderAdminUsers() {
    if (!isAdmin()) {
        showPage('home');
        return;
    }
    
    const usersDiv = document.getElementById('adminUsers');
    usersDiv.innerHTML = `
        <div class="container">
            <button onclick="showPage('admin')" class="btn-secondary" style="margin-bottom: 20px;">
                <i class="fas fa-arrow-right"></i> العودة للوحة التحكم
            </button>
            <h1 style="margin-bottom: 30px;">👥 إدارة المستخدمين</h1>
            
            <div class="card" style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 12px; text-align: right;">#</th>
                            <th style="padding: 12px; text-align: right;">الاسم</th>
                            <th style="padding: 12px; text-align: right;">البريد الإلكتروني</th>
                            <th style="padding: 12px; text-align: right;">الدور</th>
                            <th style="padding: 12px; text-align: right;">المستوى</th>
                            <th style="padding: 12px; text-align: right;">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map((user, idx) => `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px;">${idx + 1}</td>
                                <td style="padding: 12px;">${user.name}</td>
                                <td style="padding: 12px;">${user.email}</td>
                                <td style="padding: 12px;">
                                    <select onchange="updateUserRole(${user.id}, this.value)">
                                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>مستخدم</option>
                                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>أدمن</option>
                                    </select>
                                </td>
                                <td style="padding: 12px;">
                                    <span class="card-badge ${user.level === 'beginner' ? 'badge-beginner' : user.level === 'intermediate' ? 'badge-intermediate' : 'badge-advanced'}">
                                        ${user.level === 'beginner' ? 'مبتدئ' : user.level === 'intermediate' ? 'متوسط' : 'متقدم'}
                                    </span>
                                </td>
                                <td style="padding: 12px;">
                                    <button onclick="deleteUser(${user.id})" class="btn-danger" style="padding: 6px 12px; font-size: 12px;">
                                        <i class="fas fa-trash"></i> حذف
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function updateUserRole(userId, newRole) {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].role = newRole;
        localStorage.setItem('users', JSON.stringify(users));
        
        if (currentUser && currentUser.id === userId) {
            currentUser.role = newRole;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateAuthUI();
        }
        
        showMessage('تم تحديث دور المستخدم بنجاح', 'success');
        renderAdminUsers();
    }
}

function deleteUser(userId) {
    if (currentUser && currentUser.id === userId) {
        showMessage('لا يمكن حذف حسابك الحالي', 'error');
        return;
    }
    
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        users = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(users));
        showMessage('تم حذف المستخدم بنجاح', 'success');
        renderAdminUsers();
    }
}

// ============================================
// إدارة الدورات
// ============================================

function renderAdminCourses() {
    if (!isAdmin()) {
        showPage('home');
        return;
    }
    
    const coursesDiv = document.getElementById('adminCourses');
    coursesDiv.innerHTML = `
        <div class="container">
            <button onclick="showPage('admin')" class="btn-secondary" style="margin-bottom: 20px;">
                <i class="fas fa-arrow-right"></i> العودة للوحة التحكم
            </button>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h1>📚 إدارة الدورات</h1>
                <button onclick="showAddCourseModal()" class="btn-primary">+ دورة جديدة</button>
            </div>
            
            <div class="card" style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 12px; text-align: right;">#</th>
                            <th style="padding: 12px; text-align: right;">العنوان</th>
                            <th style="padding: 12px; text-align: right;">المستوى</th>
                            <th style="padding: 12px; text-align: right;">السعر</th>
                            <th style="padding: 12px; text-align: right;">الطلاب</th>
                            <th style="padding: 12px; text-align: right;">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${coursesData.map((course, idx) => `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 12px;">${idx + 1}</td>
                                <td style="padding: 12px;">${course.title}</td>
                                <td style="padding: 12px;">
                                    <span class="card-badge ${course.level === 'beginner' ? 'badge-beginner' : course.level === 'intermediate' ? 'badge-intermediate' : 'badge-advanced'}">
                                        ${course.levelName}
                                    </span>
                                </td>
                                <td style="padding: 12px;">${course.isFree ? 'مجاني' : course.price + ' ريال'}</td>
                                <td style="padding: 12px;">${course.studentsCount}</td>
                                <td style="padding: 12px;">
                                    <button onclick="editCourse(${course.id})" class="btn-secondary" style="padding: 6px 12px; margin-left: 8px;">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteCourse(${course.id})" class="btn-danger" style="padding: 6px 12px;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showAddCourseModal() {
    const newCourse = {
        id: coursesData.length + 1,
        title: prompt('عنوان الدورة:'),
        description: prompt('وصف الدورة:'),
        level: prompt('المستوى (beginner/intermediate/advanced):'),
        price: parseFloat(prompt('السعر (0 للمجاني):')) || 0,
        isFree: false,
        image: '📘',
        lessonsCount: 30,
        studentsCount: 0,
        rating: 0
    };
    
    if (newCourse.title) {
        newCourse.isFree = newCourse.price === 0;
        newCourse.levelName = newCourse.level === 'beginner' ? 'مبتدئ' : 
                              newCourse.level === 'intermediate' ? 'متوسط' : 'متقدم';
        coursesData.push(newCourse);
        localStorage.setItem('coursesData', JSON.stringify(coursesData));
        showMessage('تم إضافة الدورة بنجاح', 'success');
        renderAdminCourses();
    }
}

function editCourse(courseId) {
    const course = coursesData.find(c => c.id === courseId);
    if (course) {
        const newTitle = prompt('عنوان الدورة:', course.title);
        const newDescription = prompt('وصف الدورة:', course.description);
        const newPrice = parseFloat(prompt('السعر:', course.price));
        
        if (newTitle) course.title = newTitle;
        if (newDescription) course.description = newDescription;
        if (!isNaN(newPrice)) {
            course.price = newPrice;
            course.isFree = newPrice === 0;
        }
        
        localStorage.setItem('coursesData', JSON.stringify(coursesData));
        showMessage('تم تحديث الدورة بنجاح', 'success');
        renderAdminCourses();
    }
}

function deleteCourse(courseId) {
    if (confirm('هل أنت متأكد من حذف هذه الدورة؟')) {
        const index = coursesData.findIndex(c => c.id === courseId);
        if (index !== -1) {
            coursesData.splice(index, 1);
            localStorage.setItem('coursesData', JSON.stringify(coursesData));
            showMessage('تم حذف الدورة بنجاح', 'success');
            renderAdminCourses();
        }
    }
}

// ============================================
// إدارة الدروس
// ============================================

function renderAdminLessons() {
    if (!isAdmin()) {
        showPage('home');
        return;
    }
    
    const lessonsDiv = document.getElementById('adminLessons');
    lessonsDiv.innerHTML = `
        <div class="container">
            <button onclick="showPage('admin')" class="btn-secondary" style="margin-bottom: 20px;">
                <i class="fas fa-arrow-right"></i> العودة للوحة التحكم
            </button>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h1>📖 إدارة الدروس</h1>
                <div>
                    <select id="courseSelect" onchange="loadLessonsForCourse()" class="btn-secondary">
                        ${coursesData.map(c => `<option value="${c.id}">${c.title}</option>`).join('')}
                    </select>
                    <button onclick="showAddLessonModal()" class="btn-primary">+ درس جديد</button>
                </div>
            </div>
            
            <div id="lessonsList" class="card">
                <p style="text-align: center; padding: 40px;">اختر دورة لعرض دروسها</p>
            </div>
        </div>
    `;
}

function loadLessonsForCourse() {
    const courseId = parseInt(document.getElementById('courseSelect').value);
    const lessons = lessonsData[courseId] || [];
    
    const lessonsDiv = document.getElementById('lessonsList');
    lessonsDiv.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f1f5f9;">
                    <th style="padding: 12px; text-align: right;">الترتيب</th>
                    <th style="padding: 12px; text-align: right;">عنوان الدرس</th>
                    <th style="padding: 12px; text-align: right;">المدة</th>
                    <th style="padding: 12px; text-align: right;">مجاني</th>
                    <th style="padding: 12px; text-align: right;">الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${lessons.map(lesson => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px;">${lesson.order}</td>
                        <td style="padding: 12px;">${lesson.title}</td>
                        <td style="padding: 12px;">${lesson.duration} دقيقة</td>
                        <td style="padding: 12px;">${lesson.isFree ? 'نعم' : 'لا'}</td>
                        <td style="padding: 12px;">
                            <button onclick="editLesson(${lesson.id})" class="btn-secondary" style="padding: 6px 12px; margin-left: 8px;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteLesson(${lesson.id})" class="btn-danger" style="padding: 6px 12px;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showAddLessonModal() {
    const courseId = parseInt(document.getElementById('courseSelect').value);
    const lessons = lessonsData[courseId] || [];
    const newOrder = lessons.length + 1;
    
    const newLesson = {
        id: Date.now(),
        order: newOrder,
        title: prompt('عنوان الدرس:'),
        duration: parseInt(prompt('المدة (دقائق):')) || 15,
        isFree: confirm('هل الدرس مجاني؟'),
        points: 10,
        content: '<p>محتوى الدرس سيتم إضافته لاحقاً</p>'
    };
    
    if (newLesson.title) {
        if (!lessonsData[courseId]) lessonsData[courseId] = [];
        lessonsData[courseId].push(newLesson);
        localStorage.setItem('lessonsData', JSON.stringify(lessonsData));
        showMessage('تم إضافة الدرس بنجاح', 'success');
        loadLessonsForCourse();
    }
}

function editLesson(lessonId) {
    for (let courseId in lessonsData) {
        const lesson = lessonsData[courseId].find(l => l.id === lessonId);
        if (lesson) {
            const newTitle = prompt('عنوان الدرس:', lesson.title);
            const newDuration = parseInt(prompt('المدة (دقائق):', lesson.duration));
            if (newTitle) lesson.title = newTitle;
            if (!isNaN(newDuration)) lesson.duration = newDuration;
            localStorage.setItem('lessonsData', JSON.stringify(lessonsData));
            showMessage('تم تحديث الدرس بنجاح', 'success');
            loadLessonsForCourse();
            break;
        }
    }
}

function deleteLesson(lessonId) {
    if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
        for (let courseId in lessonsData) {
            const index = lessonsData[courseId].findIndex(l => l.id === lessonId);
            if (index !== -1) {
                lessonsData[courseId].splice(index, 1);
                localStorage.setItem('lessonsData', JSON.stringify(lessonsData));
                showMessage('تم حذف الدرس بنجاح', 'success');
                loadLessonsForCourse();
                break;
            }
        }
    }
}

// ============================================
// تفعيل المدفوعات
// ============================================

function renderAdminActivate() {
    if (!isAdmin()) {
        showPage('home');
        return;
    }
    
    const activateDiv = document.getElementById('adminActivate');
    activateDiv.innerHTML = `
        <div class="container">
            <button onclick="showPage('admin')" class="btn-secondary" style="margin-bottom: 20px;">
                <i class="fas fa-arrow-right"></i> العودة للوحة التحكم
            </button>
            <h1 style="margin-bottom: 30px;">💳 تفعيل المدفوعات اليدوية</h1>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div class="card">
                    <h3>اختر المستخدم</h3>
                    <select id="activateUser" class="form-group" style="width: 100%; margin-top: 16px;">
                        <option value="">-- اختر المستخدم --</option>
                        ${users.filter(u => u.role !== 'admin').map(user => `
                            <option value="${user.id}">${user.name} (${user.email})</option>
                        `).join('')}
                    </select>
                </div>
                <div class="card">
                    <h3>اختر الدورة</h3>
                    <select id="activateCourse" class="form-group" style="width: 100%; margin-top: 16px;">
                        <option value="">-- اختر الدورة --</option>
                        ${coursesData.map(course => `
                            <option value="${course.id}">${course.title} - ${course.isFree ? 'مجاني' : course.price + ' ريال'}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="activateCourseForUser()" class="btn-primary">تفعيل الدورة للمستخدم</button>
            </div>
        </div>
    `;
}

function activateCourseForUser() {
    const userId = parseInt(document.getElementById('activateUser').value);
    const courseId = parseInt(document.getElementById('activateCourse').value);
    
    if (!userId || !courseId) {
        showMessage('يرجى اختيار المستخدم والدورة', 'error');
        return;
    }
    
    const user = users.find(u => u.id === userId);
    const course = coursesData.find(c => c.id === courseId);
    
    if (user && course) {
        if (!user.enrolledCourses) user.enrolledCourses = [];
        if (!user.enrolledCourses.includes(courseId)) {
            user.enrolledCourses.push(courseId);
            localStorage.setItem('users', JSON.stringify(users));
            
            if (currentUser && currentUser.id === userId) {
                currentUser.enrolledCourses = user.enrolledCourses;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
            
            showMessage(`تم تفعيل دورة "${course.title}" للمستخدم ${user.name} بنجاح`, 'success');
        } else {
            showMessage('المستخدم مسجل بالفعل في هذه الدورة', 'error');
        }
    }
}

// ============================================
// تهيئة صفحات الأدمن
// ============================================

// تسجيل صفحات الأدمن في نظام الصفحات
function initAdminPages() {
    // إضافة معالجة لصفحات الأدمن
    const originalLoadPage = loadPage;
    window.loadPage = function(pageId) {
        if (pageId === 'admin') {
            renderAdminDashboard();
        } else if (pageId === 'adminUsers') {
            renderAdminUsers();
        } else if (pageId === 'adminCourses') {
            renderAdminCourses();
        } else if (pageId === 'adminLessons') {
            renderAdminLessons();
        } else if (pageId === 'adminActivate') {
            renderAdminActivate();
        } else {
            originalLoadPage(pageId);
        }
    };
    
    loadPage = window.loadPage;
}

// تهيئة صفحة الأدمن عند التحميل
initAdminPages();
