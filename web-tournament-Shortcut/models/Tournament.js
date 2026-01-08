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

// Generate bracket for single elimination only
TournamentSchema.methods.generateBracket = function() {
    const numParticipants = this.participants.length;
    if (numParticipants < 2) return;
    
    // Calculate number of rounds needed
    const numRounds = Math.ceil(Math.log2(numParticipants));
    
    // Create matches array
    const matches = [];
    
    // Create the final match (championship)
    matches.push({
        matchId: `final`,
        round: numRounds,
        position: 1,
        player1: null,
        player2: null,
        status: 'pending'
    });
    
    // Create remaining matches from top-down
    for (let round = numRounds - 1; round > 0; round--) {
        const matchesInRound = Math.pow(2, round - 1);
        for (let position = 1; position <= matchesInRound; position++) {
            const matchId = `r${round}p${position}`;
            const nextMatchPosition = Math.ceil(position / 2);
            const nextMatchId = round === numRounds - 1 
                ? 'final' 
                : `r${round + 1}p${nextMatchPosition}`;
                
            matches.push({
                matchId,
                round,
                position,
                player1: null,
                player2: null,
                status: 'pending',
                nextMatchId
            });
        }
    }
    
    // Create first round matches and seed players
    const firstRoundMatches = Math.pow(2, Math.ceil(Math.log2(numParticipants)) - 1);
    const byes = firstRoundMatches * 2 - numParticipants;
    
    // Sort participants by seed
    const sortedParticipants = [...this.participants].sort((a, b) => a.seed - b.seed);
    let participantIndex = 0;
    
    for (let position = 1; position <= firstRoundMatches; position++) {
        const matchId = `r1p${position}`;
        const nextMatchPosition = Math.ceil(position / 2);
        const nextMatchId = `r2p${nextMatchPosition}`;
        
        // Check if this match gets a bye
        const hasBye = position <= byes;
        
        const match = {
            matchId,
            round: 1,
            position,
            status: 'pending',
            nextMatchId
        };
        
        if (hasBye) {
            // Assign only one player (gets a bye)
            match.player1 = sortedParticipants[participantIndex++]?.userId || null;
            match.player2 = null;
            match.status = 'completed';
            match.winner = match.player1;
            match.completedAt = new Date();
        } else {
            // Assign two players
            match.player1 = sortedParticipants[participantIndex++]?.userId || null;
            match.player2 = sortedParticipants[participantIndex++]?.userId || null;
        }
        
        matches.push(match);
    }
    
    // Propagate byes up the bracket
    this.propagateByes(matches);
    
    this.matches = matches;
    return this;
};

// Helper to propagate byes up the bracket
TournamentSchema.methods.propagateByes = function(matches) {
    // Create a map for faster lookups
    const matchMap = {};
    matches.forEach(match => {
        matchMap[match.matchId] = match;
    });
    
    // Process each match
    matches.forEach(match => {
        // If match has a winner and a next match
        if (match.winner && match.nextMatchId) {
            const nextMatch = matchMap[match.nextMatchId];
            if (!nextMatch) return;
            
            // Determine which position to fill
            if (match.position % 2 === 1) {
                // Odd position goes to player1
                nextMatch.player1 = match.winner;
            } else {
                // Even position goes to player2
                nextMatch.player2 = match.winner;
            }
            
            // If both players are byes, automatically resolve the next match
            if (nextMatch.player1 && nextMatch.player2 === null) {
                nextMatch.winner = nextMatch.player1;
                nextMatch.status = 'completed';
                nextMatch.completedAt = new Date();
                // Recursively propagate
                this.propagateByes([nextMatch], matchMap);
            } else if (nextMatch.player2 && nextMatch.player1 === null) {
                nextMatch.winner = nextMatch.player2;
                nextMatch.status = 'completed';
                nextMatch.completedAt = new Date();
                // Recursively propagate
                this.propagateByes([nextMatch], matchMap);
            }
        }
    });
};

// Helper to update match and propagate changes
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
            }
        }
    }
    
    return true;
};

module.exports = mongoose.model('Tournament', TournamentSchema);