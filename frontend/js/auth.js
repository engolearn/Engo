// التحقق من حالة تسجيل الدخول
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user) {
        document.getElementById('authButtons').style.display = 'none';
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('userName').textContent = user.name || user.email;
        
        // عرض رابط الأدمن إذا كان المستخدم أدمن
        if (user.role === 'admin') {
            document.getElementById('adminPanelLink').style.display = 'block';
            document.getElementById('adminPanelLink').href = 'admin.html';
        }
        
        return user;
    } else {
        document.getElementById('authButtons').style.display = 'flex';
        document.getElementById('userInfo').style.display = 'none';
        return null;
    }
}

// تسجيل الدخول
async function login(email, password) {
    try {
        const data = await loginUser(email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showAlert('تم تسجيل الدخول بنجاح!', 'success');
        
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
        return data;
    } catch (error) {
        showAlert(error.message, 'error');
        throw error;
    }
}

// إنشاء حساب
async function register(name, email, password) {
    try {
        const data = await registerUser(name, email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showAlert('تم إنشاء الحساب بنجاح!', 'success');
        
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
        return data;
    } catch (error) {
        showAlert(error.message, 'error');
        throw error;
    }
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

// عرض مودال تسجيل الدخول
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

// إضافة مستمعين للأحداث
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await login(email, password);
        });
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            await register(name, email, password);
        });
    }
    
    // إغلاق المودالات عند النقر خارجها
    window.onclick = function(event) {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const paymentModal = document.getElementById('paymentModal');
        
        if (event.target === loginModal) closeLoginModal();
        if (event.target === registerModal) closeRegisterModal();
        if (event.target === paymentModal) closePaymentModal();
    };
    
    checkAuth();
});

// عرض رسالة تنبيه
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.main-content') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}
