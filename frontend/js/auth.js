// frontend/js/auth.js
const API_URL = 'https://engo.koyeb.app/api';

// تسجيل الدخول
window.login = async function(email, password) {
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
        alert('✅ تم تسجيل الدخول');
        location.reload();
    } catch(err) {
        alert('❌ ' + err.message);
    }
};

// إنشاء حساب
window.register = async function(name, email, password) {
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
        alert('✅ تم إنشاء الحساب');
        location.reload();
    } catch(err) {
        alert('❌ ' + err.message);
    }
};

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.reload();
};

window.showLoginModal = function() {
    document.getElementById('loginModal').style.display = 'block';
};

window.closeLoginModal = function() {
    document.getElementById('loginModal').style.display = 'none';
};

window.showRegisterModal = function() {
    document.getElementById('registerModal').style.display = 'block';
};

window.closeRegisterModal = function() {
    document.getElementById('registerModal').style.display = 'none';
};

// التحقق من حالة الدخول
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const authDiv = document.getElementById('authButtons');
    const userDiv = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    
    if (token && user.id) {
        if (authDiv) authDiv.style.display = 'none';
        if (userDiv) userDiv.style.display = 'flex';
        if (userName) userName.innerText = user.name || user.email;
    } else {
        if (authDiv) authDiv.style.display = 'flex';
        if (userDiv) userDiv.style.display = 'none';
    }
}

// تشغيل عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = function(e) {
            e.preventDefault();
            login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
        };
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.onsubmit = function(e) {
            e.preventDefault();
            register(
                document.getElementById('regName').value,
                document.getElementById('regEmail').value,
                document.getElementById('regPassword').value
            );
        };
    }
});
