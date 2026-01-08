const { 
    EmbedBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ActionRowBuilder, 
    Events
} = require('discord.js');
const TournamentSchema = require('../../Schemas/Tournament');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isModalSubmit()) return;
        
        // Handle score modal submission
        if (interaction.customId.startsWith('score_modal_')) {
            await handleScoreModalSubmit(interaction, client);
        }
    }
};

async function handleScoreModalSubmit(interaction, client) {
    try {
        // Parse customId
        const parts = interaction.customId.split('_');
        const tournamentId = parts[2];
        const matchId = parts[3];
        const reporterId = parts[4];
        
        // Validate tournament
        const tournament = await TournamentSchema.findById(tournamentId);
        if (!tournament) {
            return interaction.reply({ 
                content: 'Tournament not found. Please check with the tournament organizer.', 
                ephemeral: true 
            });
        }
        
        // Find the match
        const matchIndex = tournament.matches.findIndex(m => m.matchId === matchId);
        if (matchIndex === -1) {
            return interaction.reply({ 
                content: 'Match not found. Please check with the tournament organizer.', 
                ephemeral: true 
            });
        }
        
        const match = tournament.matches[matchIndex];
        
        // Verify match is in progress
        if (match.status !== 'in_progress') {
            return interaction.reply({ 
                content: `This match is not in progress. Current status: ${match.status}`, 
                ephemeral: true 
            });
        }
        
        // Get scores from modal
        const yourScore = parseInt(interaction.fields.getTextInputValue('your_score'));
        const opponentScore = parseInt(interaction.fields.getTextInputValue('opponent_score'));
        
        // Validate scores
        const maxScore = match.format === 'bo3' ? 2 : 3; // BO3 -> max 2, BO5 -> max 3
        
        if (isNaN(yourScore) || isNaN(opponentScore) || 
            yourScore < 0 || opponentScore < 0 || 
            yourScore > maxScore || opponentScore > maxScore) {
            return interaction.reply({ 
                content: `Invalid scores. Scores must be between 0 and ${maxScore}.`, 
                ephemeral: true 
            });
        }
        
        // Verify that one player has reached the required number of wins
        if (yourScore !== maxScore && opponentScore !== maxScore) {
            return interaction.reply({ 
                content: `For a ${match.format.toUpperCase()} match, one player must have ${maxScore} wins.`, 
                ephemeral: true 
            });
        }
        
        // Verify that the total number of games makes sense
        const totalGames = yourScore + opponentScore;
        const maxGames = match.format === 'bo3' ? 3 : 5;
        if (totalGames > maxGames) {
            return interaction.reply({ 
                content: `Invalid scores. The total number of games cannot exceed ${maxGames} for a ${match.format.toUpperCase()} match.`, 
                ephemeral: true 
            });
        }
        
        // Determine which player is reporting
        const isPlayer1 = match.player1 === reporterId;
        const opponentId = isPlayer1 ? match.player2 : match.player1;
        
        // Get player usernames
        let reporterUser, opponentUser;
        try {
            reporterUser = await client.users.fetch(reporterId);
            opponentUser = await client.users.fetch(opponentId);
        } catch (error) {
            console.error('Error fetching users:', error);
            return interaction.reply({ 
                content: 'An error occurred while processing the result. Please try again.', 
                ephemeral: true 
            });
        }
        
        // Determine winner based on scores
        let winnerId = null;
        if (yourScore > opponentScore) {
            winnerId = reporterId;
        } else if (opponentScore > yourScore) {
            winnerId = opponentId;
        } else {
            return interaction.reply({ 
                content: 'The scores are tied. There must be a winner in the match.', 
                ephemeral: true 
            });
        }
        
        // Create confirmation embed
        const confirmationEmbed = new EmbedBuilder()
            .setTitle(`Match Result Confirmation`)
            .setDescription(`Please confirm the match result.`)
            .setColor('#FF9900')
            .addFields(
                { name: 'Your Score', value: yourScore.toString(), inline: true },
                { name: `${opponentUser.username}'s Score`, value: opponentScore.toString(), inline: true },
                { name: 'Winner', value: winnerId === reporterId ? 'You' : opponentUser.username, inline: true },
                { name: 'Tournament', value: tournament.name, inline: false },
                { name: 'Match Format', value: match.format.toUpperCase(), inline: true },
                { name: 'Match', value: `Round ${match.round} - ${match.matchId}`, inline: true }
            )
            .setFooter({ text: 'This action is irreversible' });
        
        // Create confirmation buttons
        const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm_score_${tournament._id}_${match.matchId}_${reporterId}_${yourScore}_${opponentScore}_${winnerId}`)
            .setLabel('Confirm Result')
            .setStyle(ButtonStyle.Success);
        
        const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel_score_${tournament._id}_${match.matchId}`)
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);
        
        const disputeButton = new ButtonBuilder()
            .setCustomId(`dispute_match_${tournament._id}_${match.matchId}`)
            .setLabel('Dispute Match')
            .setStyle(ButtonStyle.Danger);
        
        const row = new ActionRowBuilder()
            .addComponents(confirmButton, cancelButton, disputeButton);
        
        await interaction.reply({ 
            embeds: [confirmationEmbed], 
            components: [row],
            ephemeral: true 
        });
    } catch (error) {
        console.error('Error handling score modal submit:', error);
        await interaction.reply({ 
            content: 'An error occurred while processing the match result. Please try again.', 
            ephemeral: true 
        });
    }
}