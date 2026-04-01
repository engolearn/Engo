// frontend/js/auth.js
const API_URL = 'https://engo.koyeb.app/api';

// دوال عرض الصفحات
window.showPage = function(page) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    // إظهار الصفحة المطلوبة
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) pageElement.style.display = 'block';
    
    // تحديث الرابط النشط
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
};

// نافذة تسجيل الدخول
window.showLoginModal = () => {
    document.getElementById('loginModal').style.display = 'block';
};

window.closeLoginModal = () => {
    document.getElementById('loginModal').style.display = 'none';
};

window.showRegisterModal = () => {
    document.getElementById('registerModal').style.display = 'block';
};

window.closeRegisterModal = () => {
    document.getElementById('registerModal').style.display = 'none';
};

// تسجيل الدخول
window.login = async (email, password) => {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message);
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert('✅ تم تسجيل الدخول بنجاح');
        location.reload();
        
    } catch (err) {
        alert('❌ ' + err.message);
    }
};

// إنشاء حساب
window.register = async (name, email, password) => {
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message);
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert('✅ تم إنشاء الحساب بنجاح');
        location.reload();
        
    } catch (err) {
        alert('❌ ' + err.message);
    }
};

// تسجيل خروج
window.logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.reload();
};

// التحقق من الحالة وإظهار الروابط المناسبة
window.checkAuth = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const authDiv = document.getElementById('authButtons');
    const userDiv = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    
    // روابط الأدمن
    const adminLink = document.getElementById('adminLink');
    const dashboardLink = document.getElementById('dashboardLink');
    
    if (token && user.id) {
        // إخفاء أزرار تسجيل الدخول
        if (authDiv) authDiv.style.display = 'none';
        if (userDiv) userDiv.style.display = 'flex';
        if (userName) userName.innerText = user.name || user.email;
        
        // ✅ إظهار روابط الأدمن إذا كان المستخدم أدمن
        if (user.role === 'admin') {
            if (adminLink) adminLink.style.display = 'inline-block';
            if (dashboardLink) dashboardLink.style.display = 'inline-block';
        } else {
            if (adminLink) adminLink.style.display = 'none';
            if (dashboardLink) dashboardLink.style.display = 'none';
        }
        
        return user;
    } else {
        // إظهار أزرار تسجيل الدخول
        if (authDiv) authDiv.style.display = 'flex';
        if (userDiv) userDiv.style.display = 'none';
        
        // إخفاء روابط الأدمن
        if (adminLink) adminLink.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
        
        return null;
    }
};

// تشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.checkAuth();
    
    // نموذج تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            window.login(email, password);
        };
    }
    
    // نموذج إنشاء حساب
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            window.register(name, email, password);
        };
    }
    
    // إغلاق المودالات عند النقر خارجها
    window.onclick = (e) => {
        if (e.target.id === 'loginModal') window.closeLoginModal();
        if (e.target.id === 'registerModal') window.closeRegisterModal();
    };
    
    // عرض الصفحة الرئيسية افتراضياً
    if (typeof showPage === 'function') {
        showPage('home');
    }
});
