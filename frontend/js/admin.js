// التحقق من صلاحيات الأدمن
document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role !== 'admin') {
        showAlert('غير مصرح لك بالدخول إلى هذه الصفحة', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // تحميل البيانات
    await loadCoursesForAdmin();
    await loadPaymentRequests();
    await loadCoursesForSelect();
});

// تحميل الدورات للأدمن
async function loadCoursesForAdmin() {
    try {
        const courses = await getAllCoursesAdmin();
        displayCoursesAdmin(courses);
    } catch (error) {
        console.error('خطأ في تحميل الدورات:', error);
    }
}

// عرض الدورات في لوحة الأدمن
function displayCoursesAdmin(courses) {
    const container = document.getElementById('coursesList');
    
    if (!courses || courses.length === 0) {
        container.innerHTML = '<p>لا توجد دورات حالياً</p>';
        return;
    }
    
    container.innerHTML = courses.map(course => `
        <div class="course-admin-card">
            <div>
                <strong>${course.title}</strong>
                <span style="color: #888; margin-right: 10px;">(${course.level === 'beginner' ? 'مبتدئ' : 'متقدم'})</span>
                <span style="color: ${course.isPremium ? '#ed8936' : '#48bb78'}">
                    ${course.isPremium ? `💰 ${course.price} ريال` : 'مجاني'}
                </span>
            </div>
            <div>
                <button onclick="toggleCourseStatus('${course._id}', ${!course.isPremium})" class="btn-copy">
                    ${course.isPremium ? 'تحويل إلى مجاني' : 'تحويل إلى مدفوع'}
                </button>
                <button onclick="deleteCourse('${course._id}')" style="background: #e53e3e; margin-right: 5px;">حذف</button>
            </div>
        </div>
    `).join('');
}

// تغيير حالة الدورة (مجاني/مدفوع)
async function toggleCourseStatus(courseId, makePremium) {
    try {
        await updateCourseStatus(courseId, makePremium);
        showAlert('تم تحديث حالة الدورة بنجاح', 'success');
        await loadCoursesForAdmin();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// إضافة دورة جديدة
document.getElementById('addCourseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const courseData = {
        title: document.getElementById('courseTitle').value,
        description: document.getElementById('courseDescription').value,
        level: document.getElementById('courseLevel').value,
        price: parseInt(document.getElementById('coursePrice').value),
        isPremium: document.getElementById('coursePremium').checked,
        image: document.getElementById('courseImage').value || null
    };
    
    try {
        await createCourse(courseData);
        showAlert('تم إضافة الدورة بنجاح', 'success');
        e.target.reset();
        await loadCoursesForAdmin();
        await loadCoursesForSelect();
    } catch (error) {
        showAlert(error.message, 'error');
    }
});

// تحميل الدورات للقائمة المنسدلة
async function loadCoursesForSelect() {
    try {
        const courses = await getAllCoursesAdmin();
        const select = document.getElementById('lessonCourse');
        select.innerHTML = '<option value="">اختر الدورة</option>' + 
            courses.map(course => `<option value="${course._id}">${course.title}</option>`).join('');
    } catch (error) {
        console.error('خطأ:', error);
    }
}

// إضافة درس
document.getElementById('addLessonForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const assignmentType = document.getElementById('assignmentType').value;
    let assignment = null;
    
    if (assignmentType !== 'none') {
        assignment = getAssignmentData(assignmentType);
    }
    
    const lessonData = {
        title: document.getElementById('lessonTitle').value,
        content: document.getElementById('lessonContent').value,
        videoUrl: document.getElementById('lessonVideo').value,
        audioUrl: document.getElementById('lessonAudio').value,
        lessonNumber: parseInt(document.getElementById('lessonNumber').value),
        courseId: document.getElementById('lessonCourse').value,
        assignment: assignment
    };
    
    try {
        await addLesson(lessonData);
        showAlert('تم إضافة الدرس بنجاح', 'success');
        e.target.reset();
        document.getElementById('assignmentFields').style.display = 'none';
    } catch (error) {
        showAlert(error.message, 'error');
    }
});

