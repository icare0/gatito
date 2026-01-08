const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits
} = require("discord.js");
const TournamentSchema = require("../../Schemas/Tournament");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('match')
        .setDescription('Gestion des matchs de tournoi')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addSubcommand(subcommand =>
            subcommand
                .setName('victory')
                .setDescription('Définir manuellement le gagnant d\'un match')
                .addStringOption(option =>
                    option.setName('match_id')
                        .setDescription('ID du match')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addUserOption(option =>
                    option.setName('winner')
                        .setDescription('Le joueur gagnant')
                        .setRequired(true))),
    
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices = [];

        if (focusedOption.name === 'match_id') {
            // Récupérer le tournoi actif
            const activeTournament = await TournamentSchema.findOne({ 
                discordServerId: interaction.guild.id,
                status: 'ongoing'
            });
            
            if (!activeTournament) return await interaction.respond([]);
            
            // Filtrer les matchs en cours ou en litige
            const relevantMatches = activeTournament.matches.filter(m => 
                m.status === 'in_progress' || m.status === 'disputed'
            );
            
            choices = relevantMatches.map(match => ({
                name: `Match ${match.matchId} (Round ${match.round}) - ${match.status}`,
                value: match.matchId
            }));
        }

        const filtered = choices.filter(choice => 
            choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
        );
        
        await interaction.respond(filtered.slice(0, 25));
    },

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'victory') {
            await this.setMatchVictory(interaction, client);
        }
    },

    async setMatchVictory(interaction, client) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const matchId = interaction.options.getString('match_id');
            const winnerUser = interaction.options.getUser('winner');
            
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
                    content: 'Vous n\'avez pas la permission de gérer les matchs.', 
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
            if (match.player1 !== winnerUser.id && match.player2 !== winnerUser.id) {
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
            
            const loserId = match.player1 === winnerUser.id ? match.player2 : match.player1;
            
            // Update match with admin resolution
            match.winner = winnerUser.id;
            match.status = 'completed';
            match.completedAt = new Date();
            match.resultReports = []; // Clear any conflicting reports
            match.adminResolved = true;
            match.resolvedBy = interaction.user.id;
            
            // Update scores based on winner
            if (match.player1 === winnerUser.id) {
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
                        // Odd positions go to player1 of next match
                        nextMatch.player1 = winnerUser.id;
                    } else {
                        // Even positions go to player2 of next match
                        nextMatch.player2 = winnerUser.id;
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
            
            await tournament.save();
            
            // Get loser user for display
            let loserUser;
            try {
                loserUser = await client.users.fetch(loserId);
            } catch (error) {
                loserUser = { username: 'Utilisateur inconnu' };
            }
            
            // Notify in thread if it exists
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
                                    { name: '🏆 Gagnant', value: winnerUser.username, inline: true },
                                    { name: '❌ Éliminé', value: loserUser.username, inline: true },
                                    { name: '👮 Résolu par', value: interaction.user.username, inline: true }
                                )
                                .setFooter({ text: `Match ID: ${match.matchId}` })
                                .setTimestamp();
                            
                            await thread.send({ 
                                content: `🛡️ Match résolu par l'administration.\n🏆 <@${winnerUser.id}> a été déclaré vainqueur.`,
                                embeds: [resolutionEmbed]
                            });
                            
                            // Archive the thread
                            await thread.setArchived(true);
                        }
                    }
                } catch (error) {
                    console.error('Error notifying thread:', error);
                }
            }
            
            await interaction.editReply({ 
                content: `✅ Match résolu avec succès.\n🏆 **${winnerUser.username}** a été déclaré vainqueur du match **${matchId}** (Round ${match.round}).`,
                ephemeral: true 
            });
            
            // Check if tournament is complete
            const totalRounds = Math.ceil(Math.log2(tournament.participants.length));
            if (match.round === totalRounds) {
                // This was the final match - tournament is complete
                tournament.status = 'completed';
                
                // Update winner participant status
                const winnerIndex = tournament.participants.findIndex(p => p.userId === winnerUser.id);
                if (winnerIndex !== -1) {
                    tournament.participants[winnerIndex].status = 'winner';
                }
                
                // Create winner announcement
                const channel = interaction.guild.channels.cache.get(tournament.discordChannelId);
                if (channel) {
                    try {
                        const winnerEmbed = new EmbedBuilder()
                            .setTitle(`🏆 Champion du Tournoi : ${tournament.name}`)
                            .setDescription(`Félicitations à **${winnerUser.username}** pour avoir gagné le tournoi !`)
                            .setColor('#FFD700')
                            .addFields(
                                { name: 'Total Participants', value: tournament.participants.length.toString(), inline: true },
                                { name: 'Résolution', value: 'Match final résolu par l\'administration', inline: true }
                            )
                            .setFooter({ text: 'Tournoi terminé' })
                            .setTimestamp();
                        
                        await channel.send({ 
                            content: `🎉 Félicitations <@${winnerUser.id}> ! 🎉`,
                            embeds: [winnerEmbed]
                        });
                    } catch (error) {
                        console.error('Error creating winner announcement:', error);
                    }
                }
                
                await tournament.save();
            }
            
        } catch (error) {
            console.error('Error setting match victory:', error);
            await interaction.editReply({ 
                content: 'Une erreur est survenue lors de la résolution du match.', 
                ephemeral: true 
            });
        }
    }
};