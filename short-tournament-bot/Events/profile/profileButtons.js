const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const UserSchema = require('../../Schemas/User');
const TournamentSchema = require('../../Schemas/Tournament');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        
        // Handle preferences view
        if (interaction.customId.startsWith('view_preferences_')) {
            await handlePreferencesView(interaction, client);
        }
        
        // Handle preference update
        if (interaction.customId.startsWith('toggle_pref_')) {
            await handlePreferenceToggle(interaction, client);
        }
        
        // Handle back to profile
        if (interaction.customId.startsWith('back_to_profile_')) {
            await handleBackToProfile(interaction, client);
        }
    }
};

async function handlePreferencesView(interaction, client) {
    try {
        await interaction.deferUpdate();
        
        // Get user ID from button customId
        const userId = interaction.customId.replace('view_preferences_', '');
        
        // Ensure only the user can view their own preferences
        if (userId !== interaction.user.id) {
            return interaction.editReply({ 
                content: "Tu peux modifier seulement tes propres préférences.", 
                embeds: [],
                components: []
            });
        }
        
        // Find user profile
        const userProfile = await UserSchema.findOne({ discordId: userId });
        if (!userProfile) {
            return interaction.editReply({ 
                content: 'Profil utilisateur non trouvé.', 
                embeds: [],
                components: []
            });
        }
        
        // Create preferences embed
       const preferencesEmbed = new EmbedBuilder()
    .setTitle('Préférences de notification')
    .setDescription('Configure les notifications de tournoi (toutes envoyées en messages privés)')
    .setColor('#0099FF')
    .addFields(
        { 
            name: 'Notifications de tournoi', 
            value: 
            `Début du tournoi : ${userProfile.preferences.notifications.tournamentStart ? '✅' : '❌'}\n` +
            `Début de match : ${userProfile.preferences.notifications.matchStart ? '✅' : '❌'}\n` +
            `Rappel de match : ${userProfile.preferences.notifications.matchReminder ? '✅' : '❌'}\n` +
            `Résultats : ${userProfile.preferences.notifications.results ? '✅' : '❌'}\n` +
            `Annonces : ${userProfile.preferences.notifications.announcements ? '✅' : '❌'}`
        },
    )
    .setFooter({ text: 'Clique sur les boutons ci-dessous pour modifier tes paramètres' })
    .setTimestamp();

        
        // Create toggle buttons
        const toggleTournamentStartButton = new ButtonBuilder()
            .setCustomId(`toggle_pref_tournamentStart_${userId}`)
            .setLabel('Début de tournoi')
            .setStyle(userProfile.preferences.notifications.tournamentStart ? ButtonStyle.Success : ButtonStyle.Danger);
        
        const toggleMatchStartButton = new ButtonBuilder()
            .setCustomId(`toggle_pref_matchStart_${userId}`)
            .setLabel('Début de match')
            .setStyle(userProfile.preferences.notifications.matchStart ? ButtonStyle.Success : ButtonStyle.Danger);
        
        const toggleMatchReminderButton = new ButtonBuilder()
            .setCustomId(`toggle_pref_matchReminder_${userId}`)
            .setLabel('Rappel de match')
            .setStyle(userProfile.preferences.notifications.matchReminder ? ButtonStyle.Success : ButtonStyle.Danger);
        
        const toggleResultsButton = new ButtonBuilder()
            .setCustomId(`toggle_pref_results_${userId}`)
            .setLabel('Résultats')
            .setStyle(userProfile.preferences.notifications.results ? ButtonStyle.Success : ButtonStyle.Danger);
        
        const row1 = new ActionRowBuilder()
            .addComponents(
                toggleTournamentStartButton, 
                toggleMatchStartButton, 
                toggleMatchReminderButton, 
                toggleResultsButton
            );
        
        const toggleAnnouncementsButton = new ButtonBuilder()
            .setCustomId(`toggle_pref_announcements_${userId}`)
            .setLabel('Annonces')
            .setStyle(userProfile.preferences.notifications.announcements ? ButtonStyle.Success : ButtonStyle.Danger);
        
        const backButton = new ButtonBuilder()
            .setCustomId(`back_to_profile_${userId}`)
            .setLabel('Retour au profil')
            .setStyle(ButtonStyle.Secondary);
        
        const row2 = new ActionRowBuilder()
            .addComponents(toggleAnnouncementsButton, backButton);
        
        await interaction.editReply({
            embeds: [preferencesEmbed],
            components: [row1, row2]
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'affichage des préférences:', error);
        await interaction.editReply({ 
            content: 'Une erreur est survenue lors de la récupération des préférences. Veuillez réessayer.', 
            embeds: [],
            components: []
        });
    }
}

async function handlePreferenceToggle(interaction, client) {
    try {
        await interaction.deferUpdate();
        
        // Parse customId
        const parts = interaction.customId.split('_');
        const prefName = parts[2];
        const userId = parts[3];
        
        // Ensure only the user can change their own preferences
        if (userId !== interaction.user.id) {
            return interaction.editReply({ 
                content: "Tu peux seulement modifier tes propres préférences.", 
                embeds: [],
                components: []
            });
        }
        
        // Find user profile
        const userProfile = await UserSchema.findOne({ discordId: userId });
        if (!userProfile) {
            return interaction.editReply({ 
                content: 'Profil utilisateur non trouvé.', 
                embeds: [],
                components: []
            });
        }
        
        // Toggle the preference
        userProfile.preferences.notifications[prefName] = !userProfile.preferences.notifications[prefName];
        await userProfile.save();
        
        // Recreate the preferences embed with updated values
        const preferencesEmbed = new EmbedBuilder()
           .setTitle('Préférences de notification')
.setDescription('Configure les notifications de tournoi (toutes envoyées en messages privés)')
.setColor('#0099FF')
.addFields(
    { 
        name: 'Notifications de tournoi', 
        value: 
        `Début du tournoi : ${userProfile.preferences.notifications.tournamentStart ? '✅' : '❌'}\n` +
        `Début de match : ${userProfile.preferences.notifications.matchStart ? '✅' : '❌'}\n` +
        `Rappel de match : ${userProfile.preferences.notifications.matchReminder ? '✅' : '❌'}\n` +
        `Résultats : ${userProfile.preferences.notifications.results ? '✅' : '❌'}\n` +
        `Annonces : ${userProfile.preferences.notifications.announcements ? '✅' : '❌'}`
    }
)

            .setFooter({ text: `${capitalizeFirstLetter(prefName)} ${userProfile.preferences.notifications[prefName] ? 'activé' : 'désactivé'}` })
            .setTimestamp();
        
        // Recreate toggle buttons with updated states
        const toggleTournamentStartButton = new ButtonBuilder()
            .setCustomId(`toggle_pref_tournamentStart_${userId}`)
            .setLabel('Début de tournoi')
            .setStyle(userProfile.preferences.notifications.tournamentStart ? ButtonStyle.Success : ButtonStyle.Danger);
        
        const toggleMatchStartButton = new ButtonBuilder()
            .setCustomId(`toggle_pref_matchStart_${userId}`)
            .setLabel('Début de match')
            .setStyle(userProfile.preferences.notifications.matchStart ? ButtonStyle.Success : ButtonStyle.Danger);
        
        const toggleMatchReminderButton = new ButtonBuilder()
            .setCustomId(`toggle_pref_matchReminder_${userId}`)
            .setLabel('Rappel de match')
            .setStyle(userProfile.preferences.notifications.matchReminder ? ButtonStyle.Success : ButtonStyle.Danger);
        
        const toggleResultsButton = new ButtonBuilder()
            .setCustomId(`toggle_pref_results_${userId}`)
            .setLabel('Résultats')
            .setStyle(userProfile.preferences.notifications.results ? ButtonStyle.Success : ButtonStyle.Danger);
        
        const row1 = new ActionRowBuilder()
            .addComponents(
                toggleTournamentStartButton, 
                toggleMatchStartButton, 
                toggleMatchReminderButton, 
                toggleResultsButton
            );
        
        const toggleAnnouncementsButton = new ButtonBuilder()
            .setCustomId(`toggle_pref_announcements_${userId}`)
            .setLabel('Annonces')
            .setStyle(userProfile.preferences.notifications.announcements ? ButtonStyle.Success : ButtonStyle.Danger);
        
        const backButton = new ButtonBuilder()
            .setCustomId(`back_to_profile_${userId}`)
            .setLabel('Retour au profil')
            .setStyle(ButtonStyle.Secondary);
        
        const row2 = new ActionRowBuilder()
            .addComponents(toggleAnnouncementsButton, backButton);
        
        await interaction.editReply({
            embeds: [preferencesEmbed],
            components: [row1, row2]
        });
        
    } catch (error) {
        console.error('Erreur lors de la modification des préférences:', error);
        await interaction.editReply({ 
            content: 'Une erreur est survenue lors de la mise à jour des préférences. Veuillez réessayer.', 
            embeds: [],
            components: []
        });
    }
}

async function handleBackToProfile(interaction, client) {
    try {
        await interaction.deferUpdate();
        
        // Get user ID from button customId
        const userId = interaction.customId.replace('back_to_profile_', '');
        
        // Find user profile
        const userProfile = await UserSchema.findOne({ discordId: userId });
        if (!userProfile) {
            return interaction.editReply({ 
                content: 'Profil utilisateur non trouvé.', 
                embeds: [],
                components: []
            });
        }
        
        // Get target user
        const targetUser = await client.users.fetch(userId);
        
        // Create profile embed
        const profileEmbed = new EmbedBuilder()
            .setTitle(`${targetUser.username} - Profil Tournoi`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setColor('#0099FF')
            .setDescription('Les informations du match ou du tournoi seront affichées ici')
            .setFooter({ text: 'Profil tournoi' })
            .setTimestamp();

        // Récupérer le tournoi en cours depuis la base de données
        const currentTournament = await TournamentSchema.findOne({ 
            discordServerId: interaction.guild.id,
            status: { $in: ['registration', 'ongoing'] }
        });

        // Ajouter les informations du match actuel si dans un tournoi
        if (currentTournament) {
            // Vérifier si l'utilisateur participe au tournoi
            const participant = currentTournament.participants.find(p => p.userId === targetUser.id);
            
            if (participant) {
                // Chercher un match en cours pour cet utilisateur
                const userMatches = currentTournament.matches.filter(m => 
                    (m.player1 === targetUser.id || m.player2 === targetUser.id) && 
                    (m.status === 'in_progress' || m.status === 'pending')
                );
                
                if (userMatches.length > 0) {
                    const currentMatch = userMatches[0];
                    const isPlayer1 = currentMatch.player1 === targetUser.id;
                    const opponentId = isPlayer1 ? currentMatch.player2 : currentMatch.player1;
                    
                    let opponentName = 'Adversaire inconnu';
                    if (opponentId) {
                        try {
                            const opponent = await client.users.fetch(opponentId);
                            opponentName = opponent.username;
                        } catch (error) {
                            opponentName = 'Adversaire inconnu';
                        }
                    }
                    
                    let currentMatchInfo = `**🏆 Tournoi :** ${currentTournament.name}\n`;
                    currentMatchInfo += `**🎮 Round :** ${currentMatch.round}\n`;
                    currentMatchInfo += `**⚔️ Adversaire :** ${opponentName}\n`;
                    currentMatchInfo += `**📋 Statut :** ${getMatchStatusFR(currentMatch.status)}`;
                    
                    // Ajouter le mot de passe si l'utilisateur consulte son propre profil et le match est en cours
                    if (targetUser.id === interaction.user.id && 
                        currentMatch.status === 'in_progress' && 
                        currentMatch.password) {
                        currentMatchInfo += `\n**🔑 Mot de passe :** \`${currentMatch.password}\``;
                    }
                    
                    // Ajouter le lien du thread si disponible
                    if (currentMatch.threadId) {
                        currentMatchInfo += `\n**💬 Thread :** <#${currentMatch.threadId}>`;
                    }
                    
                    profileEmbed.addFields({
                        name: "🎮 Match en cours",
                        value: currentMatchInfo,
                        inline: false
                    });
                    
                } else {
                    // Utilisateur dans le tournoi mais pas de match actuel
                    if (participant.status === 'registered') {
                        let tournamentInfo = `**🏆 Tournoi :** ${currentTournament.name}\n`;
                        tournamentInfo += `**📋 Statut :** En attente du prochain match\n`;
                        tournamentInfo += `**🎯 Position :** Seed #${participant.seed || 'Non définie'}\n`;
                        
                        if (currentTournament.status === 'registration') {
                            tournamentInfo += `**⏳ Phase :** Inscriptions ${currentTournament.registrationClosed ? 'fermées' : 'ouvertes'}`;
                        } else {
                            const currentRound = currentTournament.getCurrentRound();
                            tournamentInfo += `**🎮 Round actuel :** ${currentRound}`;
                        }
                        
                        profileEmbed.addFields({
                            name: "🏆 Tournoi en cours",
                            value: tournamentInfo,
                            inline: false
                        });
                    } else if (participant.status === 'eliminated') {
                        profileEmbed.addFields({
                            name: "❌ Éliminé du tournoi",
                            value: `**🏆 Tournoi :** ${currentTournament.name}\n**📋 Statut :** Éliminé`,
                            inline: false
                        });
                    } else if (participant.status === 'winner') {
                        profileEmbed.addFields({
                            name: "🏆 CHAMPION !",
                            value: `**🏆 Tournoi :** ${currentTournament.name}\n**📋 Statut :** CHAMPION DU TOURNOI !`,
                            inline: false
                        });
                    }
                }
            } else {
                // Tournoi existe mais utilisateur pas inscrit
                profileEmbed.addFields({
                    name: "🏆 Tournoi disponible",
                    value: `**Nom :** ${currentTournament.name}\n**Statut :** Non inscrit\n**Participants :** ${currentTournament.participants.length}`,
                    inline: false
                });
            }
        } else {
            profileEmbed.addFields({
                name: "🏆 Tournoi",
                value: "Aucun tournoi en cours",
                inline: false
            });
        }
        
        // Créer seulement le bouton des préférences si c'est son propre profil
        let components = [];
        if (targetUser.id === interaction.user.id) {
            const preferencesButton = new ButtonBuilder()
                .setCustomId(`view_preferences_${targetUser.id}`)
                .setLabel('⚙️ Préférences de notification')
                .setStyle(ButtonStyle.Primary);
            
            const row = new ActionRowBuilder()
                .addComponents(preferencesButton);
            
            components = [row];
        }
        
        await interaction.editReply({
            embeds: [profileEmbed],
            components: components
        });
        
    } catch (error) {
        console.error('Erreur lors du retour au profil:', error);
        await interaction.editReply({ 
            content: 'Une erreur est survenue lors de la récupération du profil. Veuillez réessayer.', 
            embeds: [],
            components: []
        });
    }
}

// Fonction d'aide pour obtenir le statut du match en français
function getMatchStatusFR(status) {
    switch (status) {
        case 'pending': return '⏳ En attente';
        case 'in_progress': return '🎮 En cours';
        case 'completed': return '✅ Terminé';
        case 'disputed': return '⚠️ En litige';
        case 'cancelled': return '❌ Annulé';
        default: return '❓ Inconnu';
    }
}

// Fonction d'aide pour capitaliser la première lettre
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}