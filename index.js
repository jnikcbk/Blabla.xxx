const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType } = require('discord.js');
require('dotenv').config();
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`[ROBLOX BOT] Đã sẵn sàng!`);
    client.user.setActivity('!help | Roblox Tracker', { type: ActivityType.Watching });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // --- LỆNH HELP (CHỈ CÒN ROBLOX) ---
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle("🎮 ROBLOX COMMAND MENU")
            .setColor(0xFF0000)
            .addFields(
                { name: "🚀 Ép Join", value: "`!rbjoin [tên]`: Ép mở App vào thẳng SV mục tiêu đang chơi." },
                { name: "📡 Theo Dõi", value: "`!rblog [tên]`: Quét liên tục, báo ngay khi mục tiêu vào game." },
                { name: "🔍 Tra Cứu", value: "`!ttacc [tên]`: Soi profile, ngày tạo, ID.\n`!rbcheck [tên]`: Check nhanh trạng thái.\n`!rbavatar [tên]`: Lấy ảnh chân dung.\n`!rbgroup [tên]`: Xem các nhóm đã tham gia.\n`!rbfriends [tên]`: Đếm số lượng bạn bè." },
                { name: "🔐 Tiện Ích", value: "`!joinvip [link]`: Tạo nút Join nhanh cho link Server VIP.\n`!logacc`: Nút đăng nhập nhanh." }
            );
        return message.reply({ embeds: [embed] });
    }
