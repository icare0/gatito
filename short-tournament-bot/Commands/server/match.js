const { 
    SlashCommandBuilder, 
    EmbedBuilder
} = require("discord.js");
const TournamentSchema = require("../../Schemas/Tournament");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('matches')
        .setDescription('Voir vos matchs actuels du tournoi'),
    
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
            
            const participant = tournament.participants.find(p => p.userId === interaction.user.id);
            if (!participant) {
                return interaction.editReply({ 
                    content: 'Vous n\'êtes pas inscrit à ce tournoi.', 
                    ephemeral: true 
                });
            }
            
            const userMatches = tournament.matches.filter(m => 
                m.player1 === interaction.user.id || m.player2 === interaction.user.id
            );
            
            if (userMatches.length === 0) {
                return interaction.editReply({ 
                    content: 'Vous n\'avez pas encore de matchs dans ce tournoi.', 
                    ephemeral: true 
                });
            }
            
            const matchesEmbed = new EmbedBuilder()
                .setTitle(`Vos Matchs de Tournoi : ${tournament.name}`)
                .setDescription(`Voici vos matchs pour ce tournoi.`)
                .setColor('#0099FF')
                .setFooter({ text: `Tournoi: ${tournament.name}` })
                .setTimestamp();
            
            // Current match
            const currentMatch = userMatches.find(m => 
                m.status === 'pending' || m.status === 'in_progress' || m.status === 'disputed'
            );
            
            if (currentMatch) {
                const isPlayer1 = currentMatch.player1 === interaction.user.id;
                const opponentId = isPlayer1 ? currentMatch.player2 : currentMatch.player1;
                
                if (opponentId) {
                    try {
                        const opponent = await client.users.fetch(opponentId);
                        matchesEmbed.addFields({ 
                            name: '🎮 Match Actuel', 
                            value: `Round ${currentMatch.round}: vs ${opponent.username} (Statut: ${currentMatch.status})`,
                            inline: false
                        });
                    } catch (error) {
                        matchesEmbed.addFields({ 
                            name: '🎮 Match Actuel', 
                            value: `Round ${currentMatch.round}: vs Adversaire Inconnu (Statut: ${currentMatch.status})`,
                            inline: false
                        });
                    }
                }
                
                if (currentMatch.threadId) {
                    matchesEmbed.addFields({ 
                        name: 'Thread du Match', 
                        value: `<#${currentMatch.threadId}>`,
                        inline: true
                    });
                }
            } else if (tournament.status === 'ongoing') {
                matchesEmbed.addFields({ 
                    name: 'Statut Actuel', 
                    value: 'Vous attendez votre prochain match.',
                    inline: false
                });
            }
            
            // Match history
            const completedMatches = userMatches.filter(m => m.status === 'completed');
            if (completedMatches.length > 0) {
                let historyText = '';
                
                for (const match of completedMatches) {
                    const isWinner = match.winner === interaction.user.id;
                    const isPlayer1 = match.player1 === interaction.user.id;
                    
                    let opponentId = isPlayer1 ? match.player2 : match.player1;
                    let opponentName = 'Inconnu';
                    
                    if (opponentId) {
                        try {
                            const opponentUser = await client.users.fetch(opponentId);
                            opponentName = opponentUser.username;
                        } catch (error) {
                            // Use default name
                        }
                    }
                    
                    historyText += `Round ${match.round}: ${isWinner ? '✅ Gagné' : '❌ Perdu'} vs ${opponentName}\n`;
                }
                
                matchesEmbed.addFields({ 
                    name: '📜 Historique des Matchs', 
                    value: historyText,
                    inline: false
                });
            }
            
            // Add upcoming matches if tournament is ongoing
            if (tournament.status === 'ongoing') {
                const nextRoundMatches = tournament.matches.filter(m => 
                    (m.player1 === null || m.player2 === null) && m.status === 'pending'
                );
                
                if (nextRoundMatches.length > 0) {
                    matchesEmbed.addFields({ 
                        name: '⏳ Prochains Rounds', 
                        value: 'Le bracket est encore déterminé par les matchs en cours.',
                        inline: false
                    });
                }
            }
            
            await interaction.editReply({ 
                embeds: [matchesEmbed],
                ephemeral: true 
            });
            
        } catch (error) {
            console.error('Error viewing matches:', error);
            await interaction.editReply({ 
                content: 'Une erreur est survenue.', 
                ephemeral: true 
            });
        }
    }
};