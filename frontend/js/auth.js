// frontend/js/auth.js
const API_URL = 'https://engo.koyeb.app/api';

// دوال عامة
window.showLoginModal = function() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'block';
};

window.closeLoginModal = function() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
};

window.showRegisterModal = function() {
    const modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'block';
};

window.closeRegisterModal = function() {
    const modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'none';
};

// تسجيل الدخول
window.login = async function(email, password) {
    try {
        console.log('📡 Sending login request...');
        
        const response = await fetch(API_URL + '/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('📥 Response status:', response.status);
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'فشل تسجيل الدخول');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert('✅ تم تسجيل الدخول بنجاح');
        window.location.reload();
        
    } catch (error) {
        console.error('❌ Login error:', error);
        alert('❌ خطأ: ' + error.message + '\nتأكد من الاتصال بالإنترنت');
    }
};

// إنشاء حساب
window.register = async function(name, email, password) {
    try {
        console.log('📡 Sending register request...');
        
        const response = await fetch(API_URL + '/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        console.log('📥 Response status:', response.status);
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'فشل إنشاء الحساب');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert('✅ تم إنشاء الحساب بنجاح');
        window.location.reload();
        
    } catch (error) {
        console.error('❌ Register error:', error);
        alert('❌ خطأ: ' + error.message);
    }
};

// تسجيل الخروج
window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
};

// التحقق من حالة الدخول
window.checkAuth = function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    
    if (token && user.id) {
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.innerText = user.name || user.email;
        return user;
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
        return null;
    }
};

// تحميل الدورات
window.loadCourses = async function() {
    try {
        const response = await fetch(API_URL + '/courses');
        const courses = await response.json();
        
        const grid = document.getElementById('coursesGrid');
        if (!grid) return;
        
        if (!courses || courses.length === 0) {
            grid.innerHTML = '<div class="no-courses"><p>📚 لا توجد دورات متاحة حالياً</p><p>سيتم إضافة دورات قريباً</p></div>';
            return;
        }
        
        grid.innerHTML = courses.map(course => `
            <div class="course-card">
                <div class="course-info">
                    <h3>${course.title}</h3>
                    <p>${course.description}</p>
                    <div class="course-price">${course.isPremium ? course.price + ' ريال' : 'مجاني'}</div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading courses:', error);
        const grid = document.getElementById('coursesGrid');
        if (grid) {
            grid.innerHTML = '<div class="error-message"><p>⚠️ حدث خطأ في تحميل الدورات</p></div>';
        }
    }
};

// تشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded, initializing...');
    
    window.checkAuth();
    window.loadCourses();
    
    // نموذج تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            window.login(email, password);
        };
    }
    
    // نموذج إنشاء حساب
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.onsubmit = function(e) {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            window.register(name, email, password);
        };
    }
    
    // إغلاق المودالات
    window.onclick = function(e) {
        if (e.target.id === 'loginModal') window.closeLoginModal();
        if (e.target.id === 'registerModal') window.closeRegisterModal();
    };
});
