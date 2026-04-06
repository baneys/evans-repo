const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('see the latency'),
  async execute(interaction, client) {
    const ping = client.ws.ping;
    await interaction.reply(`🏓 This is my latency: ${ping}**ms**`);
  }
}
