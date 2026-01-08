// models/User.js (updated)
import mongoose from 'mongoose';

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
                default: true
            },
            matchStart: {
                type: Boolean,
                default: true
            },
            matchReminder: {
                type: Boolean,
                default: true
            },
            results: {
                type: Boolean,
                default: true
            },
            announcements: {
                type: Boolean,
                default: true
            },
            directMessages: {
                type: Boolean,
                default: true
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
    badges: [{
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        icon: {
            type: String
        },
        awardedAt: {
            type: Date,
            default: Date.now
        }
    }],
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Calculer le winRate avant de sauvegarder
UserSchema.pre('save', function (next) {
  if (this.totalMatches > 0) {
    this.winRate = (this.victories / this.totalMatches) * 100;
  } else {
    this.winRate = 0;
  }
  
  if (this.seasonalStats) {
    Object.values(this.seasonalStats).forEach(season => {
      if (season && season.totalMatches > 0) {
        season.winRate = (season.victories / season.totalMatches) * 100;
      }
    });
  }

  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);