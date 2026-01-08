// Commands/server/tournament-status.js - NOUVELLE COMMANDE

const { 
    SlashCommandBuilder, 
    EmbedBuilder
} = require("discord.js");
const TournamentSchema = require("../../Schemas/Tournament");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tournamentstatus')
        .setDescription('Voir le status actuel du tournoi'),
    
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const tournament = await TournamentSchema.findOne({
                discordServerId: interaction.guild.id,
                status: { $in: ['registration', 'ongoing', 'completed'] }
            });
            
            if (!tournament) {
                return interaction.editReply({ 
                    content: 'Aucun tournoi trouvé.', 
                    ephemeral: true 
                });
            }
            
            const statusEmbed = new EmbedBuilder()
                .setTitle(`📊 Status : ${tournament.name}`)
                .setColor(this.getStatusColor(tournament.status))
                .setFooter({ text: 'Status du tournoi' })
                .setTimestamp();
            
            // Informations générales
            statusEmbed.addFields(
                { name: 'Statut', value: this.getStatusText(tournament.status), inline: true },
                { name: 'Participants', value: tournament.participants.length.toString(), inline: true }
            );
            
            if (tournament.status === 'ongoing') {
                const currentRound = tournament.getCurrentRound();
                const roundMatches = tournament.matches.filter(m => m.round === currentRound);
                const completedMatches = roundMatches.filter(m => m.status === 'completed');
                const inProgressMatches = roundMatches.filter(m => m.status === 'in_progress');
                const pendingMatches = roundMatches.filter(m => m.status === 'pending');
                
                statusEmbed.addFields(
                    { name: 'Round Actuel', value: currentRound.toString(), inline: true },
                    { name: 'Matchs Terminés', value: `${completedMatches.length}/${roundMatches.length}`, inline: true },
                    { name: 'Matchs en Cours', value: inProgressMatches.length.toString(), inline: true },
                    { name: 'Matchs en Attente', value: pendingMatches.length.toString(), inline: true }
                );
                
                // Progression
                const progressPercent = roundMatches.length > 0 ? Math.round((completedMatches.length / roundMatches.length) * 100) : 0;
                statusEmbed.addFields({
                    name: `Progression Round ${currentRound}`,
                    value: `${progressPercent}% (${completedMatches.length}/${roundMatches.length})`,
                    inline: false
                });
                
                // Prochaine action
                if (completedMatches.length === roundMatches.length) {
                    statusEmbed.addFields({
                        name: '⏭️ Prochaine Action',
                        value: 'Round terminé ! Utilisez `/nextround` pour continuer.',
                        inline: false
                    });
                } else {
                    statusEmbed.addFields({
                        name: '⏳ En Attente',
                        value: `${roundMatches.length - completedMatches.length} matchs restants à terminer.`,
                        inline: false
                    });
                }
                
            } else if (tournament.status === 'registration') {
                if (tournament.registrationClosed) {
                    statusEmbed.addFields({
                        name: '⏭️ Prochaine Action',
                        value: 'Inscriptions fermées. Utilisez `/start` pour commencer.',
                        inline: false
                    });
                } else {
                    statusEmbed.addFields({
                        name: '📝 Inscriptions',
                        value: 'Ouvertes - Les joueurs peuvent s\'inscrire !',
                        inline: false
                    });
                }
                
            } else if (tournament.status === 'completed') {
                const winner = tournament.participants.find(p => p.status === 'winner');
                if (winner) {
                    try {
                        const winnerUser = await client.users.fetch(winner.userId);
                        statusEmbed.addFields({
                            name: '🏆 Champion',
                            value: winnerUser.username,
                            inline: false
                        });
                    } catch (error) {
                        statusEmbed.addFields({
                            name: '🏆 Champion',
                            value: winner.pseudo || 'Inconnu',
                            inline: false
                        });
                    }
                }
                
                const totalRounds = Math.max(...(tournament.matches.map(m => m.round) || [1]));
                statusEmbed.addFields({
                    name: 'Rounds Joués',
                    value: totalRounds.toString(),
                    inline: true
                });
            }
            
            // Statistiques générales
            const totalMatches = tournament.matches.length;
            const completedTotalMatches = tournament.matches.filter(m => m.status === 'completed').length;
            
            if (totalMatches > 0) {
                statusEmbed.addFields({
                    name: 'Matchs Total',
                    value: `${completedTotalMatches}/${totalMatches} terminés`,
                    inline: true
                });
            }
            
            await interaction.editReply({ 
                embeds: [statusEmbed],
                ephemeral: true 
            });
            
        } catch (error) {
            console.error('Error getting tournament status:', error);
            await interaction.editReply({ 
                content: 'Une erreur est survenue.', 
                ephemeral: true 
            });
        }
    },

    getStatusColor(status) {
        switch (status) {
            case 'registration': return '#FFA500'; // Orange
            case 'ongoing': return '#0099FF';      // Bleu
            case 'completed': return '#00FF00';    // Vert
            default: return '#808080';             // Gris
        }
    },

    getStatusText(status) {
        switch (status) {
            case 'registration': return '📝 Inscriptions';
            case 'ongoing': return '🎮 En cours';
            case 'completed': return '🏆 Terminé';
            default: return '❓ Inconnu';
        }
    }
};