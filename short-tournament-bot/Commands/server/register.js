const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require("discord.js");
const TournamentSchema = require("../../Schemas/Tournament");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription("S'enregistrer au tournoi"),
    
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            // Trouver le tournoi en inscription (et pas encore fermé)
            const tournament = await TournamentSchema.findOne({ 
                discordServerId: interaction.guild.id,
                status: 'registration',
                registrationClosed: { $ne: true }
            });
            
            // Vérifier si un tournoi existe et si les inscriptions sont ouvertes
            if (!tournament) {
                return interaction.editReply({ 
                    content: 'Aucun tournoi avec inscriptions ouvertes n\'est actuellement disponible.', 
                    ephemeral: true 
                });
            }
            
            // Vérifier si l'utilisateur est déjà inscrit
            const isRegistered = tournament.participants.some(p => p.userId === interaction.user.id);
            if (isRegistered) {
                return interaction.editReply({ 
                    content: 'Vous êtes déjà inscrit à ce tournoi.', 
                    ephemeral: true 
                });
            }
            
            // Afficher les règles et la confirmation
            const rulesEmbed = new EmbedBuilder()
                .setTitle(`Règles du tournoi : ${tournament.name}`)
                .setDescription(tournament.rules)
                .setColor('#0099FF')
                .setFooter({ text: 'Veuillez lire attentivement les règles avant d\'accepter' });
            
            const acceptButton = new ButtonBuilder()
                .setCustomId(`accept_rules`)
                .setLabel('Accepter les règles et s\'inscrire')
                .setStyle(ButtonStyle.Success);
            
            const declineButton = new ButtonBuilder()
                .setCustomId(`decline_rules`)
                .setLabel('Refuser')
                .setStyle(ButtonStyle.Danger);
            
            const row = new ActionRowBuilder()
                .addComponents(acceptButton, declineButton);
            
            await interaction.editReply({ 
                embeds: [rulesEmbed], 
                components: [row],
                ephemeral: true 
            });
            
        } catch (error) {
            console.error('Erreur lors de l\'inscription au tournoi:', error);
            await interaction.editReply({ 
                content: 'Une erreur est survenue lors de l\'inscription au tournoi. Veuillez réessayer.', 
                ephemeral: true 
            });
        }
    }
};