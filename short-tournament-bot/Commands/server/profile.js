const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const UserSchema = require("../../Schemas/User");
const TournamentSchema = require("../../Schemas/Tournament");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription("Voir tes informations sur le tournoi")
        .addUserOption(option => 
            option.setName('user')
                .setDescription("Voir le profil d'un autre utilisateur (par défaut le tien)")
                .setRequired(false)),
    
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            // Obtenir l'utilisateur cible (soi-même ou spécifié)
            const targetUser = interaction.options.getUser('user') || interaction.user;
            
            // Trouver ou créer le profil utilisateur
            let userProfile = await UserSchema.findOne({ discordId: targetUser.id });
            
            if (!userProfile) {
                userProfile = new UserSchema({
                    discordId: targetUser.id,
                    username: targetUser.username,
                    avatar: targetUser.displayAvatarURL({ dynamic: true })
                });
                
                await userProfile.save();
            }
            
            // Vérifier si le profil a besoin d'une mise à jour du nom d'utilisateur
            if (userProfile.username !== targetUser.username) {
                userProfile.username = targetUser.username;
                await userProfile.save();
            }
            
            // Créer l'embed du profil
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
            console.error('Erreur dans la commande profil:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({ 
                    content: 'Une erreur est survenue lors de la récupération du profil.', 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: 'Une erreur est survenue lors de la récupération du profil.', 
                    ephemeral: true 
                });
            }
        }
    }
};

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
