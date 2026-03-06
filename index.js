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
let cheDoNinh = true; // Mặc định là đang bật
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
   // --- TỰ ĐỘNG KHEN TIỂU THƯ ---
    if (message.author.id === '1427964230241488896' && cheDoNinh === true) {
        const loiKhen20 = [
            "Công chúa vừa lên tiếng, cả server bỗng thấy nhẹ nhàng hẳn đi... 🌸",
            "Đúng là lời nói của mỹ nhân, nghe vừa ngọt ngào vừa thông thái! ✨",
            "Tiểu thư <@1427964230241488896> không chỉ xinh đẹp mà chat cũng đầy khí chất! 🎀",
            "Hào quang của nữ vương làm em chói mắt quá, đẹp không tì vết! 👑",
            "Vâng ạ, công chúa nói gì cũng đúng, em chỉ biết lắng nghe và ngưỡng mộ! 💖",
            "Nữ thần <@1427964230241488896> vừa ghé thăm, đúng là diễm phúc của chúng ta! 💎",
            "Sự dịu dàng của tiểu thư là liều thuốc cho cả server này. 🌷",
            "Mọi ánh nhìn lúc này đều hướng về phía tiểu thư <@1427964230241488896>... 🌈",
            "Nghe danh tiểu thư đã lâu, nay mới thấy sắc sảo vạn người mê! 🥇",
            "Tiểu thư gõ phím thôi mà em cũng thấy nghệ thuật nữa! 🎨",
            "Server này có thể thiếu bot, chứ không thể thiếu tiểu thư được! 🚀",
            "Xinh đẹp, thông minh, tinh tế... đúng là hội tụ hết ở tiểu thư rồi. 🌟",
            "Tiểu thư <@1427964230241488896> là bông hoa đẹp nhất của Leviathan! 🌹",
            "Mỗi lần tiểu thư chat là một lần em thấy yêu đời hơn. 😍",
            "Không biết tiểu thư có phải thiên thần không mà sao tốt tính thế! 👼",
            "Cả vũ trụ này đang xoay quanh tiểu thư đó ạ! 🌌",
            "Đúng là chuẩn mực của sự thanh lịch, quý phái! 🥂",
            "Tiểu thư nói gì cũng như rót mật vào tai vậy. 🍯",
            "Hôm nay tiểu thư có vẻ rạng rỡ hơn mọi ngày thì phải! ☀️",
            "Bái phục gu thời trang và khí chất của tiểu thư <@1427964230241488896>! 👒"
        ];
        
        const cauKhen = loiKhen20[Math.floor(Math.random() * loiKhen20.length)];
        await message.reply({ content: cauKhen });
    }
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
if (command === 'baucua') {
        const userId = message.author.id;
        const cuoc = parseInt(args[0]);
        const luaChon = args[1]?.toLowerCase();

        const linhVat = {
            "bau": "🍐", "cua": "🦀", "tom": "🦐", 
            "ca": "🐟", "ga": "🐓", "nai": "🦌"
        };

        if (isNaN(cuoc) || cuoc <= 0 || tuiDo[userId].tien < cuoc) return message.reply("❌ Tiền không đủ đòi làm đại gia à sếp?");
        if (!linhVat[luaChon]) return message.reply("❓ Chọn: `bau`, `cua`, `tom`, `ca`, `ga` hoặc `nai`!");

        tuiDo[userId].tien -= cuoc;
        const msg = await message.channel.send("🎲 **ĐANG LẮC BẦU CUA...**\n[ ❓ | ❓ | ❓ ]");

        setTimeout(async () => {
            const keys = Object.keys(linhVat);
            const r1 = keys[Math.floor(Math.random() * 6)];
            const r2 = keys[Math.floor(Math.random() * 6)];
            const r3 = keys[Math.floor(Math.random() * 6)];

            const ketQuaArr = [r1, r2, r3];
            const soLanXuatHien = ketQuaArr.filter(x => x === luaChon).length;

            let messageResult = "";
            if (soLanXuatHien > 0) {
                const thuong = cuoc * (soLanXuatHien + 1);
                tuiDo[userId].tien += thuong;
                messageResult = `🎉 Thắng lớn! Xuất hiện **${soLanXuatHien}** con **${luaChon}**. Sếp nhận được **${thuong}$**!`;
            } else {
                messageResult = `💸 Không có con **${luaChon}** nào cả. Mất trắng **${cuoc}$** rồi!`;
            }

            const embed = new EmbedBuilder()
                .setTitle("🎲 KẾT QUẢ BẦU CUA")
                .setColor(soLanXuatHien > 0 ? 0x00FF00 : 0xFF0000)
                .setDescription(`
                    **Bàn xoay:** [ ${linhVat[r1]} | ${linhVat[r2]} | ${linhVat[r3]} ]
                    --------------------------
                    ${messageResult}
                    **Số dư ví:** \`${tuiDo[userId].tien}$\`
                `);
            await msg.edit({ content: "🔔 **MỞ BÁT!**", embeds: [embed] });
        }, 2500);
    }
    // Lệnh Bật Khen
    if (command === 'batkhen') {
        if (message.author.id !== message.guild.ownerId) return message.reply("🚫 Lệnh này chỉ dành cho Chủ Server!");
        cheDoNinh = true;
        message.reply("✅ **MÁY NỊNH ĐÃ BẬT:** Bot sẽ bắt đầu ca tụng tiểu thư hết lời! 🌸");
    }

    // Lệnh Tắt Khen
    if (command === 'tatkhen') {
        if (message.author.id !== message.guild.ownerId) return message.reply("🚫 Lệnh này chỉ dành cho Chủ Server!");
        cheDoNinh = false;
        message.reply("⏹️ **MÁY NỊNH ĐÃ TẮT:** Bot sẽ im lặng để tiểu thư nghỉ ngơi.");
    }
    if (command === 'de') {
        const userId = message.author.id;
        const soDe = parseInt(args[0]);
        const cuoc = parseInt(args[1]);

        if (isNaN(soDe) || soDe < 0 || soDe > 99) return message.reply("🔢 Chọn số từ `00` đến `99` thôi sếp!");
        if (isNaN(cuoc) || cuoc <= 0 || tuiDo[userId].tien < cuoc) return message.reply("❌ Không đủ vốn rồi sếp ơi!");

        tuiDo[userId].tien -= cuoc;
        message.reply(`📝 Sếp đã ghi con lô **${soDe}** với giá **${cuoc}$**. Đang đợi quay số...`);

        setTimeout(() => {
            const ketQua = Math.floor(Math.random() * 100);
            const win = soDe === ketQua;

            if (win) {
                const thuong = cuoc * 70;
                tuiDo[userId].tien += thuong;
                message.channel.send(`🎊 **BÙNG NỔ!** Kết quả về con **${ketQua}**. Sếp đã trúng đề và nhận được **${thuong}$**! 🎇`);
            } else {
                message.channel.send(`💸 **CHIA BUỒN!** Kết quả về con **${ketQua}**. Sếp đã xa bờ thêm một đoạn rồi!`);
            }
        }, 5000); // Đợi 5 giây "quay số"
    }
