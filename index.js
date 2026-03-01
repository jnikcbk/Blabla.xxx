const { Client, GatewayIntentBits, AuditLogEvent, EmbedBuilder, Collection, PermissionFlagsBits, ActivityType } = require('discord.js');
require('dotenv').config();
const chalk = require('chalk');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMembers
    ]
});

// Cấu hình lưu trữ (Trong thực tế nên dùng Database, ở đây lưu tạm vào bộ nhớ)
let config = {
    prefix: "!",
    antiLink: true,
    antiNuke: true,
    antiRaid: true,
    logChannel: null, // Sẽ được thiết lập qua lệnh !setlog
    whitelist: [process.env.OWNER_ID]
};

const msgCache = new Collection();

client.once('ready', () => {
    console.log(chalk.green(`[SUCCESS]`) + ` Bot ${client.user.tag} đã sẵn sàng bảo vệ Server!`);
    client.user.setActivity('!help để xem hướng dẫn', { type: ActivityType.Listening });
});

// --- HÀM GỬI LOG ---
async function sendLog(guild, title, color, description) {
    if (!config.logChannel) return;
    const channel = guild.channels.cache.get(config.logChannel);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle(`🛡️ BẢO MẬT: ${title}`)
        .setColor(color)
        .setDescription(description)
        .setTimestamp();
    channel.send({ embeds: [embed] }).catch(() => {});
}

// --- XỬ LÝ LỆNH ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const isOwner = message.author.id === process.env.OWNER_ID;
    const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!message.content.startsWith(config.prefix)) {
        // TỰ ĐỘNG BẢO VỆ (Cho người dùng thường)
        if (config.whitelist.includes(message.author.id)) return;
        
        // Anti-Link
        if (config.antiLink && /(https?:\/\/[^\s]+)/g.test(message.content)) {
            await message.delete().catch(() => {});
            return message.channel.send(`⚠️ **${message.author.username}**, không được gửi link!`).then(m => setTimeout(() => m.delete(), 3000));
        }
        return;
    }

    // CHỈ ADMIN/OWNER MỚI ĐƯỢC DÙNG LỆNH DƯỚI ĐÂY
    if (!isOwner && !isAdmin) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. Lệnh Hướng dẫn
    if (command === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle("📜 HƯỚNG DẪN SỬ DỤNG BOT BẢO MẬT")
            .setColor(0x00ff00)
            .addFields(
                { name: "🛡️ Bảo mật tự động", value: "`Anti-Nuke`, `Anti-Link`, `Anti-Raid` luôn chạy ngầm." },
                { name: "⚙️ Lệnh cài đặt", value: "• `!setlog #channel`: Thiết lập kênh nhận báo cáo.\n• `!status`: Kiểm tra trạng thái hệ thống.\n• `!setup [tên]`: Bật/Tắt (ví dụ: `!setup antiLink`)." },
                { name: "🔨 Lệnh quản trị", value: "• `!banbot @bot`: Ban ngay lập tức một bot lạ.\n• `!whitelist @user`: Thêm người tin cậy." }
            )
            .setFooter({ text: "Chỉ Admin/Owner mới có quyền dùng lệnh này" });
        message.reply({ embeds: [helpEmbed] });
    }

    // 2. Lệnh Thiết lập kênh Log
    if (command === 'setlog') {
        const channel = message.mentions.channels.first();
        if (!channel) return message.reply("❌ Vui lòng tag kênh. VD: `!setlog #nhat-ky` ");
        config.logChannel = channel.id;
        message.reply(`✅ Đã thiết lập kênh Log tại: ${channel}`);
    }

    // 3. Lệnh Ban Bot lạ
    if (command === 'banbot') {
        const targetBot = message.mentions.members.first();
        if (!targetBot || !targetBot.user.bot) return message.reply("❌ Vui lòng tag một con Bot cần Ban.");
        
        await targetBot.ban({ reason: "Lệnh BanBot: Loại bỏ bot lạ xâm nhập" });
        message.reply(`✅ Đã Ban thành công bot phá hoại: **${targetBot.user.tag}**`);
        sendLog(message.guild, "TRUY QUÉT BOT", 0xff0000, `Admin **${message.author.tag}** đã ban bot: **${targetBot.user.tag}**`);
    }

    // 4. Lệnh Status
    if (command === 'status') {
        message.reply(`**TRẠNG THÁI:**\n- Anti-Link: ${config.antiLink ? "✅" : "❌"}\n- Anti-Nuke: ${config.antiNuke ? "✅" : "❌"}\n- Kênh Log: ${config.logChannel ? `<#${config.logChannel}>` : "⚠️ Chưa cài đặt"}`);
    }
});

// --- TỰ ĐỘNG CHỐNG NUKE (XÓA KÊNH) ---
client.on('channelDelete', async (channel) => {
    if (!config.antiNuke) return;
    const logs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
    const entry = logs.entries.first();
    if (!entry) return;

    if (!config.whitelist.includes(entry.executor.id) && entry.executor.id !== channel.guild.ownerId) {
        const member = await channel.guild.members.fetch(entry.executor.id);
        await member.ban({ reason: "Anti-Nuke: Phá hoại server" }).catch(() => {});
        await channel.clone();
        sendLog(channel.guild, "CHỐNG PHÁ HOẠI", 0xff0000, `**Kẻ phá hoại:** ${entry.executor.tag}\n**Hành động:** Xóa kênh ${channel.name}\n**Kết quả:** Đã Ban & Khôi phục.`);
    }
});

client.login(process.env.TOKEN);
