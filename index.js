const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ActivityType 
} = require('discord.js');
require('dotenv').config();
const axios = require('axios');

// Biến lưu trữ tiền và túi đồ (Lưu trong RAM, sẽ reset khi bot restart)
const tuiDo = {};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`[LEVIATHAN BOT] Đã sẵn sàng hoạt động! (Đã xóa Voice để fix lỗi Railway)`);
    client.user.setActivity('!help | Roblox & Fishing', { type: ActivityType.Watching });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
   const khoVatPham = [
    // 🗑️ RÁC (30% - Không bán được)
    { ten: "👟 Giày cũ rách", gia: 0 }, { ten: "🥫 Lon nước rỉ sét", gia: 0 },
    { ten: "🪵 Khúc gỗ mục", gia: 0 }, { ten: "🌿 Tảo biển độc", gia: 0 },
    { ten: "🧱 Viên gạch vỡ", gia: 0 }, { ten: "🧴 Chai nhựa rỗng", gia: 0 },

    // 🐟 CÁ THƯỜNG (50% - Tổng hợp đủ các loại cá sếp muốn)
    { ten: "🐟 Cá Rô", gia: 100 }, { ten: "🐠 Cá Hề", gia: 120 }, { ten: "🐡 Cá Nóc", gia: 150 },
    { ten: "🐟 Cá Chép", gia: 200 }, { ten: "🐟 Cá Thu", gia: 250 }, { ten: "🐟 Cá Trắm", gia: 300 },
    { ten: "🐟 Cá Linh", gia: 80 }, { ten: "🐟 Cá Sặc", gia: 90 }, { ten: "🐟 Cá Bống", gia: 110 },
    { ten: "🐟 Cá Tai Tượng", gia: 400 }, { ten: "🐟 Cá Lóc", gia: 350 }, { ten: "🐟 Cá Trê", gia: 320 },
    // ... (Sếp cứ copy thêm tên cá vào đây cho đủ 100 con)

    // ✨ CÁ HIẾM (15%)
    { ten: "🦈 Cá Mập Con", gia: 2500 }, { ten: "🐬 Cá Heo", gia: 5000 },
    { ten: "🦈 Cá Kiếm", gia: 7000 }, { ten: "🦑 Mực Khổng Lồ", gia: 4500 },

    // 📦 RƯƠNG BÁU (5% - Tách riêng logic)
    { ten: "🎁 Rương Gỗ Cổ", loai: "ruong" },
    { ten: "💎 Rương Kim Cương", loai: "ruong" },
    { ten: "🔱 Đinh Ba Thần", gia: 50000, rarity: "Thần Thoại" }
];
    // --- LỆNH HELP TỔNG HỢP (CHỨA TẤT CẢ LỆNH CŨ & MỚI) ---
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle("🎮 LEVIATHAN BOT - FULL COMMAND MENU")
            .setThumbnail(client.user.displayAvatarURL())
            .setColor(0xFF0000)
            .addFields(
                { 
                    name: "🚀 ROBLOX - TƯƠNG TÁC", 
                    value: "`!rbjoin [tên]`: Ép vào SV mục tiêu đang chơi.\n`!rblog [tên]`: Báo ngay khi mục tiêu vào game.", 
                    inline: false 
                },
                { 
                    name: "🔍 ROBLOX - TRA CỨU", 
                    value: "`!ttacc [tên]`: Soi profile, ngày tạo, ID.\n`!rbcheck [tên]`: Check trạng thái Online.\n`!rbavatar [tên]`: Lấy ảnh chân dung.\n`!rbgroup [tên]`: Xem các nhóm đã tham gia.\n`!rbfriends [tên]`: Đếm số lượng bạn bè.", 
                    inline: false 
                },
                { 
                    name: "🗣️ fish ( new)", 
                    value: "`!fish`: câu cá.\n`!vi `: xem ví.\n`!!doixu`: đổi xu \n`!moruong` : moẻ rương.", 
                    inline: false 
                },
                { 
                    name: "🔐 TIỆN ÍCH & TROLL", 
                    value: "`!laymk [tên]`: Lệnh troll lấy mật khẩu.\n`!joinvip [link]`: Nút Join nhanh cho SV VIP.", 
                    inline: false 
                }
            )
            .setFooter({ text: `Yêu cầu bởi: ${message.author.username}` })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }


