const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    matchId: {
        type: String,
        required: true
    },
    round: {
        type: Number,
        required: true,
    },
    position: {
        type: Number, 
        required: true,
    },
    player1: {
        type: String,
        default: null
    },
    player2: {
        type: String,
        default: null
    },
    winner: {
        type: String,
        default: null
    },
    scores: {
        player1: { type: Number, default: 0 },
        player2: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled', 'disputed'],
        default: 'pending'
    },
    password: {
        type: String,
        default: null
    },
    completedAt: Date,
    nextMatchId: String,
    threadId: String,
    resultReports: [{
        reporterId: String,
        claimedWinner: String,
        timestamp: { type: Date, default: Date.now }
    }],
    adminResolved: {
        type: Boolean,
        default: false
    },
    resolvedBy: {
        type: String,
        default: null
    },
    // ✅ NOUVEAU : Marquer les matchs bye
    isBye: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const TournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        default: null // Sera définie quand le tournoi commence vraiment
    },
    scheduledStartDate: {
        type: Date,
        default: null // Date programmée pour le début du tournoi
    },
    status: {
        type: String,
        enum: ['registration', 'ongoing', 'completed'],
        default: 'registration'
    },
    registrationClosed: {
        type: Boolean,
        default: false
    },
    shuffled: {
        type: Boolean,
        default: false
    },
    shuffleCount: {
        type: Number,
        default: 0
    },
    currentRound: {
        type: Number,
        default: 1
    },
    participants: [{
        userId: {
            type: String,
            required: true
        },
        pseudo: {
            type: String,
            required: true
        },
        seed: {
            type: Number,
            default: 0
        },
        registeredAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['registered', 'eliminated', 'winner'],
            default: 'registered'
        }
    }],
    matches: [MatchSchema],
    rules: {
        type: String,
        required: true
    },
    discordChannelId: {
        type: String,
        required: true
    },
    discordServerId: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// ✅ MÉTHODE AMÉLIORÉE : Génération du premier round avec gestion complète des byes
TournamentSchema.methods.generateFirstRound = function() {
    console.log('=== GENERATING FIRST ROUND WITH IMPROVED BYE HANDLING ===');
    console.log('Participants count:', this.participants.length);
    
    const numParticipants = this.participants.length;
    if (numParticipants < 2) {
        console.log('Not enough participants');
        this.matches = [];
        return this;
    }
    
    // Calculer le nombre de matchs pour le round 1
    const firstRoundMatches = Math.floor(numParticipants / 2);
    const playersInMatches = firstRoundMatches * 2;
    const playersWithByes = numParticipants - playersInMatches;
    
    console.log(`First round: ${firstRoundMatches} matches`);
    console.log(`Players in matches: ${playersInMatches}`);
    console.log(`Players with byes: ${playersWithByes}`);
    
    // Mélanger les participants si pas déjà fait
    const participants = [...this.participants];
    if (!this.shuffled) {
        // Mélanger aléatoirement
        for (let i = participants.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [participants[i], participants[j]] = [participants[j], participants[i]];
        }
        
        // Réassigner les seeds
        for (let i = 0; i < participants.length; i++) {
            participants[i].seed = i + 1;
        }
        
        this.participants = participants;
        this.shuffled = true;
    }
    
    // Créer les matchs du premier round
    const matches = [];
    let participantIndex = 0;
    
    // Créer les matchs 1vs1 réguliers
    for (let i = 1; i <= firstRoundMatches; i++) {
        const match = {
            matchId: `r1m${i}`,
            round: 1,
            position: i,
            player1: participants[participantIndex++].userId,
            player2: participants[participantIndex++].userId,
            status: 'pending',
            winner: null,
            completedAt: null,
            threadId: null,
            password: null,
            isBye: false
        };
        
        matches.push(match);
        
        const p1 = participants.find(p => p.userId === match.player1);
        const p2 = participants.find(p => p.userId === match.player2);
        console.log(`Match ${match.matchId}: ${p1.pseudo} vs ${p2.pseudo}`);
    }
    
    // ✅ NOUVEAU : Créer des "matchs bye" pour les joueurs sans adversaire
    for (let i = participantIndex; i < participants.length; i++) {
        const participant = participants[i];
        const byeMatch = {
            matchId: `r1bye${i - participantIndex + 1}`,
            round: 1,
            position: firstRoundMatches + (i - participantIndex + 1),
            player1: participant.userId,
            player2: null, // Pas d'adversaire = bye
            status: 'completed', // Automatiquement terminé
            winner: participant.userId, // Le joueur gagne automatiquement
            completedAt: new Date(),
            threadId: null,
            password: null,
            isBye: true // ✅ Marquer comme bye
        };
        
        matches.push(byeMatch);
        console.log(`${participant.pseudo} gets a bye to round 2 (${byeMatch.matchId})`);
    }
    
    this.matches = matches;
    this.currentRound = 1;
    
    console.log(`=== FIRST ROUND GENERATED: ${firstRoundMatches} matches + ${playersWithByes} byes ===`);
    return this;
};

