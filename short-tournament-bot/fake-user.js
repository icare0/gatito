const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./Schemas/User');
const Tournament = require('./Schemas/Tournament');

async function main() {
  await mongoose.connect(process.env.DATABASE);
  console.log('✅ Connecté à MongoDB');

  const baseId = '486909422220607';
  const avatarUrl = 'https://cdn.discordapp.com/avatars/486909422220607488/8c9b5ec844bd1ecad7b1a5f82482f50c.webp?size=128';

  // Générer 200 utilisateurs "icare"
  const users = Array.from({ length: 200 }, (_, i) => {
    const discordId = baseId + String(i).padStart(3, '0');
    return {
      discordId,
      username: 'icare',
      avatar: avatarUrl,
      joinedAt: new Date(),
      statistics: {
        totalTournaments: 0,
        tournamentsWon: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        lastActive: new Date()
      },
      preferences: {
        timezone: 'Europe/Paris',
        notifications: {
          tournamentStart: true,
          matchStart: true,
          matchReminder: true,
          results: true,
          announcements: true,
          directMessages: true
        }
      }
    };
  });

  // Insertion
  await User.insertMany(users, { ordered: false }).catch(() => {});
  console.log('✅ 200 utilisateurs créés (ou déjà existants)');

  // Trouver le tournoi actif
  const tournament = await Tournament.findOne({ status: 'registration', registrationClosed: { $ne: true } });
  if (!tournament) {
    console.log('⚠️ Aucun tournoi actif trouvé.');
    return mongoose.disconnect();
  }

  // Préparer les participations
  const participants = users.map(u => ({
    userId: u.discordId,
    pseudo: u.username,
    seed: 0,
    registeredAt: new Date(),
    status: 'registered'
  }));

  // Ajouter les participants qui ne sont pas déjà inscrits
  const existingIds = new Set(tournament.participants.map(p => p.userId));
  const newParticipants = participants.filter(p => !existingIds.has(p.userId));

  tournament.participants.push(...newParticipants);
  await tournament.save();

  console.log(`✅ ${newParticipants.length} utilisateurs inscrits au tournoi "${tournament.name}"`);

  await mongoose.disconnect();
  console.log('🔌 Déconnecté de MongoDB');
}

main();
