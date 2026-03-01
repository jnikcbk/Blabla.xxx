const { Client, GatewayIntentBits, AuditLogEvent, EmbedBuilder, Collection, PermissionFlagsBits, ActivityType } = require('discord.js');
require('dotenv').config();
const fs = require('fs-extra');
const axios = require('axios'); // Thêm dòng này để gọi API Roblox
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

    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle("🛡️ NRM SECURITY - ROBLOX EDITION")
            .setColor(0x00aaff)
            .setDescription("Hệ thống bảo mật Server & Tra cứu Roblox chuyên sâu.")
            .addFields(
                { 
                    name: "⚙️ HỆ THỐNG ANTI (BẢO MẬT)", 
                    value: "`!setup`: Cấu hình Anti.\n`!status`: Trạng thái hệ thống.\n`!whitelist @user`: Thêm tin cậy.\n`!attack @user`: Ban & Dọn sạch rác.\n`!lock`/`!unlock`: Quản lý kênh chat.\n`!clear [số]`: Xóa tin nhắn." 
                },
                { 
                    name: "🔍 ROBLOX TOOLS (TRA CỨU)", 
                    value: "`!rbcheck [tên]`: Soi thông tin & trạng thái.\n`!rblog [tên]`: Theo dõi & lấy link vào game.\n`!rbavatar [tên]`: Lấy ảnh chân dung & toàn thân.\n`!logacc [đăng nhập rbl]`: Lấy ID nhanh.\n`!logvip [link svv]`: tham gia svv." 
                }
            )
            .setFooter({ text: "NRM Security Bot v2.0" })
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }
if (command === 'rbcheck') {
        const username = args[0];
        if (!username) return message.reply("❓ Cách dùng: `!rbcheck <tên_roblox>`");

        try {
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", {
                usernames: [username],
                excludeBannedUsers: false
            });

            if (!userRes.data.data.length) return message.reply("❌ Không tìm thấy người chơi này.");

            const userId = userRes.data.data[0].id;
            const displayName = userRes.data.data[0].displayName;

            const presenceRes = await axios.post("https://presence.roblox.com/v1/presence/users", {
                userIds: [userId]
            });

            const statusType = presenceRes.data.userPresences[0].userPresenceType;
            let statusText = "🌑 Offline";
            let color = 0x757575;

            if (statusType === 1) { statusText = "🟢 Online"; color = 0x00ff00; }
            else if (statusType === 2) { 
                statusText = `🎮 Đang chơi: **${presenceRes.data.userPresences[0].lastLocation || "Một trò chơi bí mật"}**`; 
                color = 0x00a2ff; 
            }
            else if (statusType === 3) { statusText = "🛠️ Đang trong Studio"; color = 0xffa500; }

            // --- LẤY ẢNH AVATAR ---
            const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`;

            const rbEmbed = new EmbedBuilder()
                .setTitle(`🔍 Thông tin Roblox: ${username}`)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .addFields(
                    { name: "Tên hiển thị", value: displayName, inline: true },
                    { name: "User ID", value: `\`${userId}\``, inline: true },
                    { name: "Trạng thái", value: statusText }
                )
                .setThumbnail(avatarUrl) // Hiển thị ảnh nhỏ bên góc
                .setImage(avatarUrl)     // Hiển thị ảnh to ở dưới cho đẹp
                .setColor(color)
                .setFooter({ text: "Dữ liệu cập nhật từ Roblox API" })
                .setTimestamp();

            message.reply({ embeds: [rbEmbed] });

        } catch (err) {
            message.reply("❌ Lỗi kết nối API Roblox.");
        }
}
 if (command === 'rblog') {
        const username = args[0];
        if (!username) return message.reply("❓ Cách dùng: `!rblog <tên_roblox>`");

        message.reply(`📡 **Hệ thống Tracking:** Đang bắt đầu theo dõi **${username}**... Khi đối tượng vào game, tôi sẽ báo ngay!`);

        const checkLog = setInterval(async () => {
            try {
                // 1. Lấy ID người dùng từ Username
                const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [username] });
                const userId = userRes.data.data[0].id;

                // 2. Kiểm tra trạng thái Online/Game
                const presenceRes = await axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] });
                const p = presenceRes.data.userPresences[0];

                // Nếu đang trong Game (Type 2)
                if (p.userPresenceType === 2 && p.placeId) {
                    // 3. FIX LỖI "...": Lấy tên Game thật từ PlaceId
                    const gameInfo = await axios.get(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${p.placeId}`);
                    const realGameName = gameInfo.data[0]?.name || "Trò chơi bí ẩn";

                    const logEmbed = new EmbedBuilder()
                        .setTitle("🚀 PHÁT HIỆN MỤC TIÊU VÀO GAME!")
                        .setColor(0x00FF00)
                        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`)
                        .addFields(
                            { name: "👤 Người chơi", value: `**${username}**`, inline: true },
                            { name: "🎮 Game", value: `**${realGameName}**`, inline: true },
                            { name: "🆔 Place ID", value: `\`${p.placeId}\``, inline: true }
                        )
                        .setFooter({ text: "NRM Security - Auto Tracking" })
                        .setTimestamp();

                    // Tạo nút bấm Join Game chuyên nghiệp
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('VÀO GAME NGAY')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://www.roblox.com/games/${p.placeId}`)
                    );

                    message.channel.send({ 
                        content: `🔔 <@${message.author.id}>! **${username}** đã xuất hiện tại **${realGameName}**!`, 
                        embeds: [logEmbed],
                        components: [row] 
                    });

                    clearInterval(checkLog); // Dừng quét sau khi tìm thấy
                }
            } catch (err) {
                // Bỏ qua lỗi API tạm thời để tiếp tục quét
            }
        }, 15000); // Quét mỗi 15 giây để bắt kịp mục tiêu
 }
   if (command === 'logacc') {
        const embed = new EmbedBuilder()
            .setTitle("🔐 HỆ THỐNG ĐIỀU KHIỂN ACCOUNT")
            .setDescription("Vui lòng xác nhận trạng thái tài khoản trước khi thực hiện các lệnh tiếp theo.")
            .setColor(0x00fbff)
            .addFields(
                { name: "Trạng thái", value: "🟡 Đang chờ kết nối...", inline: true },
                { name: "Yêu cầu", value: "Sau khi đăng nhập, hãy dùng lệnh `!joinvip <link>`", inline: false }
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('ĐĂNG NHẬP ROBLOX')
                .setStyle(ButtonStyle.Link)
                .setURL('https://www.roblox.com/login'),
            new ButtonBuilder()
                .setCustomId('check_status')
                .setLabel('KIỂM TRA KẾT NỐI')
                .setStyle(ButtonStyle.Success)
        );

        message.reply({ embeds: [embed], components: [row] });
   }
    if (command === 'joinvip') {
        const vipLink = args[0];
        if (!vipLink || !vipLink.includes("privateServerLinkCode")) {
            return message.reply("❌ Vui lòng gửi link Server VIP hợp lệ!\nVí dụ: `!joinvip https://www.roblox.com/games/12345?privateServerLinkCode=abc...` ");
        }

        // Bóc tách PlaceID và Code từ Link
        const url = new URL(vipLink);
        const placeId = url.pathname.split('/')[2];
        const code = url.searchParams.get("privateServerLinkCode");

        const joinEmbed = new EmbedBuilder()
            .setTitle("🚀 HỆ THỐNG GIA NHẬP SERVER VIP")
            .setDescription(`Bạn đã yêu cầu tham gia server VIP tại Place: **${placeId}**`)
            .addFields(
                { name: "📱 Mobile/PC", value: "Nhấn nút bên dưới để tự động mở App Roblox" }
            )
            .setColor(0x00FF00)
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('VÀO SERVER VIP NGAY')
                .setStyle(ButtonStyle.Link)
                // Link protocol đặc biệt để ép mở App Roblox vào thẳng SV VIP
                .setURL(`roblox://experiences/start?placeId=${placeId}&privateServerLinkCode=${code}`)
        );

        message.reply({ embeds: [joinEmbed], components: [row] });
    }
    if (command === 'ttacc') {
        const username = args[0];
        if (!username) return message.reply("❓ Cách dùng: `!ttacc <tên_roblox>`");

        try {
            // 1. Lấy thông tin cơ bản
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", {
                usernames: [username],
                excludeBannedUsers: false
            });

            if (!userRes.data.data.length) return message.reply("❌ Không tìm thấy người chơi này.");
            const userId = userRes.data.data[0].id;

            // 2. Lấy chi tiết Profile & Ngày tạo
            const detailRes = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
            const createdDate = new Date(detailRes.data.created).toLocaleDateString('vi-VN');

            // 3. Lấy trạng thái & Game đang chơi
            const presenceRes = await axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] });
            const presence = presenceRes.data.userPresences[0];
            
            let statusText = "🌑 Offline";
            if (presence.userPresenceType === 1) statusText = "🟢 Online (Web)";
            if (presence.userPresenceType === 2) statusText = `🎮 Đang chơi: **${presence.lastLocation}**`;
            if (presence.userPresenceType === 3) statusText = "🛠️ Đang trong Studio";

            // 4. Lấy số lượng Follower
            const followRes = await axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`);

            // --- ĐOÁN GAME CHƠI NHIỀU NHẤT QUA BADGE ---
            // Lưu ý: Đây là thuật toán tìm game họ vừa cày Badge gần đây nhất
            const badgeRes = await axios.get(`https://badges.roblox.com/v1/users/${userId}/badges?limit=10&sortOrder=Desc`);
            let topGame = "Không rõ (Ẩn Inventory)";
            if (badgeRes.data.data.length > 0) {
                topGame = badgeRes.data.data[0].awarder.name; // Game gần nhất họ nhận Badge
            }

            const embed = new EmbedBuilder()
                .setTitle(`📊 THÔNG TIN TÀI KHOẢN: ${username}`)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setColor(0x00fbff)
                .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`)
                .addFields(
                    { name: "🆔 ID Người dùng", value: `\`${userId}\``, inline: true },
                    { name: "📅 Ngày gia nhập", value: createdDate, inline: true },
                    { name: "👥 Người theo dõi", value: `${followRes.data.count}`, inline: true },
                    { name: "📍 Trạng thái hiện tại", value: statusText },
                    { name: "🔥 Dự đoán Game cày nhiều nhất", value: `**${topGame}** (Dựa trên Badge mới nhất)` },
                    { name: "📝 Tiểu sử", value: detailRes.data.description || "Trống" }
                )
                .setImage(`https://www.roblox.com/avatar-thumbnail/image?userId=${userId}&width=420&height=420&format=png`) // Ảnh cả người
                .setFooter({ text: "địt lò bot - Hệ thống soi acc chuyên nghiệp" })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            message.reply("❌ Lỗi khi lấy dữ liệu. Có thể acc này bị khóa hoặc API lỗi.");
        }
    }
    if (command === 'rbavatar') {
        const username = args[0];
        if (!username) return message.reply("❓ Cách dùng: `!rbavatar <tên_roblox>`");

        try {
            // 1. Lấy ID từ Username
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", {
                usernames: [username],
                excludeBannedUsers: false
            });

            if (!userRes.data.data.length) return message.reply("❌ Không tìm thấy người chơi này.");
            const userId = userRes.data.data[0].id;

            // 2. Lấy đồng thời 2 loại ảnh: Toàn thân và Khuôn mặt
            const [fullBodyRes, headshotRes] = await Promise.all([
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`),
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`)
            ]);

            const fullBodyUrl = fullBodyRes.data.data[0].imageUrl;
            const headshotUrl = headshotRes.data.data[0].imageUrl;

            const avatarEmbed = new EmbedBuilder()
                .setTitle(`👤 Ảnh đại diện của ${username}`)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setDescription(`[Nhấn vào đây để tải ảnh gốc (Full HD)](${fullBodyUrl})`)
                .setImage(fullBodyUrl) // Ảnh toàn thân to rõ nét
                .setThumbnail(headshotUrl) // Ảnh mặt nhỏ ở góc
                .setColor(0x00AAFF)
                .setFooter({ text: `ID: ${userId} | Yêu cầu bởi ${message.author.username}` })
                .setTimestamp();

            message.reply({ embeds: [avatarEmbed] });

        } catch (err) {
            console.error(err);
            message.reply("❌ Lỗi khi lấy ảnh đại diện từ Roblox.");
        }
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
