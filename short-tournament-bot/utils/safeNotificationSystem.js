// utils/SafeNotificationSystem.js - Version sécurisée du système de notifications
const { EmbedBuilder } = require('discord.js');
const UserSchema = require('../Schemas/User');
const SafeDiscordUtils = require('./SafeDiscordUtils');

class SafeNotificationSystem {
    constructor(client) {
        this.client = client;
        this.notificationQueue = new Map(); // Pour éviter le spam
        this.retryQueue = new Map(); // Pour réessayer les notifications échouées
    }

    /**
     * Envoie des notifications de façon sécurisée avec gestion d'erreurs
     * @param {Array} participants - Liste des participants
     * @param {Function} createNotificationFn - Fonction qui crée la notification pour un utilisateur
     * @param {string} notificationType - Type de notification pour les logs
     * @returns {Promise<{success: number, failed: number, errors: Array}>}
     */
    async safeBulkNotification(participants, createNotificationFn, notificationType) {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        if (!participants || participants.length === 0) {
            console.log(`📭 No participants for ${notificationType} notifications`);
            return results;
        }

        console.log(`📬 Sending ${notificationType} notifications to ${participants.length} participants...`);

        // Traiter les notifications en parallèle mais avec limite
        const BATCH_SIZE = 5; // Traiter 5 notifications à la fois
        
        for (let i = 0; i < participants.length; i += BATCH_SIZE) {
            const batch = participants.slice(i, i + BATCH_SIZE);
            
            const batchPromises = batch.map(async (participant) => {
                try {
                    const participantId = participant.userId || participant;
                    
                    // Vérifier les préférences utilisateur
                    const userProfile = await UserSchema.findOne({ discordId: participantId });
                    if (!userProfile) {
                        console.log(`⚠️ No user profile found for ${participantId} - skipping notification`);
                        return { success: false, error: 'No user profile' };
                    }

                    // Récupérer l'utilisateur de façon sécurisée
                    const userFetchResult = await SafeDiscordUtils.safeUserFetch(this.client, participantId);
                    if (!userFetchResult.success) {
                        console.log(`⚠️ Could not fetch user ${participantId}: ${userFetchResult.error}`);
                        results.errors.push(`User ${participantId}: ${userFetchResult.error}`);
                        return { success: false, error: userFetchResult.error };
                    }

                    const user = userFetchResult.user;

                    // Créer la notification spécifique
                    const notification = await createNotificationFn(user, userProfile, participant);
                    if (!notification) {
                        return { success: false, error: 'Notification not created (preferences)' };
                    }

                    // Vérifier la queue pour éviter le spam
                    const queueKey = `${participantId}_${notificationType}`;
                    if (this.notificationQueue.has(queueKey)) {
                        const lastSent = this.notificationQueue.get(queueKey);
                        if (Date.now() - lastSent < 60000) { // 1 minute minimum entre notifications du même type
                            console.log(`⏳ Skipping ${notificationType} for ${participantId} - too recent`);
                            return { success: false, error: 'Rate limited' };
                        }
                    }

                    // Envoyer la notification
                    const dmResult = await SafeDiscordUtils.safeDM(user, notification);
                    
                    if (dmResult.success) {
                        this.notificationQueue.set(queueKey, Date.now());
                        console.log(`✅ ${notificationType} notification sent to ${user.username}`);
                        return { success: true };
                    } else {
                        console.log(`❌ Failed to send ${notificationType} to ${user.username}: ${dmResult.error}`);
                        results.errors.push(`${user.username}: ${dmResult.error}`);
                        return { success: false, error: dmResult.error };
                    }

                } catch (error) {
                    console.error(`❌ Error in ${notificationType} notification for ${participant.userId || participant}:`, error.message);
                    results.errors.push(`${participant.userId || participant}: ${error.message}`);
                    return { success: false, error: error.message };
                }
            });

            // Attendre que le batch soit terminé
            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    if (result.value.success) {
                        results.success++;
                    } else {
                        results.failed++;
                    }
                } else {
                    results.failed++;
                    results.errors.push(result.reason?.message || 'Unknown error');
                }
            });

            // Petite pause entre les batches pour éviter le rate limiting
            if (i + BATCH_SIZE < participants.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`📊 ${notificationType} notifications: ${results.success} success, ${results.failed} failed`);
        return results;
    }

    // ✅ NOTIFICATION DE DÉBUT DE TOURNOI SÉCURISÉE
    async sendTournamentStartNotification(tournament) {
        return await this.safeBulkNotification(
            tournament.participants,
            async (user, userProfile, participant) => {
                if (!userProfile.preferences.notifications.tournamentStart) {
                    return null; // L'utilisateur ne veut pas ce type de notification
                }

                return {
                    embeds: [new EmbedBuilder()
                        .setTitle('🏆 Tournoi Commencé !')
                        .setDescription(`Le tournoi "${tournament.name}" vient de commencer !`)
                        .setColor('#00FF00')
                        .addFields(
                            { name: 'Participants', value: tournament.participants.length.toString(), inline: true },
                            { name: 'Votre Seed', value: `#${participant.seed}`, inline: true },
                            { name: 'Serveur', value: tournament.discordServerId, inline: true }
                        )
                        .setFooter({ text: 'Vous serez notifié quand votre premier match sera prêt' })
                    ]
                };
            },
            'tournament_start'
        );
    }

    // ✅ NOTIFICATION DE DÉBUT DE MATCH SÉCURISÉE
    async sendMatchStartNotification(tournament, match) {
        const players = [match.player1, match.player2].filter(Boolean);
        
        return await this.safeBulkNotification(
            players,
            async (user, userProfile, playerId) => {
                if (!userProfile.preferences.notifications.matchStart) {
                    return null;
                }

                const opponentId = playerId === match.player1 ? match.player2 : match.player1;
                let opponentName = 'Adversaire inconnu';
                
                if (opponentId) {
                    const opponentResult = await SafeDiscordUtils.safeUserFetch(this.client, opponentId);
                    if (opponentResult.success) {
                        opponentName = opponentResult.user.username;
                    }
                }

                const embed = new EmbedBuilder()
                    .setTitle('🎮 Votre Match est Prêt !')
                    .setDescription(`Votre match du Round ${match.round} est maintenant disponible !`)
                    .setColor('#0099FF')
                    .addFields(
                        { name: 'Tournoi', value: tournament.name, inline: false },
                        { name: 'Adversaire', value: opponentName, inline: true },
                        { name: 'Round', value: match.round.toString(), inline: true }
                    )
                    .setFooter({ text: 'Rendez-vous dans le channel du tournoi' });

                if (match.password) {
                    embed.addFields({ name: '🔑 Mot de passe', value: `\`${match.password}\``, inline: true });
                }

                if (match.threadId) {
                    embed.addFields({
                        name: '💬 Thread du Match',
                        value: `<#${match.threadId}>`,
                        inline: false
                    });
                }

                return { embeds: [embed] };
            },
            'match_start'
        );
    }

    // ✅ NOTIFICATION DE RAPPEL DE MATCH SÉCURISÉE
    async sendMatchReminder(tournament, match, reminderText = 'Votre match vous attend !') {
        const players = [match.player1, match.player2].filter(Boolean);
        
        return await this.safeBulkNotification(
            players,
            async (user, userProfile, playerId) => {
                if (!userProfile.preferences.notifications.matchReminder) {
                    return null;
                }

                const opponentId = playerId === match.player1 ? match.player2 : match.player1;
                let opponentName = 'Adversaire inconnu';
                
                if (opponentId) {
                    const opponentResult = await SafeDiscordUtils.safeUserFetch(this.client, opponentId);
                    if (opponentResult.success) {
                        opponentName = opponentResult.user.username;
                    }
                }

                const embed = new EmbedBuilder()
                    .setTitle('⏰ Rappel de Match')
                    .setDescription(reminderText)
                    .setColor('#FF9900')
                    .addFields(
                        { name: 'Tournoi', value: tournament.name, inline: false },
                        { name: 'Adversaire', value: opponentName, inline: true },
                        { name: 'Round', value: match.round.toString(), inline: true }
                    )
                    .setFooter({ text: 'N\'oubliez pas de reporter le résultat après votre match !' });

                if (match.password) {
                    embed.addFields({ name: '🔑 Mot de passe', value: `\`${match.password}\``, inline: true });
                }

                if (match.threadId) {
                    embed.addFields({
                        name: '💬 Thread du Match',
                        value: `<#${match.threadId}>`,
                        inline: false
                    });
                }

                return { embeds: [embed] };
            },
            'match_reminder'
        );
    }

    // ✅ NOTIFICATION D'ANNONCE DE TOURNOI SÉCURISÉE
    async sendTournamentAnnouncement(tournament, title, message, color = '#0099FF') {
        return await this.safeBulkNotification(
            tournament.participants,
            async (user, userProfile) => {
                if (!userProfile.preferences.notifications.announcements) {
                    return null;
                }

                return {
                    embeds: [new EmbedBuilder()
                        .setTitle(title)
                        .setDescription(message)
                        .setColor(color)
                        .addFields(
                            { name: 'Tournoi', value: tournament.name, inline: true }
                        )
                        .setTimestamp()
                    ]
                };
            },
            'tournament_announcement'
        );
    }

    // ✅ NOTIFICATION DE RÉSULTAT DE MATCH SÉCURISÉE
    async sendMatchResultNotification(tournament, match, winnerId, loserId) {
        const notifications = [];

        // Notification pour le gagnant
        if (winnerId) {
            notifications.push(this.safeBulkNotification(
                [winnerId],
                async (user, userProfile) => {
                    if (!userProfile.preferences.notifications.results) {
                        return null;
                    }

                    const loserResult = await SafeDiscordUtils.safeUserFetch(this.client, loserId);
                    const loserName = loserResult.success ? loserResult.user.username : 'Adversaire inconnu';

                    return {
                        embeds: [new EmbedBuilder()
                            .setTitle('🏆 Victoire !')
                            .setDescription('Félicitations ! Vous avez gagné votre match !')
                            .setColor('#00FF00')
                            .addFields(
                                { name: 'Tournoi', value: tournament.name, inline: false },
                                { name: 'Adversaire', value: loserName, inline: true },
                                { name: 'Round', value: match.round.toString(), inline: true }
                            )
                            .setFooter({ text: 'Bonne chance pour le prochain round !' })
                        ]
                    };
                },
                'match_result_win'
            ));
        }

        // Notification pour le perdant
        if (loserId) {
            notifications.push(this.safeBulkNotification(
                [loserId],
                async (user, userProfile) => {
                    if (!userProfile.preferences.notifications.results) {
                        return null;
                    }

                    const winnerResult = await SafeDiscordUtils.safeUserFetch(this.client, winnerId);
                    const winnerName = winnerResult.success ? winnerResult.user.username : 'Adversaire inconnu';

                    return {
                        embeds: [new EmbedBuilder()
                            .setTitle('📋 Résultat du Match')
                            .setDescription('Votre match est terminé.')
                            .setColor('#FF6B6B')
                            .addFields(
                                { name: 'Tournoi', value: tournament.name, inline: false },
                                { name: 'Adversaire', value: winnerName, inline: true },
                                { name: 'Round', value: match.round.toString(), inline: true },
                                { name: 'Résultat', value: 'Défaite', inline: true }
                            )
                            .setFooter({ text: 'Merci d\'avoir participé au tournoi !' })
                        ]
                    };
                },
                'match_result_loss'
            ));
        }

        // Attendre toutes les notifications
        const results = await Promise.allSettled(notifications);
        return results;
    }

    // ✅ NOTIFICATION DE CHAMPION DE TOURNOI SÉCURISÉE
    async sendTournamentWinnerNotification(tournament, winnerId) {
        return await this.safeBulkNotification(
            [winnerId],
            async (user, userProfile) => {
                if (!userProfile.preferences.notifications.results) {
                    return null;
                }

                return {
                    embeds: [new EmbedBuilder()
                        .setTitle('🏆 CHAMPION DU TOURNOI !')
                        .setDescription(`🎉 Félicitations ! Vous avez remporté le tournoi "${tournament.name}" ! 🎉`)
                        .setColor('#FFD700')
                        .addFields(
                            { name: 'Participants', value: tournament.participants.length.toString(), inline: true },
                            { name: 'Votre Performance', value: 'Champion 🏆', inline: true }
                        )
                        .setFooter({ text: 'Bravo pour cette magnifique victoire !' })
                        .setTimestamp()
                    ]
                };
            },
            'tournament_winner'
        );
    }

    // Nettoyer la queue de notifications (appeler périodiquement)
    cleanupNotificationQueue() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [key, timestamp] of this.notificationQueue.entries()) {
            if (timestamp < oneHourAgo) {
                this.notificationQueue.delete(key);
            }
        }
    }

    // Obtenir les statistiques du système de notifications
    getNotificationStats() {
        return {
            queueSize: this.notificationQueue.size,
            retryQueueSize: this.retryQueue.size
        };
    }
}

module.exports = SafeNotificationSystem;