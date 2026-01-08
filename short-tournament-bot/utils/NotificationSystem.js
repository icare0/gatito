const { EmbedBuilder } = require('discord.js');
const UserSchema = require('../Schemas/User');

class NotificationSystem {
    constructor(client) {
        this.client = client;
    }

    // Send tournament start notification
    async sendTournamentStartNotification(tournament) {
        try {
            for (const participant of tournament.participants) {
                const userProfile = await UserSchema.findOne({ discordId: participant.userId });
                
                if (userProfile && userProfile.preferences.notifications.tournamentStart) {
                    try {
                        const user = await this.client.users.fetch(participant.userId);
                        
                        const embed = new EmbedBuilder()
                            .setTitle('🏆 Tournoi Commencé !')
                            .setDescription(`Le tournoi "${tournament.name}" vient de commencer !`)
                            .setColor('#00FF00')
                            .addFields(
                                { name: 'Participants', value: tournament.participants.length.toString(), inline: true },
                                { name: 'Votre Seed', value: `#${participant.seed}`, inline: true },
                                { name: 'Serveur', value: tournament.discordServerId, inline: true }
                            )
                            .setFooter({ text: 'Vous serez notifié quand votre premier match sera prêt' });
                        
                        await user.send({ embeds: [embed] });
                    } catch (error) {
                        console.log(`Could not send tournament start notification to ${participant.userId}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error sending tournament start notifications:', error);
        }
    }

    // Send match start notification
    async sendMatchStartNotification(tournament, match) {
        try {
            const players = [match.player1, match.player2].filter(Boolean);
            
            for (const playerId of players) {
                const userProfile = await UserSchema.findOne({ discordId: playerId });
                
                if (userProfile && userProfile.preferences.notifications.matchStart) {
                    try {
                        const user = await this.client.users.fetch(playerId);
                        const opponentId = playerId === match.player1 ? match.player2 : match.player1;
                        let opponentName = 'Adversaire inconnu';
                        
                        if (opponentId) {
                            try {
                                const opponent = await this.client.users.fetch(opponentId);
                                opponentName = opponent.username;
                            } catch (error) {
                                opponentName = 'Adversaire inconnu';
                            }
                        }
                        
                        const embed = new EmbedBuilder()
                            .setTitle('🎮 Votre Match est Prêt !')
                            .setDescription(`Votre match du Round ${match.round} est maintenant disponible !`)
                            .setColor('#0099FF')
                            .addFields(
                                { name: 'Tournoi', value: tournament.name, inline: false },
                                { name: 'Adversaire', value: opponentName, inline: true },
                                { name: 'Round', value: match.round.toString(), inline: true },
                                { name: '🔑 Mot de passe', value: `\`${match.password}\``, inline: true }
                            )
                            .setFooter({ text: `Thread: Rendez-vous dans le channel du tournoi` });
                        
                        if (match.threadId) {
                            embed.addFields({
                                name: '💬 Thread du Match',
                                value: `<#${match.threadId}>`,
                                inline: false
                            });
                        }
                        
                        await user.send({ embeds: [embed] });
                    } catch (error) {
                        console.log(`Could not send match start notification to ${playerId}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error sending match start notifications:', error);
        }
    }

    // Send match reminder (after some time of inactivity)
    async sendMatchReminder(tournament, match, reminderText = 'Votre match vous attend !') {
        try {
            const players = [match.player1, match.player2].filter(Boolean);
            
            for (const playerId of players) {
                const userProfile = await UserSchema.findOne({ discordId: playerId });
                
                if (userProfile && userProfile.preferences.notifications.matchReminder) {
                    try {
                        const user = await this.client.users.fetch(playerId);
                        const opponentId = playerId === match.player1 ? match.player2 : match.player1;
                        let opponentName = 'Adversaire inconnu';
                        
                        if (opponentId) {
                            try {
                                const opponent = await this.client.users.fetch(opponentId);
                                opponentName = opponent.username;
                            } catch (error) {
                                opponentName = 'Adversaire inconnu';
                            }
                        }
                        
                        const embed = new EmbedBuilder()
                            .setTitle('⏰ Rappel de Match')
                            .setDescription(reminderText)
                            .setColor('#FF9900')
                            .addFields(
                                { name: 'Tournoi', value: tournament.name, inline: false },
                                { name: 'Adversaire', value: opponentName, inline: true },
                                { name: 'Round', value: match.round.toString(), inline: true },
                                { name: '🔑 Mot de passe', value: `\`${match.password}\``, inline: true }
                            )
                            .setFooter({ text: 'N\'oubliez pas de reporter le résultat après votre match !' });
                        
                        if (match.threadId) {
                            embed.addFields({
                                name: '💬 Thread du Match',
                                value: `<#${match.threadId}>`,
                                inline: false
                            });
                        }
                        
                        await user.send({ embeds: [embed] });
                    } catch (error) {
                        console.log(`Could not send match reminder to ${playerId}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error sending match reminders:', error);
        }
    }

    // Send tournament announcement
    async sendTournamentAnnouncement(tournament, title, message, color = '#0099FF') {
        try {
            for (const participant of tournament.participants) {
                const userProfile = await UserSchema.findOne({ discordId: participant.userId });
                
                if (userProfile && userProfile.preferences.notifications.announcements) {
                    try {
                        const user = await this.client.users.fetch(participant.userId);
                        
                        const embed = new EmbedBuilder()
                            .setTitle(title)
                            .setDescription(message)
                            .setColor(color)
                            .addFields(
                                { name: 'Tournoi', value: tournament.name, inline: true }
                            )
                            .setTimestamp();
                        
                        await user.send({ embeds: [embed] });
                    } catch (error) {
                        console.log(`Could not send announcement to ${participant.userId}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error sending tournament announcements:', error);
        }
    }

    // Send match result notification
    async sendMatchResultNotification(tournament, match, winnerId, loserId) {
        try {
            // Notification for winner
            const winnerProfile = await UserSchema.findOne({ discordId: winnerId });
            if (winnerProfile && winnerProfile.preferences.notifications.results) {
                try {
                    const winnerUser = await this.client.users.fetch(winnerId);
                    const loserUser = await this.client.users.fetch(loserId);
                    
                    const winnerEmbed = new EmbedBuilder()
                        .setTitle('🏆 Victoire !')
                        .setDescription(`Félicitations ! Vous avez gagné votre match !`)
                        .setColor('#00FF00')
                        .addFields(
                            { name: 'Tournoi', value: tournament.name, inline: false },
                            { name: 'Adversaire', value: loserUser.username, inline: true },
                            { name: 'Round', value: match.round.toString(), inline: true }
                        )
                        .setFooter({ text: 'Bonne chance pour le prochain round !' });
                    
                    await winnerUser.send({ embeds: [winnerEmbed] });
                } catch (error) {
                    console.log(`Could not send win notification to ${winnerId}`);
                }
            }

            // Notification for loser
            const loserProfile = await UserSchema.findOne({ discordId: loserId });
            if (loserProfile && loserProfile.preferences.notifications.results) {
                try {
                    const loserUser = await this.client.users.fetch(loserId);
                    const winnerUser = await this.client.users.fetch(winnerId);
                    
                    const loserEmbed = new EmbedBuilder()
                        .setTitle('📋 Résultat du Match')
                        .setDescription(`Votre match est terminé.`)
                        .setColor('#FF6B6B')
                        .addFields(
                            { name: 'Tournoi', value: tournament.name, inline: false },
                            { name: 'Adversaire', value: winnerUser.username, inline: true },
                            { name: 'Round', value: match.round.toString(), inline: true },
                            { name: 'Résultat', value: 'Défaite', inline: true }
                        )
                        .setFooter({ text: 'Merci d\'avoir participé au tournoi !' });
                    
                    await loserUser.send({ embeds: [loserEmbed] });
                } catch (error) {
                    console.log(`Could not send loss notification to ${loserId}`);
                }
            }
        } catch (error) {
            console.error('Error sending match result notifications:', error);
        }
    }

    // Send tournament winner notification
    async sendTournamentWinnerNotification(tournament, winnerId) {
        try {
            const winnerProfile = await UserSchema.findOne({ discordId: winnerId });
            if (winnerProfile && winnerProfile.preferences.notifications.results) {
                try {
                    const winnerUser = await this.client.users.fetch(winnerId);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('🏆 CHAMPION DU TOURNOI !')
                        .setDescription(`🎉 Félicitations ! Vous avez remporté le tournoi "${tournament.name}" ! 🎉`)
                        .setColor('#FFD700')
                        .addFields(
                            { name: 'Participants', value: tournament.participants.length.toString(), inline: true },
                            { name: 'Votre Performance', value: 'Champion 🏆', inline: true }
                        )
                        .setFooter({ text: 'Bravo pour cette magnifique victoire !' })
                        .setTimestamp();
                    
                    await winnerUser.send({ embeds: [embed] });
                } catch (error) {
                    console.log(`Could not send winner notification to ${winnerId}`);
                }
            }
        } catch (error) {
            console.error('Error sending tournament winner notification:', error);
        }
    }

    // Get notification preferences summary for a user
    async getNotificationSummary(userId) {
        try {
            const userProfile = await UserSchema.findOne({ discordId: userId });
            if (!userProfile) return null;
            
            const prefs = userProfile.preferences.notifications;
            return {
                tournamentStart: prefs.tournamentStart,
                matchStart: prefs.matchStart,
                matchReminder: prefs.matchReminder,
                results: prefs.results,
                announcements: prefs.announcements,
                directMessages: prefs.directMessages
            };
        } catch (error) {
            console.error('Error getting notification summary:', error);
            return null;
        }
    }
}

module.exports = NotificationSystem;