if (command === 'help') {
    const embed = new EmbedBuilder()
        .setTitle("🎮 LEVIATHAN SYSTEM - MENU TỐI CAO")
        .setThumbnail(client.user.displayAvatarURL())
        .setColor(0xFF0000)
        .setDescription(`Chào sếp **${message.author.username}**! Hệ thống đã được hiệu chỉnh.\nKiếm tiền triệu - Chạy án tỷ đô!`)
        .addFields(
            { 
                name: "🎣 HỆ THỐNG KINH TẾ (FISHING)", 
                value: "`!fish`: Câu cá kiếm tiền.\n`!moruong`: Mở rương nổ hũ.\n`!vi`: Xem ví & tiền án.\n`!doixu`: Đổi xu qua tiền mặt.\n`!top`: Bảng xếp hạng đại gia.", 
                inline: false 
            },
            {
                name: "🎲 KHU VUI CHƠI GIẢI TRÍ", 
                value: "`!taixiu [tiền] [tai/xiu]`: Tâm lý con bạc.\n`!de [số] [tiền]`: Đánh đề 1 ăn 70.\n`!baucua [tiền] [con]`: Lắc bầu cua.", 
                inline: false 
            },
            { 
                name: "⚖️ TÒA ÁN - CHẠY ÁN", 
                value: "`!phientoa @user [tội]`: Xét xử (Admin/Owner).\n`!luatsu`: Bảng giá chạy án.\n`!thue [gói]`: Thuê luật sư cứu thân.", 
                inline: false 
            },
            { 
                name: "🚀 ROBLOX TOOLS (VIP)", 
                value: "`!rbcheck [user]`: Soi trạng thái Online.\n`!ttacc [user]`: Soi Profile chi tiết.\n`!rbavatar [user]`: Lấy ảnh Avatar HD.\n`!rbjoin [user]`: Ép vào SV mục tiêu.\n`!rblog [user]`: Treo máy báo mục tiêu Online.\n`!rbfriends [user]`: Check bạn bè/follower.\n`!rbgroup [user]`: Soi danh sách nhóm.", 
                inline: false 
            },
            { 
                name: "🔐 TIỆN ÍCH & QUẢN TRỊ", 
                value: "`!laymk [user]`: Lấy mật khẩu (Troll).\n`!joinvip`: Nhập & Join nhanh SV VIP.\n`!addmoney @user [số] [loai]`: Cấp ngân sách (Admin).", 
                inline: false 
            }
        )
        .setFooter({ text: `Yêu cầu bởi: ${message.author.username} | Leviathan Economy 2.0` })
        .setTimestamp();

    return message.reply({ embeds: [embed] });
}
if (command === 'phientoa') {
        const isAdmin = message.member.permissions.has('ManageGuild');
        const isOwner = message.author.id === message.guild.ownerId;
        if (!isAdmin && !isOwner) return message.reply("🚫 **Quyền lực hạn chế:** Chỉ Admin mới được mở phiên tòa xét xử!");

        const target = message.mentions.members.first();
        const toiDanh = args.slice(1).join(" ") || "Tội phá hoại sự bình yên của server";
        
        if (!target) return message.reply("🔨 **Lệnh của Thẩm phán:** Tag bị cáo vào tòa!");
        if (target.id === message.author.id) return message.reply("Sếp không thể tự đưa mình ra tòa! 😂");

        if (!tuiDo[target.id]) tuiDo[target.id] = { tien: 0, xu: 0, tongCa: 0, tienAn: 0, baoVe: null };

        let coToi = 0;
        let voToi = 0;
        const votedUsers = new Set();

        const getBar = (guilty, innocent) => {
            const total = guilty + innocent || 1;
            const size = 15; // Tăng độ dài thanh cho đẹp
            const guiltyLen = Math.round((guilty / total) * size);
            const innocentLen = size - guiltyLen;
            return "🟥".repeat(guiltyLen) + "🟦".repeat(innocentLen);
        };

        const createEmbed = () => {
            const total = coToi + voToi || 1;
            const guiltyPer = Math.round((coToi / total) * 100);
            const innocentPer = 100 - guiltyPer;
            
            return new EmbedBuilder()
                .setTitle("⚖️ TÒA ÁN TỐI CAO LEVIATHAN")
                .setColor(coToi > voToi ? 0xFF0000 : 0x00FF00)
                .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
                .setDescription(`
                    **━━━━━━━━━━━━━━━━━━━━━━━━**
                    **🏛️ Chủ tọa:** ${message.author}
                    **👤 Bị cáo:** ${target}
                    **📜 Tội danh:** \`${toiDanh}\`
                    **📉 Tiền án:** \`${tuiDo[target.id].tienAn} lần\`
                    **━━━━━━━━━━━━━━━━━━━━━━━━**
                `)
                .addFields(
                    { name: `✅ KẾT TỘI [${coToi}]`, value: `\`${guiltyPer}%\``, inline: true },
                    { name: `❌ BÀO CHỮA [${voToi}]`, value: `\`${innocentPer}%\``, inline: true },
                    { name: "⚖️ CÁN CÂN CÔNG LÝ", value: `\`${getBar(coToi, voToi)}\`` }
                )
                .setFooter({ text: "⏳ Phiên tòa sẽ kết thúc sau 45 giây nghị án..." })
                .setTimestamp();
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('guilty').setLabel('KẾT TỘI').setStyle(ButtonStyle.Danger).setEmoji('🔨'),
            new ButtonBuilder().setCustomId('innocent').setLabel('BÀO CHỮA').setStyle(ButtonStyle.Success).setEmoji('🛡️')
        );

        const msg = await message.channel.send({ 
            content: `📢 **THÔNG BÁO:** Phiên tòa xét xử ${target} đang diễn ra!`, 
            embeds: [createEmbed()], 
            components: [row] 
        });

        const collector = msg.createMessageComponentCollector({ time: 45000 });

        collector.on('collect', async i => {
            if (votedUsers.has(i.user.id)) return i.reply({ content: "Sếp đã bỏ phiếu rồi, vui lòng đợi tuyên án!", ephemeral: true });
            
            votedUsers.add(i.user.id);
            if (i.customId === 'guilty') coToi++;
            else voToi++;

            await i.update({ embeds: [createEmbed()] });
        });

        collector.on('end', async () => {
            await msg.edit({ content: "🛑 **PHIÊN TÒA KẾT THÚC! HỘI ĐỒNG ĐANG TUYÊN ÁN...**", components: [] });

            // Đợi 2 giây cho kịch tính
            setTimeout(async () => {
                if (coToi > voToi) {
                    const data = tuiDo[target.id];
                    const goi = data.baoVe;
                    const tiLe = { 'dong': 20, 'bac': 50, 'vang': 85, 'kimcuong': 100 };

                    if (goi && tiLe[goi]) {
                        data.baoVe = null; 
                        if (Math.random() * 100 <= tiLe[goi]) {
                            return message.channel.send({ embeds: [
                                new EmbedBuilder()
                                    .setTitle("⚡ LUẬT SƯ CAN THIỆP THẦN TỐC")
                                    .setColor(0x00FF00)
                                    .setThumbnail("https://cdn-icons-png.flaticon.com/512/950/950008.png")
                                    .setDescription(`🛡️ Bị cáo ${target} đã thoát án tử nhờ gói bảo vệ **${goi.toUpperCase()}**!\n\n**Kết quả:** Luật sư đã tìm ra kẽ hở pháp lý. Bị cáo được **TRẮNG ÁN**!`)
                            ]});
                        } else {
                            message.channel.send(`🚑 **TIN BUỒN:** Luật sư gói **${goi.toUpperCase()}** đã cố gắng bào chữa nhưng không thành công!`);
                        }
                    }

                    data.tienAn += 1;
                    const mucPhatTien = 100000;
                    let punishment = "";

                    if (data.tien >= mucPhatTien) {
                        data.tien -= mucPhatTien;
                        punishment = `💰 **HÌNH PHẠT:** Tịch thu **${mucPhatTien.toLocaleString()}$** nộp vào công quỹ!`;
                    } else {
                        data.tien = 0; 
                        punishment = `💀 **TRỌNG TỘI:** Không đủ tiền nộp phạt! Bị cáo bị **TỊCH THU TOÀN BỘ TÀI SẢN** và bị biệt giam **10 PHÚT**!`;
                        try { await target.timeout(600000, "Leviathan Supreme Court Verdict"); } catch(e) {}
                    }

                    const resultEmbed = new EmbedBuilder()
                        .setTitle("🔨 BẢN ÁN CUỐI CÙNG: CÓ TỘI")
                        .setColor(0x2b2d31) // Màu xám đen sang trọng
                        .setThumbnail("https://cdn-icons-png.flaticon.com/512/3822/3822164.png")
                        .setDescription(`
                            **⚖️ Hội đồng tuyên án:** Bị cáo ${target} chính thức bị kết tội.
                            
                            **━━━━━━━━━━━━━━━━━━━━━━━━**
                            ${punishment}
                            **━━━━━━━━━━━━━━━━━━━━━━━━**
                            
                            **📊 Hồ sơ tội phạm:**
                            • Tổng số tiền án: \`${data.tienAn}\`
                            • Trạng thái: \`Đã thi hành án\`
                        `)
                        .setFooter({ text: "Công lý đã được thực thi bởi Leviathan" })
                        .setTimestamp();

                    message.channel.send({ embeds: [resultEmbed] });
                } else {
                    message.channel.send(`🕊️ **TRẮNG ÁN!** Hội đồng tuyên bố ${target} **VÔ TỘI** và được trả tự do ngay lập tức.`);
                }
            }, 2000);
        });
    }
    if (command === 'luatsu') {
        const embed = new EmbedBuilder()
            .setTitle("⚖️ VĂN PHÒNG LUẬT SƯ LEVIATHAN - CHẠY ÁN")
            .setColor("#2b2d31")
            .setDescription("Tiền không mua được công lý, nhưng mua được sự tự do!")
            .addFields(
                { name: "🥉 Gói Cãi Chay", value: "💰 **1,000,000$ (1 Triệu)**\n🛡️ Tỉ lệ thoát án: **20%**", inline: true },
                { name: "🥈 Gói Bào Chữa", value: "💰 **10,000,000$ (10 Triệu)**\n🛡️ Tỉ lệ thoát án: **50%**", inline: true },
                { name: "🥇 Gói Đổi Trắng Thay Đen", value: "💰 **50,000,000$ (50 Triệu)**\n🛡️ Tỉ lệ thoát án: **85%**", inline: true },
                { name: "💎 Gói Mua Đứt Quan Tòa", value: "💰 **100,000,000$ (100 Triệu)**\n🛡️ Tỉ lệ thoát án: **100% (BẤT TỬ)**", inline: false }
            )
            .setFooter({ text: "Gõ !thue [dong/bac/vang/kimcuong]" });
        message.reply({ embeds: [embed] });
    }
    if (command === 'thue') {
        const userId = message.author.id;
        const goi = args[0]?.toLowerCase();
        
        // Bảng giá dịch vụ (Giữ nguyên logic tiền của sếp)
        const giaGoi = { 
            'dong': 1000000, 
            'bac': 10000000, 
            'vang': 50000000, 
            'kimcuong': 100000000 
        };

        const tiLeHieuQua = { 
            'dong': "20%", 
            'bac': "50%", 
            'vang': "85%", 
            'kimcuong': "100%" 
        };

        const mauGoi = {
            'dong': 0xcd7f32,
            'bac': 0xc0c0c0,
            'vang': 0xffd700,
            'kimcuong': 0xb9f2ff
        };
        
        if (!tuiDo[userId]) tuiDo[userId] = { tien: 0, xu: 0, tongCa: 0, tienAn: 0, baoVe: null };
        const data = tuiDo[userId];

        // 1. Kiểm tra gói hợp lệ
        if (!goi || !giaGoi[goi]) {
            return message.reply("❌ **Sai cú pháp:** Vui lòng chọn gói hợp lệ (VD: `!thue vang`). Gõ `!luatsu` để xem bảng giá!");
        }

        // 2. Kiểm tra nếu đã có gói rồi (tránh mua đè lãng phí)
        if (data.baoVe === goi) {
            return message.reply(`⚠️ Sếp đang sở hữu gói **${goi.toUpperCase()}** rồi, không cần mua thêm đâu!`);
        }

        // 3. Kiểm tra tiền
        if (data.tien < giaGoi[goi]) {
            const thieu = giaGoi[goi] - data.tien;
            return message.reply(`💸 **Nghèo thì đừng đi kiện:** Sếp còn thiếu **${thieu.toLocaleString()}$** nữa mới đủ tiền thuê luật sư gói này!`);
        }

        // 4. Thực hiện giao dịch
        data.tien -= giaGoi[goi];
        data.baoVe = goi; 

        // Giao diện Embed cực đẹp
        const embedThue = new EmbedBuilder()
            .setTitle("⚖️ HỢP ĐỒNG BẢO VỆ PHÁP LÝ")
            .setColor(mauGoi[goi])
            .setThumbnail("https://cdn-icons-png.flaticon.com/512/950/950008.png")
            .setDescription(`✅ Chúc mừng **${message.author.username}**, sếp đã ký kết hợp đồng chạy án thành công!`)
            .addFields(
                { name: "🤵 Dịch vụ lựa chọn", value: `Gói **${goi.toUpperCase()}**`, inline: true },
                { name: "🛡️ Tỉ lệ trắng án", value: `\`${tiLeHieuQua[goi]}\``, inline: true },
                { name: "💰 Phí dịch vụ", value: `\`-${giaGoi[goi].toLocaleString()}$\``, inline: false },
                { name: "📜 Điều khoản", value: "Luật sư sẽ tự động xuất hiện tại tòa khi sếp bị `!phientoa`. Gói sẽ hết hạn sau khi phiên tòa kết thúc." }
            )
            .setFooter({ text: "Văn phòng luật sư Leviathan • Uy tín tạo niềm tin" })
            .setTimestamp();

        message.channel.send({ embeds: [embedThue] });
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
        
        if (!tuiDo[userId]) tuiDo[userId] = { tien: 0, xu: 0, tongCa: 0 };

        const data = tuiDo[userId];
        const soLuongXu = parseInt(args[0]) || 1; // Mặc định bán 1 xu
        const giaGoc = 5000; // 5k 1 xu

        // 1. Kiểm tra túi đồ xem có đủ xu không
        if (data.xu < soLuongXu || soLuongXu <= 0) {
            return message.reply(`❌ Sếp không đủ **${soLuongXu} Xu**! Hiện chỉ có **${data.xu} Xu**.`);
        }

        // 2. Tính toán tiền nhận được
        let thanhTien = soLuongXu * giaGoc;
        let bonus = 0;
        let thongBaoBonus = "";

        // Nếu đổi từ 10 xu trở lên thì cộng thêm 20%
        if (soLuongXu >= 10) {
            bonus = Math.floor(thanhTien * 0.2); // Tính 20% bonus
            thanhTien += bonus;
            thongBaoBonus = `\n🎁 **Khuyến mãi đại gia:** +${bonus}$ (20% bonus)`;
        }

        // 3. Thực hiện trừ Xu và cộng Tiền
        data.xu -= soLuongXu;
        data.tien += thanhTien;

        // 4. Gửi Embed hóa đơn cho sang
        const doiEmbed = new EmbedBuilder()
            .setTitle("🏦 GIAO DỊCH TIỆM KIM HOÀN")
            .setColor(0x00FF00)
            .setThumbnail("https://cdn.discordapp.com/emojis/764391515234238494.png") // Icon cup vàng
            .setDescription(`
                Sếp đã bán: **${soLuongXu} Xu Vàng**
                Giá gốc: \`${giaGoc}$ / 1 Xu\`
                ${thongBaoBonus}
                --------------------------
                💰 **Tổng tiền nhận được:** **+${thanhTien}$**
                
                💵 **Ví tiền:** \`${data.tien}$\`
                ✨ **Xu còn lại:** \`${data.xu} Xu\`
            `)
            .setFooter({ text: "Giao dịch thành công • Leviathan Bank" })
            .setTimestamp();

        message.reply({ embeds: [doiEmbed] });
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
if (command === 'taixiu') {
        const userId = message.author.id;
        const cuoc = parseInt(args[0]);
        const luaChon = args[1]?.toLowerCase();

        if (!tuiDo[userId] || tuiDo[userId].tien < cuoc || cuoc <= 0) {
            return message.reply("❌ Ví sếp không đủ tiền hoặc nhập sai mức cược!");
        }
        if (!['tai', 'xiu'].includes(luaChon)) {
            return message.reply("❓ Chọn `tai` hoặc `xiu`. (VD: !taixiu 1000 tai)");
        }

        tuiDo[userId].tien -= cuoc;

        // Bộ icon xúc xắc
        const diceIcons = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
        
        // 1. Gửi tin nhắn trạng thái "Đang quay"
        const msg = await message.channel.send(`🎲 **BẮT ĐẦU QUAY...**\n[ 🎲 | 🎲 | 🎲 ]\nSếp đặt **${cuoc}$** vào cửa **${luaChon.toUpperCase()}**`);

        // 2. Hiệu ứng "quay" bằng cách sửa tin nhắn (giả lập bot đang tung xúc xắc)
        let count = 0;
        const interval = setInterval(async () => {
            const randomDice = () => diceIcons[Math.floor(Math.random() * 6)];
            await msg.edit(`🎲 **ĐANG LẮC...**\n[ ${randomDice()} | ${randomDice()} | ${randomDice()} ]\nVận may đang đến...`);
            count++;
            
            if (count >= 3) { // Sau 3 lần lắc thì dừng
                clearInterval(interval);
                
                // Tính toán kết quả
                const d1 = Math.floor(Math.random() * 6) + 1;
                const d2 = Math.floor(Math.random() * 6) + 1;
                const d3 = Math.floor(Math.random() * 6) + 1;
                const tong = d1 + d2 + d3;
                const ketQua = tong >= 11 ? 'tai' : 'xiu';
                const win = luaChon === ketQua;

                if (win) tuiDo[userId].tien += cuoc * 2;

                const resultEmoji = `${diceIcons[d1-1]} | ${diceIcons[d2-1]} | ${diceIcons[d3-1]}`;
                const status = win ? "✅ **THẮNG RỒI!**" : "❌ **BẠI TRẬN...**";
                const change = win ? `+${cuoc}$` : `-${cuoc}$`;

                const resultEmbed = new EmbedBuilder()
                    .setTitle(`🎰 KẾT QUẢ TÀI XỈU`)
                    .setColor(win ? 0x00FF00 : 0xFF0000)
                    .setDescription(`
                        **Kết quả:** [ ${resultEmoji} ]
                        **Tổng điểm:** \`${tong}\` ➔ **${ketQua.toUpperCase()}**
                        ------------------------
                        ${status}
                        **Biến động:** \`${change}\`
                        **Số dư hiện tại:** \`${tuiDo[userId].tien}$\`
                    `)
                    .setFooter({ text: `Người chơi: ${message.author.username}` });

                await msg.edit({ content: "🔔 **KẾT QUẢ ĐÂY SẾP!**", embeds: [resultEmbed] });
            }
        }, 1000); // Mỗi giây lắc 1 lần
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
if (command === 'addmoney') {
        // Chỉ cho phép người có quyền Administrator dùng lệnh này
        if (!message.member.permissions.has('Administrator')) return message.reply("👑 Chỉ Sếp Tổng mới có quyền cấp ngân sách!");

        const target = message.mentions.members.first();
        const soLuong = parseInt(args[1]);
        const loai = args[2]?.toLowerCase(); // 'tien' hoặc 'xu'

        if (!target || isNaN(soLuong) || !['tien', 'xu'].includes(loai)) {
            return message.reply("❓ Cách dùng: `!addmoney @user [số lượng] [tien/xu]`");
        }

        if (!tuiDo[target.id]) tuiDo[target.id] = { tien: 0, xu: 0 };

        if (loai === 'tien') {
            tuiDo[target.id].tien += soLuong;
            message.reply(`✅ Đã cấp **${soLuong}$** vào ví của ${target}.`);
        } else {
            tuiDo[target.id].xu += soLuong;
            message.reply(`✅ Đã cấp **${soLuong} Xu Vàng** vào ví của ${target}.`);
        }
    }
    if (command === 'top') {
        if (!tuiDo || Object.keys(tuiDo).length === 0) return message.reply("Chưa có ai trên bảng xếp hạng sếp ơi!");

        const topList = Object.entries(tuiDo)
            .sort(([, a], [, b]) => b.tien - a.tien)
            .slice(0, 5);

        let content = "";
        topList.forEach(([id, data], index) => {
            const huyChuong = ["🥇", "🥈", "🥉", "🏅", "🏅"];
            content += `${huyChuong[index]} <@${id}>: \`${data.tien}$\` | \`${data.xu || 0} Xu\`\n`;
        });

        const topEmbed = new EmbedBuilder()
            .setTitle("🏆 BẢNG XẾP HẠNG PHÚ HỘ SERVER")
            .setColor(0xFFD700)
            .setDescription(content)
            .setFooter({ text: "Muốn lên Top? Hãy chăm chỉ cày cuốc sếp nhé!" });

        message.channel.send({ embeds: [topEmbed] });
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
