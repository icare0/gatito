const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { connect, mongoose } = require('mongoose');
const { loadEvents } = require('./Handlers/eventHandler');
const { loadCommands } = require('./Handlers/CommandHandler');
const logger = require('./logger');
const MatchReminderSystem = require('./utils/matchReminder');
const SafeNotificationSystem = require('./utils/safeNotificationSystem');
require('@colors/colors');
require('dotenv').config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();
client.cooldowns = new Collection();

// Handle autocomplete interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isAutocomplete()) return;
    
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    
    try {
        if (command.autocomplete) {
            await command.autocomplete(interaction);
        }
    } catch (error) {
        console.error(`Error in autocomplete for ${interaction.commandName}:`, error);
    }
});

client.once('ready', () => {
    console.clear();
    console.log('[Discord API] '.green + client.user.username + ' est connecté.');
    logger.info(`Bot started: ${client.user.tag}`);
    
    mongoose.set('strictQuery', true);
    connect(process.env.DATABASE)
        .then(() => {
            console.log('[MongoDB API] '.green + 'est maintenant connecté.');
            logger.info('Connected to MongoDB');
            
            loadEvents(client);
            loadCommands(client);
            
            // 🔥 DÉMARRER LE SYSTÈME DE RAPPELS AUTOMATIQUES
            const reminderSystem = new MatchReminderSystem(client);
            const safeNotificationSystem = new SafeNotificationSystem(client);
            reminderSystem.startReminderSystem();
            
            // Stocker les systèmes sur le client
            client.reminderSystem = reminderSystem;
            client.safeNotificationSystem = safeNotificationSystem;
            
            console.log('[Reminder System] '.cyan + 'Système de rappels démarré.');
            logger.info('Match reminder system started');
        })
        .catch(err => {
            console.error('[MongoDB API] '.red + 'erreur de connexion:', err);
            logger.error(`MongoDB connection error: ${err.message}`);
        });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        logger.info(`Command: ${interaction.commandName}, User: ${interaction.user.tag}, Date: ${new Date().toISOString()}`);
        await command.execute(interaction, client);
    } catch (error) {
        logger.error(`Error executing command: ${interaction.commandName}, User: ${interaction.user.tag}, Date: ${new Date().toISOString()}, Error: ${error.message}`);
        console.error(error);
        
        const errorMessage = 'There was an error while executing this command.';
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(() => {});
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => {});
        }
    }
});

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    logger.error(`Unhandled promise rejection: ${error.message}`);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    logger.error(`Uncaught exception: ${error.message}`);
});

client.login(process.env.Bot_TOKEN).catch((err) => {
    console.error('[Discord API] '.red + 'failed to login:', err);
    logger.error(`Login error: ${err.message}`);
});
