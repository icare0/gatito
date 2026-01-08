const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events } = require('discord.js');
const TournamentSchema = require('../../Schemas/Tournament');
const UserSchema = require('../../Schemas/User');

// Admin user ID - à configurer selon vos besoins
const ADMIN_USER_ID = '123456789012345678'; // Remplacez par l'ID Discord de l'admin

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        
        // Handle tournament registration button
        if (interaction.customId === 'register_tournament') {
            await handleTournamentRegistration(interaction, client);
        }
        
        // Handle match victory reporting
        if (interaction.customId.startsWith('match_victory')) {
            await handleMatchVictory(interaction, client);
        }
        
        // Handle match defeat reporting
        if (interaction.customId.startsWith('match_defeat')) {
            await handleMatchDefeat(interaction, client);
        }
    }
};

async function handleTournamentRegistration(interaction, client) {
    try {
        // Trouver le tournoi actif (en inscription et pas encore fermé)
        const tournament = await TournamentSchema.findOne({
            discordServerId: interaction.guild.id,
            status: 'registration',
            registrationClosed: { $ne: true }
        });
        
        if (!tournament) {
            return interaction.reply({ 
                content: 'Aucun tournoi en inscription trouvé.', 
                ephemeral: true 
            });
        }
        
        // Check if user is already registered
        const isRegistered = tournament.participants.some(p => p.userId === interaction.user.id);
        if (isRegistered) {
            return interaction.reply({ 
                content: 'Vous êtes déjà inscrit à ce tournoi.', 
                ephemeral: true 
            });
        }
        
        // Inscription directe sans acceptation des règles
        const added = tournament.addParticipant(interaction.user.id, interaction.user.username);
        
        if (!added) {
            return interaction.reply({ 
                content: 'Vous êtes déjà inscrit à ce tournoi.', 
                ephemeral: true 
            });
        }
        
        // Sauvegarder avec le bracket mis à jour
        await tournament.save();
        
        // Créer ou trouver le profil utilisateur automatiquement
        let userProfile = await UserSchema.findOne({ discordId: interaction.user.id });
        if (!userProfile) {
            userProfile = new UserSchema({
                discordId: interaction.user.id,
                username: interaction.user.username,
                avatar: interaction.user.displayAvatarURL({ dynamic: true })
            });
            await userProfile.save();
            console.log(`✅ Profil créé pour ${interaction.user.username}`);
        }
        
        // Réponse simple et éphémère
        await interaction.reply({ 
            content: `✅ Vous êtes maintenant inscrit au tournoi **${tournament.name}** ! (Seed #${tournament.participants.find(p => p.userId === interaction.user.id)?.seed || 'N/A'})`,
            ephemeral: true 
        });
        
    } catch (error) {
        console.error('Error handling tournament registration:', error);
        await interaction.reply({ 
            content: 'Une erreur est survenue lors de l\'inscription.', 
            ephemeral: true 
        });
    }
}

