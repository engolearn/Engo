// تكوين API
const API_URL = 'https://engo.koyeb.app';

// دالة مساعدة للطلبات
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ ما');
    }
    
    return data;
}

// دوال المصادقة
async function registerUser(name, email, password) {
    return apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
    });
}

async function loginUser(email, password) {
    return apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

// دوال الدورات
async function getAllCourses() {
    return apiCall('/courses');
}

async function getCourseDetails(courseId) {
    return apiCall(`/courses/${courseId}`);
}

// دوال الأدمن
async function createCourse(courseData) {
    return apiCall('/admin/courses', {
        method: 'POST',
        body: JSON.stringify(courseData)
    });
}

async function addLesson(lessonData) {
    return apiCall('/admin/lessons', {
        method: 'POST',
        body: JSON.stringify(lessonData)
    });
}

async function getAllCoursesAdmin() {
    return apiCall('/admin/courses');
}

async function updateCourseStatus(courseId, isPremium) {
    return apiCall(`/admin/courses/${courseId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isPremium })
    });
}

// دوال الدفع
async function submitPaymentProof(paymentData) {
    return apiCall('/payment/submit', {
        method: 'POST',
        body: JSON.stringify(paymentData)
    });
}

async function getPaymentRequests() {
    return apiCall('/admin/payment-requests');
}

async function approvePayment(requestId, userId, courseId) {
    return apiCall(`/admin/payment-requests/${requestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ userId, courseId })
    });
}
