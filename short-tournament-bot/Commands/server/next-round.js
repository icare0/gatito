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
const SafeNotificationSystem = require("../../utils/safeNotificationSystem");
const SafeDiscordUtils = require("../../utils/SafeDiscordUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nextround')
        .setDescription('Lancer le prochain round du tournoi')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),
    
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
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
            
            // ✅ VÉRIFICATION DES PERMISSIONS
            if (tournament.createdBy !== interaction.user.id && 
                !interaction.member.permissions.has(PermissionFlagsBits.ManageEvents)) {
                return interaction.editReply({ 
                    content: 'Vous n\'avez pas la permission d\'avancer ce tournoi.', 
                    ephemeral: true 
                });
            }
            
            const currentRound = tournament.getCurrentRound();
            console.log(`🔍 Current round: ${currentRound}`);
            
            // ✅ VÉRIFICATION SÉCURISÉE DE L'ÉTAT DU ROUND ACTUEL
            if (!tournament.isRoundComplete(currentRound)) {
                const currentRoundMatches = tournament.matches.filter(m => m.round === currentRound);
                const completedMatches = currentRoundMatches.filter(m => m.status === 'completed');
                const pendingMatches = currentRoundMatches.filter(m => m.status !== 'completed');
                
                let pendingInfo = '';
                for (const match of pendingMatches) {
                    let status = '';
                    switch(match.status) {
                        case 'pending': status = '⏳ En attente'; break;
                        case 'in_progress': status = '🎮 En cours'; break;
                        case 'disputed': status = '⚠️ En litige'; break;
                        default: status = '❓ Inconnu';
                    }
                    pendingInfo += `${match.matchId}: ${status}\n`;
                }
                
                return interaction.editReply({ 
                    content: `❌ Round ${currentRound} pas encore terminé !\n\n**Progression:** ${completedMatches.length}/${currentRoundMatches.length} matchs terminés\n\n**Matchs restants:**\n\`\`\`${pendingInfo}\`\`\``, 
                    ephemeral: true 
                });
            }
            
            console.log(`✅ Round ${currentRound} is complete, generating next round...`);
            
            // ✅ GÉNÉRATION SÉCURISÉE DU ROUND SUIVANT
            let result;
            try {
                result = tournament.generateNextRound();
            } catch (generateError) {
                console.error('❌ Error generating next round:', generateError);
                return interaction.editReply({
                    content: 'Erreur lors de la génération du round suivant. Veuillez contacter un administrateur.',
                    ephemeral: true
                });
            }
            
            if (result === 'completed') {
                // ✅ TOURNOI TERMINÉ - GESTION SÉCURISÉE
                try {
                    await tournament.save();
                } catch (saveError) {
                    console.error('❌ Error saving completed tournament:', saveError);
                }
                
                const winner = tournament.participants.find(p => p.status === 'winner');
                
                // ✅ NOTIFICATION SÉCURISÉE DE VICTOIRE (non bloquante)
                const notificationSystem = new SafeNotificationSystem(client);
                if (winner) {
                    setTimeout(async () => {
                        try {
                            await notificationSystem.sendTournamentWinnerNotification(tournament, winner.userId);
                            console.log('✅ Tournament winner notification sent');
                        } catch (error) {
                            console.error('❌ Error sending tournament winner notification:', error);
                        }
                    }, 1000);
                }
                
                // ✅ ANNONCE SÉCURISÉE DE FIN DE TOURNOI
                const channel = interaction.guild.channels.cache.get(tournament.discordChannelId);
                if (channel && winner) {
                    const winnerResult = await SafeDiscordUtils.safeUserFetch(client, winner.userId);
                    const winnerUsername = winnerResult.success ? 
                        winnerResult.user.username : 
                        SafeDiscordUtils.generateFallbackUsername(winner.userId);
                    
                    const winnerEmbed = new EmbedBuilder()
                        .setTitle(`🏆 CHAMPION DU TOURNOI : ${tournament.name}`)
                        .setDescription(`🎉 **${winnerUsername}** a remporté le tournoi ! 🎉`)
                        .setColor('#FFD700')
                        .addFields(
                            { name: 'Champion', value: `<@${winner.userId}>`, inline: true },
                            { name: 'Total Participants', value: tournament.participants.length.toString(), inline: true },
                            { name: 'Rounds Joués', value: currentRound.toString(), inline: true }
                        )
                        .setFooter({ text: 'Félicitations au champion !' })
                        .setTimestamp();
                    
                    const announceResult = await SafeDiscordUtils.safeSendMessage(channel, { 
                        content: `🎉 **TOURNOI TERMINÉ !** 🎉\n\nFélicitations <@${winner.userId}> ! 🏆`,
                        embeds: [winnerEmbed]
                    });
                    
                    if (!announceResult.success) {
                        console.error('❌ Failed to send winner announcement:', announceResult.error);
                    }
                }
                
                return interaction.editReply({ 
                    content: `🏆 **TOURNOI TERMINÉ !** Le champion a été couronné !`,
                    ephemeral: true 
                });
            }
            
            if (!result) {
                return interaction.editReply({ 
                    content: 'Erreur lors de la génération du round suivant.', 
                    ephemeral: true 
                });
            }
            
            // ✅ SAUVEGARDE SÉCURISÉE AVEC LE NOUVEAU ROUND
            try {
                await tournament.save();
            } catch (saveError) {
                console.error('❌ Error saving tournament after next round generation:', saveError);
                return interaction.editReply({
                    content: 'Erreur lors de la sauvegarde du nouveau round.',
                    ephemeral: true
                });
            }
            
            const nextRound = tournament.getCurrentRound();
            const nextRoundMatches = tournament.matches.filter(m => m.round === nextRound);
            
            console.log(`✅ Generated round ${nextRound} with ${nextRoundMatches.length} matches`);
            
            // ✅ NOTIFICATIONS SÉCURISÉES DE NOUVEAU ROUND (non bloquantes)
            const notificationSystem = new SafeNotificationSystem(client);
            setTimeout(async () => {
                try {
                    await notificationSystem.sendTournamentAnnouncement(
                        tournament,
                        `🚀 Round ${nextRound} Commence !`,
                        `Le round ${nextRound} du tournoi démarre maintenant ! ${nextRoundMatches.length} nouveaux matchs vous attendent.`,
                        '#0099FF'
                    );
                    console.log(`✅ Round ${nextRound} announcement sent`);
                } catch (error) {
                    console.error(`❌ Error sending round ${nextRound} announcement:`, error);
                }
            }, 1000);
            
            const channel = interaction.guild.channels.cache.get(tournament.discordChannelId);
            if (channel) {
                const roundEmbed = new EmbedBuilder()
                    .setTitle(`🚀 Round ${nextRound} Commence !`)
                    .setDescription(`Le Round ${nextRound} du tournoi démarre maintenant !`)
                    .addFields(
                        { name: 'Nouveau Round', value: nextRound.toString(), inline: true },
                        { name: 'Matchs à Jouer', value: nextRoundMatches.length.toString(), inline: true },
                        { name: 'Statut', value: 'Création des threads...', inline: true }
                    )
                    .setColor('#0099FF')
                    .setFooter({ text: 'Les threads vont être créés progressivement avec vérifications' })
                    .setTimestamp();
                
                const announceResult = await SafeDiscordUtils.safeSendMessage(channel, { embeds: [roundEmbed] });
                if (!announceResult.success) {
                    console.error(`❌ Failed to send round ${nextRound} announcement:`, announceResult.error);
                }
                
                // Répondre immédiatement
                await interaction.editReply({ 
                    content: `✅ **Round ${nextRound}** généré ! ${nextRoundMatches.length} matchs en cours de création...`,
                    ephemeral: true 
                });
                
                // ✅ CRÉER LES THREADS EN ARRIÈRE-PLAN AVEC PROTECTIONS
                this.createRoundThreadsWithRateLimitSafe(tournament, channel, client, nextRound, notificationSystem);
            }
            
        } catch (error) {
            console.error('❌ Error advancing to next round:', error);
            
            try {
                await interaction.editReply({ 
                    content: 'Une erreur inattendue est survenue lors de l\'avancement au round suivant. Veuillez contacter un administrateur.', 
                    ephemeral: true 
                });
            } catch (replyError) {
                console.error('❌ Could not send error reply:', replyError);
            }
        }
    },

    async createRoundThreadsWithRateLimitSafe(tournament, channel, client, round, notificationSystem) {
        try {
            console.log(`=== CREATING ROUND ${round} THREADS (ULTRA-SAFE VERSION) ===`);
            
            const roundMatches = tournament.matches.filter(match => 
                match.round === round && 
                match.player1 && 
                match.player2 &&
                !match.threadId
            );
            
            console.log(`Found ${roundMatches.length} round ${round} matches to create`);
            
            if (roundMatches.length === 0) {
                console.log('No matches to create');
                return { totalMatches: 0, successCount: 0, failedMatches: [] };
            }
            
            const DELAY_BETWEEN_THREADS = 2500; // 2.5 secondes pour éviter rate limits
            const MAX_RETRIES = 3;
            let successCount = 0;
            let failedMatches = [];
            
            for (let i = 0; i < roundMatches.length; i++) {
                const match = roundMatches[i];
                let attempts = 0;
                let created = false;
                
                // ✅ RETRY LOGIC ROBUSTE
                while (attempts < MAX_RETRIES && !created) {
                    attempts++;
                    console.log(`🔧 Creating thread ${i + 1}/${roundMatches.length} for match ${match.matchId} (attempt ${attempts}/${MAX_RETRIES})`);
                    
                    const result = await this.createSingleMatchThreadSafe(tournament, match, channel, client);
                    
                    if (result.success) {
                        successCount++;
                        created = true;
                        
                        console.log(`✅ Thread created successfully (${successCount}/${roundMatches.length})`);
                        
                        // ✅ NOTIFICATION SÉCURISÉE SEULEMENT SI SUCCÈS
                        if (notificationSystem && result.playersInfo) {
                            setTimeout(async () => {
                                try {
                                    await notificationSystem.sendMatchStartNotification(tournament, match);
                                    console.log(`✅ Match start notification sent for ${match.matchId}`);
                                } catch (notifError) {
                                    console.error(`❌ Error sending match start notification: ${notifError.message}`);
                                }
                            }, 500); // Petit délai pour éviter le spam
                        }
                        
                        // ✅ SAUVEGARDE SÉCURISÉE APRÈS CHAQUE SUCCÈS
                        try {
                            await tournament.save();
                        } catch (saveError) {
                            console.error(`❌ Failed to save tournament after thread creation: ${saveError.message}`);
                        }
                        
                    } else {
                        console.error(`❌ Failed to create thread (attempt ${attempts}): ${result.error}`);
                        
                        if (attempts < MAX_RETRIES) {
                            const waitTime = DELAY_BETWEEN_THREADS * attempts; // Backoff progressif
                            console.log(`⏳ Retrying in ${waitTime}ms...`);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                        } else {
                            failedMatches.push({
                                matchId: match.matchId,
                                error: result.error,
                                players: result.playersInfo
                            });
                            console.error(`❌ Giving up on match ${match.matchId} after ${MAX_RETRIES} attempts`);
                        }
                    }
                }
                
                // Délai entre les threads (même en cas de succès)
                if (i < roundMatches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_THREADS));
                }
            }
            
            // ✅ RAPPORT FINAL DÉTAILLÉ
            const finalEmbed = new EmbedBuilder()
                .setTitle(`🎮 Round ${round} - Matchs Créés !`)
                .setDescription(`Rapport de création des threads de matchs`)
                .setColor(failedMatches.length === 0 ? '#00FF00' : (successCount > 0 ? '#FF9900' : '#FF0000'))
                .addFields(
                    { name: 'Round Actuel', value: round.toString(), inline: true },
                    { name: '✅ Créés', value: successCount.toString(), inline: true },
                    { name: '❌ Échoués', value: failedMatches.length.toString(), inline: true },
                    { name: 'Taux de Réussite', value: `${Math.round((successCount / roundMatches.length) * 100)}%`, inline: true }
                )
                .setTimestamp();
            
            if (successCount > 0) {
                finalEmbed.addFields({
                    name: '🎯 Instructions',
                    value: 'Les joueurs peuvent maintenant jouer leurs matchs et reporter les résultats !',
                    inline: false
                });
                
                finalEmbed.addFields({
                    name: '📋 Prochaine Étape',
                    value: 'Utilisez `/nextround` quand tous les matchs de ce round sont terminés',
                    inline: false
                });
            }
            
            if (failedMatches.length > 0) {
                const failedInfo = failedMatches.map(f => `• ${f.matchId}: ${f.error.substring(0, 50)}...`).join('\n');
                finalEmbed.addFields({
                    name: '⚠️ Matchs Échoués',
                    value: failedInfo.length > 1024 ? failedInfo.substring(0, 1021) + '...' : failedInfo,
                    inline: false
                });
                
                finalEmbed.addFields({
                    name: '🔧 Action Requise',
                    value: 'Un administrateur doit vérifier les matchs échoués et les recréer avec `/match victory`',
                    inline: false
                });
            }
            
            // Envoyer le rapport final
            await SafeDiscordUtils.safeSendMessage(channel, { embeds: [finalEmbed] });
            
            console.log(`=== ROUND ${round} THREADS COMPLETE: ${successCount}/${roundMatches.length} SUCCESS ===`);
            
            return {
                totalMatches: roundMatches.length,
                successCount,
                failedMatches
            };
            
        } catch (error) {
            console.error('❌ Error in createRoundThreadsWithRateLimitSafe:', error);
            
            // Envoyer une notification d'erreur critique
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erreur Critique lors de la Création des Threads')
                .setDescription('Une erreur inattendue est survenue. Contactez un administrateur.')
                .setColor('#FF0000')
                .addFields({ name: 'Erreur', value: error.message.substring(0, 1024), inline: false })
                .setTimestamp();
            
            await SafeDiscordUtils.safeSendMessage(channel, { embeds: [errorEmbed] });
            
            return {
                totalMatches: 0,
                successCount: 0,
                failedMatches: [],
                criticalError: error.message
            };
        }
    },

    async createSingleMatchThreadSafe(tournament, match, channel, client) {
        const errors = [];
        let threadCreated = false;
        let playersInfo = null;
        
        try {
            console.log(`🔧 Creating thread for match ${match.matchId}...`);
            
            // ✅ 1. VALIDATION DES IDs D'ABORD
            if (!SafeDiscordUtils.isValidDiscordId(match.player1) || !SafeDiscordUtils.isValidDiscordId(match.player2)) {
                throw new Error(`Invalid player IDs: ${match.player1}, ${match.player2}`);
            }
            
            // ✅ 2. RÉCUPÉRATION SÉCURISÉE DES UTILISATEURS
            const userFetchResult = await SafeDiscordUtils.safeBulkUserFetch(client, [match.player1, match.player2]);
            
            if (userFetchResult.errors.length > 0) {
                console.warn(`⚠️ User fetch issues for match ${match.matchId}:`, userFetchResult.errors);
                errors.push(...userFetchResult.errors);
            }
            
            const player1User = userFetchResult.users.get(match.player1);
            const player2User = userFetchResult.users.get(match.player2);
            
            if (!player1User || !player2User) {
                throw new Error(`Could not fetch both players: ${match.player1}, ${match.player2}`);
            }
            
            playersInfo = { player1User, player2User };
            
            // ✅ 3. CRÉER LE THREAD DE FAÇON SÉCURISÉE
            const threadName = `Round ${match.round} - Match ${match.position}`;
            const threadOptions = {
                name: threadName,
                autoArchiveDuration: 1440, // 24h
                reason: `Tournament match ${match.matchId}`,
                  type: ChannelType.PrivateThread, // ✅ THREAD PRIVÉ
                    reason: `Private tournament match ${match.matchId}`,
            };
            
            const threadResult = await SafeDiscordUtils.safeThreadCreate(channel, threadOptions);
            
            if (!threadResult.success) {
                throw new Error(`Failed to create thread: ${threadResult.error}`);
            }
            
            const thread = threadResult.thread;
            threadCreated = true;
            
            // ✅ 4. GÉNÉRER LE MOT DE PASSE SEULEMENT APRÈS SUCCÈS DU THREAD
            const password = Math.random().toString(36).substring(2, 7).toUpperCase();
            
          const matchEmbed = new EmbedBuilder()
    .setTitle(`🎮 Round ${match.round} - Match ${match.position}`)
    .setDescription(`**${player1User.username}** vs **${player2User.username}**`)
    .addFields(
        { name: '🔑 Mot de passe', value: `\`${password}\``, inline: false },
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
        {
            name: 'match en BO3',
            value: '• les matchs sont mainteannt en bo3 \n• Jouez 2 parties gagnantes pour remporter le match',
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
            
            // ✅ 6. ENVOYER LE MESSAGE DANS LE THREAD
            const messageOptions = {
                content: `🎮 **Round ${match.round}**\n<@${match.player1}> vs <@${match.player2}>\n\n🍀 Bonne chance à vous deux !`,
                embeds: [matchEmbed],
                components: [row]
            };
            
            const messageResult = await SafeDiscordUtils.safeSendMessage(thread, messageOptions);
            
            if (!messageResult.success) {
                console.error(`❌ Failed to send message in thread ${thread.id}: ${messageResult.error}`);
                errors.push(`Failed to send message: ${messageResult.error}`);
                // Ne pas considérer comme un échec critique si le thread est créé
            }
            
            // ✅ 7. METTRE À JOUR LE MATCH SEULEMENT SI TOUT A RÉUSSI
            match.threadId = thread.id;
            match.password = password;
            match.status = 'in_progress';
            
            console.log(`✅ Thread created successfully: ${threadName}`);
            
            return {
                success: true,
                threadId: thread.id,
                errors: errors.length > 0 ? errors : null,
                playersInfo
            };
            
        } catch (error) {
            console.error(`❌ Error creating thread for match ${match.matchId}:`, error.message);
            
            // ✅ 8. NETTOYAGE EN CAS D'ÉCHEC
            if (threadCreated && match.threadId) {
                try {
                    const thread = await channel.threads.fetch(match.threadId);
                    if (thread) {
                        await thread.delete('Match creation failed - cleanup');
                        console.log(`🧹 Cleaned up failed thread ${match.threadId}`);
                    }
                } catch (cleanupError) {
                    console.error(`❌ Failed to cleanup thread: ${cleanupError.message}`);
                }
                
                // Nettoyer les données du match
                match.threadId = null;
                match.password = null;
                // Le statut reste 'pending' pour permettre un retry
            }
            
            return {
                success: false,
                error: error.message,
                errors: [...errors, error.message],
                playersInfo
            };
        }
    }
};