// ✅ MÉTHODE AMÉLIORÉE : Génération des rounds suivants avec gestion complète des byes
TournamentSchema.methods.generateNextRound = function() {
    console.log('=== GENERATING NEXT ROUND WITH IMPROVED BYE HANDLING ===');
    
    const currentRound = this.currentRound || 1;
    const nextRound = currentRound + 1;
    
    console.log(`Generating round ${nextRound} from round ${currentRound}`);
    
    // Récupérer TOUS les matchs du round actuel (réguliers + byes)
    const currentRoundMatches = this.matches.filter(m => m.round === currentRound);
    const completedMatches = currentRoundMatches.filter(m => m.status === 'completed');
    
    if (completedMatches.length !== currentRoundMatches.length) {
        console.log(`Round ${currentRound} not complete: ${completedMatches.length}/${currentRoundMatches.length} matches finished`);
        return false; // Round pas terminé
    }
    
    // Récupérer tous les gagnants (incluant les byes automatiques)
    const advancingPlayers = [];
    completedMatches.forEach(match => {
        if (match.winner) {
            advancingPlayers.push(match.winner);
            const participant = this.participants.find(p => p.userId === match.winner);
            console.log(`${participant?.pseudo || 'Unknown'} advances to round ${nextRound}${match.isBye ? ' (bye)' : ''}`);
        }
    });
    
    console.log(`${advancingPlayers.length} players advancing to round ${nextRound}`);
    
    // Si il reste 1 joueur, c'est le champion
    if (advancingPlayers.length === 1) {
        console.log('Tournament complete - we have a champion!');
        
        // Marquer le gagnant
        const winnerId = advancingPlayers[0];
        const winnerIndex = this.participants.findIndex(p => p.userId === winnerId);
        if (winnerIndex !== -1) {
            this.participants[winnerIndex].status = 'winner';
        }
        
        this.status = 'completed';
        return 'completed';
    }
    
    // ✅ NOUVEAU : Créer les matchs du round suivant avec gestion intelligente des byes
    const nextRoundRegularMatches = Math.floor(advancingPlayers.length / 2);
    const hasOddPlayer = advancingPlayers.length % 2 === 1;
    const newMatches = [];
    
    // Créer les matchs réguliers
    for (let i = 0; i < nextRoundRegularMatches; i++) {
        const match = {
            matchId: `r${nextRound}m${i + 1}`,
            round: nextRound,
            position: i + 1,
            player1: advancingPlayers[i * 2],
            player2: advancingPlayers[i * 2 + 1],
            status: 'pending',
            winner: null,
            completedAt: null,
            threadId: null,
            password: null,
            isBye: false
        };
        
        newMatches.push(match);
        
        const p1 = this.participants.find(p => p.userId === match.player1);
        const p2 = this.participants.find(p => p.userId === match.player2);
        console.log(`Match ${match.matchId}: ${p1?.pseudo || 'Unknown'} vs ${p2?.pseudo || 'Unknown'}`);
    }
    
    // ✅ NOUVEAU : Gérer le joueur impair avec un bye automatique
    if (hasOddPlayer) {
        const byePlayer = advancingPlayers[advancingPlayers.length - 1];
        const participant = this.participants.find(p => p.userId === byePlayer);
        
        const byeMatch = {
            matchId: `r${nextRound}bye1`,
            round: nextRound,
            position: nextRoundRegularMatches + 1,
            player1: byePlayer,
            player2: null,
            status: 'completed',
            winner: byePlayer,
            completedAt: new Date(),
            threadId: null,
            password: null,
            isBye: true
        };
        
        newMatches.push(byeMatch);
        console.log(`${participant?.pseudo || 'Unknown'} gets a bye to round ${nextRound + 1} (${byeMatch.matchId})`);
    }
    
    // Ajouter les nouveaux matchs
    this.matches.push(...newMatches);
    this.currentRound = nextRound;
    
    console.log(`=== ROUND ${nextRound} GENERATED: ${nextRoundRegularMatches} matches + ${hasOddPlayer ? 1 : 0} bye ===`);
    return true;
};

// ✅ MÉTHODE AMÉLIORÉE : Vérifier si un round est terminé (incluant les byes)
TournamentSchema.methods.isRoundComplete = function(round) {
    const roundMatches = this.matches.filter(m => m.round === round);
    const completedMatches = roundMatches.filter(m => m.status === 'completed');
    
    console.log(`Round ${round} completion check: ${completedMatches.length}/${roundMatches.length} matches completed`);
    
    return roundMatches.length > 0 && completedMatches.length === roundMatches.length;
};

