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
// --- LỆNH !rbcheck: KIỂM TRA NHANH TRẠNG THÁI ---
    if (command === 'rbcheck') {
        const username = args[0];
        if (!username) return message.reply("❓ Cách dùng: `!rbcheck <tên_roblox>`");

        try {
            // 1. Lấy UserId từ Username
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { 
                usernames: [username] 
            });

            if (!userRes.data.data.length) return message.reply("❌ Không tìm thấy người chơi này.");
            const userId = userRes.data.data[0].id;

            // 2. Lấy trạng thái Presence
            const presenceRes = await axios.post("https://presence.roblox.com/v1/presence/users", { 
                userIds: [userId] 
            });
            const p = presenceRes.data.userPresences[0];

            // 3. Xử lý hiển thị trạng thái
            let statusEmoji = "⚪";
            let statusText = "Offline hoặc Ẩn danh";
            let detail = "";

            if (p) {
                switch (p.userPresenceType) {
                    case 0: // Offline
                        statusEmoji = "⚪";
                        statusText = "Offline";
                        break;
                    case 1: // Online (Website)
                        statusEmoji = "🔵";
                        statusText = "Đang Online (Website/App)";
                        break;
                    case 2: // In Game
                        statusEmoji = "🟢";
                        statusText = `Đang chơi: **${p.lastLocation || "Trò chơi ẩn"}**`;
                        detail = `\n📍 Place ID: \`${p.placeId}\``;
                        break;
                    case 3: // In Studio
                        statusEmoji = "🧡";
                        statusText = "Đang thiết kế (Roblox Studio)";
                        break;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(`🔍 Check: ${username}`)
                .setDescription(`${statusEmoji} ${statusText}${detail}`)
                .setColor(p.userPresenceType === 2 ? 0x00FF00 : 0x7289DA)
                .setTimestamp();

            // Nếu đang trong game, thêm nút Join nhanh
            if (p.userPresenceType === 2) {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('VÀO GAME NGAY')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`roblox://experiences/start?placeId=${p.placeId}&gameInstanceId=${p.gameId || ""}`)
                );
                return message.reply({ embeds: [embed], components: [row] });
            }

            message.reply({ embeds: [embed] });

        } catch (e) {
            console.error(e);
            message.reply("❌ Lỗi khi kiểm tra trạng thái Roblox.");
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
    // --- LỆNH !rbjoin: ÉP VÀO SERVER ---
    if (command === 'rbjoin') {
        const user = args[0];
        if (!user) return message.reply("❓ Nhập tên người chơi.");
        try {
            const u = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [user] });
            const id = u.data.data[0].id;
            const pRes = await axios.post("https://presence.roblox.com/v1/presence/users", { userIds: [id] });
            const p = pRes.data.userPresences[0];

            if (p && p.userPresenceType === 2) {
                const forceLink = `roblox://experiences/start?placeId=${p.placeId}&gameInstanceId=${p.gameId || ""}`;
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setLabel(`VÀO SERVER CỦA ${user.toUpperCase()}`).setStyle(ButtonStyle.Link).setURL(forceLink)
                );
                message.reply({ content: `✅ Tìm thấy **${user}** tại: **${p.lastLocation}**`, components: [row] });
            } else { message.reply(`❌ **${user}** đang Offline.`); }
        } catch (e) { message.reply("❌ Lỗi API."); }
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

    // --- LỆNH !ttacc: SOI CHI TIẾT ---
    if (command === 'ttacc') {
        try {
            const u = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [args[0]] });
            const id = u.data.data[0].id;
            const [det, thumb] = await Promise.all([
                axios.get(`https://users.roblox.com/v1/users/${id}`),
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=420x420&format=Png`)
            ]);
            const embed = new EmbedBuilder()
                .setTitle(`👤 Profile: ${args[0]}`)
                .setThumbnail(thumb.data.data[0].imageUrl)
                .addFields(
                    { name: "🆔 ID", value: `\`${id}\``, inline: true },
                    { name: "📅 Ngày tạo", value: new Date(det.data.created).toLocaleDateString('vi-VN'), inline: true },
                    { name: "📝 Tiểu sử", value: det.data.description || "Trống" }
                ).setColor(0x00fbff);
            message.reply({ embeds: [embed] });
        } catch (e) { message.reply("❌ Không tìm thấy."); }
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