async function handleMatchVictory(interaction, client) {
    try {
        // Parse customId: match_victory_matchId_winnerId
        const parts = interaction.customId.split('_');
        if (parts.length < 4) {
            return interaction.reply({ 
                content: 'Format de bouton invalide.', 
                ephemeral: true 
            });
        }
        
        const matchId = parts[2];
        const winnerId = parts[3];
        const reporterId = interaction.user.id;
        
        // Trouver le tournoi actif
        const tournament = await TournamentSchema.findOne({
            discordServerId: interaction.guild.id,
            status: 'ongoing'
        });
        
        if (!tournament) {
            return interaction.reply({ 
                content: 'Aucun tournoi en cours trouvé.', 
                ephemeral: true 
            });
        }
        
        // Find the match
        const matchIndex = tournament.matches.findIndex(m => m.matchId === matchId);
        if (matchIndex === -1) {
            return interaction.reply({ 
                content: 'Match non trouvé.', 
                ephemeral: true 
            });
        }
        
        const match = tournament.matches[matchIndex];
        
        // Verify match is in progress
        if (match.status !== 'in_progress') {
            return interaction.reply({ 
                content: `Ce match n'est pas en cours. Statut actuel: ${match.status}`, 
                ephemeral: true 
            });
        }
        
        // Verify the user is a participant in the match
        const isParticipant = match.player1 === reporterId || match.player2 === reporterId;
        if (!isParticipant) {
            return interaction.reply({ 
                content: 'Vous ne participez pas à ce match.', 
                ephemeral: true 
            });
        }
        
        // Vérifier que le gagnant déclaré participe au match
        if (match.player1 !== winnerId && match.player2 !== winnerId) {
            return interaction.reply({ 
                content: 'Le joueur déclaré gagnant ne participe pas à ce match.', 
                ephemeral: true 
            });
        }
        
        const loserId = match.player1 === winnerId ? match.player2 : match.player1;
        
        // Get winner and loser user objects
        let winnerUser, loserUser, reporterUser;
        try {
            winnerUser = await client.users.fetch(winnerId);
            loserUser = await client.users.fetch(loserId);
            reporterUser = await client.users.fetch(reporterId);
        } catch (error) {
            console.error('Error fetching users:', error);
            return interaction.reply({ 
                content: 'Une erreur est survenue lors du traitement du résultat.', 
                ephemeral: true 
            });
        }
        
        // Stocker le rapport de résultat sur le match
        if (!match.resultReports) {
            match.resultReports = [];
        }
        
        // Vérifier si ce joueur a déjà fait un rapport
        const existingReportIndex = match.resultReports.findIndex(r => r.reporterId === reporterId);
        if (existingReportIndex !== -1) {
            // Mettre à jour le rapport existant
            match.resultReports[existingReportIndex] = {
                reporterId,
                claimedWinner: winnerId,
                timestamp: new Date()
            };
        } else {
            // Ajouter un nouveau rapport
            match.resultReports.push({
                reporterId,
                claimedWinner: winnerId,
                timestamp: new Date()
            });
        }
        
        await tournament.save();
        
        // Analyser la situation
        const reports = match.resultReports;
        if (reports.length === 1) {
            // Premier rapport - attendre confirmation de l'adversaire
            const confirmationEmbed = new EmbedBuilder()
                .setTitle(`⏳ En attente de confirmation`)
                .setDescription(`${reporterUser.username} a déclaré que **${winnerUser.username}** a gagné le match.`)
                .setColor('#FFA500')
                .addFields(
                    { name: 'Match', value: `Round ${match.round} - ${match.matchId}`, inline: true },
                    { name: 'En attente de', value: `<@${loserId}>`, inline: true }
                )
                .setFooter({ text: 'L\'adversaire doit confirmer le résultat' })
                .setTimestamp();
            
            // Créer les boutons de confirmation pour l'adversaire
            const confirmButton = new ButtonBuilder()
                .setCustomId(`match_defeat_${matchId}_${loserId}`)
                .setLabel('✅ Confirmer ma défaite')
                .setStyle(ButtonStyle.Success);
            
            const disputeButton = new ButtonBuilder()
                .setCustomId(`match_victory_${matchId}_${loserId}`)
                .setLabel('❌ Je conteste - J\'ai gagné')
                .setStyle(ButtonStyle.Danger);
            
            const row = new ActionRowBuilder()
                .addComponents(confirmButton, disputeButton);
            
            await interaction.update({ 
                content: `<@${loserId}> ${reporterUser.username} a déclaré que ${winnerUser.username} a gagné. Confirmez-vous ce résultat ?`,
                embeds: [confirmationEmbed],
                components: [row]
            });
            
        } else if (reports.length === 2) {
            // Les deux joueurs ont fait un rapport
            const report1 = reports[0];
            const report2 = reports[1];
            
            if (report1.claimedWinner === report2.claimedWinner) {
                // Les deux sont d'accord - finaliser le match
                await finalizeMatchResult(interaction, tournament, match, report1.claimedWinner, client);
                return;
            } else {
                // Conflit - les deux prétendent avoir gagné
                await handleMatchDispute(interaction, tournament, match, client);
                return;
            }
        }
        
    } catch (error) {
        console.error('Error handling match victory:', error);
        await interaction.reply({ 
            content: 'Une erreur est survenue lors du traitement du résultat.', 
            ephemeral: true 
        });
    }
}