// ✅ MÉTHODE AMÉLIORÉE : Obtenir le round actuel
TournamentSchema.methods.getCurrentRound = function() {
    // Chercher d'abord les matchs en cours (non-bye)
    const inProgressMatches = this.matches.filter(m => 
        (m.status === 'in_progress' || m.status === 'disputed') && !m.isBye
    );
    
    if (inProgressMatches.length > 0) {
        return Math.min(...inProgressMatches.map(m => m.round));
    }
    
    // Chercher les matchs en attente (non-bye)
    const pendingMatches = this.matches.filter(m => 
        m.status === 'pending' && m.player1 && m.player2 && !m.isBye
    );
    
    if (pendingMatches.length > 0) {
        return Math.min(...pendingMatches.map(m => m.round));
    }
    
    // Sinon, utiliser currentRound ou 1 par défaut
    return this.currentRound || 1;
};

// ✅ NOUVELLE MÉTHODE : Obtenir les statistiques des byes pour un round
TournamentSchema.methods.getRoundByeStats = function(round) {
    const roundMatches = this.matches.filter(m => m.round === round);
    const regularMatches = roundMatches.filter(m => !m.isBye);
    const byeMatches = roundMatches.filter(m => m.isBye);
    
    return {
        totalMatches: roundMatches.length,
        regularMatches: regularMatches.length,
        byeMatches: byeMatches.length,
        byes: byeMatches.map(m => ({
            matchId: m.matchId,
            playerId: m.player1,
            playerName: this.participants.find(p => p.userId === m.player1)?.pseudo || 'Unknown'
        }))
    };
};

// ✅ NOUVELLE MÉTHODE : Obtenir tous les joueurs avec bye pour un round
TournamentSchema.methods.getByePlayersForRound = function(round) {
    const byeMatches = this.matches.filter(m => m.round === round && m.isBye);
    return byeMatches.map(match => ({
        userId: match.player1,
        matchId: match.matchId,
        participant: this.participants.find(p => p.userId === match.player1)
    }));
};

// Méthode de compatibilité (remplace l'ancienne generateBracket)
TournamentSchema.methods.generateBracket = function() {
    return this.generateFirstRound();
};

// Propagate byes (méthode existante, conservée)
TournamentSchema.methods.propagateByes = function(matches) {
    console.log('=== PROPAGATE BYES START ===');
    
    // Create a map for faster lookups
    const matchMap = {};
    matches.forEach(match => {
        matchMap[match.matchId] = match;
    });
    
    let changed = true;
    let iterations = 0;
    
    while (changed && iterations < 10) { // Safety limit
        changed = false;
        iterations++;
        console.log(`Propagation iteration ${iterations}`);
        
        matches.forEach(match => {
            // If match has a winner and a next match, and next match doesn't have this player yet
            if (match.winner && match.nextMatchId) {
                const nextMatch = matchMap[match.nextMatchId];
                if (!nextMatch) return;
                
                // Determine which position to fill
                let targetPosition = null;
                if (match.position % 2 === 1) {
                    // Odd position goes to player1
                    if (!nextMatch.player1) {
                        nextMatch.player1 = match.winner;
                        targetPosition = 'player1';
                        changed = true;
                        console.log(`${match.winner} advances to ${nextMatch.matchId} as player1`);
                    }
                } else {
                    // Even position goes to player2
                    if (!nextMatch.player2) {
                        nextMatch.player2 = match.winner;
                        targetPosition = 'player2';
                        changed = true;
                        console.log(`${match.winner} advances to ${nextMatch.matchId} as player2`);
                    }
                }
                
                // If this creates another bye (only one player in next match), auto-advance
                if (nextMatch.player1 && !nextMatch.player2) {
                    nextMatch.winner = nextMatch.player1;
                    nextMatch.status = 'completed';
                    nextMatch.completedAt = new Date();
                    changed = true;
                    console.log(`${nextMatch.player1} gets a bye in ${nextMatch.matchId}`);
                } else if (nextMatch.player2 && !nextMatch.player1) {
                    nextMatch.winner = nextMatch.player2;
                    nextMatch.status = 'completed';
                    nextMatch.completedAt = new Date();
                    changed = true;
                    console.log(`${nextMatch.player2} gets a bye in ${nextMatch.matchId}`);
                }
            }
        });
    }
    
    console.log(`=== PROPAGATE BYES END (${iterations} iterations) ===`);
};

// Regenerate bracket (méthode existante, conservée)
TournamentSchema.methods.regenerateBracket = function() {
    const numParticipants = this.participants.length;
    if (numParticipants < 2) {
        this.matches = [];
        return this;
    }
    
    // Assigner les seeds si pas déjà fait
    const participants = [...this.participants];
    for (let i = 0; i < participants.length; i++) {
        if (!participants[i].seed || participants[i].seed === 0) {
            participants[i].seed = i + 1;
        }
    }
    this.participants = participants;
    
    // Générer le nouveau bracket
    return this.generateBracket();
};

