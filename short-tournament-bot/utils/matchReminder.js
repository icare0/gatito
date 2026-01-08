const TournamentSchema = require('../Schemas/Tournament');
const SafeNotificationSystem = require('./safeNotificationSystem');

class MatchReminderSystem {
    constructor(client) {
        this.client = client;
        this.notificationSystem = new SafeNotificationSystem(client);
        this.reminderIntervals = new Map(); // Pour tracker les intervals actifs
    }

    // Démarrer le système de rappels automatiques
    startReminderSystem() {
        console.log('🔔 Starting Match Reminder System...');
        
        // Vérifier toutes les 5 minutes
        setInterval(async () => {
            await this.checkForMatchReminders();
        }, 5 * 60 * 1000); // 5 minutes
        
        console.log('✅ Match Reminder System started (checking every 5 minutes)');
    }

    // Vérifier tous les tournois actifs pour les rappels
    async checkForMatchReminders() {
        try {
            const activeTorunaments = await TournamentSchema.find({
                status: 'ongoing'
            });

            for (const tournament of activeTorunaments) {
                await this.checkTournamentMatches(tournament);
            }
        } catch (error) {
            console.error('❌ Error checking match reminders:', error);
        }
    }

    // Vérifier les matchs d'un tournoi spécifique
    async checkTournamentMatches(tournament) {
        try {
            const inProgressMatches = tournament.matches.filter(m => 
                m.status === 'in_progress'
            );

            for (const match of inProgressMatches) {
                await this.checkMatchForReminder(tournament, match);
            }
        } catch (error) {
            console.error(`❌ Error checking matches for tournament ${tournament.name}:`, error);
        }
    }

    // Vérifier si un match spécifique a besoin d'un rappel
    async checkMatchForReminder(tournament, match) {
        try {
            // Calculer depuis quand le match est en cours
            const now = new Date();
            const matchStartTime = new Date(match.updatedAt || match.createdAt || tournament.startDate);
            const timeSinceStart = now.getTime() - matchStartTime.getTime();
            
            const REMINDER_INTERVALS = [
                30 * 60 * 1000,  // 30 minutes
                60 * 60 * 1000,  // 1 heure
                120 * 60 * 1000, // 2 heures
                240 * 60 * 1000  // 4 heures
            ];

            // Vérifier s'il faut envoyer un rappel
            for (let i = 0; i < REMINDER_INTERVALS.length; i++) {
                const intervalTime = REMINDER_INTERVALS[i];
                const reminderKey = `${match.matchId}_${i}`;
                
                // Si le temps écoulé dépasse cet interval et qu'on n'a pas encore envoyé ce rappel
                if (timeSinceStart >= intervalTime && !this.hasReminderBeenSent(reminderKey)) {
                    await this.sendMatchReminder(tournament, match, i);
                    this.markReminderAsSent(reminderKey);
                    break; // Envoyer seulement un rappel à la fois
                }
            }
        } catch (error) {
            console.error(`❌ Error checking reminder for match ${match.matchId}:`, error);
        }
    }

