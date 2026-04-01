// frontend/js/payment.js
let currentCourseForPayment = null;

function showPaymentModal(courseId, courseTitle, coursePrice) {
    currentCourseForPayment = { id: courseId, title: courseTitle, price: coursePrice };
    
    const modal = document.getElementById('paymentModal');
    const courseInfo = document.getElementById('paymentCourseInfo');
    
    if (courseInfo) {
        courseInfo.innerHTML = `
            <div class="course-payment-info">
                <p><strong>الدورة:</strong> ${courseTitle}</p>
                <p><strong>المبلغ:</strong> ${coursePrice} ريال</p>
            </div>
        `;
    }
    
    if (modal) modal.style.display = 'block';
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
    if (document.getElementById('paymentProofForm')) {
        document.getElementById('paymentProofForm').reset();
    }
    currentCourseForPayment = null;
}

function copyNumber(number) {
    navigator.clipboard.writeText(number);
    alert('✅ تم نسخ الرقم: ' + number);
}

document.addEventListener('DOMContentLoaded', () => {
    const paymentForm = document.getElementById('paymentProofForm');
    if (paymentForm) {
        paymentForm.onsubmit = async (e) => {
            e.preventDefault();
            
            if (!currentCourseForPayment) {
                alert('⚠️ حدث خطأ، يرجى المحاولة مرة أخرى');
                return;
            }
            
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.id) {
                alert('⚠️ يرجى تسجيل الدخول أولاً');
                closePaymentModal();
                showLoginModal();
                return;
            }
            
            const transactionId = document.getElementById('transactionId').value;
            const paymentNote = document.getElementById('paymentNote').value;
            const paymentImage = document.getElementById('paymentImage').files[0];
            
            if (!transactionId || !paymentImage) {
                alert('⚠️ يرجى إدخال رقم العملية ورفع صورة الإيصال');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
                pendingPayments.push({
                    requestId: Date.now(),
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    courseId: currentCourseForPayment.id,
                    courseTitle: currentCourseForPayment.title,
                    amount: currentCourseForPayment.price,
                    transactionId: transactionId,
                    paymentNote: paymentNote,
                    paymentImage: event.target.result,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                });
                localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));
                
                alert('✅ تم إرسال طلب الدفع بنجاح! سيتم فتح الدورة خلال 24 ساعة');
                closePaymentModal();
            };
            reader.readAsDataURL(paymentImage);
        };
    }
});