if (command === 'phientoa') {
        // --- KHÓA MEMBER Ở ĐÂY ---
        const isAdmin = message.member.permissions.has('ManageGuild'); // Có quyền quản lý server
        const isOwner = message.author.id === message.guild.ownerId;   // Là chủ server

        if (!isAdmin && !isOwner) {
            return message.reply("🚫 **Quyền lực hạn chế:** Chỉ Admin hoặc Chủ Server mới có quyền mở phiên tòa xét xử!");
        }
        // ------------------------

        const target = message.mentions.members.first();
        const toiDanh = args.slice(1).join(" ") || "Tội phá hoại sự bình yên của server";

        if (!target) return message.reply("🔨 **Lệnh của Thẩm phán:** Tag bị cáo vào tòa! (VD: !phientoa @Ten Tội nói nhiều)");
        if (target.id === message.author.id) return message.reply("Sếp định tự đưa mình ra tòa à? Công lý không cho phép! 😂");

        // ... các đoạn code xử lý phiên tòa (Embed, Button, Collector) tiếp tục ở dưới ...
        // Khởi tạo dữ liệu tòa án cho người bị hại nếu chưa có
        if (!tuiDo[target.id]) tuiDo[target.id] = { tien: 0, xu: 0, tongCa: 0, tienAn: 0 };

        let coToi = 0;
        let voToi = 0;
        const votedUsers = new Set();
        const startTime = Date.now();

        // Hàm tạo giao diện thanh tiến trình chuyên nghiệp
        const getProgressBar = (part, total) => {
            const size = 12;
            const line = Math.round((part / total) * size);
            return "🟥".repeat(line) + "🟦".repeat(size - line);
        };

        const embed = new EmbedBuilder()
            .setTitle("⚖️ HỘI ĐỒNG XÉT XỬ TỐI CAO")
            .setColor(0x2f3136)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`**Bị cáo:** ${target}\n**Thẩm phán chủ tọa:** ${message.author}\n**Tội danh:** \`${toiDanh}\`\n**Tiền án:** \`${tuiDo[target.id].tienAn} lần\``)
            .addFields(
                { name: "🔍 Viện Kiểm Sát Đang Luận Tội...", value: "```Dựa trên các hoạt động gần đây, bị cáo có dấu hiệu vi phạm nghiêm trọng nội quy server. Nhân dân hãy đưa ra quyết định!```" },
                { name: `✅ CÓ TỘI [0]`, value: `0%`, inline: true },
                { name: `❌ VÔ TỘI [0]`, value: `0%`, inline: true },
                { name: "⚖️ CÁN CÂN CÔNG LÝ", value: `\`🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦\`` }
            )
            .setFooter({ text: "Phiên tòa kéo dài 45 giây • Quyết định của bạn sẽ ảnh hưởng đến số phận bị cáo!" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('guilty').setLabel('KẾT TỘI').setStyle(ButtonStyle.Danger).setEmoji('🔨'),
            new ButtonBuilder().setCustomId('innocent').setLabel('BÀO CHỮA').setStyle(ButtonStyle.Success).setEmoji('🛡️')
        );

        const msg = await message.channel.send({ content: `🔔 **PHIÊN TÒA BẮT ĐẦU!** Mời hội đồng thẩm phán vào làm việc.`, embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector({ time: 45000 });

        collector.on('collect', async i => {
            if (votedUsers.has(i.user.id)) return i.reply({ content: "Mỗi thẩm phán chỉ được bỏ phiếu một lần!", ephemeral: true });
            
            votedUsers.add(i.user.id);
            if (i.customId === 'guilty') coToi++;
            else voToi++;

            const total = coToi + voToi;
            const updatedEmbed = EmbedBuilder.from(embed).setFields(
                { name: "🔍 Tình trạng xét xử", value: `\`\`\`Tổng số phiếu: ${total}\`\`\`` },
                { name: `✅ CÓ TỘI [${coToi}]`, value: `${Math.round((coToi/total)*100)}%`, inline: true },
                { name: `❌ VÔ TỘI [${voToi}]`, value: `${Math.round((voToi/total)*100)}%`, inline: true },
                { name: "⚖️ CÁN CÂN CÔNG LÝ", value: `\`${getProgressBar(coToi, total)}\`` }
            );

            await i.update({ embeds: [updatedEmbed] });
        });

        collector.on('end', async () => {
            await msg.edit({ components: [] });
            
            // Hiệu ứng tuyên án hồi hộp
            const loadingMsg = await message.channel.send("🔨 **Đang nghị án... Thẩm phán đang gõ búa...**");
            
            setTimeout(async () => {
                await loadingMsg.delete();
                if (coToi > voToi) {
                    tuiDo[target.id].tienAn += 1; // Ghi vào sổ đen
                    const fine = 5000; // Phạt tiền nếu có tiền trong ví
                    let punishmentMsg = `⚖️ **TUYÊN ÁN:** Bị cáo ${target} bị tuyên bố **CÓ TỘI**.\n`;
                    
                    if (tuiDo[target.id].tien >= fine) {
                        tuiDo[target.id].tien -= fine;
                        punishmentMsg += `💰 **HÌNH PHẠT:** Tịch thu **${fine}$** vào công quỹ và ghi vào tiền án!`;
                    } else {
                        punishmentMsg += `👮 **HÌNH PHẠT:** Do không đủ tiền nộp phạt, bị cáo bị **TIMEOUT 2 PHÚT**!`;
                        try { await target.timeout(120000, "Kết tội bởi tòa án"); } catch(e) {}
                    }

                    message.channel.send({ content: `🔨 **CỘP! CỘP! CỘP!**\n${punishmentMsg}` });
                } else if (voToi > coToi) {
                    message.channel.send(`🕊️ **TUYÊN ÁN:** Bị cáo ${target} được tuyên **VÔ TỘI**! Trắng án và được bồi thường danh dự (không có tiền đâu).`);
                } else {
                    message.channel.send(`⚖️ **HÒA PHIẾU:** Phiên tòa giải tán do không đủ bằng chứng thuyết phục.`);
                }
            }, 3000);
        });
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
  

// ... (trong phần client.on messageCreate)

  if (command === 'fish') {
        const userId = message.author.id;
        // Khởi tạo túi đồ (phải có biến ruong)
        if (!tuiDo[userId]) tuiDo[userId] = { tien: 0, xu: 0, tongCa: 0, ruong: 0 };

        const ngauNhien = khoVatPham[Math.floor(Math.random() * khoVatPham.length)];

        // TRƯỜNG HỢP 1: CÂU TRÚNG RƯƠNG (Cất vào kho, không mở)
        if (ngauNhien.loai === "ruong") {
            tuiDo[userId].ruong = (tuiDo[userId].ruong || 0) + 1;
            return message.reply(`📦 | **KHO BÁU!** Sếp vừa câu được **${ngauNhien.ten}**!\n👉 Rương đã được cất vào kho. Gõ \`!moruong\` để mở.`);
        }

        // TRƯỜNG HỢP 2: CÂU TRÚNG RÁC (Gia = 0)
        if (ngauNhien.gia === 0) {
            return message.reply(`🎣 | Kéo cần lên... chỉ thấy một **${ngauNhien.ten}** 🗑️. Đen quá sếp!`);
        }

        // TRƯỜNG HỢP 3: CÂU TRÚNG CÁ
        tuiDo[userId].tien += ngauNhien.gia;
        tuiDo[userId].tongCa += 1;
        
        let thongBao = `🎣 | **${message.author.username}** câu được **${ngauNhien.ten}**! Bán được **${ngauNhien.gia.toLocaleString()}$**.`;
        if (ngauNhien.rarity) thongBao = `✨ | **HUYỀN THOẠI!** Sếp trục vớt được **${ngauNhien.ten}** giá **${ngauNhien.gia.toLocaleString()}$**!`;
        
        message.reply(thongBao);
  }
    if (command === 'moruong') {
        const userId = message.author.id;
        if (!tuiDo[userId] || !tuiDo[userId].ruong || tuiDo[userId].ruong <= 0) {
            return message.reply("❌ Trong kho không có cái rương nào cả sếp ơi! Đi câu đi.");
        }

        // Trừ rương
        tuiDo[userId].ruong -= 1;

        // Quà ngẫu nhiên
        const tile = Math.random() * 100;
        let phanThuong = "";

        if (tile < 80) { // 80% ra tiền
            const tien = Math.floor(Math.random() * 20000) + 5000;
            tuiDo[userId].tien += tien;
            phanThuong = `💰 **${tien.toLocaleString()}$ tiền mặt**`;
        } else { // 20% ra Xu Vàng
            const xu = Math.floor(Math.random() * 10) + 5;
            tuiDo[userId].xu += xu;
            phanThuong = `✨ **${xu} Xu Vàng**`;
        }

        message.reply(`🎁 **MỞ RƯƠNG:** Sếp khui rương thành công và nhận được: ${phanThuong}!`);
    }
    if (command === 'doixu') {
        const userId = message.author.id;
        
        // Thêm dòng này: Nếu chưa có dữ liệu thì tạo mới để tránh lỗi
        if (!tuiDo[userId]) tuiDo[userId] = { tien: 0, xu: 0, tongCa: 0 };

        const data = tuiDo[userId];
        const soLuongXu = parseInt(args[0]) || 10; 
        const giaXu = 1000; 

        if (data.tien < (giaXu * soLuongXu)) {
            return message.reply(`❌ Sếp không đủ tiền! Cần **${giaXu * soLuongXu}$** để đổi **${soLuongXu} Xu**.`);
        }

        data.tien -= (giaXu * soLuongXu);
        data.xu += soLuongXu;
        message.reply(`✅ Thành công! Sếp đã đổi **${giaXu * soLuongXu}$** lấy **${soLuongXu} Xu Vàng**. Hiện có: **${data.xu} Xu**.`);
    }
    if (command === 'vi') {
        const userId = message.author.id;
        
        // Khởi tạo dữ liệu mặc định nếu người dùng mới tinh chưa có túi đồ
        if (!tuiDo[userId]) {
            tuiDo[userId] = { 
                tien: 0, 
                xu: 0, 
                tongCa: 0, 
                ruong: 0, 
                tienAn: 0 
            };
        }

        const data = tuiDo[userId];

        const embedVi = new EmbedBuilder()
            .setTitle(`🏦 TÀI KHOẢN CỦA ${message.author.username.toUpperCase()}`)
            .setColor(0x00FF00) // Màu xanh lá cho giàu sang
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                { 
                    name: "💰 Tài Chính", 
                    value: `💵 Tiền mặt: **${(data.tien || 0).toLocaleString()}$**\n✨ Xu Vàng: **${data.xu || 0} Xu**`, 
                    inline: false 
                },
                { 
                    name: "🎣 Kho Đồ Câu Cá", 
                    value: `🐟 Tổng cá đã câu: **${data.tongCa || 0} con**\n📦 Rương báu hiện có: **${data.ruong || 0} cái**`, 
                    inline: true 
                },
                { 
                    name: "⚖️ Hồ Sơ Pháp Lý", 
                    value: `🔨 Tiền án: **${data.tienAn || 0} lần**`, 
                    inline: true 
                }
            )
            .setFooter({ text: "Sếp chăm chỉ câu cá để làm giàu nhé! 💸" })
            .setTimestamp();

        message.reply({ embeds: [embedVi] });
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

    // --- LỆNH !rbgroup: SOI HỘI NHÓM CHI TIẾT ---
    if (command === 'rbgroup') {
        const username = args[0];
        if (!username) return message.reply("❓ Nhập tên người chơi cần xem nhóm.");

        try {
            // 1. Lấy UserId
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [username] });
            if (!userRes.data.data.length) return message.reply("❌ Không tìm thấy người chơi này.");
            
            const userId = userRes.data.data[0].id;

            // 2. Lấy danh sách nhóm và ảnh đại diện
            const [groupsRes, thumbRes] = await Promise.all([
                axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`),
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`)
            ]);

            const groupsData = groupsRes.data.data;
            const avatarUrl = thumbRes.data.data[0].imageUrl;

            if (groupsData.length === 0) {
                return message.reply(`👤 **${username}** hiện không tham gia bất kỳ nhóm nào.`);
            }

            // 3. Phân tích dữ liệu nhóm (Lấy tối đa 10 nhóm nổi bật nhất để tránh dài quá)
            const groupList = groupsData.slice(0, 10).map(g => {
                return `🏠 **${g.group.name}**\n   └ 🏷️ *Chức vụ:* \`${g.role.name}\` (Rank: ${g.role.rank})`;
            }).join('\n\n');

            const embed = new EmbedBuilder()
                .setTitle(`🏘️ Danh sách nhóm của ${username}`)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setThumbnail(avatarUrl)
                .setColor(0x2F3136) // Màu xám tối cực sang
                .setDescription(groupList)
                .addFields(
                    { name: "📊 Tổng quan", value: `Đã tham gia **${groupsData.length}** nhóm.`, inline: false }
                )
                .setFooter({ text: `Check bởi ${message.author.username} | Dữ liệu thời gian thực` })
                .setTimestamp();

            // 4. Nút bấm xem tất cả nhóm
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('XEM TẤT CẢ NHÓM')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://www.roblox.com/users/${userId}/profile#!/groups`)
            );

            message.reply({ embeds: [embed], components: [row] });

        } catch (e) {
            console.error(e);
            message.reply("❌ Lỗi khi trích xuất dữ liệu nhóm từ Roblox.");
        }
    }

    // --- LỆNH !rbfriends: THỐNG KÊ TƯƠNG TÁC ---
    if (command === 'rbfriends') {
        const username = args[0];
        if (!username) return message.reply("❓ Nhập tên người chơi cần check bạn bè.");

        try {
            // 1. Lấy UserId
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [username] });
            if (!userRes.data.data.length) return message.reply("❌ Không tìm thấy người chơi này.");
            
            const userId = userRes.data.data[0].id;
            const displayName = userRes.data.data[0].displayName;

            // 2. Lấy đồng thời: Số bạn bè, Follower, Following và Ảnh Profile
            const [friends, followers, followings, thumb] = await Promise.all([
                axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
                axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
                axios.get(`https://friends.roblox.com/v1/users/${userId}/followings/count`),
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`)
            ]);

            // 3. Tạo Embed chuyên nghiệp
            const embed = new EmbedBuilder()
                .setTitle(`👥 Danh sách tương tác: ${username}`)
                .setURL(`https://www.roblox.com/users/${userId}/friends#!/friends`)
                .setThumbnail(thumb.data.data[0].imageUrl)
                .setColor(0x5865F2) // Màu xanh Discord Blurple
                .addFields(
                    { name: "🤝 Bạn bè", value: `**${friends.data.count}** / 200`, inline: true },
                    { name: "📈 Người theo dõi", value: `**${followers.data.count.toLocaleString()}**`, inline: true },
                    { name: "📉 Đang theo dõi", value: `**${followings.data.count.toLocaleString()}**`, inline: true }
                )
                .setFooter({ text: `ID: ${userId} | Check bởi ${message.author.username}` })
                .setTimestamp();

            // 4. Nút bấm xem danh sách trên Web
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('XEM DANH SÁCH BẠN BÈ')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://www.roblox.com/users/${userId}/friends#!/friends`)
            );

            message.reply({ embeds: [embed], components: [row] });

        } catch (e) {
            console.error(e);
            message.reply("❌ Lỗi khi lấy dữ liệu bạn bè từ Roblox.");
        }
    }
    // --- LỆNH !rbavatar: LẤY ẢNH AVATAR SIÊU ĐẸP ---
    if (command === 'rbavatar') {
        const username = args[0];
        if (!username) return message.reply("❓ Nhập tên người chơi cần lấy ảnh.");

        try {
            // 1. Lấy UserId
            const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", { usernames: [username] });
            if (!userRes.data.data.length) return message.reply("❌ Không tìm thấy người chơi này.");
            const userId = userRes.data.data[0].id;
            const displayName = userRes.data.data[0].displayName;

            // 2. Lấy đồng thời ảnh Toàn thân và ảnh Chân dung (Size lớn nhất 720x720)
            const [fullBody, headShot] = await Promise.all([
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`),
                axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`)
            ]);

            const fullImageUrl = fullBody.data.data[0].imageUrl;
            const headImageUrl = headShot.data.data[0].imageUrl;

            // 3. Tạo Embed
            const embed = new EmbedBuilder()
                .setTitle(`📸 Avatar của ${username}`)
                .setURL(`https://www.roblox.com/users/${userId}/profile`)
                .setDescription(`👤 **Tên hiển thị:** ${displayName}\n🆔 **User ID:** \`${userId}\``)
                .setImage(fullImageUrl) // Ảnh to là ảnh toàn thân
                .setThumbnail(headImageUrl) // Ảnh nhỏ góc trên là ảnh chân dung
                .setColor(0x00fbff)
                .setFooter({ text: `Yêu cầu bởi: ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            // 4. Nút bấm để mở ảnh gốc hoặc xem Profile
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Mở Ảnh Gốc (HD)')
                    .setStyle(ButtonStyle.Link)
                    .setURL(fullImageUrl),
                new ButtonBuilder()
                    .setLabel('Xem Profile')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://www.roblox.com/users/${userId}/profile`)
            );

            message.reply({ embeds: [embed], components: [row] });

        } catch (e) {
            console.error(e);
            message.reply("❌ Có lỗi xảy ra khi lấy dữ liệu ảnh từ Roblox.");
        }
    }