async function handleMatchDefeat(interaction, client) {
    try {
        // Parse customId: match_defeat_matchId_loserId
        const parts = interaction.customId.split('_');
        if (parts.length < 4) {
            return interaction.reply({ 
                content: 'Format de bouton invalide.', 
                ephemeral: true 
            });
        }
        
        const matchId = parts[2];
        const loserId = parts[3];
        const confirmerId = interaction.user.id;
        
        // Vérifier que c'est bien le bon joueur qui confirme
        if (loserId !== confirmerId) {
            return interaction.reply({ 
                content: 'Vous ne pouvez pas confirmer ce résultat.', 
                ephemeral: true 
            });
        }
        
        // Trouver le tournoi actif
        const tournament = await TournamentSchema.findOne({
            discordServerId: interaction.guild.id,
            status: 'ongoing'
        });
        
        if (!tournament) {
            return interaction.reply({ 
                content: 'Aucun tournoi en cours trouvé.', 
                ephemeral: true 
            });
        }
        
        // Find the match
        const matchIndex = tournament.matches.findIndex(m => m.matchId === matchId);
        if (matchIndex === -1) {
            return interaction.reply({ 
                content: 'Match non trouvé.', 
                ephemeral: true 
            });
        }
        
        const match = tournament.matches[matchIndex];
        
        // Trouver le gagnant (l'autre joueur)
        const winnerId = match.player1 === loserId ? match.player2 : match.player1;
        
        // Finaliser le match avec le gagnant
        await finalizeMatchResult(interaction, tournament, match, winnerId, client);
        
    } catch (error) {
        console.error('Error handling match defeat:', error);
        await interaction.reply({ 
            content: 'Une erreur est survenue.', 
            ephemeral: true 
        });
    }
}

