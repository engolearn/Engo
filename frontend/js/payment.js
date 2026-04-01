let currentCourseForPayment = null;

// عرض مودال الدفع
async function showPaymentModal(courseId, courseTitle, coursePrice) {
    currentCourseForPayment = {
        id: courseId,
        title: courseTitle,
        price: coursePrice
    };
    
    const modal = document.getElementById('paymentModal');
    const courseInfo = document.getElementById('paymentCourseInfo');
    
    courseInfo.innerHTML = `
        <div class="course-payment-info">
            <p><strong>الدورة:</strong> ${courseTitle}</p>
            <p><strong>المبلغ:</strong> ${coursePrice} ريال</p>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    document.getElementById('paymentProofForm').reset();
    currentCourseForPayment = null;
}

// نسخ الرقم
function copyNumber(number) {
    navigator.clipboard.writeText(number);
    showAlert('تم نسخ الرقم بنجاح!', 'success');
}

// إرسال إثبات الدفع
document.addEventListener('DOMContentLoaded', () => {
    const paymentForm = document.getElementById('paymentProofForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentCourseForPayment) {
                showAlert('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
                return;
            }
            
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.id) {
                showAlert('يرجى تسجيل الدخول أولاً', 'error');
                closePaymentModal();
                showLoginModal();
                return;
            }
            
            const transactionId = document.getElementById('transactionId').value;
            const paymentNote = document.getElementById('paymentNote').value;
            const paymentImage = document.getElementById('paymentImage').files[0];
            
            if (!transactionId || !paymentImage) {
                showAlert('يرجى إدخال رقم العملية ورفع صورة الإيصال', 'error');
                return;
            }
            
            // تحويل الصورة إلى Base64
            const reader = new FileReader();
            reader.onload = async function(event) {
                const paymentData = {
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    courseId: currentCourseForPayment.id,
                    courseTitle: currentCourseForPayment.title,
                    amount: currentCourseForPayment.price,
                    transactionId: transactionId,
                    paymentNote: paymentNote,
                    paymentImage: event.target.result,
                    paymentMethod: 'wallet',
                    status: 'pending'
                };
                
                try {
                    // حفظ طلب الدفع في localStorage مؤقتاً (سيتم ربطه بالخادم لاحقاً)
                    const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
                    pendingPayments.push({
                        ...paymentData,
                        requestId: Date.now(),
                        createdAt: new Date().toISOString()
                    });
                    localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));
                    
                    showAlert('تم إرسال طلب الدفع بنجاح! سيتم فتح الدورة خلال 24 ساعة', 'success');
                    closePaymentModal();
                    
                } catch (error) {
                    showAlert('حدث خطأ في إرسال الطلب', 'error');
                }
            };
            reader.readAsDataURL(paymentImage);
        });
    }
});
