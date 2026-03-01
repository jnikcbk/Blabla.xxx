const { Client, GatewayIntentBits, AuditLogEvent, EmbedBuilder, Collection, PermissionFlagsBits, ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();
const fs = require('fs-extra');
const axios = require('axios');

// --- FIX LỖI INTENTS (BITFIELD) ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildAuditLogs
    ]
});

// --- DATABASE ---
const dbPath = './database.json';
let db = { logChannel: null, whitelist: [process.env.OWNER_ID], settings: { antiLink: true, antiNuke: true, antiRaid: true, antiSpam: true } };
if (fs.existsSync(dbPath)) db = fs.readJsonSync(dbPath);
const saveDB = () => fs.writeJsonSync(dbPath, db, { spaces: 4 });

client.once('ready', () => {
    console.log(`[NRM BOT] Đã sẵn sàng! Đầy đủ tính năng Roblox.`);
    client.user.setActivity('!help | Roblox Expert', { type: ActivityType.Watching });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // --- AUTO MOD ---
    if (!db.whitelist.includes(message.author.id) && db.settings.antiLink) {
        if (/(https?:\/\/[^\s]+)/g.test(message.content)) return message.delete().catch(() => {});
    }

    if (!message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const isOwner = message.author.id === process.env.OWNER_ID;
    const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
    if (!isOwner && !isAdmin) return;

    // --- 1. LỆNH HELP (MENU ĐẦY ĐỦ) ---
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle("🛡️ NRM ROBLOX - TẤT CẢ LỆNH")
            .setColor(0x00fbff)
            .addFields(
                { name: "🔍 Tra cứu", value: "`!ttacc`, `!rbcheck`, `!rbavatar`, `!rbgroup`, `!rbfriends`" },
                { name: "🚀 Ép Join & Log", value: "`!rbjoin [tên]`: Ép vào SV.\n`!rblog [tên]`: Theo dõi 24/7." },
                { name: "🔐 Tiện ích", value: "`!logacc`, `!joinvip [link]`" },
                { name: "⚙️ Quản trị", value: "`!setup`, `!setlog`, `!whitelist`" }
            );
        return message.reply({ embeds: [embed] });
    }

    // --- 2. LỆNH !rbjoin (ÉP VÀO SERVER) ---
    if (command === 'rbjoin') {
        const username = args[0];
        if (!username) return message.reply("❓ Nhập tên người chơi.");
        try {
            const u = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [username] });
            if (!u.data.data.length) return message.reply("❌ Không tìm thấy.");
            const userId = u.data.data[0].id;
            const pRes = await axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] });
            const p = pRes.data.userPresences[0];

            if (p && p.userPresenceType === 2) {
                const forceLink = `roblox://experiences/start?placeId=${p.placeId}&gameInstanceId=${p.gameId || ""}`;
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setLabel(`ÉP VÀO SERVER CỦA ${username.toUpperCase()}`).setStyle(ButtonStyle.Link).setURL(forceLink)
                );
                message.reply({ content: `✅ **${username}** đang chơi: **${p.lastLocation}**`, components: [row] });
            } else {
                message.reply(`❌ **${username}** đang Offline/Web.`);
            }
        } catch (e) { message.reply("❌ Lỗi API."); }
    }

    // --- 3. LỆNH !rblog (THEO DÕI) ---
    if (command === 'rblog') {
        const username = args[0];
        if (!username) return message.reply("❓ Nhập tên.");
        message.reply(`📡 Đang bám đuôi **${username}**... Sẽ báo khi vào game!`);
        const track = async () => {
            try {
                const u = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [username] });
                const pRes = await axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [u.data.data[0].id] });
                const p = pRes.data.userPresences[0];
                if (p && p.userPresenceType === 2) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel('ÉP VÀO NGAY').setStyle(ButtonStyle.Link).setURL(`roblox://experiences/start?placeId=${p.placeId}&gameInstanceId=${p.gameId || ""}`)
                    );
                    return message.channel.send({ content: `🚨 **MỤC TIÊU VÀO GAME:** **${username}** đang chơi \`${p.lastLocation}\``, components: [row] });
                }
                setTimeout(track, 7000);
            } catch (e) { setTimeout(track, 15000); }
        };
        track();
    }

    // --- 4. LỆNH !ttacc (SOI CHI TIẾT) ---
    if (command === 'ttacc') {
        try {
            const u = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [args[0]] });
            const id = u.data.data[0].id;
            const [det, thumb, friends] = await Promise.all([
                axios.get(`https://users.roblox.com/v1/users/${id}`),
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=420x420&format=Png`),
                axios.get(`https://friends.roblox.com/v1/users/${id}/friends/count`)
            ]);
            const embed = new EmbedBuilder().setTitle(`📊 Profile: ${args[0]}`).setThumbnail(thumb.data.data[0].imageUrl).setColor(0x00fbff)
                .addFields(
                    { name: "🆔 ID", value: `\`${id}\``, inline: true },
                    { name: "📅 Tạo", value: new Date(det.data.created).toLocaleDateString('vi-VN'), inline: true },
                    { name: "👥 Bạn bè", value: `${friends.data.count}`, inline: true },
                    { name: "📝 Tiểu sử", value: det.data.description || "Trống" }
                );
            message.reply({ embeds: [embed] });
        } catch (e) { message.reply("❌ Lỗi dữ liệu."); }
    }

    // --- 5. LỆNH !rbgroup (XEM NHÓM) ---
    if (command === 'rbgroup') {
        try {
            const u = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [args[0]] });
            const gRes = await axios.get(`https://groups.roblox.com/v2/users/${u.data.data[0].id}/groups/roles`);
            const groups = gRes.data.data.slice(0, 10).map(g => `• **${g.group.name}**`).join('\n') || "Không có nhóm.";
            message.reply(`👥 **Nhóm của ${args[0]}:**\n${groups}`);
        } catch (e) { message.reply("❌ Lỗi lấy nhóm."); }
    }

    // --- 6. LỆNH !joinvip (SERVER VIP) ---
    if (command === 'joinvip') {
        try {
            const url = new URL(args[0]);
            const pid = url.pathname.split('/')[2];
            const code = url.searchParams.get("privateServerLinkCode");
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('VÀO VIP').setStyle(ButtonStyle.Link).setURL(`roblox://experiences/start?placeId=${pid}&privateServerLinkCode=${code}`));
            message.reply({ content: "🎟️ Bấm để mở app vào thẳng Server VIP:", components: [row] });
        } catch (e) { message.reply("❌ Link VIP không hợp lệ."); }
    }

    // --- 7. LỆNH !rbavatar (LẤY ẢNH) ---
    if (command === 'rbavatar') {
        try {
            const u = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [args[0]] });
            const res = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${u.data.data[0].id}&size=720x720&format=Png`);
            message.reply(res.data.data[0].imageUrl);
        } catch (e) { message.reply("❌ Lỗi ảnh."); }
    }
});

client.login(process.env.TOKEN);