async function finalizeMatchResult(interaction, tournament, match, winnerId, client) {
    try {
        const loserId = match.player1 === winnerId ? match.player2 : match.player1;
        
        // Update match winner and status
        match.winner = winnerId;
        match.status = 'completed';
        match.completedAt = new Date();
        match.resultReports = []; // Clear reports
        
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
                    // Odd positions go to player1 of next match
                    nextMatch.player1 = winnerId;
                } else {
                    // Even positions go to player2 of next match
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
        
        await tournament.save();
        
        // Get winner and loser user objects
        let winnerUser, loserUser;
        try {
            winnerUser = await client.users.fetch(winnerId);
            loserUser = await client.users.fetch(loserId);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
        
        // Create result confirmation embed
        const resultEmbed = new EmbedBuilder()
            .setTitle(`✅ Match Terminé`)
            .setDescription(`Le match est terminé et le résultat a été enregistré.`)
            .setColor('#00FF00')
            .addFields(
                { name: '🏆 Gagnant', value: winnerUser ? winnerUser.username : 'Inconnu', inline: true },
                { name: '❌ Éliminé', value: loserUser ? loserUser.username : 'Inconnu', inline: true },
                { name: 'Match', value: `Round ${match.round} - ${match.matchId}`, inline: false }
            )
            .setFooter({ text: 'Bien joué aux deux joueurs !' })
            .setTimestamp();
        
        await interaction.update({ 
            content: `🏁 **Match terminé !** <@${winnerId}> a gagné et passe au round suivant !`,
            embeds: [resultEmbed], 
            components: []
        });
        
        // Archive the thread
        if (match.threadId && interaction.channel.isThread()) {
            try {
                await interaction.channel.setArchived(true);
            } catch (error) {
                console.error('Error archiving thread:', error);
            }
        }
        
        // Send notifications
        await sendMatchResultNotifications(tournament, match, winnerId, loserId, client);
        
        // Check if this was the final match
        const totalRounds = Math.ceil(Math.log2(tournament.participants.length));
        if (tournament.status === 'ongoing' && match.round === totalRounds) {
            // Tournament is complete
            tournament.status = 'completed';
            
            // Update winner participant status
            const winnerIndex = tournament.participants.findIndex(p => p.userId === winnerId);
            if (winnerIndex !== -1) {
                tournament.participants[winnerIndex].status = 'winner';
            }
            
            // Create winner announcement
            const channel = interaction.guild.channels.cache.get(tournament.discordChannelId);
            if (channel) {
                try {
                    const winnerEmbed = new EmbedBuilder()
                        .setTitle(`🏆 Champion du Tournoi : ${tournament.name}`)
                        .setDescription(`Félicitations à **<@${winnerId}>** pour avoir gagné le tournoi !`)
                        .setColor('#FFD700')
                        .addFields(
                            { name: 'Total Participants', value: tournament.participants.length.toString(), inline: true }
                        )
                        .setFooter({ text: 'Tournoi terminé' })
                        .setTimestamp();
                    
                    await channel.send({ 
                        content: `🎉 Félicitations <@${winnerId}> ! 🎉`,
                        embeds: [winnerEmbed]
                    });
                } catch (error) {
                    console.error('Error creating winner announcement:', error);
                }
            }
            
            await tournament.save();
        }
        
    } catch (error) {
        console.error('Error finalizing match result:', error);
        throw error;
    }
}

async function handleMatchDispute(interaction, tournament, match, client) {
    try {
        // Les deux joueurs prétendent avoir gagné - notifier l'admin
        match.status = 'disputed';
        await tournament.save();
        
        const player1User = await client.users.fetch(match.player1);
        const player2User = await client.users.fetch(match.player2);
        
        const conflictEmbed = new EmbedBuilder()
            .setTitle(`⚠️ LITIGE MATCH`)
            .setDescription(`Les deux joueurs prétendent avoir gagné ce match !`)
            .setColor('#FF0000')
            .addFields(
                { name: 'Match', value: `Round ${match.round} - ${match.matchId}`, inline: true },
                { name: 'Conflit', value: `${player1User.username} et ${player2User.username} prétendent tous les deux avoir gagné`, inline: false }
            )
            .setFooter({ text: 'Un administrateur doit résoudre ce conflit' })
            .setTimestamp();
        
        await interaction.update({ 
            content: `⚠️ **LITIGE !** Les deux joueurs prétendent avoir gagné. <@${ADMIN_USER_ID}> intervention nécessaire !`,
            embeds: [conflictEmbed], 
            components: []
        });
        
        // Send notification to admin
        try {
            const admin = await client.users.fetch(ADMIN_USER_ID);
            if (admin) {
                const adminEmbed = new EmbedBuilder()
                    .setTitle(`⚠️ Litige de Match - Intervention Requise`)
                    .setDescription(`Un conflit de résultat nécessite votre intervention.`)
                    .setColor('#FF0000')
                    .addFields(
                        { name: 'Tournoi', value: tournament.name, inline: false },
                        { name: 'Match', value: `Round ${match.round} - ${match.matchId}`, inline: false },
                        { name: 'Thread', value: `<#${match.threadId}>`, inline: false },
                        { name: 'Joueurs', value: `<@${match.player1}> et <@${match.player2}> prétendent tous les deux avoir gagné`, inline: false }
                    )
                    .setFooter({ text: 'Utilisez /tournament resolve pour résoudre ce conflit' })
                    .setTimestamp();
                
                await admin.send({ embeds: [adminEmbed] }).catch(() => {
                    console.log('Could not send DM to admin');
                });
            }
        } catch (error) {
            console.error('Error notifying admin:', error);
        }
        
    } catch (error) {
        console.error('Error handling match dispute:', error);
        throw error;
    }
}

async function sendMatchResultNotifications(tournament, match, winnerId, loserId, client) {
    try {
        // Get user profiles
        const winnerProfile = await UserSchema.findOne({ discordId: winnerId });
        const loserProfile = await UserSchema.findOne({ discordId: loserId });
        
        // Send winner notification
        if (winnerProfile && winnerProfile.preferences.notifications.results) {
            try {
                const winnerUser = await client.users.fetch(winnerId);
                const loserUser = await client.users.fetch(loserId);
                
                const winnerEmbed = new EmbedBuilder()
                    .setTitle('🏆 Victoire de Match !')
                    .setDescription(`Félicitations ! Vous avez gagné votre match dans le tournoi "${tournament.name}"`)
                    .setColor('#00FF00')
                    .addFields(
                        { name: 'Adversaire', value: loserUser.username, inline: true },
                        { name: 'Round', value: match.round.toString(), inline: true },
                        { name: 'Serveur', value: tournament.discordServerId, inline: true }
                    )
                    .setFooter({ text: 'Bonne chance pour la suite !' });
                
                await winnerUser.send({ embeds: [winnerEmbed] });
            } catch (error) {
                // Silently fail if DM can't be sent
            }
        }
        
        // Send loser notification
        if (loserProfile && loserProfile.preferences.notifications.results) {
            try {
                const winnerUser = await client.users.fetch(winnerId);
                const loserUser = await client.users.fetch(loserId);
                
                const loserEmbed = new EmbedBuilder()
                    .setTitle('📋 Résultat de Match')
                    .setDescription(`Votre match dans le tournoi "${tournament.name}" est terminé`)
                    .setColor('#FF6B6B')
                    .addFields(
                        { name: 'Adversaire', value: winnerUser.username, inline: true },
                        { name: 'Round', value: match.round.toString(), inline: true },
                        { name: 'Résultat', value: 'Défaite', inline: true }
                    )
                    .setFooter({ text: 'Merci d\'avoir participé !' });
                
                await loserUser.send({ embeds: [loserEmbed] });
            } catch (error) {
                // Silently fail if DM can't be sent
            }
        }
    } catch (error) {
        console.error('Error sending match result notifications:', error);
    }
}