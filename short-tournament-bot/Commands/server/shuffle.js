const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits
} = require("discord.js");
const TournamentSchema = require("../../Schemas/Tournament");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Mélanger l\'ordre des joueurs pour le tournoi')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),
    
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            // Récupérer le tournoi en inscription
            const tournament = await TournamentSchema.findOne({
                discordServerId: interaction.guild.id,
                status: 'registration'
            });
            
            if (!tournament) {
                return interaction.editReply({ 
                    content: 'Aucun tournoi en inscription trouvé.', 
                    ephemeral: true 
                });
            }
            
            // Check permissions
            if (tournament.createdBy !== interaction.user.id && 
                !interaction.member.permissions.has(PermissionFlagsBits.ManageEvents)) {
                return interaction.editReply({ 
                    content: 'Vous n\'avez pas la permission de mélanger ce tournoi.', 
                    ephemeral: true 
                });
            }
            
            // Check participants
            if (tournament.participants.length < 2) {
                return interaction.editReply({ 
                    content: 'Il faut au moins 2 participants pour mélanger.', 
                    ephemeral: true 
                });
            }
            
            // Mélanger les participants (Fisher-Yates shuffle)
            const participants = [...tournament.participants];
            
            for (let i = participants.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [participants[i], participants[j]] = [participants[j], participants[i]];
            }
            
            // Réassigner les seeds
            for (let i = 0; i < participants.length; i++) {
                participants[i].seed = i + 1;
            }
            
            tournament.participants = participants;
            tournament.shuffled = true;
            
            // Incrémenter le compteur de shuffle
            if (!tournament.shuffleCount) {
                tournament.shuffleCount = 1;
            } else {
                tournament.shuffleCount += 1;
            }
            
            // Regénérer le bracket avec le nouvel ordre
            tournament.generateBracket();
            
            await tournament.save();
            console.log(`Tournament shuffled (${tournament.shuffleCount} times)`);
            
            // Create embed showing the new order
            const shuffleEmbed = new EmbedBuilder()
                .setTitle(`🔀 Joueurs Mélangés : ${tournament.name}`)
                .setDescription(`Mélange #${tournament.shuffleCount} - Voici le nouvel ordre des joueurs :`)
                .setColor('#9932CC')
                .setFooter({ text: `Mélangé par ${interaction.user.username}` })
                .setTimestamp();
            
            // Créer la liste des participants avec leurs nouvelles seeds
            let participantsList = '';
            for (const participant of participants) {
                try {
                    const user = await client.users.fetch(participant.userId);
                    participantsList += `**${participant.seed}.** ${user.username}\n`;
                } catch (error) {
                    participantsList += `**${participant.seed}.** ${participant.pseudo}\n`;
                }
            }
            
            // Diviser en plusieurs champs si trop long
            if (participantsList.length > 1024) {
                const halfPoint = Math.ceil(participants.length / 2);
                const firstHalf = participants.slice(0, halfPoint);
                const secondHalf = participants.slice(halfPoint);
                
                let firstHalfText = '';
                let secondHalfText = '';
                
                for (const participant of firstHalf) {
                    try {
                        const user = await client.users.fetch(participant.userId);
                        firstHalfText += `**${participant.seed}.** ${user.username}\n`;
                    } catch (error) {
                        firstHalfText += `**${participant.seed}.** ${participant.pseudo}\n`;
                    }
                }
                
                for (const participant of secondHalf) {
                    try {
                        const user = await client.users.fetch(participant.userId);
                        secondHalfText += `**${participant.seed}.** ${user.username}\n`;
                    } catch (error) {
                        secondHalfText += `**${participant.seed}.** ${participant.pseudo}\n`;
                    }
                }
                
                shuffleEmbed.addFields(
                    { name: `Seeds 1-${halfPoint}`, value: firstHalfText, inline: true },
                    { name: `Seeds ${halfPoint + 1}-${participants.length}`, value: secondHalfText, inline: true }
                );
            } else {
                shuffleEmbed.addFields(
                    { name: 'Nouvel Ordre des Seeds', value: participantsList, inline: false }
                );
            }
            
            // Send to tournament channel
            const channel = interaction.guild.channels.cache.get(tournament.discordChannelId);
            if (channel) {
                await channel.send({ embeds: [shuffleEmbed] });
            }
            
            await interaction.editReply({ 
                content: `✅ Joueurs mélangés avec succès (Mélange #${tournament.shuffleCount}) ! Le bracket a été régénéré. Utilisez \`/start\` pour démarrer le tournoi.`,
                ephemeral: true 
            });
            
        } catch (error) {
            console.error('Error shuffling tournament:', error);
            await interaction.editReply({ 
                content: 'Une erreur est survenue lors du mélange.', 
                ephemeral: true 
            });
        }
    }
};