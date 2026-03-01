const { Client, GatewayIntentBits, AuditLogEvent, EmbedBuilder, Collection, PermissionFlagsBits, ActivityType } = require('discord.js');
require('dotenv').config();
const fs = require('fs-extra');

const client = new Client({
    intents: [Object.keys(GatewayIntentBits)] 
});

// --- HỆ THỐNG DATABASE (JSON) ---
const dbPath = './database.json';
let db = {
    logChannel: null,
    whitelist: [process.env.OWNER_ID],
    settings: {
        antiLink: true,
        antiNuke: true,
        antiRaid: true,
        antiSpam: true
    }
};

// Đọc dữ liệu từ file khi khởi động
if (fs.existsSync(dbPath)) {
    db = fs.readJsonSync(dbPath);
}

const saveDB = () => fs.writeJsonSync(dbPath, db, { spaces: 4 });

const msgCache = new Collection();

client.once('ready', () => {
    console.log(`[NRM BOT] Đã sẵn sàng! Bảo vệ server ngay bây giờ.`);
    client.user.setActivity('!help | Bảo vệ Server', { type: ActivityType.Watching });
});

// --- HÀM GỬI LOG ---
async function sendLog(guild, title, color, desc) {
    if (!db.logChannel) return;
    const channel = guild.channels.cache.get(db.logChannel);
    if (!channel) return;
    const embed = new EmbedBuilder()
        .setTitle(`🛡️ LOG BẢO MẬT: ${title}`)
        .setColor(color)
        .setDescription(desc)
        .setTimestamp();
    channel.send({ embeds: [embed] }).catch(() => {});
}

// --- XỬ LÝ LỆNH & AUTO MOD ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const isOwner = message.author.id === process.env.OWNER_ID;
    const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

    // 1. CHẾ ĐỘ TỰ ĐỘNG (Dành cho người thường)
    if (!db.whitelist.includes(message.author.id)) {
        // Anti-Link
        if (db.settings.antiLink && /(https?:\/\/[^\s]+)/g.test(message.content)) {
            await message.delete().catch(() => {});
            return message.channel.send(`⚠️ **${message.author.username}**, link bị cấm tại đây!`).then(m => setTimeout(() => m.delete(), 3000));
        }
        // Anti-Spam (5 tin/5s)
        if (db.settings.antiSpam) {
            const now = Date.now();
            const timestamps = msgCache.get(message.author.id) || [];
            timestamps.push(now);
            const recent = timestamps.filter(t => now - t < 5000);
            msgCache.set(message.author.id, recent);
            if (recent.length > 5) {
                await message.member.timeout(60000, "Spamming").catch(() => {});
                message.channel.send(`🔇 **${message.author.username}** bị mute 1 phút vì spam.`);
            }
        }
    }

    // 2. HỆ THỐNG LỆNH (Admin/Owner)
    if (!message.content.startsWith('!')) return;
    if (!isOwner && !isAdmin) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // !help
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle("📜 HƯỚNG DẪN NRM BOT")
            .setColor(0x3498db)
            .addFields(
                { name: "⚙️ Cài đặt", value: "`!setlog #channel`: Đặt kênh báo cáo.\n`!setup [tính năng]`: Bật/Tắt (antiLink, antiNuke, antiRaid, antiSpam).\n`!status`: Xem trạng thái." },
                { name: "🛡️ Whitelist", value: "`!whitelist @user`: Thêm tin cậy.\n`!unwhitelist @user`: Xóa tin cậy." },
                { name: "🔨 Quản trị", value: "`!banbot @bot`: Ban bot lạ.\n`!kick @user`: Kick thành viên." }
            );
        message.reply({ embeds: [embed] });
    }

    // !setlog
    if (command === 'setlog') {
        const chan = message.mentions.channels.first();
        if (!chan) return message.reply("❌ Tag kênh vào!");
        db.logChannel = chan.id;
        saveDB();
        message.reply(`✅ Đã đặt kênh Log tại: ${chan}`);
    }

    // !setup (Bật/Tắt)
    if (command === 'setup') {
        const feature = args[0];
        if (db.settings.hasOwnProperty(feature)) {
            db.settings[feature] = !db.settings[feature];
            saveDB();
            message.reply(`✅ Tính năng **${feature}** hiện là: **${db.settings[feature] ? "BẬT" : "TẮT"}**`);
        } else {
            message.reply("❌ Nhập: antiLink, antiNuke, antiRaid hoặc antiSpam");
        }
    }

    // !whitelist
    if (command === 'whitelist') {
        const user = message.mentions.users.first();
        if (!user) return message.reply("❌ Tag người cần thêm!");
        if (!db.whitelist.includes(user.id)) {
            db.whitelist.push(user.id);
            saveDB();
            message.reply(`✅ Đã thêm **${user.tag}** vào danh sách trắng.`);
        }
    }

    // !banbot
    if (command === 'banbot') {
        const bot = message.mentions.members.first();
        if (!bot || !bot.user.bot) return message.reply("❌ Tag một con Bot!");
        await bot.ban({ reason: "Ban bot lạ" });
        message.reply(`🚀 Đã ban bot: ${bot.user.tag}`);
    }
});

// --- ANTI-NUKE (XỬ LÝ PHÁ HOẠI) ---
client.on('channelDelete', async (channel) => {
    if (!db.settings.antiNuke) return;
    const logs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
    const entry = logs.entries.first();
    if (!entry) return;

    if (!db.whitelist.includes(entry.executor.id) && entry.executor.id !== channel.guild.ownerId) {
        const member = await channel.guild.members.fetch(entry.executor.id);
        await member.ban({ reason: "Anti-Nuke: Xóa kênh" }).catch(() => {});
        await channel.clone();
        sendLog(channel.guild, "ANTI-NUKE", 0xff0000, `**${entry.executor.tag}** đã bị Ban vì xóa kênh **${channel.name}**.`);
    }
});

// --- ANTI-RAID (CHỐNG ACC MỚI) ---
client.on('guildMemberAdd', async (member) => {
    if (!db.settings.antiRaid) return;
    const age = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
    if (age < 1) {
        await member.kick("Anti-Raid: Tài khoản < 24h").catch(() => {});
        sendLog(member.guild, "ANTI-RAID", 0xffff00, `Đã Kick: **${member.user.tag}** (Tài khoản mới tạo).`);
    }
});

client.login(process.env.TOKEN);