// --- LỆNH !joinvip: HIỆN NÚT NHẬP LINK ---
    if (command === 'joinvip') {
        const embed = new EmbedBuilder()
            .setTitle("🎟️ KÍCH HOẠT SERVER VIP")
            .setDescription("Bấm vào nút bên dưới để nhập Link Server VIP. \n*Thông tin sẽ được xử lý riêng tư cho bạn.*")
            .setColor(0xFFD700);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_vip_modal')
                .setLabel('NHẬP LINK VIP')
                .setStyle(ButtonStyle.Primary)
        );

        message.reply({ embeds: [embed], components: [row] });
    }
    
});
// --- XỬ LÝ BẢNG NHẬP LIỆU (MODAL) ---
client.on('interactionCreate', async (interaction) => {
    // 1. Khi bấm nút để hiện bảng nhập
    if (interaction.isButton() && interaction.customId === 'open_vip_modal') {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder().setCustomId('vip_modal').setTitle('Nhập Link Server VIP');

        const linkInput = new TextInputBuilder()
            .setCustomId('vip_link_input')
            .setLabel("Dán link Server VIP vào đây:")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("https://www.roblox.com/games/...")
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(linkInput));
        return await interaction.showModal(modal);
    }

    // 2. Khi gửi bảng nhập liệu
    if (interaction.isModalSubmit() && interaction.customId === 'vip_modal') {
        const link = interaction.fields.getTextInputValue('vip_link_input');
        
        try {
            const urlObj = new URL(link);
            const placeId = urlObj.pathname.split('/')[2];
            const vipCode = urlObj.searchParams.get("privateServerLinkCode");

            if (!placeId || !vipCode) {
                return await interaction.reply({ content: "❌ Link không đúng định dạng Server VIP!", ephemeral: true });
            }

            const forceVipLink = `roblox://experiences/start?placeId=${placeId}&privateServerLinkCode=${vipCode}`;
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel('VÀO SERVER VIP NGAY').setStyle(ButtonStyle.Link).setURL(forceVipLink)
            );

            // Nhắn riêng cho người nhập (Chỉ họ mới thấy)
            await interaction.reply({ 
                content: `✅ **Đã xác nhận link thành công!**\n📍 Place ID: \`${placeId}\`\nBấm nút dưới đây để bay thẳng vào game:`, 
                components: [row],
                ephemeral: true 
            });

        } catch (e) {
            await interaction.reply({ content: "❌ Link không hợp lệ, vui lòng kiểm tra lại.", ephemeral: true });
        }
    }
});
client.login(process.env.TOKEN);
