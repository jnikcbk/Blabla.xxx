const { Client, GatewayIntentBits, AuditLogEvent, EmbedBuilder, Collection, PermissionFlagsBits, ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();
const fs = require('fs-extra');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // Bắt buộc để bot hoạt động trong server
        GatewayIntentBits.GuildMessages,    // Để đọc tin nhắn
        GatewayIntentBits.MessageContent,   // Quan trọng: Để bot hiểu nội dung lệnh !
        GatewayIntentBits.GuildMembers,     // Để quản lý thành viên và Whitelist
        GatewayIntentBits.GuildAuditLogs    // Cho tính năng Anti-Nuke
    ]
});

// --- HỆ THỐNG DATABASE ---
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

if (fs.existsSync(dbPath)) {
    db = fs.readJsonSync(dbPath);
}
const saveDB = () => fs.writeJsonSync(dbPath, db, { spaces: 4 });

const msgCache = new Collection();

client.once('ready', () => {
    console.log(`[NRM BOT] Đã sẵn sàng!`);
    client.user.setActivity('!help | Roblox Security', { type: ActivityType.Watching });
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

    // 1. TỰ ĐỘNG BẢO VỆ (Dành cho người không có Whitelist)
    if (!db.whitelist.includes(message.author.id)) {
        if (db.settings.antiLink && /(https?:\/\/[^\s]+)/g.test(message.content)) {
            await message.delete().catch(() => {});
            return message.channel.send(`⚠️ **${message.author.username}**, không được gửi link!`).then(m => setTimeout(() => m.delete(), 3000));
        }
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

    if (!message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // CHỈ ADMIN HOẶC OWNER MỚI DÙNG ĐƯỢC LỆNH
    if (!isOwner && !isAdmin) return;

    // --- LỆNH HỆ THỐNG ---
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle("🛡️ NRM SECURITY - FULL COMMANDS")
            .setColor(0x3498db)
            .addFields(
                { name: "⚙️ Quản trị", value: "`!setlog`, `!setup`, `!whitelist`, `!banbot`" },
                { name: "🔍 Roblox Tra cứu", value: "`!ttacc [tên]`: Soi acc.\n`!rblog [tên]`: Theo dõi vào game.\n`!rbavatar [tên]`: Lấy ảnh chân dung.\n`!rbcheck [tên]`: Check nhanh." },
                { name: "🔐 Roblox Tool", value: "`!logacc`: Nút đăng nhập.\n`!joinvip [link]`: Nút join Server VIP." }
            );
        return message.reply({ embeds: [embed] });
    }

    // --- LỆNH ROBLOX ---
    if (command === 'rbcheck') {
        try {
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [args[0]] });
            if (!userRes.data.data.length) return message.reply("❌ Không tìm thấy.");
            const userId = userRes.data.data[0].id;
            const presenceRes = await axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] });
            const p = presenceRes.data.userPresences[0];
            let status = p.userPresenceType === 2 ? `🎮 Trong game: **${p.lastLocation}**` : "🌑 Offline/Web";
            message.reply(`🔍 **${args[0]}**: ${status}`);
        } catch (e) { message.reply("❌ Lỗi API."); }
    }

    if (command === 'ttacc') {
        try {
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [args[0]] });
            const userId = userRes.data.data[0].id;
            const [detail, presence, thumb] = await Promise.all([
                axios.get(`https://users.roblox.com/v1/users/${userId}`),
                axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] }),
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png`)
            ]);
            const p = presence.data.userPresences[0];
            const embed = new EmbedBuilder()
                .setTitle(`📊 Profile: ${args[0]}`)
                .setColor(0x00fbff)
                .setThumbnail(thumb.data.data[0].imageUrl)
                .addFields(
                    { name: "🆔 ID", value: `\`${userId}\``, inline: true },
                    { name: "📅 Ngày tạo", value: new Date(detail.data.created).toLocaleDateString('vi-VN'), inline: true },
                    { name: "📍 Vị trí", value: p.lastLocation || "Offline" }
                );
            message.reply({ embeds: [embed] });
        } catch (e) { message.reply("❌ Lỗi dữ liệu."); }
    }

    if (command === 'rblog') {
        const username = args[0];
        if (!username) return message.reply("❓ Nhập tên.");
        message.reply(`📡 Đang bám sát **${username}** (5s/lần)...`);
        const startTracking = async () => {
            try {
                const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [username] });
                const userId = userRes.data.data[0].id;
                const presenceRes = await axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] });
                const p = presenceRes.data.userPresences[0];

                if (p && p.userPresenceType === 2 && p.placeId) {
                    const gameInfo = await axios.get(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${p.placeId}`);
                    const embed = new EmbedBuilder()
                        .setTitle("🚨 PHÁT HIỆN MỤC TIÊU!")
                        .setColor(0x00FF00)
                        .setDescription(`**${username}** đang chơi **${gameInfo.data[0]?.name}**`);
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel('JOIN NGAY').setStyle(ButtonStyle.Link).setURL(`https://www.roblox.com/games/${p.placeId}`)
                    );
                    return message.channel.send({ content: `🔔 <@${message.author.id}>`, embeds: [embed], components: [row] });
                }
                setTimeout(startTracking, 5000);
            } catch (e) { setTimeout(startTracking, 10000); }
        };
        startTracking();
    }