// --- LỆNH !rbcheck: PHIÊN BẢN VIP ---
    if (command === 'rbcheck') {
        const username = args[0];
        if (!username) return message.reply("❓ Nhập tên người chơi cần soi.");

        try {
            // 1. Lấy thông tin cơ bản & ID
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [username] }).catch(() => null);
            if (!userRes?.data?.data?.length) return message.reply("❌ Không tìm thấy người chơi này trên Roblox.");
            
            const userId = userRes.data.data[0].id;
            const displayName = userRes.data.data[0].displayName;

            // 2. Lấy dữ liệu đa tầng (Status, Avatar, Profile)
            const [presenceRes, thumbRes, detailRes] = await Promise.all([
                axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] }),
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`),
                axios.get(`https://users.roblox.com/v1/users/${userId}`)
            ]);

            const p = presenceRes.data.userPresences[0];
            const avatarUrl = thumbRes.data.data[0].imageUrl;
            
            // Thiết lập trạng thái hiển thị
            let statusEmoji = "⚪"; 
            let statusColor = 0x95a5a6; // Xám (Offline)
            let statusName = "Offline / Riêng tư";
            let gameInfo = "Không rõ";
            let components = [];

            if (p) {
                if (p.userPresenceType === 1) {
                    statusEmoji = "🔵"; statusColor = 0x3498db; statusName = "Đang Online (Web/App)";
                } else if (p.userPresenceType === 2) {
                    statusEmoji = "🟢"; statusColor = 0x2ecc71; statusName = "Đang trong Game";
                    gameInfo = `**${p.lastLocation}**`;
                    
                    // Lấy link ép Join Server
                    const forceJoin = `roblox://experiences/start?placeId=${p.placeId}&gameInstanceId=${p.gameId || ""}`;
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel(`ÉP VÀO SERVER CỦA ${username.toUpperCase()}`).setStyle(ButtonStyle.Link).setURL(forceJoin),
                        new ButtonBuilder().setLabel('XEM TRANG GAME').setStyle(ButtonStyle.Link).setURL(`https://www.roblox.com/games/${p.placeId}`)
                    );
                    components.push(row);
                } else if (p.userPresenceType === 3) {
                    statusEmoji = "🧡"; statusColor = 0xe67e22; statusName = "Đang dùng Roblox Studio";
                }
            }

            // 3. Tạo Embed "Đẹp Nhất"
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Hệ thống kiểm tra mục tiêu: ${username}`, iconURL: avatarUrl })
                .setTitle(`${statusEmoji} Trạng thái: ${statusName}`)
                .setColor(statusColor)
                .setThumbnail(avatarUrl)
                .addFields(
                    { name: "👤 Tên hiển thị", value: `\`${displayName}\``, inline: true },
                    { name: "🆔 User ID", value: `\`${userId}\``, inline: true },
                    { name: "🎮 Đang chơi", value: gameInfo, inline: false },
                    { name: "🔗 Trang cá nhân", value: `[Bấm để xem Profile](https://www.roblox.com/users/${userId}/profile)`, inline: false }
                )
                .setFooter({ text: `Yêu cầu bởi: ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            message.reply({ embeds: [embed], components: components.length > 0 ? components : [] });

        } catch (error) {
            console.error(error);
            message.reply("⚠️ **Lỗi Bảo Mật:** Không thể kết nối tới máy chủ Roblox hoặc tài khoản bị chặn.");
        }
                        }
    // --- LỆNH !laymk: TROLL LẤY MẬT KHẨU ---
    if (command === 'laymk') {
        const target = args[0];
        if (!target) return message.reply("❓ Nhập tên đứa bạn muốn 'hack' mật khẩu nào!");

        const embed = new EmbedBuilder()
            .setTitle("🔑 ĐÃ TRÍCH XUẤT MẬT KHẨU THÀNH CÔNG!")
            .setDescription(`Hệ thống đã truy cập vào cơ sở dữ liệu của **${target}**.\n\n**Trạng thái:** ✅ Hoàn tất 100%\n**Độ bảo mật:** Thấp`)
            .setColor(0xFF0000) // Màu đỏ cho nguy hiểm
            .setFooter({ text: "Dữ liệu sẽ tự hủy sau 60 giây..." });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('troll_button')
                .setLabel('BẤM VÀO ĐỂ COPY MẬT KHẨU')
                .setStyle(ButtonStyle.Danger)
        );

        const response = await message.reply({ embeds: [embed], components: [row] });

        // Xử lý khi có người bấm vào nút
        const filter = i => i.customId === 'troll_button';
        const collector = response.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            // ephemeral: true giúp chỉ người bấm mới thấy tin nhắn này
            await i.reply({ 
                content: `🤣🤣 **SCAMMMMMMMMMMMMM HAHAAHAHA!** \n\nLàm gì có mật khẩu nào ở đây, tỉnh táo lên bồ tèo! 🤡`, 
                ephemeral: true 
            });
        });
    }
    
// --- LỆNH !rbjoin: PHIÊN BẢN ÉP JOIN SIÊU CẤP ---
    if (command === 'rbjoin') {
        const username = args[0];
        if (!username) return message.reply("❓ Nhập tên người chơi cần 'đột kích'.");

        try {
            // 1. Truy xuất ID và thông tin cơ bản
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [username] }).catch(() => null);
            if (!userRes?.data?.data?.length) return message.reply("❌ Không tìm thấy người chơi này.");
            
            const userId = userRes.data.data[0].id;

            // 2. Lấy trạng thái Presence (Vị trí server) và Ảnh đại diện
            const [presenceRes, thumbRes] = await Promise.all([
                axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] }),
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`)
            ]);

            const p = presenceRes.data.userPresences[0];
            const avatarUrl = thumbRes.data.data[0].imageUrl;

            // 3. Kiểm tra mục tiêu có đang trong Game hay không
            if (p && p.userPresenceType === 2 && p.placeId) {
                const placeId = p.placeId;
                const jobId = p.gameId; // Đây là mã server cụ thể (Cực quan trọng để ép join)
                const gameName = p.lastLocation || "Trò chơi ẩn";

                // Giao thức roblox:// ép mở ứng dụng và vào thẳng JobId
                const forceJoinLink = `roblox://experiences/start?placeId=${placeId}${jobId ? `&gameInstanceId=${jobId}` : ""}`;

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Mục tiêu: ${username}`, iconURL: avatarUrl })
                    .setTitle("🚀 PHÁT HIỆN SERVER KHẢ DỤNG!")
                    .setDescription(`Đang ở: **${gameName}**\nTrạng thái: **Sẵn sàng ép Join**`)
                    .addFields(
                        { name: "📍 Place ID", value: `\`${placeId}\``, inline: true },
                        { name: "🆔 Server ID", value: `\`${jobId || "Không công khai"}\``, inline: true }
                    )
                    .setThumbnail(avatarUrl)
                    .setColor(0x00FF00)
                    .setFooter({ text: "Lưu ý: Nếu mục tiêu tắt Join trong Privacy, Roblox sẽ báo lỗi." });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel(`ÉP VÀO SERVER CỦA ${username.toUpperCase()}`)
                        .setStyle(ButtonStyle.Link)
                        .setURL(forceJoinLink)
                );

                message.reply({ embeds: [embed], components: [row] });
            } else {
                message.reply(`❌ **${username}** hiện đang Offline hoặc đã ẩn trạng thái chơi (Privacy Settings).`);
            }
        } catch (error) {
            console.error(error);
            message.reply("⚠️ **Lỗi:** Không thể kết nối tới máy chủ Roblox để lấy mã Server.");
        }
                }
    // --- LỆNH !rblog: THEO DÕI 24/7 ---
    if (command === 'rblog') {
        const user = args[0];
        if (!user) return message.reply("❓ Nhập tên.");
        message.reply(`📡 Đang bám đuôi **${user}**...`);
        const track = async () => {
            try {
                const u = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [user] });
                const pRes = await axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [u.data.data[0].id] });
                const p = pRes.data.userPresences[0];
                if (p && p.userPresenceType === 2) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel('JOIN NGAY').setStyle(ButtonStyle.Link).setURL(`roblox://experiences/start?placeId=${p.placeId}&gameInstanceId=${p.gameId || ""}`)
                    );
                    return message.channel.send({ content: `🚨 **${user}** ĐÃ VÀO GAME!\n📍 Trò chơi: ${p.lastLocation}`, components: [row] });
                }
                setTimeout(track, 10000); // Quét mỗi 10 giây
            } catch (e) { setTimeout(track, 20000); }
        };
        track();
    }

    // --- LỆNH !ttacc: PHIÊN BẢN SOI ACC TOÀN DIỆN ---
    if (command === 'ttacc') {
        const username = args[0];
        if (!username) return message.reply("❓ Nhập tên người chơi cần soi.");

        try {
            // 1. Lấy thông tin cơ bản & ID (Hỗ trợ cả tên cũ)
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { 
                usernames: [username],
                excludeBannedUsers: false 
            });
            if (!userRes.data.data.length) return message.reply("❌ Không tìm thấy người chơi này trên Roblox.");
            
            const userId = userRes.data.data[0].id;

            // 2. Thu thập đa nguồn dữ liệu (Dùng Promise.all để tốc độ nhanh nhất)
            const [detail, friends, followers, headshot, presences, groups] = await Promise.all([
                axios.get(`https://users.roblox.com/v1/users/${userId}`), // Thông tin chung
                axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`), // Số bạn bè
                axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`), // Người theo dõi
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`), // Ảnh đại diện
                axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [userId] }), // Trạng thái online
                axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`) // Nhóm tham gia
            ]);

            const d = detail.data;
            const p = presences.data.userPresences[0];
            const avatarUrl = headshot.data.data[0].imageUrl;

            // Xác định trạng thái Online
            let status = "⚪ Offline";
            if (p.userPresenceType === 1) status = "🔵 Online (Web/App)";
            if (p.userPresenceType === 2) status = `🟢 Đang chơi: **${p.lastLocation}**`;
            if (p.userPresenceType === 3) status = "🧡 Đang ở trong Studio";

            // Tạo Embed "Đẹp nhất"
            const embed = new EmbedBuilder()
                .setTitle(`📊 THÔNG TIN CHI TIẾT: ${d.name}`)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setDescription(d.description ? `\`\`\`${d.description}\`\`\`` : "*Không có tiểu sử*")
                .setThumbnail(avatarUrl)
                .setColor(d.isBanned ? 0xFF0000 : 0x00fbff)
                .addFields(
                    { name: "👤 Tên hiển thị", value: `${d.displayName}`, inline: true },
                    { name: "🆔 User ID", value: `\`${userId}\``, inline: true },
                    { name: "📅 Ngày gia nhập", value: new Date(d.created).toLocaleDateString('vi-VN'), inline: true },
                    { name: "👥 Tương tác", value: `• **Bạn bè:** ${friends.data.count}\n• **Followers:** ${followers.data.count}`, inline: true },
                    { name: "🛡️ Trạng thái Acc", value: `• **Bị Ban:** ${d.isBanned ? "⚠️ Có" : "✅ Không"}\n• **Xác minh:** ${d.hasVerifiedBadge ? "🔹 Đã xác minh" : "❌ Chưa"}`, inline: true },
                    { name: "📡 Trạng thái hiện tại", value: status, inline: false },
                    { name: "🏘️ Nhóm tiêu biểu", value: groups.data.data[0] ? `**${groups.data.data[0].group.name}** (${groups.data.data[0].role.name})` : "Chưa vào nhóm", inline: false }
                )
                .setFooter({ text: `Dữ liệu cập nhật từ Roblox API`, iconURL: "https://images.rbxcdn.com/2b6a952957e102602167d6435c593817.png" })
                .setTimestamp();

            // Nút bấm tiện ích
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel('Xem Profile').setStyle(ButtonStyle.Link).setURL(`https://www.roblox.com/users/${userId}/profile`),
                new ButtonBuilder().setLabel('Lấy Ảnh Avatar').setStyle(ButtonStyle.Secondary).setCustomId(`get_av_${userId}`)
            );

            message.reply({ embeds: [embed], components: [row] });

        } catch (e) {
            console.error(e);
            message.reply("❌ Lỗi: Không thể lấy dữ liệu từ Roblox. Tài khoản có thể đã bị xóa hoặc API lag.");
        }
                }

    // --- LỆNH !rbgroup: XEM NHÓM ---
    if (command === 'rbgroup') {
        try {
            const u = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [args[0]] });
            const gRes = await axios.get(`https://groups.roblox.com/v2/users/${u.data.data[0].id}/groups/roles`);
            const groups = gRes.data.data.slice(0, 15).map(g => `• **${g.group.name}**`).join('\n') || "Không có nhóm.";
            message.reply(`👥 **Các nhóm của ${args[0]}:**\n${groups}`);
        } catch (e) { message.reply("❌ Lỗi."); }
    }

    // --- LỆNH !rbfriends: CHECK BẠN BÈ ---
    if (command === 'rbfriends') {
        try {
            const u = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [args[0]] });
            const f = await axios.get(`https://friends.roblox.com/v1/users/${u.data.data[0].id}/friends/count`);
            message.reply(`👥 **${args[0]}** có **${f.data.count}** bạn bè.`);
        } catch (e) { message.reply("❌ Lỗi."); }
    }

    // --- LỆNH !rbavatar: LẤY ẢNH ---
    if (command === 'rbavatar') {
        try {
            const u = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [args[0]] });
            const res = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${u.data.data[0].id}&size=720x720&format=Png`);
            message.reply(res.data.data[0].imageUrl);
        } catch (e) { message.reply("❌ Lỗi."); }
    }

    // --- LỆNH !joinvip: VÀO SERVER VIP ---
    if (command === 'joinvip') {
        try {
            const url = new URL(args[0]);
            const pid = url.pathname.split('/')[2];
            const code = url.searchParams.get("privateServerLinkCode");
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('VÀO VIP').setStyle(ButtonStyle.Link).setURL(`roblox://experiences/start?placeId=${pid}&privateServerLinkCode=${code}`));
            message.reply({ content: "🎟️ Bấm để vào Server VIP:", components: [row] });
        } catch (e) { message.reply("❌ Link VIP không đúng."); }
    }
});

client.login(process.env.TOKEN);
