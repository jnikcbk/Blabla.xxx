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
// ... (Phần code cũ của bạn giữ nguyên đến đoạn const command = args.shift().toLowerCase();)

    // !help (Cập nhật Menu mới)
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle("🛡️ HƯỚNG DẪN NRM BOT - ROBLOX EDITION")
            .setColor(0x3498db)
            .addFields(
                { name: "⚙️ Cài đặt & Anti", value: "`!setlog`, `!setup`, `!status`, `!whitelist`, `!attack`" },
                { name: "🔍 Roblox Tra Cứu", value: "`!rbcheck [tên]`: Soi nhanh.\n`!rblog [tên]`: Theo dõi vào game (Hết lỗi ...)." },
                { name: "🔐 Panel Điều Khiển", value: "`!logacc`: Hiện bảng đăng nhập.\n`!joinvip [link]`: Tạo nút Join Server VIP cực xịn." }
            );
        message.reply({ embeds: [embed] });
    }

    // !rbcheck (Bản fix lỗi)
    if (command === 'rbcheck') {
        const axios = require("axios");
        const username = args[0];
        if (!username) return message.reply("❓ Dùng: `!rbcheck <username>`");

        try {
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [username] });
            if (!userRes.data.data.length) return message.reply("❌ Không tìm thấy tài khoản.");
            const userId = userRes.data.data[0].id;

            const presenceRes = await axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] });
            const p = presenceRes.data.userPresences[0];

            let gameName = "Offline/Website";
            if (p.userPresenceType === 2) {
                const gameInfo = await axios.get(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${p.placeId}`);
                gameName = gameInfo.data[0]?.name || "Trò chơi ẩn";
            }
            message.reply(`🔍 **${username}**: ${gameName} (Trạng thái: ${p.userPresenceType})`);
        } catch (err) { message.reply("❌ Lỗi API Roblox."); }
    }

    

    // !logacc (Lệnh Panel Đăng Nhập)
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    if (command === 'logacc') {
        const embed = new EmbedBuilder()
            .setTitle("🔐 ĐĂNG NHẬP HỆ THỐNG")
            .setDescription("Vui lòng đăng nhập Roblox trên trình duyệt trước.\nSau khi đăng nhập xong, hãy dùng lệnh `!joinvip` để vào server.")
            .setColor(0x00fbff);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('ĐĂNG NHẬP TẠI ĐÂY')
                .setStyle(ButtonStyle.Link)
                .setURL('https://www.roblox.com/login')
        );

        message.reply({ embeds: [embed], components: [row] });
    }

    if (command === 'rblog') {
        const username = args[0];
        if (!username) return message.reply("❓ Cách dùng: `!rblog <tên_roblox>`");

        try {
            // 1. KIỂM TRA USERNAME CÓ THẬT KHÔNG
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { 
                usernames: [username],
                excludeBannedUsers: false 
            }).catch(() => null);

            if (!userRes || !userRes.data.data.length) {
                return message.reply(`❌ Không tìm thấy tài khoản **${username}**. Hãy kiểm tra lại chính xác tên!`);
            }

            const userId = userRes.data.data[0].id;
            const displayName = userRes.data.data[0].displayName;

            await message.reply(`📡 **Bắt đầu theo dõi:** \`${displayName}\` (@${username})\n⚡ Trạng thái: Quét liên tục (5s/lần). Khi đối tượng vào game, bot sẽ báo ngay!`);

            // 2. HÀM QUÉT CHUYÊN SÂU (Sử dụng đệ quy để không bao giờ dừng)
            const startTracking = async () => {
                try {
                    const presenceRes = await axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] });
                    const p = presenceRes.data.userPresences[0];

                    // Nếu đang trong Game (Type 2)
                    if (p && p.userPresenceType === 2 && p.placeId) {
                        // Lấy tên game thật để xóa lỗi "..."
                        const gameInfo = await axios.get(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${p.placeId}`);
                        const realGameName = gameInfo.data[0]?.name || "Trò chơi ẩn";

                        const logEmbed = new EmbedBuilder()
                            .setTitle("🚨 MỤC TIÊU ĐÃ VÀO GAME!")
                            .setColor(0x00FF00)
                            .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`)
                            .addFields(
                                { name: "👤 Đối tượng", value: `**${displayName}** (@${username})`, inline: true },
                                { name: "🎮 Game", value: `**${realGameName}**`, inline: true },
                                { name: "🔗 Join", value: `[Bấm để vào cùng](https://www.roblox.com/games/${p.placeId})` }
                            )
                            .setTimestamp();

                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setLabel('VÀO GAME NGAY').setStyle(5).setURL(`https://www.roblox.com/games/${p.placeId}`)
                        );

                        return message.channel.send({ 
                            content: `🔔 <@${message.author.id}>! **${username}** đã vào game!`, 
                            embeds: [logEmbed],
                            components: [row] 
                        });
                    }

                    // Nếu chưa vào game, đợi 5 giây rồi tự gọi lại chính nó để quét tiếp
                    setTimeout(startTracking, 5000);

                } catch (err) {
                    // Nếu lỗi API (Roblox sập/lag), đợi 10s rồi thử lại, không để bot chết lệnh
                    setTimeout(startTracking, 10000);
                }
            };

            // Kích hoạt vòng lặp quét
            startTracking();

        } catch (err) {
            message.reply("❌ Lỗi hệ thống: Không thể kết nối API Roblox.");
        }
                       }                                                                      }
    // !joinvip (Nút Join Server VIP)
    if (command === 'joinvip') {
        const vipLink = args[0];
        if (!vipLink || !vipLink.includes("privateServerLinkCode")) {
            return message.reply("❌ Vui lòng gửi link Server VIP! (Phải có đoạn `privateServerLinkCode`) ");
        }

        try {
            const url = new URL(vipLink);
            const placeId = url.pathname.split('/')[2];
            const code = url.searchParams.get("privateServerLinkCode");

            const embed = new EmbedBuilder()
                .setTitle("🎟️ SERVER VIP DETECTED")
                .setDescription(`Đã sẵn sàng để join Server VIP của Place: **${placeId}**`)
                .setColor(0x00ff00);
if (command === 'ttacc') {
        const username = args[0];
        if (!username) return message.reply("❓ Cách dùng: `!ttacc <tên_roblox>`");

        try {
            // 1. Lấy userId (Dùng API v1 chuẩn)
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", {
                usernames: [username],
                excludeBannedUsers: false
            }).catch(() => null);

            if (!userRes || !userRes.data.data.length) return message.reply("❌ Không tìm thấy người chơi này.");
            const user = userRes.data.data[0];
            const userId = user.id;

            // 2. Gọi nhiều API cùng lúc (Promise.all) để tăng tốc độ và tránh timeout
            const [detailRes, presenceRes, followRes, badgeRes, thumbRes] = await Promise.all([
                axios.get(`https://users.roblox.com/v1/users/${userId}`).catch(() => ({ data: {} })),
                axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] }).catch(() => ({ data: { userPresences: [] } })),
                axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`).catch(() => ({ data: { count: 0 } })),
                axios.get(`https://badges.roblox.com/v1/users/${userId}/badges?limit=1&sortOrder=Desc`).catch(() => ({ data: { data: [] } })),
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`).catch(() => ({ data: { data: [{ imageUrl: "" }] } }))
            ]);

            // 3. Xử lý Ngày tạo & Trạng thái
            const createdDate = detailRes.data.created ? new Date(detailRes.data.created).toLocaleDateString('vi-VN') : "Không rõ";
            
            const presence = presenceRes.data.userPresences[0] || {};
            let statusText = "🌑 Offline";
            if (presence.userPresenceType === 1) statusText = "🟢 Online (Web)";
            if (presence.userPresenceType === 2) {
                // Fix lỗi hiện dấu "..." bằng cách check lastLocation
                statusText = `🎮 Đang chơi: **${presence.lastLocation || "Game ẩn/Kín"}**`;
            }
            if (presence.userPresenceType === 3) statusText = "🛠️ Đang trong Studio";

            // 4. Xử lý Badge (Đoán game)
            let topGame = "Không rõ (Ẩn Badge)";
            if (badgeRes.data.data && badgeRes.data.data.length > 0) {
                topGame = badgeRes.data.data[0].awarder?.name || "Ẩn thông tin";
            }

            // 5. Lấy ảnh đại diện (Thumbnail API mới)
            const avatarUrl = thumbRes.data.data[0]?.imageUrl || "https://t.rbxcdn.com/79267156942055660855210996846152";

            const embed = new EmbedBuilder()
                .setTitle(`📊 THÔNG TIN: ${user.displayName} (@${username})`)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setColor(0x00fbff)
                .setThumbnail(avatarUrl)
                .addFields(
                    { name: "🆔 ID", value: `\`${userId}\``, inline: true },
                    { name: "📅 Ngày gia nhập", value: createdDate, inline: true },
                    { name: "👥 Follower", value: `${followRes.data.count || 0}`, inline: true },
                    { name: "📍 Trạng thái", value: statusText },
                    { name: "🔥 Badge mới nhất từ", value: `**${topGame}**` },
                    { name: "📝 Tiểu sử", value: detailRes.data.description || "Trống" }
                )
                .setImage(avatarUrl)
                .setFooter({ text: "Hệ thống soi acc chuyên nghiệp" })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (err) {
            console.error("Lỗi API Roblox:", err.message);
            message.reply("❌ Lỗi API hoặc tài khoản này đã bị xóa/banned.");
        }
                }
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('BẤM ĐỂ JOIN VIP')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`roblox://experiences/start?placeId=${placeId}&privateServerLinkCode=${code}`)
            );

            message.reply({ embeds: [embed], components: [row] });
        } catch (e) { message.reply("❌ Link không hợp lệ."); }
    }
    if (command === 'ttacc') {
        const username = args[0];
        if (!username) return message.reply("❓ Cách dùng: `!ttacc <tên_roblox>`");

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
