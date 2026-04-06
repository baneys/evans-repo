require("dotenv").config();

const { Client, GatewayIntentBits, Collection, Partials, Events, REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildWebhooks,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
  ],
});

client.comandos = new Collection();
client.componentes = new Collection();

const folders = ["comandos", "eventos", "componentes"];
for (const folder of folders) {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    console.log(chalk.yellow(`[📁] Pasta criada: ${folder}`));
  }
}

// ===== COMANDOS =====
const comandosPath = path.join(__dirname, "comandos");
const comandoFiles = fs.readdirSync(comandosPath).filter(f => f.endsWith(".js"));
const comandosParaRegistro = [];

for (const file of comandoFiles) {
  const comando = require(path.join(comandosPath, file));
  if (!comando.data || !comando.execute) {
    console.log(chalk.red(`[X] Comando mal estruturado: ${file}`));
    continue;
  }
  client.comandos.set(comando.data.name, comando);
  comandosParaRegistro.push(comando.data.toJSON());
  console.log(chalk.green(`[✔] Comando carregado: ${comando.data.name}`));
}

// ===== COMPONENTES =====
const componentesPath = path.join(__dirname, "componentes");
const componenteFiles = fs.readdirSync(componentesPath).filter(f => f.endsWith(".js"));

for (const file of componenteFiles) {
  const componente = require(path.join(componentesPath, file));
  if (!componente.customId || !componente.execute) {
    console.log(chalk.red(`[X] Componente mal estruturado: ${file}`));
    continue;
  }
  client.componentes.set(componente.customId, componente);
  console.log(chalk.green(`[✔] Componente carregado: ${componente.customId}`));
}

// ===== EVENTOS =====
const eventosPath = path.join(__dirname, "eventos");
const eventoFiles = fs.readdirSync(eventosPath).filter(f => f.endsWith(".js"));

for (const file of eventoFiles) {
  const evento = require(path.join(eventosPath, file));
  if (evento.once) {
    client.once(evento.name, (...args) => evento.execute(...args, client));
  } else {
    client.on(evento.name, (...args) => evento.execute(...args, client));
  }
  console.log(chalk.green(`[✔] Evento carregado: ${evento.name}`));
}

// ===== REGISTRO DE COMANDOS =====
(async () => {
  try {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    if (process.env.GUILD_ID) {
      console.log(chalk.blue(`[🚀] Registrando ${comandosParaRegistro.length} comandos na guild...`));

      await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID
        ),
        { body: comandosParaRegistro }
      );

      console.log(chalk.green("[✔] Comandos registrados na guild!"));
    } else {
      console.log(chalk.blue(`[🌍] Registrando ${comandosParaRegistro.length} comandos globalmente...`));

      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: comandosParaRegistro }
      );

      console.log(chalk.green("[✔] Comandos registrados globalmente!"));
    }
  } catch (error) {
    console.log(chalk.red("[X] Erro ao registrar comandos:"), error);
  }
})();

// ===== INTERAÇÕES =====
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const comando = client.comandos.get(interaction.commandName);
      if (comando) await comando.execute(interaction, client);
    }

    if (
      interaction.isButton() ||
      interaction.isStringSelectMenu() ||
      interaction.isModalSubmit()
    ) {
      const componente = client.componentes.get(interaction.customId);
      if (componente) await componente.execute(interaction, client);
    }
  } catch (error) {
    console.log(chalk.red("[X] Erro na interação:"), error);
  }
});

// ===== LOGIN =====
client.login(process.env.TOKEN).then(() => {
  console.log(chalk.green("[✔] Bot logado com sucesso!"));
});
