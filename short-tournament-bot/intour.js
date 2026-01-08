const mongoose = require('mongoose');
const TournamentSchema = require('./Schemas/Tournament');
require('dotenv').config();

// 🔥 REMPLACEZ CES VALEURS PAR VOS INFORMATIONS
const USER_ID = "486909422220607488"; // Remplacez par votre ID Discord
const USERNAME = "icare"; // Remplacez par votre username
const AVATAR_URL = "https://cdn.discordapp.com/avatars/486909422220607488/8c9b5ec844bd1ecad7b1a5f82482f50c"; // Votre avatar

async function populateTournamentWith200Participants() {
    try {
        console.log('🔗 Connexion à MongoDB...');
        await mongoose.connect(process.env.DATABASE);
        console.log('✅ Connecté à MongoDB');

        // Trouver un tournoi en inscription
        console.log('🔍 Recherche d\'un tournoi en inscription...');
        const tournament = await TournamentSchema.findOne({
            status: 'registration'
        });

        if (!tournament) {
            console.log('❌ Aucun tournoi en inscription trouvé');
            console.log('💡 Créez d\'abord un tournoi avec /tournament create');
            process.exit(1);
        }

        console.log(`🏆 Tournoi trouvé: "${tournament.name}"`);
        console.log(`📊 Participants actuels: ${tournament.participants.length}`);

        // Ajouter 200 participants fictifs
        console.log('🚀 Ajout de 200 participants...');
        
        for (let i = 1; i <= 200; i++) {
            const fakeUserId = `${USER_ID}_clone_${i.toString().padStart(3, '0')}`;
            const fakeUsername = `${USERNAME}_${i.toString().padStart(3, '0')}`;
            
            // Vérifier si ce participant existe déjà
            const isRegistered = tournament.participants.some(p => p.userId === fakeUserId);
            if (!isRegistered) {
                tournament.participants.push({
                    userId: fakeUserId,
                    pseudo: fakeUsername,
                    seed: tournament.participants.length + 1,
                    registeredAt: new Date(),
                    status: 'registered'
                });
                
                if (i % 50 === 0) {
                    console.log(`📈 Progression: ${i}/200 participants ajoutés`);
                }
            }
        }

        console.log('💾 Sauvegarde du tournoi...');
        await tournament.save();

        console.log('✅ TERMINÉ !');
        console.log(`🎉 Le tournoi "${tournament.name}" contient maintenant ${tournament.participants.length} participants`);
        
        // Générer le bracket automatiquement
        console.log('🔧 Génération du bracket...');
        tournament.generateBracket();
        await tournament.save();
        console.log('✅ Bracket généré !');

        // Afficher les statistiques
        const totalRounds = Math.ceil(Math.log2(tournament.participants.length));
        const firstRoundMatches = tournament.matches.filter(m => m.round === 1).length;
        
        console.log('\n📊 STATISTIQUES DU TOURNOI:');
        console.log(`├─ Participants: ${tournament.participants.length}`);
        console.log(`├─ Rounds totaux: ${totalRounds}`);
        console.log(`├─ Matchs du 1er round: ${firstRoundMatches}`);
        console.log(`└─ ID du tournoi: ${tournament._id}`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
        process.exit(0);
    }
}

// 🚀 LANCER LE SCRIPT
populateTournamentWith200Participants();