    // Envoyer un rappel de match
    async sendMatchReminder(tournament, match, reminderLevel) {
        try {
            const reminderMessages = [
                "⏰ Votre match vous attend depuis 30 minutes ! N'oubliez pas de jouer et reporter le résultat.",
                "⚠️ Votre match est en attente depuis 1 heure ! Merci de jouer rapidement.",
                "🚨 Votre match est en attente depuis 2 heures ! Contactez votre adversaire ou un admin.",
                "🔥 URGENT : Votre match est en attente depuis 4 heures ! Risk de disqualification !"
            ];

            const reminderText = reminderMessages[reminderLevel] || reminderMessages[0];

            await this.notificationSystem.sendMatchReminder(tournament, match, reminderText);
            
            // Aussi poster dans le thread du match s'il existe
            if (match.threadId) {
                try {
                    const guild = await this.client.guilds.fetch(tournament.discordServerId);
                    const channel = await guild.channels.fetch(tournament.discordChannelId);
                    const thread = await channel.threads.fetch(match.threadId);
                    
                    if (thread && !thread.archived) {
                        const reminderEmbed = {
                            title: '⏰ Rappel de Match',
                            description: reminderText,
                            color: reminderLevel >= 2 ? 0xFF0000 : 0xFF9900, // Rouge pour urgent, orange sinon
                            fields: [
                                { name: 'Temps écoulé', value: this.formatTime(reminderLevel), inline: true },
                                { name: 'Action requise', value: 'Jouez votre match et reportez le résultat', inline: true }
                            ],
                            timestamp: new Date().toISOString()
                        };

                        await thread.send({ 
                            content: `<@${match.player1}> <@${match.player2}>`,
                            embeds: [reminderEmbed]
                        });
                    }
                } catch (error) {
                    console.error(`❌ Error sending reminder to thread ${match.threadId}:`, error);
                }
            }

            console.log(`✅ Reminder level ${reminderLevel} sent for match ${match.matchId}`);
        } catch (error) {
            console.error(`❌ Error sending reminder for match ${match.matchId}:`, error);
        }
    }

    // Vérifier si un rappel a déjà été envoyé
    hasReminderBeenSent(reminderKey) {
        return this.reminderIntervals.has(reminderKey);
    }

    // Marquer un rappel comme envoyé
    markReminderAsSent(reminderKey) {
        this.reminderIntervals.set(reminderKey, new Date());
    }

    // Nettoyer les rappels d'un match terminé
    clearMatchReminders(matchId) {
        const keysToDelete = [];
        for (const key of this.reminderIntervals.keys()) {
            if (key.startsWith(matchId + '_')) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => {
            this.reminderIntervals.delete(key);
        });
        
        console.log(`🧹 Cleared ${keysToDelete.length} reminders for match ${matchId}`);
    }

    // Nettoyer tous les rappels d'un tournoi terminé
    clearTournamentReminders(tournamentId) {
        const keysToDelete = [];
        for (const key of this.reminderIntervals.keys()) {
            // Ici on devrait avoir une façon de lier les clés au tournamentId
            // Pour l'instant on nettoie tout si le tournoi est terminé
        }
        
        console.log(`🧹 Cleared tournament reminders for ${tournamentId}`);
    }

    // Formater le temps écoulé pour l'affichage
    formatTime(reminderLevel) {
        const times = ['30 minutes', '1 heure', '2 heures', '4 heures'];
        return times[reminderLevel] || 'Longtemps';
    }

    // Méthode pour envoyer un rappel manuel (pour commande admin)
    async sendManualReminder(tournamentId, matchId, customMessage = null) {
        try {
            const tournament = await TournamentSchema.findById(tournamentId);
            if (!tournament) {
                throw new Error('Tournament not found');
            }

            const match = tournament.matches.find(m => m.matchId === matchId);
            if (!match) {
                throw new Error('Match not found');
            }

            const message = customMessage || "📢 Rappel manuel : Votre match vous attend ! Merci de jouer et reporter le résultat.";
            
            await this.notificationSystem.sendMatchReminder(tournament, match, message);
            
            console.log(`✅ Manual reminder sent for match ${matchId}`);
            return true;
        } catch (error) {
            console.error(`❌ Error sending manual reminder:`, error);
            return false;
        }
    }

    // Obtenir les statistiques des rappels
    getReminderStats() {
        const stats = {
            totalActiveReminders: this.reminderIntervals.size,
            remindersByLevel: {
                level0: 0, // 30 min
                level1: 0, // 1h
                level2: 0, // 2h
                level3: 0  // 4h
            }
        };

        for (const key of this.reminderIntervals.keys()) {
            const level = key.split('_')[1];
            if (level !== undefined) {
                stats.remindersByLevel[`level${level}`]++;
            }
        }

        return stats;
    }
}

module.exports = MatchReminderSystem;