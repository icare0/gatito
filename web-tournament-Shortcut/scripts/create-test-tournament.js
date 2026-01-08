// scripts/step-by-step-tournament.js
const { MongoClient } = require('mongodb');

// Connexion directe
const MONGODB_URI = 'mongodb+srv://icare:Test123@cluster.94j4e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster';
const MONGODB_DB = 'test';

async function createTournamentStepByStep() {
  console.log('🔄 Création d\'un tournoi étape par étape');
  
  // ===== ÉTAPE 1: CONNEXION =====
  console.log('\n==== ÉTAPE 1: CONNEXION À LA BASE DE DONNÉES ====');
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connexion établie avec MongoDB');
    
    const db = client.db(MONGODB_DB);
    console.log(`✅ Base de données "${MONGODB_DB}" sélectionnée`);
    
    // ===== ÉTAPE 2: PRÉPARATION DES DONNÉES =====
    console.log('\n==== ÉTAPE 2: PRÉPARATION DES DONNÉES DU TOURNOI ====');
    const tournamentId = new Date().getTime().toString();
    console.log(`ID du tournoi: ${tournamentId}`);
    
    const now = new Date();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const endRegistration = new Date(today);
    endRegistration.setHours(today.getHours() + 12);
    
    const endTournament = new Date(today);
    endTournament.setDate(today.getDate() + 3);
    
    console.log(`Date de début: ${tomorrow.toISOString()}`);
    console.log(`Fin des inscriptions: ${endRegistration.toISOString()}`);
    console.log(`Date de fin: ${endTournament.toISOString()}`);
    
    // ===== ÉTAPE 3: CRÉATION DES UTILISATEURS DE TEST =====
    console.log('\n==== ÉTAPE 3: CRÉATION/VÉRIFICATION DES UTILISATEURS DE TEST ====');
    const testUsers = [
      { iduser: 'test-user-1', pseudo: 'Pikachu_Test', elo: 1500, rank: 'gold' },
      { iduser: 'test-user-2', pseudo: 'Charizard_Test', elo: 1700, rank: 'platinum' },
      { iduser: 'test-user-3', pseudo: 'Bulbasaur_Test', elo: 1200, rank: 'silver' },
      { iduser: 'test-user-4', pseudo: 'Squirtle_Test', elo: 1000, rank: 'bronze' }
    ];
    
    const usersCollection = db.collection('users');
    
    for (const user of testUsers) {
      try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await usersCollection.findOne({ iduser: user.iduser });
        
        if (existingUser) {
          console.log(`✅ L'utilisateur ${user.pseudo} existe déjà, pas besoin de le créer`);
        } else {
          // Compléter les données de l'utilisateur
          const fullUser = {
            ...user,
            avatar: '/images/default-avatar.png',
            victories: Math.floor(Math.random() * 20),
            totalMatches: Math.floor(Math.random() * 40) + 20,
            winRate: Math.random() * 100,
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Insérer l'utilisateur
          const result = await usersCollection.insertOne(fullUser);
          if (result.acknowledged) {
            console.log(`✅ Utilisateur ${user.pseudo} créé avec succès`);
          } else {
            console.log(`⚠️ Problème lors de la création de l'utilisateur ${user.pseudo}`);
          }
        }
      } catch (userError) {
        console.log(`❌ Erreur lors de la gestion de l'utilisateur ${user.pseudo}: ${userError.message}`);
      }
    }
    
    // ===== ÉTAPE 4: CRÉATION DU TOURNOI DE BASE =====
    console.log('\n==== ÉTAPE 4: CRÉATION DU TOURNOI DE BASE ====');
    
    const tournament = {
      _id: tournamentId,
      name: "Tournoi Étape par Étape",
      description: "Un tournoi créé pas à pas pour tester la génération",
      banner: "/images/tournament-default-banner.jpg",
      startDate: tomorrow,
      endDate: endTournament,
      registrationEndDate: endRegistration,
      status: 'registration',
      participants: [],
      matches: [],
      format: 'single_elimination',
      rules: "<h2>Règles du tournoi</h2><p>Ce tournoi est créé à des fins de test.</p>",
      roundFormats: [
        { round: 1, format: 'bo1' },
        { round: 2, format: 'bo3' }
      ],
      prizes: [
        { place: 1, description: "Vainqueur du tournoi" },
        { place: 2, description: "Finaliste" }
      ],
      createdAt: now,
      updatedAt: now
    };
    
    try {
      const tournamentCollection = db.collection('tournaments');
      const result = await tournamentCollection.insertOne(tournament);
      
      if (result.acknowledged) {
        console.log(`✅ Tournoi de base créé avec succès! ID: ${tournamentId}`);
      } else {
        console.log(`❌ Échec de la création du tournoi de base`);
        return;
      }
    } catch (tournamentError) {
      console.log(`❌ Erreur lors de la création du tournoi de base: ${tournamentError.message}`);
      return;
    }
    
    // ===== ÉTAPE 5: AJOUT DES PARTICIPANTS =====
    console.log('\n==== ÉTAPE 5: AJOUT DES PARTICIPANTS ====');
    
    const participants = testUsers.map((user, index) => ({
      userId: user.iduser,
      seed: index + 1,
      registeredAt: now,
      status: 'registered'
    }));
    
    try {
      const updateResult = await db.collection('tournaments').updateOne(
        { _id: tournamentId },
        { 
          $set: { 
            participants,
            updatedAt: now
          }
        }
      );
      
      if (updateResult.modifiedCount === 1) {
        console.log(`✅ ${participants.length} participants ajoutés au tournoi`);
      } else {
        console.log(`⚠️ Problème lors de l'ajout des participants. ModifiedCount: ${updateResult.modifiedCount}`);
        
        // Vérification supplémentaire
        const tournamentCheck = await db.collection('tournaments').findOne({ _id: tournamentId });
        if (tournamentCheck && tournamentCheck.participants.length === participants.length) {
          console.log(`✅ Vérification: Les participants sont bien présents dans le tournoi`);
        }
      }
    } catch (participantsError) {
      console.log(`❌ Erreur lors de l'ajout des participants: ${participantsError.message}`);
    }
    
    // ===== ÉTAPE 6: GÉNÉRATION DES MATCHES =====
    console.log('\n==== ÉTAPE 6: GÉNÉRATION DES MATCHES ====');
    
    try {
      // Calcul du nombre de rounds nécessaires
      const numParticipants = participants.length;
      const numRounds = Math.ceil(Math.log2(numParticipants));
      console.log(`Nombre de participants: ${numParticipants}, Nombre de rounds: ${numRounds}`);
      
      // Création des matches
      let matches = [];
      
      // Création du match final
      const finalMatch = {
        matchId: `match-final-${tournamentId}`,
        round: numRounds,
        position: 1,
        player1: null,
        player2: null,
        scores: { player1: 0, player2: 0 },
        status: 'pending',
        tournamentId,
        format: 'bo3'
      };
      
      matches.push(finalMatch);
      console.log(`✓ Match final créé`);
      
      // Si nous avons plus d'un round, nous devons créer des matches préliminaires
      if (numRounds > 1) {
        console.log(`Création des matches préliminaires...`);
        
        // Création des matches du premier tour
        const firstRoundMatches = [];
        
        // Nombre de matches au premier tour (avec possibles byes)
        const matchesNeeded = Math.pow(2, Math.ceil(Math.log2(numParticipants)) - 1);
        const byes = matchesNeeded * 2 - numParticipants;
        
        console.log(`Matches nécessaires au premier tour: ${matchesNeeded}, Byes: ${byes}`);
        
        // Créer les matches du premier tour
        for (let i = 0; i < Math.ceil(numParticipants / 2); i++) {
          const match = {
            matchId: `match-r1-p${i+1}-${tournamentId}`,
            round: 1,
            position: i + 1,
            player1: i * 2 < numParticipants ? participants[i * 2].userId : null,
            player2: i * 2 + 1 < numParticipants ? participants[i * 2 + 1].userId : null,
            scores: { player1: 0, player2: 0 },
            status: 'pending',
            tournamentId,
            format: 'bo1',
            nextMatchId: numRounds > 1 ? `match-r2-p${Math.ceil((i+1)/2)}-${tournamentId}` : `match-final-${tournamentId}`
          };
          
          // Si c'est un bye, marquer comme complété
          if (match.player2 === null && match.player1 !== null) {
            match.status = 'completed';
            match.winner = match.player1;
            match.completedAt = now;
          }
          
          firstRoundMatches.push(match);
        }
        
        matches = [...matches, ...firstRoundMatches];
        console.log(`✓ ${firstRoundMatches.length} matches de premier tour créés`);
        
        // Si nous avons plus de 2 rounds, nous devons créer des rounds intermédiaires
        if (numRounds > 2) {
          console.log(`Création des rounds intermédiaires...`);
          
          for (let round = 2; round < numRounds; round++) {
            const matchesInRound = Math.pow(2, numRounds - round);
            const roundMatches = [];
            
            for (let position = 1; position <= matchesInRound; position++) {
              const match = {
                matchId: `match-r${round}-p${position}-${tournamentId}`,
                round,
                position,
                player1: null,
                player2: null,
                scores: { player1: 0, player2: 0 },
                status: 'pending',
                tournamentId,
                format: round === numRounds - 1 ? 'bo3' : 'bo1',
                nextMatchId: round === numRounds - 1 ? 
                  `match-final-${tournamentId}` : 
                  `match-r${round+1}-p${Math.ceil(position/2)}-${tournamentId}`
              };
              
              roundMatches.push(match);
            }
            
            matches = [...matches, ...roundMatches];
            console.log(`✓ ${roundMatches.length} matches de round ${round} créés`);
          }
        }
      }
      
      // Mettre à jour le tournoi avec les matches
      const updateResult = await db.collection('tournaments').updateOne(
        { _id: tournamentId },
        { 
          $set: { 
            matches,
            updatedAt: now
          }
        }
      );
      
      if (updateResult.modifiedCount === 1) {
        console.log(`✅ ${matches.length} matches ajoutés au tournoi`);
      } else {
        console.log(`⚠️ Problème lors de l'ajout des matches. ModifiedCount: ${updateResult.modifiedCount}`);
        
        // Vérification supplémentaire
        const tournamentCheck = await db.collection('tournaments').findOne({ _id: tournamentId });
        if (tournamentCheck && tournamentCheck.matches.length === matches.length) {
          console.log(`✅ Vérification: Les matches sont bien présents dans le tournoi`);
        }
      }
    } catch (matchesError) {
      console.log(`❌ Erreur lors de la génération des matches: ${matchesError.message}`);
    }
    
    // ===== ÉTAPE 7: VÉRIFICATION FINALE =====
    console.log('\n==== ÉTAPE 7: VÉRIFICATION FINALE ====');
    
    try {
      const finalTournament = await db.collection('tournaments').findOne({ _id: tournamentId });
      
      if (finalTournament) {
        console.log(`Nom du tournoi: ${finalTournament.name}`);
        console.log(`Nombre de participants: ${finalTournament.participants.length}`);
        console.log(`Nombre de matches: ${finalTournament.matches.length}`);
        console.log(`Status: ${finalTournament.status}`);
        console.log(`✅ Tournoi créé et vérifié avec succès`);
        console.log(`🔗 Accessible à /tournaments/${tournamentId}`);
      } else {
        console.log(`❌ Impossible de trouver le tournoi après sa création`);
      }
    } catch (finalError) {
      console.log(`❌ Erreur lors de la vérification finale: ${finalError.message}`);
    }
    
  } catch (error) {
    console.error(`❌ ERREUR CRITIQUE: ${error.message}`);
    console.error(error);
  } finally {
    if (client) {
      try {
        await client.close();
        console.log('🔌 Connexion à MongoDB fermée');
      } catch (closeError) {
        console.error('Erreur lors de la fermeture de la connexion:', closeError);
      }
    }
    console.log('✨ Fin du script');
  }
}

// Exécuter le script
createTournamentStepByStep()
  .catch(err => {
    console.error('❌ Erreur non gérée:', err);
    process.exit(1);
  });