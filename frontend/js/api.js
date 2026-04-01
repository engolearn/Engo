// frontend/js/api.js
const API_URL = 'https://engo.koyeb.app/api';

async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    
    const res = await fetch(API_URL + endpoint, {
        ...options,
        headers
    });
    
    const data = await res.json();
    
    if (!res.ok) {
        throw new Error(data.message || 'حدث خطأ');
    }
    
    return data;
}

// المصادقة
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

// الدورات
async function getAllCourses() {
    return apiCall('/courses');
}

async function getCourseDetails(courseId) {
    return apiCall('/courses/' + courseId);
}

// الأدمن
async function createCourse(data) {
    return apiCall('/admin/courses', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function addLesson(data) {
    return apiCall('/admin/lessons', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getAllCoursesAdmin() {
    return apiCall('/admin/courses');
}

async function updateCourseStatus(courseId, isPremium) {
    return apiCall('/admin/courses/' + courseId + '/status', {
        method: 'PUT',
        body: JSON.stringify({ isPremium })
    });
}
