// frontend/js/auth.js
const API_URL = 'https://engo.koyeb.app/api';

// التحقق من حالة تسجيل الدخول
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const adminPanelLink = document.getElementById('adminPanelLink');
    
    if (token && user.id) {
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.innerText = user.name || user.email;
        
        if (user.role === 'admin' && adminPanelLink) {
            adminPanelLink.style.display = 'block';
            adminPanelLink.href = '/admin';
        }
        return user;
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
        return null;
    }
}

// تسجيل الدخول
async function login(email, password) {
    try {
        const res = await fetch(API_URL + '/auth/login', {
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
}

// إنشاء حساب
async function register(name, email, password) {
    try {
        const res = await fetch(API_URL + '/auth/register', {
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
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.reload();
}

// المودالات
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

// تشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            login(email, password);
        };
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.onsubmit = function(e) {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            register(name, email, password);
        };
    }
    
    window.onclick = function(e) {
        if (e.target.id === 'loginModal') closeLoginModal();
        if (e.target.id === 'registerModal') closeRegisterModal();
    };
});