// --- LỆNH !rbjoin: ÉP VÀO SERVER ---
    if (command === 'rbjoin') {
        const username = args[0];
        if (!username) return message.reply("❓ Vui lòng nhập tên người chơi cần join.");

        try {
            // 1. Lấy UserId từ Username
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [username] });
            if (!userRes.data.data.length) return message.reply("❌ Không tìm thấy người chơi này.");
            const userId = userRes.data.data[0].id;

            // 2. Check trạng thái Presence (Xem họ có đang trong game không và lấy Game ID)
            const presenceRes = await axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] });
            const p = presenceRes.data.userPresences[0];

            // userPresenceType 2 là đang trong game
            if (p && p.userPresenceType === 2 && p.placeId) {
                const placeId = p.placeId;
                const gameName = p.lastLocation || "một trò chơi";
                
                // Tạo link Deep Link để ép mở app Roblox
                // Cấu trúc: roblox://experiences/start?placeId=...&gameInstanceId=...
                // Nếu không có JobId (gameInstanceId), ta dùng link join theo UserId
                let joinLink = `roblox://experiences/start?placeId=${placeId}`;
                if (p.gameId) { // p.gameId chính là JobId của server
                    joinLink += `&gameInstanceId=${p.gameId}`;
                }

                const embed = new EmbedBuilder()
                    .setTitle(`🚀 Đã tìm thấy: ${username}`)
                    .setDescription(`Đang chơi: **${gameName}**\nTrạng thái: **Sẵn sàng Join**`)
                    .setColor(0x00FF00)
                    .setFooter({ text: "Lưu ý: Chỉ hoạt động nếu mục tiêu không tắt chế độ 'Who can join me?'" });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel(`ÉP VÀO SERVER CỦA ${username.toUpperCase()}`)
                        .setStyle(ButtonStyle.Link)
                        .setURL(joinLink)
                );

                message.reply({ embeds: [embed], components: [row] });
            } else {
                message.reply(`❌ **${username}** hiện đang Offline hoặc không ở trong game.`);
            }
        } catch (e) {
            console.error(e);
            message.reply("❌ Lỗi hệ thống khi cố gắng lấy thông tin server.");
        }
    }
    if (command === 'rbavatar') {
        try {
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [args[0]] });
            const userId = userRes.data.data[0].id;
            const thumb = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png`);
            message.reply(thumb.data.data[0].imageUrl);
        } catch (e) { message.reply("❌ Lỗi lấy ảnh."); }
    }

    if (command === 'logacc') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('ĐĂNG NHẬP ROBLOX').setStyle(ButtonStyle.Link).setURL('https://www.roblox.com/login')
        );
        message.reply({ content: "🔐 Đăng nhập để chuẩn bị join Server VIP:", components: [row] });
    }

    if (command === 'joinvip') {
        try {
            const vipLink = args[0];
            if (!vipLink?.includes("privateServerLinkCode")) return message.reply("❌ Link VIP không hợp lệ.");
            const url = new URL(vipLink);
            const placeId = url.pathname.split('/')[2];
            const code = url.searchParams.get("privateServerLinkCode");
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel('JOIN SERVER VIP').setStyle(ButtonStyle.Link).setURL(`roblox://experiences/start?placeId=${placeId}&privateServerLinkCode=${code}`)
            );
            message.reply({ content: "🎟️ Đã tạo nút join nhanh:", components: [row] });
        } catch (e) { message.reply("❌ Lỗi xử lý link."); }
    }

    // --- LỆNH QUẢN TRỊ ---
    if (command === 'setlog') {
        const chan = message.mentions.channels.first();
        if (!chan) return message.reply("❌ Tag kênh!");
        db.logChannel = chan.id; saveDB();
        message.reply(`✅ Đã đặt kênh Log tại: ${chan}`);
    }

    if (command === 'setup') {
        const feature = args[0];
        if (db.settings.hasOwnProperty(feature)) {
            db.settings[feature] = !db.settings[feature];
            saveDB();
            message.reply(`✅ **${feature}** hiện là: **${db.settings[feature] ? "BẬT" : "TẮT"}**`);
        } else {
            message.reply("❌ Nhập: antiLink, antiNuke, antiRaid hoặc antiSpam");
        }
    }
});

// --- ANTI-NUKE ---
client.on('channelDelete', async (channel) => {
    if (!db.settings.antiNuke) return;
    const logs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
    const entry = logs.entries.first();
    if (entry && !db.whitelist.includes(entry.executor.id)) {
        const member = await channel.guild.members.fetch(entry.executor.id).catch(() => null);
        if (member) await member.ban({ reason: "Anti-Nuke" }).catch(() => {});
        await channel.clone();
    }
});

client.login(process.env.TOKEN);
