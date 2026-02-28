require("dotenv").config();
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder 
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const FANTASY_ID = "1333801402597904456";

client.once("ready", () => {
  console.log(`🔥 Fantasy Guardian Online: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.mentions.users.has(FANTASY_ID)) {

    const embed = new EmbedBuilder()
      .setColor("#7a00ff")
      .setTitle("🌌 Nghi Thức Triệu Hồi Đã Kích Hoạt")
      .setDescription(
        `⚔️ ${message.author} đã dám gọi tên bóng tối...\n\n` +
        `👑 <@${FANTASY_ID}> xuất hiện từ hư không.\n\n` +
        `🩸 Đừng triệu hồi nếu chưa sẵn sàng đối diện số phận.`
      )
      .setFooter({ text: "Fantasy Realm System" })
      .setTimestamp();

    await message.reply({
      content: `🔮 Cổng không gian mở ra...`,
      embeds: [embed]
    });

  }
});

client.login(process.env.TOKEN);