// الحصول على بيانات الواجب حسب النوع
function getAssignmentData(type) {
    switch(type) {
        case 'sentence_arrangement':
            const sentences = prompt('أدخل الجمل مفصولة بفواصل:').split(',');
            const correctOrder = prompt('أدخل الترتيب الصحيح (مثال: 0,1,2):').split(',').map(Number);
            return {
                type: 'sentence_arrangement',
                question: 'رتب الجمل التالية:',
                sentences: sentences,
                correctOrder: correctOrder
            };
            
        case 'word_match':
            const pairs = [];
            let addMore = true;
            while(addMore) {
                const word = prompt('أدخل الكلمة:');
                const meaning = prompt('أدخل المعنى:');
                if(word && meaning) pairs.push({word, meaning});
                addMore = confirm('هل تريد إضافة زوج آخر؟');
            }
            return {
                type: 'word_match',
                pairs: pairs,
                questions: pairs.map(p => p.word)
            };
            
        case 'fill_blank':
            const text = prompt('أدخل النص مع ____ للفراغ:');
            const correctAnswer = prompt('أدخل الإجابة الصحيحة:');
            return {
                type: 'fill_blank',
                text: text,
                correctAnswer: correctAnswer
            };
            
        default:
            return null;
    }
}

// تغيير حقول الواجب حسب النوع
document.getElementById('assignmentType')?.addEventListener('change', (e) => {
    const fields = document.getElementById('assignmentFields');
    if (e.target.value === 'none') {
        fields.style.display = 'none';
    } else {
        fields.style.display = 'block';
        fields.innerHTML = '<p class="payment-info">⚠️ سيتم طلب تفاصيل الواجب عند إرسال النموذج</p>';
    }
});

// تحميل طلبات الدفع
async function loadPaymentRequests() {
    try {
        const requests = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
        displayPaymentRequests(requests);
    } catch (error) {
        console.error('خطأ:', error);
    }
}

// عرض طلبات الدفع
function displayPaymentRequests(requests) {
    const container = document.getElementById('paymentRequestsList');
    
    if (!requests || requests.length === 0) {
        container.innerHTML = '<p>لا توجد طلبات دفع حالياً</p>';
        return;
    }
    
    const pendingRequests = requests.filter(r => r.status === 'pending');
    
    if (pendingRequests.length === 0) {
        container.innerHTML = '<p>لا توجد طلبات معلقة</p>';
        return;
    }
    
    container.innerHTML = pendingRequests.map(request => `
        <div class="course-admin-card" style="flex-direction: column; align-items: flex-start;">
            <div style="width: 100%; margin-bottom: 10px;">
                <strong>👤 ${request.userName}</strong><br>
                <small>📧 ${request.userEmail}</small><br>
                <strong>📚 ${request.courseTitle}</strong><br>
                <strong>💰 المبلغ: ${request.amount} ريال</strong><br>
                <strong>🆔 رقم العملية: ${request.transactionId}</strong><br>
                ${request.paymentNote ? `<strong>📝 ملاحظات: ${request.paymentNote}</strong><br>` : ''}
                <strong>📅 التاريخ: ${new Date(request.createdAt).toLocaleString()}</strong>
            </div>
            ${request.paymentImage ? `
                <div style="margin: 10px 0;">
                    <strong>🖼️ إثبات الدفع:</strong><br>
                    <img src="${request.paymentImage}" style="max-width: 200px; border-radius: 10px; margin-top: 5px;">
                </div>
            ` : ''}
            <div style="margin-top: 10px;">
                <button onclick="approvePaymentRequest(${request.requestId}, '${request.userId}', '${request.courseId}')" style="background: #48bb78;">✅ قبول الطلب</button>
                <button onclick="rejectPaymentRequest(${request.requestId})" style="background: #e53e3e; margin-right: 10px;">❌ رفض الطلب</button>
            </div>
        </div>
    `).join('');
}

// قبول طلب الدفع
async function approvePaymentRequest(requestId, userId, courseId) {
    try {
        // تحديث حالة المستخدم في localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id === userId) {
            const purchasedCourses = user.purchasedCourses || [];
            if (!purchasedCourses.includes(courseId)) {
                purchasedCourses.push(courseId);
                user.purchasedCourses = purchasedCourses;
                localStorage.setItem('user', JSON.stringify(user));
            }
        }
        
        // إزالة الطلب من قائمة المعلقة
        const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
        const updatedPayments = pendingPayments.filter(p => p.requestId !== requestId);
        localStorage.setItem('pendingPayments', JSON.stringify(updatedPayments));
        
        showAlert('تم قبول الطلب وفتح الدورة للمستخدم', 'success');
        await loadPaymentRequests();
        
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// رفض طلب الدفع
function rejectPaymentRequest(requestId) {
    if (confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
        const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
        const updatedPayments = pendingPayments.filter(p => p.requestId !== requestId);
        localStorage.setItem('pendingPayments', JSON.stringify(updatedPayments));
        
        showAlert('تم رفض الطلب', 'success');
        loadPaymentRequests();
    }
}
