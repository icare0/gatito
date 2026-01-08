const { SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();
require('@colors/colors');

async function loadCommands(client) {
  let commandArray = [];

  try {
    const commandsFolder = fs.readdirSync('./Commands');
    for (const folder of commandsFolder) {
      const commandFiles = fs
        .readdirSync(`./Commands/${folder}`)
        .filter((file) => file.endsWith('.js'));

      for (const file of commandFiles) {
        try {
          const commandFile = require(`../Commands/${folder}/${file}`);
          
          client.commands.set(commandFile.data.name, commandFile);
          if (commandFile.data instanceof SlashCommandBuilder) {
            commandArray.push(commandFile.data.toJSON());
          } else {
            commandArray.push(commandFile.data);
          }

          console.log('[Commands]'.red + ` ${file.split('.')[0]} a été chargée.`);
        } catch (error) {
          console.error(`[Commands] ${file.split('.')[0]} n'a pas pu être chargée : ${error.message}`);
        }
      }
    }

    const rest = new REST({ version: '9' }).setToken(process.env.Bot_TOKEN);
    const clientId = process.env.clientId;

    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandArray }
      );

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.log(`An error occurred while reloading commands: ${error.message}`);
    }

  } catch (error) {
    console.error(`An error occurred while loading commands: ${error.message}`);
  }
}

module.exports = { loadCommands };