// Méthode pour ajouter un participant et regénérer le bracket
TournamentSchema.methods.addParticipant = function(userId, username) {
    // Vérifier si déjà inscrit
    const isRegistered = this.participants.some(p => p.userId === userId);
    if (isRegistered) {
        return false;
    }
    
    // Ajouter le participant
    this.participants.push({
        userId: userId,
        pseudo: username,
        seed: this.participants.length + 1,
        registeredAt: new Date(),
        status: 'registered'
    });
    
    // Regénérer le bracket
    this.regenerateBracket();
    
    return true;
};

// Méthode pour mélanger et regénérer
TournamentSchema.methods.shuffleAndRegenerate = function() {
    const participants = [...this.participants];
    
    // Mélanger avec Fisher-Yates
    for (let i = participants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participants[i], participants[j]] = [participants[j], participants[i]];
    }
    
    // Réassigner les seeds
    for (let i = 0; i < participants.length; i++) {
        participants[i].seed = i + 1;
    }
    
    this.participants = participants;
    this.shuffled = true;
    
    // Incrémenter le compteur de shuffle
    if (!this.shuffleCount) {
        this.shuffleCount = 1;
    } else {
        this.shuffleCount += 1;
    }
    
    // Regénérer le bracket
    this.regenerateBracket();
    
    return this;
};

// ✅ MÉTHODE AMÉLIORÉE : Obtenir un aperçu du bracket avec byes
TournamentSchema.methods.getBracketSummary = function() {
    if (this.participants.length < 2) {
        return "Pas assez de participants pour générer un bracket.";
    }
    
    const firstRoundMatches = this.matches.filter(m => m.round === 1);
    const regularMatches = firstRoundMatches.filter(m => !m.isBye);
    const byeMatches = firstRoundMatches.filter(m => m.isBye);
    
    let summary = `**Bracket Preview** (${this.participants.length} participants)\n\n`;
    
    summary += `**Premier Round:**\n`;
    
    // Afficher les matchs réguliers
    for (const match of regularMatches) {
        if (match.player1 && match.player2) {
            const player1 = this.participants.find(p => p.userId === match.player1);
            const player2 = this.participants.find(p => p.userId === match.player2);
            summary += `• ${player1?.pseudo || 'Inconnu'} vs ${player2?.pseudo || 'Inconnu'}\n`;
        }
    }
    
    // Afficher les byes
    if (byeMatches.length > 0) {
        summary += `\n**Byes automatiques:**\n`;
        for (const byeMatch of byeMatches) {
            const player = this.participants.find(p => p.userId === byeMatch.player1);
            summary += `• ${player?.pseudo || 'Inconnu'} (passe automatiquement au round 2)\n`;
        }
    }
    
    const totalRounds = Math.ceil(Math.log2(this.participants.length));
    summary += `\n**Total de rounds prévus:** ${totalRounds}`;
    summary += `\n**Matchs réguliers round 1:** ${regularMatches.length}`;
    summary += `\n**Byes round 1:** ${byeMatches.length}`;
    
    return summary;
};

// Helper to update match and propagate changes (méthode existante, conservée)
TournamentSchema.methods.updateMatch = function(matchId, updateData) {
    const matchIndex = this.matches.findIndex(m => m.matchId === matchId);
    if (matchIndex === -1) return false;
    
    // Update match data
    Object.assign(this.matches[matchIndex], updateData);
    
    // If the match is completed, propagate winner
    if (updateData.status === 'completed' && updateData.winner) {
        const match = this.matches[matchIndex];
        if (match.nextMatchId) {
            const nextMatch = this.matches.find(m => m.matchId === match.nextMatchId);
            if (nextMatch) {
                // Determine which position to fill
                if (match.position % 2 === 1) {
                    nextMatch.player1 = match.winner;
                } else {
                    nextMatch.player2 = match.winner;
                }
                
                // If both players are now assigned, make match ready
                if (nextMatch.player1 && nextMatch.player2 && nextMatch.status === 'pending') {
                    nextMatch.status = 'pending'; // Ready to be started
                }
            }
        }
    }
    
    return true;
};

// ✅ MÉTHODE AMÉLIORÉE : Helper to get current round matches that are ready to start (excluant les byes)
TournamentSchema.methods.getReadyMatches = function() {
    return this.matches.filter(match => 
        match.status === 'pending' && 
        match.player1 && 
        match.player2 &&
        !match.isBye // ✅ Exclure les byes
    );
};

module.exports = mongoose.model('Tournament', TournamentSchema);