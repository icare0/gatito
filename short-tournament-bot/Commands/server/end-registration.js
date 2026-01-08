const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits
} = require("discord.js");
const TournamentSchema = require("../../Schemas/Tournament");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('endregistration')
        .setDescription('Fermer les inscriptions du tournoi')
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
                    content: 'Aucun tournoi en phase d\'inscription trouvé.', 
                    ephemeral: true 
                });
            }
            
            // Check permissions
            if (tournament.createdBy !== interaction.user.id && 
                !interaction.member.permissions.has(PermissionFlagsBits.ManageEvents)) {
                return interaction.editReply({ 
                    content: 'Vous n\'avez pas la permission de fermer les inscriptions.', 
                    ephemeral: true 
                });
            }
            
            // Check participants
            if (tournament.participants.length < 2) {
                return interaction.editReply({ 
                    content: 'Il faut au moins 2 participants pour fermer les inscriptions.', 
                    ephemeral: true 
                });
            }
            
            // Simplement fermer les inscriptions
            tournament.registrationClosed = true;
            
            // Générer le bracket s'il n'existe pas encore
            if (!tournament.matches || tournament.matches.length === 0) {
                console.log('Generating bracket...');
                tournament.generateBracket();
            }
            
            await tournament.save();
            console.log('Tournament saved after ending registration');
            
            const channel = interaction.guild.channels.cache.get(tournament.discordChannelId);
            if (channel) {
                const closedEmbed = new EmbedBuilder()
                    .setTitle(`📝 Inscriptions Fermées : ${tournament.name}`)
                    .setDescription(`Les inscriptions sont maintenant fermées avec ${tournament.participants.length} participants !`)
                    .setColor('#FF9900')
                    .addFields(
                        { name: 'Participants', value: tournament.participants.length.toString(), inline: true },
                        { name: 'Prochaine étape', value: 'Utilisez `/start` pour lancer le tournoi', inline: true }
                    )
                    .setFooter({ text: 'Vous pouvez encore utiliser /shuffle pour mélanger les joueurs.' })
                    .setTimestamp();
                
                await channel.send({ embeds: [closedEmbed] });
            }
            
            await interaction.editReply({ 
                content: `✅ Inscriptions fermées pour le tournoi "${tournament.name}" avec ${tournament.participants.length} participants. Utilisez \`/shuffle\` pour mélanger ou \`/start\` pour démarrer.`,
                ephemeral: true 
            });
            
        } catch (error) {
            console.error('Error ending registration:', error);
            await interaction.editReply({ 
                content: 'Une erreur est survenue lors de la fermeture des inscriptions.', 
                ephemeral: true 
            });
        }
    }
};