const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ChannelType
} = require("discord.js");
const TournamentSchema = require("../../Schemas/Tournament");
const SafeDiscordUtils = require("../../utils/SafeDiscordUtils");
const SafeNotificationSystem = require("../../utils/safeNotificationSystem");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tournament')
        .setDescription('Tournament management commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .setDMPermission(false)
        // Create subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new tournament')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the tournament')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description of the tournament')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for tournament announcements')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText))
                .addStringOption(option =>
                    option.setName('rules')
                        .setDescription('Rules for the tournament')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('start_date')
                        .setDescription('Start date and time (YYYY-MM-DD HH:MM)')
                        .setRequired(false)))
        // End registration subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('endregister')
                .setDescription('End tournament registration and prepare matches'))
        // Resolve subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('resolve')
                .setDescription('Resolve a disputed match')
                .addStringOption(option =>
                    option.setName('match_id')
                        .setDescription('ID of the match')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('winner')
                        .setDescription('The winner of the match')
                        .setRequired(true)
                        .setAutocomplete(true)))
        // Start tournament subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start the tournament'))
        // Shuffle subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('shuffle')
                .setDescription('Shuffle players order in the tournament')),
                        
    async autocomplete(interaction) {
        try {
            const focusedOption = interaction.options.getFocused(true);
            let choices = [];

            // ✅ RÉCUPÉRATION SÉCURISÉE DU TOURNOI ACTIF
            const activeTournament = await TournamentSchema.findOne({ 
                discordServerId: interaction.guild.id,
                status: { $in: ['registration', 'ongoing'] }
            });
            
            if (!activeTournament) return await interaction.respond([]);
            
            if (focusedOption.name === 'match_id') {
                // Filtrer les matchs disputés du tournoi actif
                const disputedMatches = activeTournament.matches.filter(m => m.status === 'disputed');
                choices = disputedMatches.map(match => ({
                    name: `Match ${match.matchId} (Round ${match.round})`,
                    value: match.matchId
                }));
            }
            else if (focusedOption.name === 'winner') {
                const matchId = interaction.options.getString('match_id');
                if (!matchId) return;
                
                const match = activeTournament.matches.find(m => m.matchId === matchId);
                if (!match) return;
                
                // ✅ RÉCUPÉRATION SÉCURISÉE DES JOUEURS
                if (match.player1) {
                    const player1Result = await SafeDiscordUtils.safeUserFetch(interaction.client, match.player1);
                    if (player1Result.success) {
                        choices.push({
                            name: player1Result.user.username,
                            value: match.player1
                        });
                    } else {
                        choices.push({
                            name: `Player 1 (${match.player1})`,
                            value: match.player1
                        });
                    }
                }
                
                if (match.player2) {
                    const player2Result = await SafeDiscordUtils.safeUserFetch(interaction.client, match.player2);
                    if (player2Result.success) {
                        choices.push({
                            name: player2Result.user.username,
                            value: match.player2
                        });
                    } else {
                        choices.push({
                            name: `Player 2 (${match.player2})`,
                            value: match.player2
                        });
                    }
                }
            }

            const filtered = choices.filter(choice => 
                choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
            );
            
            await interaction.respond(filtered.slice(0, 25));
        } catch (error) {
            console.error('❌ Error in tournament autocomplete:', error);
            await interaction.respond([]);
        }
    },

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch(subcommand) {
                case 'create':
                    await this.createTournament(interaction, client);
                    break;
                case 'endregister':
                    await this.endRegistration(interaction, client);
                    break;
                case 'resolve':
                    await this.resolveMatch(interaction, client);
                    break;
                case 'start':
                    await this.startTournament(interaction, client);
                    break;
                case 'shuffle':
                    await this.shufflePlayers(interaction, client);
                    break;
                default:
                    await interaction.reply({ 
                        content: 'Sous-commande invalide. Veuillez réessayer.', 
                        ephemeral: true 
                    });
            }
        } catch (error) {
            console.error(`❌ Error executing tournament ${subcommand}:`, error);
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: 'Une erreur inattendue est survenue. Veuillez réessayer ou contacter un administrateur.', 
                        ephemeral: true 
                    });
                } else {
                    await interaction.followUp({ 
                        content: 'Une erreur inattendue est survenue. Veuillez réessayer ou contacter un administrateur.', 
                        ephemeral: true 
                    });
                }
            } catch (replyError) {
                console.error('❌ Could not send error reply:', replyError);
            }
        }
    },

    async createTournament(interaction, client) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            // ✅ VALIDATION DES PERMISSIONS
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageEvents)) {
                return interaction.editReply({
                    content: 'Vous n\'avez pas la permission de créer des tournois.',
                    ephemeral: true
                });
            }
            
            // Vérifier s'il existe déjà un tournoi actif
            const existingTournament = await TournamentSchema.findOne({
                discordServerId: interaction.guild.id,
                status: { $in: ['registration', 'ongoing'] }
            });
            
            if (existingTournament) {
                return interaction.editReply({
                    content: `Un tournoi est déjà actif : "${existingTournament.name}". Veuillez terminer celui-ci avant d'en créer un nouveau.`,
                    ephemeral: true
                });
            }
            
            // ✅ VALIDATION DES INPUTS
            const name = interaction.options.getString('name').trim();
            const description = interaction.options.getString('description').trim();
            const channel = interaction.options.getChannel('channel');
            const rules = interaction.options.getString('rules').trim();
            const startDateStr = interaction.options.getString('start_date');
            
            // Validation des longueurs
            if (name.length < 3 || name.length > 100) {
                return interaction.editReply({
                    content: 'Le nom du tournoi doit faire entre 3 et 100 caractères.',
                    ephemeral: true
                });
            }
            
            if (description.length < 10 || description.length > 500) {
                return interaction.editReply({
                    content: 'La description doit faire entre 10 et 500 caractères.',
                    ephemeral: true
                });
            }
            
            if (rules.length < 10 || rules.length > 1000) {
                return interaction.editReply({
                    content: 'Les règles doivent faire entre 10 et 1000 caractères.',
                    ephemeral: true
                });
            }
            
            // ✅ VALIDATION DU CHANNEL
            if (channel.type !== ChannelType.GuildText) {
                return interaction.editReply({
                    content: 'Le channel doit être un channel texte.',
                    ephemeral: true
                });
            }
            
            // Vérifier les permissions du bot dans le channel
            const botPermissions = channel.permissionsFor(client.user);
            if (!botPermissions || !botPermissions.has(['SendMessages', 'CreatePublicThreads', 'ManageThreads'])) {
                return interaction.editReply({
                    content: 'Le bot n\'a pas les permissions nécessaires dans ce channel (SendMessages, CreatePublicThreads, ManageThreads).',
                    ephemeral: true
                });
            }
            
            // ✅ VALIDATION DE LA DATE (si fournie)
            let scheduledStartDate = null;
            if (startDateStr) {
                const dateRegex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/;
                const match = startDateStr.match(dateRegex);
                
                if (match) {
                    const [, year, month, day, hour, minute] = match;
                    scheduledStartDate = new Date(year, month - 1, day, hour, minute);
                    
                    // Vérifier que la date est dans le futur
                    if (scheduledStartDate <= new Date()) {
                        return interaction.editReply({
                            content: 'La date de début doit être dans le futur. Format: YYYY-MM-DD HH:MM',
                            ephemeral: true
                        });
                    }
                    
                    // Vérifier que la date n'est pas trop loin (max 1 an)
                    const oneYearFromNow = new Date();
                    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                    if (scheduledStartDate > oneYearFromNow) {
                        return interaction.editReply({
                            content: 'La date de début ne peut pas être plus d\'un an dans le futur.',
                            ephemeral: true
                        });
                    }
                } else {
                    return interaction.editReply({
                        content: 'Format de date invalide. Utilisez: YYYY-MM-DD HH:MM (ex: 2024-12-25 20:00)',
                        ephemeral: true
                    });
                }
            }
            
            // ✅ VALIDATION DE L'ID CRÉATEUR
            if (!SafeDiscordUtils.isValidDiscordId(interaction.user.id)) {
                return interaction.editReply({
                    content: 'Erreur avec votre ID Discord. Veuillez contacter un administrateur.',
                    ephemeral: true
                });
            }
            
            // ✅ CRÉATION SÉCURISÉE DU TOURNOI
            const tournament = new TournamentSchema({
                name,
                description,
                rules,
                discordChannelId: channel.id,
                discordServerId: interaction.guild.id,
                createdBy: interaction.user.id,
                status: 'registration',
                scheduledStartDate
            });
            
            try {
                await tournament.save();
            } catch (saveError) {
                console.error('❌ Error saving new tournament:', saveError);
                return interaction.editReply({
                    content: 'Erreur lors de la sauvegarde du tournoi. Veuillez réessayer.',
                    ephemeral: true
                });
            }
            
            // ✅ CRÉATION SÉCURISÉE DE L'ANNONCE
            const announcementEmbed = new EmbedBuilder()
                .setTitle(`🏆 Nouveau Tournoi : ${name}`)
                .setDescription(description)
                .addFields(
                    { name: 'Règles', value: rules.length > 1024 ? rules.substring(0, 1021) + '...' : rules }
                )
                .setColor('#00FF00')
                .setFooter({ text: `Créé par ${interaction.user.username}` })
                .setTimestamp();
            
            if (scheduledStartDate) {
                announcementEmbed.addFields({
                    name: 'Début programmé',
                    value: `<t:${Math.floor(scheduledStartDate.getTime() / 1000)}:F>`,
                    inline: true
                });
            }
            
            // Register button
            const registerButton = new ButtonBuilder()
                .setCustomId(`register_tournament`)
                .setLabel('S\'inscrire maintenant')
                .setStyle(ButtonStyle.Primary);
            
            const row = new ActionRowBuilder()
                .addComponents(registerButton);
            
            // ✅ ENVOI SÉCURISÉ DE L'ANNONCE
            const announceResult = await SafeDiscordUtils.safeSendMessage(channel, { 
                embeds: [announcementEmbed], 
                components: [row] 
            });
            
            if (!announceResult.success) {
                console.error('❌ Failed to send tournament announcement:', announceResult.error);
                // Supprimer le tournoi créé
                await TournamentSchema.findByIdAndDelete(tournament._id);
                return interaction.editReply({
                    content: `Impossible d'envoyer l'annonce dans le channel. Vérifiez les permissions. Erreur: ${announceResult.error}`,
                    ephemeral: true
                });
            }
            
            await interaction.editReply({ 
                content: `✅ Tournoi "${name}" créé avec succès ! Les inscriptions sont ouvertes dans <#${channel.id}>.`,
                ephemeral: true 
            });
            
        } catch (error) {
            console.error('❌ Error creating tournament:', error);
            await interaction.editReply({ 
                content: 'Une erreur est survenue lors de la création du tournoi.', 
                ephemeral: true 
            });
        }
    },

    async endRegistration(interaction, client) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            // Récupérer le tournoi en inscription
            const tournament = await TournamentSchema.findOne({
                discordServerId: interaction.guild.id,
                status: 'registration'
            });
            
            if (!tournament) {
                return interaction.editReply({ 
                    content: 'Aucun tournoi en phase d\'inscription trouvé.', 
                    ephemeral: true 
                });
            }
            
            // Check permissions
            if (tournament.createdBy !== interaction.user.id && 
                !interaction.member.permissions.has(PermissionFlagsBits.ManageEvents)) {
                return interaction.editReply({ 
                    content: 'Vous n\'avez pas la permission de fermer les inscriptions.', 
                    ephemeral: true 
                });
            }
            
            // Check participants
            if (tournament.participants.length < 2) {
                return interaction.editReply({ 
                    content: 'Il faut au moins 2 participants pour fermer les inscriptions.', 
                    ephemeral: true 
                });
            }
            
            // ✅ FERMETURE SÉCURISÉE DES INSCRIPTIONS
            tournament.registrationClosed = true;
            
            // Generate seedings for participants
            const participants = [...tournament.participants];
            for (let i = 0; i < participants.length; i++) {
                participants[i].seed = i + 1;
            }
            tournament.participants = participants;
            
            // ✅ GÉNÉRATION SÉCURISÉE DU BRACKET
            try {
                tournament.generateBracket();
            } catch (bracketError) {
                console.error('❌ Error generating bracket:', bracketError);
                return interaction.editReply({
                    content: 'Erreur lors de la génération du bracket. Veuillez réessayer.',
                    ephemeral: true
                });
            }
            
            // ✅ SAUVEGARDE SÉCURISÉE
            try {
                await tournament.save();
            } catch (saveError) {
                console.error('❌ Error saving tournament after closing registration:', saveError);
                return interaction.editReply({
                    content: 'Erreur lors de la sauvegarde. Veuillez réessayer.',
                    ephemeral: true
                });
            }
            
            // ✅ ENVOI SÉCURISÉ DE LA NOTIFICATION
            const channel = interaction.guild.channels.cache.get(tournament.discordChannelId);
            if (channel) {
                const closedEmbed = new EmbedBuilder()
                    .setTitle(`📝 Inscriptions Fermées : ${tournament.name}`)
                    .setDescription(`Les inscriptions sont maintenant fermées avec ${tournament.participants.length} participants !`)
                    .setColor('#FF9900')
                    .addFields(
                        { name: 'Participants', value: tournament.participants.length.toString(), inline: true },
                        { name: 'Brackets générés', value: 'Le tournoi est prêt à démarrer', inline: true }
                    )
                    .setFooter({ text: 'Utilisez /tournament shuffle pour mélanger les joueurs, puis /tournament start pour lancer' })
                    .setTimestamp();
                
                await SafeDiscordUtils.safeSendMessage(channel, { embeds: [closedEmbed] });
            }
            
            await interaction.editReply({ 
                content: `✅ Inscriptions fermées et brackets générés pour "${tournament.name}" avec ${tournament.participants.length} participants.`,
                ephemeral: true 
            });
            
        } catch (error) {
            console.error('❌ Error ending registration:', error);
            await interaction.editReply({ 
                content: 'Une erreur est survenue lors de la fermeture des inscriptions.', 
                ephemeral: true 
            });
        }
    },

    async shufflePlayers(interaction, client) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            // Récupérer le tournoi avec inscriptions fermées mais pas encore démarré
            const tournament = await TournamentSchema.findOne({
                discordServerId: interaction.guild.id,
                status: 'registration',
                registrationClosed: true
            });
            
            if (!tournament) {
                return interaction.editReply({ 
                    content: 'Aucun tournoi prêt à être mélangé trouvé. Utilisez d\'abord /tournament endregister.', 
                    ephemeral: true 
                });
            }
            
            // Check permissions
            if (tournament.createdBy !== interaction.user.id && 
                !interaction.member.permissions.has(PermissionFlagsBits.ManageEvents)) {
                return interaction.editReply({ 
                    content: 'Vous n\'avez pas la permission de mélanger ce tournoi.', 
                    ephemeral: true 
                });
            }
            
            // ✅ MÉLANGE SÉCURISÉ DES PARTICIPANTS
            const participants = [...tournament.participants];
            
            // Fisher-Yates shuffle
            for (let i = participants.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [participants[i], participants[j]] = [participants[j], participants[i]];
            }
            
            // Assign new seeds based on shuffled order
            for (let i = 0; i < participants.length; i++) {
                participants[i].seed = i + 1;
            }
            
            tournament.participants = participants;
            tournament.shuffled = true;
            
            // Increment shuffle count for display
            if (!tournament.shuffleCount) {
                tournament.shuffleCount = 1;
            } else {
                tournament.shuffleCount += 1;
            }
            
            // ✅ REGÉNÉRATION SÉCURISÉE DU BRACKET
            try {
                tournament.generateBracket();
            } catch (bracketError) {
                console.error('❌ Error regenerating bracket after shuffle:', bracketError);
                return interaction.editReply({
                    content: 'Erreur lors de la regénération du bracket après mélange.',
                    ephemeral: true
                });
            }
            
            // ✅ SAUVEGARDE SÉCURISÉE
            try {
                await tournament.save();
            } catch (saveError) {
                console.error('❌ Error saving tournament after shuffle:', saveError);
                return interaction.editReply({
                    content: 'Erreur lors de la sauvegarde après mélange.',
                    ephemeral: true
                });
            }
            
            // ✅ CRÉATION SÉCURISÉE DE L'EMBED DE RÉSULTATS
            const shuffleEmbed = new EmbedBuilder()
                .setTitle(`🔀 Joueurs Mélangés : ${tournament.name}`)
                .setDescription(`Mélange #${tournament.shuffleCount} - Voici le nouvel ordre des joueurs :`)
                .setColor('#9932CC')
                .setFooter({ text: `Mélangé par ${interaction.user.username}` })
                .setTimestamp();
            
            // ✅ RÉCUPÉRATION SÉCURISÉE DES NOMS D'UTILISATEURS
            let participantsList = '';
            const userFetchResult = await SafeDiscordUtils.safeBulkUserFetch(
                client, 
                participants.map(p => p.userId)
            );
            
            for (const participant of participants) {
                const user = userFetchResult.users.get(participant.userId);
                const username = user ? user.username : SafeDiscordUtils.generateFallbackUsername(participant.userId);
                participantsList += `**${participant.seed}.** ${username}\n`;
            }
            
            // Diviser en champs si trop long
            if (participantsList.length > 1024) {
                const halfPoint = Math.ceil(participants.length / 2);
                const firstHalf = participantsList.split('\n').slice(0, halfPoint).join('\n');
                const secondHalf = participantsList.split('\n').slice(halfPoint, -1).join('\n'); // -1 pour enlever le dernier élément vide
                
                shuffleEmbed.addFields(
                    { name: `Seeds 1-${halfPoint}`, value: firstHalf, inline: true },
                    { name: `Seeds ${halfPoint + 1}-${participants.length}`, value: secondHalf, inline: true }
                );
            } else {
                shuffleEmbed.addFields(
                    { name: 'Nouvel Ordre des Seeds', value: participantsList, inline: false }
                );
            }
            
            // ✅ ENVOI SÉCURISÉ AU CHANNEL DU TOURNOI
            const channel = interaction.guild.channels.cache.get(tournament.discordChannelId);
            if (channel) {
                await SafeDiscordUtils.safeSendMessage(channel, { embeds: [shuffleEmbed] });
            }
            
            await interaction.editReply({ 
                content: `✅ Joueurs mélangés avec succès (Mélange #${tournament.shuffleCount}) ! Le bracket a été régénéré.`,
                ephemeral: true 
            });
            
        } catch (error) {
            console.error('❌ Error shuffling tournament:', error);
            await interaction.editReply({ 
                content: 'Une erreur est survenue lors du mélange.', 
                ephemeral: true 
            });
        }
    },

    async startTournament(interaction, client) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            // Récupérer le tournoi avec inscriptions fermées
            const tournament = await TournamentSchema.findOne({
                discordServerId: interaction.guild.id,
                status: 'registration',
                registrationClosed: true
            });
            
            if (!tournament) {
                return interaction.editReply({ 
                    content: 'Aucun tournoi prêt à démarrer trouvé. Utilisez d\'abord /tournament endregister.', 
                    ephemeral: true 
                });
            }
            
            // Check permissions
            if (tournament.createdBy !== interaction.user.id && 
                !interaction.member.permissions.has(PermissionFlagsBits.ManageEvents)) {
                return interaction.editReply({ 
                    content: 'Vous n\'avez pas la permission de démarrer ce tournoi.', 
                    ephemeral: true 
                });
            }
            
            // ✅ DÉMARRAGE SÉCURISÉ DU TOURNOI
            tournament.status = 'ongoing';
            tournament.startDate = new Date();
            tournament.registrationClosed = undefined;
            
            try {
                await tournament.save();
            } catch (saveError) {
                console.error('❌ Error saving tournament start:', saveError);
                return interaction.editReply({
                    content: 'Erreur lors de la sauvegarde du démarrage.',
                    ephemeral: true
                });
            }
            
            // ✅ NOTIFICATIONS SÉCURISÉES (non bloquantes)
            const notificationSystem = new SafeNotificationSystem(client);
            setTimeout(async () => {
                try {
                    await notificationSystem.sendTournamentStartNotification(tournament);
                    console.log('✅ Tournament start notifications sent');
                } catch (error) {
                    console.error('❌ Error sending start notifications:', error);
                }
            }, 1000);
            
            const channel = interaction.guild.channels.cache.get(tournament.discordChannelId);
            if (channel) {
                const startEmbed = new EmbedBuilder()
                    .setTitle(`🏆 Tournoi Commencé : ${tournament.name}`)
                    .setDescription(`Le tournoi a officiellement commencé avec ${tournament.participants.length} participants !`)
                    .setColor('#0099FF')
                    .setFooter({ text: 'Les threads des matchs vont être créés...' })
                    .setTimestamp();
                
                await SafeDiscordUtils.safeSendMessage(channel, { embeds: [startEmbed] });
                
                // ✅ CRÉATION SÉCURISÉE DES THREADS (non bloquant)
                setTimeout(() => {
                    this.createMatchThreadsWithDelaySafe(tournament, channel, client);
                }, 2000);
            }
            
            await interaction.editReply({ 
                content: `✅ Tournoi "${tournament.name}" démarré avec succès ! Les threads des matchs sont en cours de création.`,
                ephemeral: true 
            });
            
        } catch (error) {
            console.error('❌ Error starting tournament:', error);
            await interaction.editReply({ 
                content: 'Une erreur est survenue lors du démarrage du tournoi.', 
                ephemeral: true 
            });
        }
    },

    async resolveMatch(interaction, client) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const matchId = interaction.options.getString('match_id');
            const winnerId = interaction.options.getString('winner');
            
            // ✅ VALIDATION DES IDs
            if (!SafeDiscordUtils.isValidDiscordId(winnerId)) {
                return interaction.editReply({
                    content: 'ID de gagnant invalide.',
                    ephemeral: true
                });
            }
            
            // Trouver le tournoi actif
            const tournament = await TournamentSchema.findOne({
                discordServerId: interaction.guild.id,
                status: 'ongoing'
            });
            
            if (!tournament) {
                return interaction.editReply({ 
                    content: 'Aucun tournoi en cours trouvé.', 
                    ephemeral: true 
                });
            }
            
            // Check permissions (organizer or admin)
            if (tournament.createdBy !== interaction.user.id && 
                !interaction.member.permissions.has(PermissionFlagsBits.ManageEvents)) {
                return interaction.editReply({ 
                    content: 'Vous n\'avez pas la permission de résoudre les matchs.', 
                    ephemeral: true 
                });
            }
            
            // Find the match
            const matchIndex = tournament.matches.findIndex(m => m.matchId === matchId);
            if (matchIndex === -1) {
                return interaction.editReply({ 
                    content: 'Match non trouvé.', 
                    ephemeral: true 
                });
            }
            
            const match = tournament.matches[matchIndex];
            
            // Verify winner is a participant in this match
            if (match.player1 !== winnerId && match.player2 !== winnerId) {
                return interaction.editReply({ 
                    content: 'Le joueur spécifié ne participe pas à ce match.', 
                    ephemeral: true 
                });
            }
            
            // Verify match is not already completed
            if (match.status === 'completed') {
                return interaction.editReply({ 
                    content: 'Ce match est déjà terminé.', 
                    ephemeral: true 
                });
            }
            
            const loserId = match.player1 === winnerId ? match.player2 : match.player1;
            
            // ✅ RÉSOLUTION SÉCURISÉE DU MATCH
            match.winner = winnerId;
            match.status = 'completed';
            match.completedAt = new Date();
            match.resultReports = []; // Clear any conflicting reports
            match.adminResolved = true;
            match.resolvedBy = interaction.user.id;
            
            // Update scores based on winner
            if (match.player1 === winnerId) {
                match.scores = { player1: 1, player2: 0 };
            } else {
                match.scores = { player1: 0, player2: 1 };
            }
            
            // Find the next match and update with winner
            if (match.nextMatchId) {
                const nextMatchIndex = tournament.matches.findIndex(m => m.matchId === match.nextMatchId);
                if (nextMatchIndex !== -1) {
                    const nextMatch = tournament.matches[nextMatchIndex];
                    
                    // Determine which player slot to update
                    const position = match.position;
                    if (position % 2 === 1) {
                        nextMatch.player1 = winnerId;
                    } else {
                        nextMatch.player2 = winnerId;
                    }
                    
                    // If both players are now assigned, update next match status
                    if (nextMatch.player1 && nextMatch.player2) {
                        nextMatch.status = 'pending';
                    }
                }
            }
            
            // Update eliminated player's status
            if (loserId) {
                const loserIndex = tournament.participants.findIndex(p => p.userId === loserId);
                if (loserIndex !== -1) {
                    tournament.participants[loserIndex].status = 'eliminated';
                }
            }
            
            try {
                await tournament.save();
            } catch (saveError) {
                console.error('❌ Error saving match resolution:', saveError);
                return interaction.editReply({
                    content: 'Erreur lors de la sauvegarde de la résolution.',
                    ephemeral: true
                });
            }
            
            // ✅ RÉCUPÉRATION SÉCURISÉE DES UTILISATEURS POUR L'AFFICHAGE
            const userFetchResult = await SafeDiscordUtils.safeBulkUserFetch(client, [winnerId, loserId]);
            const winnerUser = userFetchResult.users.get(winnerId);
            const loserUser = userFetchResult.users.get(loserId);
            
            const winnerName = winnerUser ? winnerUser.username : SafeDiscordUtils.generateFallbackUsername(winnerId);
            const loserName = loserUser ? loserUser.username : SafeDiscordUtils.generateFallbackUsername(loserId);
            
            // ✅ NOTIFICATION SÉCURISÉE DANS LE THREAD
            if (match.threadId) {
                try {
                    const channel = interaction.guild.channels.cache.get(tournament.discordChannelId);
                    if (channel) {
                        const thread = await channel.threads.fetch(match.threadId);
                        if (thread) {
                            const resolutionEmbed = new EmbedBuilder()
                                .setTitle(`🛡️ Match Résolu par l'Administration`)
                                .setDescription(`Le match a été résolu manuellement par un administrateur.`)
                                .setColor('#FF9900')
                                .addFields(
                                    { name: '🏆 Gagnant', value: winnerName, inline: true },
                                    { name: '❌ Éliminé', value: loserName, inline: true },
                                    { name: '👮 Résolu par', value: interaction.user.username, inline: true }
                                )
                                .setFooter({ text: `Match ID: ${match.matchId}` })
                                .setTimestamp();
                            
                            await SafeDiscordUtils.safeSendMessage(thread, { 
                                content: `🛡️ Match résolu par l'administration.\n🏆 <@${winnerId}> a été déclaré vainqueur.`,
                                embeds: [resolutionEmbed]
                            });
                            
                            // Archive the thread
                            try {
                                await thread.setArchived(true);
                            } catch (archiveError) {
                                console.error('❌ Error archiving thread:', archiveError);
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Error notifying thread:', error);
                }
            }
            
            await interaction.editReply({ 
                content: `✅ Match résolu avec succès.\n🏆 **${winnerName}** a été déclaré vainqueur du match **${matchId}** (Round ${match.round}).`,
                ephemeral: true 
            });
            
            // ✅ VÉRIFICATION SÉCURISÉE DE FIN DE TOURNOI
            const totalRounds = Math.ceil(Math.log2(tournament.participants.length));
            if (match.round === totalRounds) {
                tournament.status = 'completed';
                
                // Update winner participant status
                const winnerIndex = tournament.participants.findIndex(p => p.userId === winnerId);
                if (winnerIndex !== -1) {
                    tournament.participants[winnerIndex].status = 'winner';
                }
                
                // ✅ NOTIFICATIONS DE FIN DE TOURNOI (non bloquantes)
                setTimeout(async () => {
                    try {
                        const notificationSystem = new SafeNotificationSystem(client);
                        await notificationSystem.sendTournamentWinnerNotification(tournament, winnerId);
                    } catch (error) {
                        console.error('❌ Error sending winner notification:', error);
                    }
                }, 1000);
                
                // Create winner announcement
                const channel = interaction.guild.channels.cache.get(tournament.discordChannelId);
                if (channel) {
                    const winnerEmbed = new EmbedBuilder()
                        .setTitle(`🏆 Champion du Tournoi : ${tournament.name}`)
                        .setDescription(`Félicitations à **${winnerName}** pour avoir gagné le tournoi !`)
                        .setColor('#FFD700')
                        .addFields(
                            { name: 'Total Participants', value: tournament.participants.length.toString(), inline: true },
                            { name: 'Résolution', value: 'Match final résolu par l\'administration', inline: true }
                        )
                        .setFooter({ text: 'Tournoi terminé' })
                        .setTimestamp();
                    
                    await SafeDiscordUtils.safeSendMessage(channel, { 
                        content: `🎉 Félicitations <@${winnerId}> ! 🎉`,
                        embeds: [winnerEmbed]
                    });
                }
                
                await tournament.save();
            }
            
        } catch (error) {
            console.error('❌ Error resolving match:', error);
            await interaction.editReply({ 
                content: 'Une erreur est survenue lors de la résolution du match.', 
                ephemeral: true 
            });
        }
    },

    async createMatchThreadsWithDelaySafe(tournament, channel, client) {
        try {
            const firstRoundMatches = tournament.matches.filter(match => 
                match.round === 1 && match.status === 'pending' && match.player1 && match.player2
            );
            
            let delay = 0;
            const DELAY_BETWEEN_THREADS = 2000; // 2 secondes entre chaque thread
            
            for (const match of firstRoundMatches) {
                setTimeout(async () => {
                    try {
                        await this.createSingleMatchThreadSafe(tournament, match, channel, client);
                    } catch (error) {
                        console.error(`❌ Error creating thread for match ${match.matchId}:`, error);
                    }
                }, delay);
                
                delay += DELAY_BETWEEN_THREADS;
            }
            
            // Save tournament with updated match threadIds after all threads are created
            setTimeout(async () => {
                try {
                    await tournament.save();
                } catch (saveError) {
                    console.error('❌ Error saving tournament after thread creation:', saveError);
                }
            }, delay + 1000);
        } catch (error) {
            console.error('❌ Error in createMatchThreadsWithDelaySafe:', error);
        }
    },

    async createSingleMatchThreadSafe(tournament, match, channel, client) {
        try {
            const threadName = `Match: Round ${match.round} - ${match.matchId}`;
            
            // ✅ CRÉATION SÉCURISÉE DU THREAD
            const threadResult = await SafeDiscordUtils.safeThreadCreate(channel, {
                name: threadName,
                autoArchiveDuration: 1440,
                reason: `Tournament match ${match.matchId}`
            });
            
            if (!threadResult.success) {
                throw new Error(`Failed to create thread: ${threadResult.error}`);
            }
            
            const thread = threadResult.thread;
            match.threadId = thread.id;
            
            // ✅ RÉCUPÉRATION SÉCURISÉE DES JOUEURS
            const userFetchResult = await SafeDiscordUtils.safeBulkUserFetch(client, [match.player1, match.player2]);
            const player1User = userFetchResult.users.get(match.player1);
            const player2User = userFetchResult.users.get(match.player2);
            
            if (!player1User || !player2User) {
                throw new Error('Could not fetch both players');
            }
            
            // Generate 5-character password
            const password = Math.random().toString(36).substring(2, 7).toUpperCase();
            match.password = password;
            
            const matchEmbed = new EmbedBuilder()
    .setTitle(`Round ${match.round} Match`)
    .setDescription(`**${player1User.username}** vs **${player2User.username}**`)
    .addFields(
        { name: '🔑 Mot de passe du match', value: `\`${password}\``, inline: false },
        { 
            name: '📋 Instructions', 
            value: '• Créez votre partie avec ce mot de passe\n• Jouez votre match\n• Cliquez sur le bouton de résultat ci-dessous\n• **Prenez un screenshot de fin de match** (preuve en cas de litige)', 
            inline: false 
        },
        {
            name: '⏰ Adversaire absent ?',
            value: '• Attendez **20 minutes** maximum\n• Si votre adversaire ne se présente pas, vous pouvez vous déclarer gagnant\n• Prévenez dans ce thread avant de valider',
            inline: false
        },
        { name: 'ℹ️ Informations', value: `Match ID: ${match.matchId}`, inline: false }
    )
    .setColor('#0099FF')
    .setFooter({ text: `Tournoi: ${tournament.name} | En cas de problème, contactez un admin` });

            
            const player1WinButton = new ButtonBuilder()
                .setCustomId(`match_victory_${match.matchId}_${match.player1}`)
                .setLabel(`${player1User.username} gagne`)
                .setStyle(ButtonStyle.Success);
            
            const player2WinButton = new ButtonBuilder()
                .setCustomId(`match_victory_${match.matchId}_${match.player2}`)
                .setLabel(`${player2User.username} gagne`)
                .setStyle(ButtonStyle.Success);
            
            const row = new ActionRowBuilder()
                .addComponents(player1WinButton, player2WinButton);
            
            // ✅ ENVOI SÉCURISÉ DU MESSAGE
            const messageResult = await SafeDiscordUtils.safeSendMessage(thread, { 
                content: `<@${match.player1}> vs <@${match.player2}>`,
                embeds: [matchEmbed],
                components: [row]
            });
            
            if (!messageResult.success) {
                console.error(`❌ Failed to send message in thread: ${messageResult.error}`);
            }
            
            match.status = 'in_progress';
            
        } catch (error) {
            console.error(`❌ Error in createSingleMatchThreadSafe:`, error);
            throw error;
        }
    }
};