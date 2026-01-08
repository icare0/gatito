const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    activeGuilds: [{
        type: String,
        default: []
    }],
    statistics: {
        totalTournaments: {
            type: Number,
            default: 0
        },
        tournamentsWon: {
            type: Number,
            default: 0
        },
        matchesPlayed: {
            type: Number,
            default: 0
        },
        matchesWon: {
            type: Number,
            default: 0
        },
        winRate: {
            type: Number,
            default: 0
        },
        lastActive: {
            type: Date,
            default: Date.now
        }
    },
    preferences: {
        notifications: {
            tournamentStart: {
                type: Boolean,
                default: false
            },
            matchStart: {
                type: Boolean,
                default: false
            },
            matchReminder: {
                type: Boolean,
                default: false
            },
            results: {
                type: Boolean,
                default: false
            },
            announcements: {
                type: Boolean,
                default: false
            },
            directMessages: {
                type: Boolean,
                default: false
            }
        },
        timezone: {
            type: String,
            default: 'UTC'
        },
        displayMode: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        }
    },
    activeTournaments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    }],
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Calculate win rate when saving a user
UserSchema.pre('save', function(next) {
    if (this.statistics.matchesPlayed > 0) {
        this.statistics.winRate = (this.statistics.matchesWon / this.statistics.matchesPlayed) * 100;
    }
    next();
});

// Method to update user stats after a tournament
UserSchema.methods.updateTournamentStats = async function(tournamentId, tournamentName, placement, status) {
    // Add to tournament history
    const tournamentEntry = {
        tournamentId,
        tournamentName,
        placement,
        status,
        registeredAt: new Date()
    };
    
    // Check if entry already exists
    const existingEntryIndex = this.tournamentHistory.findIndex(
        t => t.tournamentId.toString() === tournamentId.toString()
    );
    
    if (existingEntryIndex >= 0) {
        // Update existing entry
        this.tournamentHistory[existingEntryIndex].placement = placement;
        this.tournamentHistory[existingEntryIndex].status = status;
        if (status === 'eliminated' || status === 'winner') {
            this.tournamentHistory[existingEntryIndex].eliminatedAt = new Date();
        }
    } else {
        // Add new entry
        this.tournamentHistory.push(tournamentEntry);
        this.statistics.totalTournaments += 1;
    }
    
    // Update tournament wins count
    if (status === 'winner') {
        this.statistics.tournamentsWon += 1;
    }
    
    // Update last active timestamp
    this.statistics.lastActive = new Date();
    
    // Save changes
    await this.save();
};

// Method to update user stats after a match
UserSchema.methods.updateMatchStats = async function(matchData) {
    const {
        tournamentId,
        tournamentName,
        matchId,
        round,
        opponentId,
        opponentUsername,
        result,
        score
    } = matchData;
    
    // Find tournament in history
    const tournamentIndex = this.tournamentHistory.findIndex(
        t => t.tournamentId.toString() === tournamentId.toString()
    );
    
    if (tournamentIndex >= 0) {
        // Add match to tournament history
        this.tournamentHistory[tournamentIndex].matches.push({
            tournamentId,
            tournamentName,
            matchId,
            round,
            opponentId,
            opponentUsername,
            result,
            score,
            date: new Date()
        });
    }
    
    // Update general statistics
    this.statistics.matchesPlayed += 1;
    if (result === 'win') {
        this.statistics.matchesWon += 1;
    }
    
    // Update last active timestamp
    this.statistics.lastActive = new Date();
    
    // Save changes
    await this.save();
};

// Static method to find or create user
UserSchema.statics.findOrCreate = async function(discordUser) {
    let user = await this.findOne({ discordId: discordUser.id });
    
    if (!user) {
        user = new this({
            discordId: discordUser.id,
            username: discordUser.username,
            discriminator: discordUser.discriminator,
            avatar: discordUser.avatar
        });
        
        await user.save();
    }
    
    return user;
};

// Method to get current tournament info
UserSchema.methods.getCurrentTournamentInfo = async function(guildId) {
    const Tournament = require('./Tournament');
    
    const currentTournament = await Tournament.findOne({
        discordServerId: guildId,
        status: 'ongoing',
        'participants.userId': this.discordId
    });
    
    if (!currentTournament) return null;
    
    // Find user's current match
    const currentMatch = currentTournament.matches.find(m => 
        (m.player1 === this.discordId || m.player2 === this.discordId) && 
        (m.status === 'in_progress' || m.status === 'pending')
    );
    
    return {
        tournament: currentTournament,
        match: currentMatch
    };
};

module.exports = mongoose.model('User', UserSchema);