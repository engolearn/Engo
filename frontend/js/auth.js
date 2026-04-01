// frontend/js/auth.js
const API_URL = 'https://engo.koyeb.app/api';

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
        
        alert('✅ تم تسجيل الدخول');
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
        
        alert('✅ تم إنشاء الحساب');
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

// التحقق من الحالة
window.checkAuth = () => {
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
};

// تشغيل عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    window.checkAuth();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            window.login(email, password);
        };
    }
    
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
    
    window.onclick = (e) => {
        if (e.target.id === 'loginModal') window.closeLoginModal();
        if (e.target.id === 'registerModal') window.closeRegisterModal();
    };
});
