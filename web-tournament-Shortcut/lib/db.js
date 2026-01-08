// lib/db.js
import { connectToDatabase, convertDocToObj } from './mongodb';
import MatchHistory from '../components/profile/MatchHistory';

// Fonctions pour les clans
export async function getTopClans(limit = 10) {
  const { db } = await connectToDatabase();
  
  const clans = await db
    .collection('clans')
    .find({})
    .sort({ elo: -1 })
    .limit(limit)
    .toArray();
  
  return clans.map(convertDocToObj);
}

// lib/db.js - Modified getClanById function
export async function getClanById(clanId) {
  const { db } = await connectToDatabase();
  
  // First, fetch the clan data
  const clan = await db.collection('clans').findOne({ idClan: clanId });
  
  if (!clan) return null;
  
  // If the clan has members, fetch their complete profiles
  if (clan.members && clan.members.length > 0) {
    // Extract member user IDs
    const memberIds = clan.members.map(member => member.userId);
    
    // Fetch all user profiles for these members
    const userProfiles = await db.collection('users')
      .find({ iduser: { $in: memberIds } })
      .toArray();
    
    // Create a map for quick lookup
    const userMap = {};
    userProfiles.forEach(user => {
      userMap[user.iduser] = user;
    });
    
    // Enrich the members array with full user data
    clan.members = clan.members.map(member => {
      const userProfile = userMap[member.userId] || {};
      return {
        ...member, // Keep original member data (role, joinDate, etc.)
        // Add user profile data
        userId: member.userId, // Keep this for reference
        pseudo: userProfile.pseudo || `Joueur ${member.userId?.substring(0, 6)}`,
        avatar: userProfile.avatar || '/images/default-avatar.png',
        elo: userProfile.elo || 1000,
        rank: userProfile.rank || 'unranked',
        userStats: {
          victories: userProfile.victories || 0,
          defeats: (userProfile.totalMatches || 0) - (userProfile.victories || 0),
          // You could add more stats if needed
        }
      };
    });
  }
  
  return convertDocToObj(clan);
}

export async function searchClans(query) {
  const { db } = await connectToDatabase();
  
  const clans = await db
    .collection('clans')
    .find({
      $or: [
        { Name: { $regex: query, $options: 'i' } },
        { idClan: { $regex: query, $options: 'i' } }
      ]
    })
    .sort({ elo: -1 })
    .limit(20)
    .toArray();
  
  return clans.map(convertDocToObj);
}

// Fonctions pour les utilisateurs
export async function getTopUsers(limit = 10, sort = 'elo') {
  const { db } = await connectToDatabase();
  
  const sortOptions = {};
  if (sort === 'winRate') {
    sortOptions.winRate = -1;
  } else {
    sortOptions.elo = -1;
  }
  
  const users = await db
    .collection('users')
    .find({})
    .sort(sortOptions)
    .limit(limit)
    .toArray();
  
  return users.map(convertDocToObj);
}

export async function getUserById(userId) {
  const { db } = await connectToDatabase();
  
  const user = await db
    .collection('users')
    .findOne({ iduser: userId });
  
  if (!user) return null;
  
  return convertDocToObj(user);
}

export async function searchUsers(query) {
  const { db } = await connectToDatabase();
  
  const users = await db
    .collection('users')
    .find({
      $or: [
        { pseudo: { $regex: query, $options: 'i' } },
        { iduser: { $regex: query, $options: 'i' } }
      ]
    })
    .sort({ elo: -1 })
    .limit(20)
    .toArray();
  
  return users.map(convertDocToObj);
}

// lib/db.js (extrait à ajouter/remplacer)

export async function getMatchesByUserId(userId, limit = 5) {
  const { db } = await connectToDatabase();
  
  const matchesQuery = {
    status: 'completed',
    $or: [
      { player1: userId },
      { player2: userId }
    ]
  };
  
  // Create a base query
  let query = db.collection('matchmakings').find(matchesQuery).sort({ updatedAt: -1 });
  
  // Only apply limit if it's not set to a special value like -1
  if (limit !== -1) {
    query = query.limit(limit);
  }
  
  const matches = await query.toArray();
  
  // Récupérer les informations des adversaires
  const opponentIds = matches.map(match => 
    match.player1 === userId ? match.player2 : match.player1
  ).filter(Boolean);
  
  // Obtenir les informations des adversaires en une seule requête
  const opponents = await db.collection('users')
    .find({ iduser: { $in: opponentIds } })
    .project({ 
      iduser: 1, 
      pseudo: 1, 
      avatar: 1, 
      elo: 1,
      rank: 1
    })
    .toArray();
  
  // Créer un map pour un accès facile
  const opponentsMap = {};
  opponents.forEach(opponent => {
    opponentsMap[opponent.iduser] = opponent;
  });
  
  // Enrichir les données de match
  const enrichedMatches = matches.map(match => {
    // Déterminer l'ID de l'adversaire
    const opponentId = match.player1 === userId ? match.player2 : match.player1;
    const opponent = opponentsMap[opponentId] || null;
    
    // Sélectionner les plus récentes données ELO si disponibles
    let eloBeforeMatch = null;
    let eloAfterMatch = null;
    let eloChange = null;
    
    // Essayer de retrouver les changements d'ELO depuis les logs
    const eloLog = match.eloLogs?.find(log => log.playerId === userId);
    
    if (eloLog) {
      eloBeforeMatch = eloLog.beforeElo;
      eloAfterMatch = eloLog.afterElo;
      eloChange = eloAfterMatch - eloBeforeMatch;
    }
    
    // Si pas de logs disponibles, on estime les changements d'ELO
    if (eloChange === null) {
      eloChange = match.winner === userId ? 15 : -10; // Valeur par défaut estimée
    }
    
    // Estimer la durée du match si non spécifiée
    let duration = match.duration;
    if (!duration && match.createdAt && match.updatedAt) {
      duration = Math.floor((new Date(match.updatedAt) - new Date(match.createdAt)) / 1000);
    }
    
    return {
      id: match._id.toString(),
      matchId: match.matchId,
      date: match.createdAt || match.updatedAt,
      player1Id: match.player1,
      player2Id: match.player2,
      winner: match.winner,
      duration: duration,
      eloBeforeMatch,
      eloAfterMatch,
      eloChange,
      opponent: opponent ? {
        id: opponent.iduser,
        pseudo: opponent.pseudo,
        avatar: opponent.avatar,
        elo: opponent.elo,
        rank: opponent.rank
      } : null,
      gameDetails: match.gameDetails || null,
      matchNotes: match.matchNotes || null,
      updatedAt: match.updatedAt,
      completedAt: match.completedAt
    };
  });
  
  return enrichedMatches;
}

export async function getMatchesByClanId(clanId, limit = 5) {
  const { db } = await connectToDatabase();
  
  // D'abord, récupérer tous les membres du clan
  const clan = await getClanById(clanId);
  if (!clan || !clan.members || !clan.members.length) {
    return [];
  }
  
  const memberIds = clan.members.map(member => member.userId);
  
  // Ensuite, récupérer les matchs pour tous les membres
  const matches = await db
    .collection('matchmakings')
    .find({
      $or: [
        { player1: { $in: memberIds } },
        { player2: { $in: memberIds } }
      ],
      status: 'completed'
    })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();
  
  return matches.map(convertDocToObj);
}


export async function getSiteSettings() {
  const { db } = await connectToDatabase();
  
  // Essayer de trouver le document de paramètres
  let settings = await db.collection('sitesettings').findOne({});
  
  // Si aucun paramètre n'existe, créer les paramètres par défaut
  if (!settings) {
    const defaultSettings = {
      siteName: 'PokéTCG League',
      siteDescription: 'Plateforme de tournois et matchmaking pour le jeu de cartes Pokémon',
      maintenanceMode: false,
      registrationEnabled: true,
      currentSeason: {
        number: '3',
        startDate: new Date('2024-12-01T00:00:00Z'),
        endDate: new Date('2025-03-01T23:59:59Z')
      },
      matchmaking: {
        enabled: true,
        timeLimit: 30,
        eloStartValue: 1000,
        eloKFactor: 32,
        victoryPoints: 3,
        drawPoints: 1,
        lossPoints: 0,
        minMatchesForRank: 10
      },
      discord: {
        webhookUrl: ''
      },
      ranks: [
        { name: 'bronze', minElo: 0, maxElo: 1199, color: '#CD7F32' },
        { name: 'silver', minElo: 1200, maxElo: 1399, color: '#C0C0C0' },
        { name: 'gold', minElo: 1400, maxElo: 1599, color: '#FFD700' },
        { name: 'platinum', minElo: 1600, maxElo: 1799, color: '#E5E4E2' },
        { name: 'diamond', minElo: 1800, maxElo: 9999, color: '#B9F2FF' }
      ],
      tournament: {
        cashprize: {
          first: 1500,
          second: 700,
          third: 300
        },
        date: new Date('2025-03-15T12:00:00Z'),
        format: 'Élimination directe'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('sitesettings').insertOne(defaultSettings);
    settings = defaultSettings;
  }
  
  return convertDocToObj(settings);
}

/**
 * Met à jour les paramètres du site
 */
export async function updateSiteSettings(section, data) {
  const { db } = await connectToDatabase();
  
  // Récupérer les paramètres actuels
  let settings = await db.collection('sitesettings').findOne({});
  
  // Si aucun paramètre n'existe, obtenir les paramètres par défaut
  if (!settings) {
    settings = await getSiteSettings();
  }
  
  // Construire l'objet de mise à jour
  const updateObj = { updatedAt: new Date() };
  
  // Mettre à jour la section spécifique
  if (section === 'general') {
    updateObj.siteName = data.siteName;
    updateObj.siteDescription = data.siteDescription;
    updateObj.maintenanceMode = data.maintenanceMode;
    updateObj.registrationEnabled = data.registrationEnabled;
    updateObj['discord.webhookUrl'] = data.discordWebhook;
    updateObj['currentSeason.number'] = data.currentSeason;
    updateObj['currentSeason.startDate'] = new Date(data.seasonStartDate);
    updateObj['currentSeason.endDate'] = new Date(data.seasonEndDate);
  } else if (section === 'matchmaking') {
    updateObj['matchmaking.enabled'] = data.enableMatchmaking;
    updateObj['matchmaking.timeLimit'] = parseInt(data.matchTimeLimit);
    updateObj['matchmaking.eloStartValue'] = parseInt(data.eloStartValue);
    updateObj['matchmaking.eloKFactor'] = parseInt(data.eloKFactor);
    updateObj['matchmaking.victoryPoints'] = parseInt(data.victoryPoints);
    updateObj['matchmaking.drawPoints'] = parseInt(data.drawPoints);
    updateObj['matchmaking.lossPoints'] = parseInt(data.lossPoints);
    updateObj['matchmaking.minMatchesForRank'] = parseInt(data.minMatchesForRank);
  } else if (section === 'ranks') {
    // Pour les rangs, il faut remplacer tout le tableau
    await db.collection('sitesettings').updateOne(
      { _id: settings._id },
      { $set: { ranks: data, updatedAt: new Date() } }
    );
    
    // Retourner les paramètres mis à jour
    return getSiteSettings();
  } else if (section === 'tournament') {
    updateObj['tournament.cashprize.first'] = parseInt(data.cashprize.first);
    updateObj['tournament.cashprize.second'] = parseInt(data.cashprize.second);
    updateObj['tournament.cashprize.third'] = parseInt(data.cashprize.third);
    updateObj['tournament.date'] = new Date(data.date);
    updateObj['tournament.format'] = data.format;
  }
  
  // Mettre à jour les paramètres
  await db.collection('sitesettings').updateOne(
    { _id: settings._id },
    { $set: updateObj }
  );
  
  // Retourner les paramètres mis à jour
  return getSiteSettings();
}

// Dans lib/db.js

export async function getGlobalStats() {
  try {
    const { db } = await connectToDatabase();
    
    // Statistiques de base
    const totalUsers = await db.collection('users').countDocuments();
    const totalClans = await db.collection('clans').countDocuments();
    const totalMatches = await db.collection('matchmakings').countDocuments({ status: 'completed' });
    
    // Récupérer les paramètres du site
    let settings = await db.collection('siteSettings').findOne({});
    
    // Si aucun paramètre n'existe, créer des valeurs par défaut
    if (!settings) {
      settings = {
        siteName: 'Pocketex',
        currentSeason: {
          number: '4',
          startDate: new Date('2024-12-01T00:00:00Z'),
          endDate: new Date('2025-03-01T23:59:59Z')
        }
      };
    }
    
    
    // Vérifier et formater les dates correctement
    let startDate, endDate;
    
    // Pour la date de début
    try {
      if (settings.currentSeason?.startDate) {
        startDate = new Date(settings.currentSeason.startDate);
        if (isNaN(startDate.getTime())) {
          console.warn("⚠️ Date de début invalide dans la BDD, utilisation de la valeur par défaut");
          startDate = new Date('2024-12-01T00:00:00Z');
        }
      } else {
        startDate = new Date('2024-12-01T00:00:00Z');
      }
    } catch (error) {
      console.error("🔴 Erreur lors du traitement de la date de début:", error);
      startDate = new Date('2024-12-01T00:00:00Z');
    }
    
    // Pour la date de fin
    try {
      if (settings.currentSeason?.endDate) {
        endDate = new Date(settings.currentSeason.endDate);
        if (isNaN(endDate.getTime())) {
          console.warn("⚠️ Date de fin invalide dans la BDD, utilisation de la valeur par défaut");
          endDate = new Date('2025-03-01T23:59:59Z');
        }
      } else {
        endDate = new Date('2025-03-01T23:59:59Z');
      }
    } catch (error) {
      console.error("🔴 Erreur lors du traitement de la date de fin:", error);
      endDate = new Date('2025-03-01T23:59:59Z');
    }
    
    
    // Créer l'objet saison actuelle
    const currentSeason = {
      number: settings.currentSeason?.number || '3',
      endDate: endDate,
      startDate: startDate,
      name: `Saison ${settings.currentSeason?.number || '3'}`
    };
    
    // Les top 3 clans pour le tournoi final
    const qualifiedClans = await getTopClans(3);
    
    return {
      totalUsers,
      totalClans,
      totalMatches,
      currentSeason,
      qualifiedClans,
      siteSettings: settings
    };
  } catch (error) {
    console.error("🔴 Erreur dans getGlobalStats:", error);
    
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      totalUsers: 0,
      totalClans: 0,
      totalMatches: 0,
      currentSeason: {
        number: '3',
        endDate: new Date('2025-03-01T23:59:59Z'),
        startDate: new Date('2024-12-01T00:00:00Z'),
        name: 'Saison 3'
      },
      qualifiedClans: [],
      siteSettings: {}
    };
  }
}

// Fonction pour obtenir l'historique des saisons
export async function getSeasonHistory() {
  // Dans une application réelle, cela viendrait de la base de données
  // Pour l'instant, on renvoie des données statiques
  return [
  ];
}

// Ajouter ces fonctions à lib/db.js

/**
 * Récupère les statistiques détaillées pour le tableau de bord d'administration
 * @param {string} range - Plage de temps ('week', 'month', 'all')
 * @returns {Object} Statistiques détaillées
 */
export async function getDetailedStats(range = 'month') {
  const { db } = await connectToDatabase();
  
  // Définir la plage de dates en fonction du paramètre range
  const now = new Date();
  let startDate;
  
  switch (range) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'all':
    default:
      startDate = new Date(0); // Début des temps Unix
      break;
  }
  
  // Récupération des statistiques de base
  const [
    totalUsers,
    totalClans,
    totalMatches,
    matchesInRange,
    usersCreatedInRange,
    activeUsers
  ] = await Promise.all([
    db.collection('users').countDocuments(),
    db.collection('clans').countDocuments(),
    db.collection('matchmakings').countDocuments({ status: 'completed' }),
    db.collection('matchmakings').countDocuments({
      status: 'completed',
      updatedAt: { $gte: startDate }
    }),
    db.collection('users').countDocuments({
      createdAt: { $gte: startDate }
    }),
    db.collection('users').countDocuments({
      lastActivity: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }) || Math.round(totalUsers * 0.15) // Estimation si lastActivity n'existe pas
  ]);
  
  // Récupération des meilleurs clans
  const topClans = await db.collection('clans')
    .find()
    .sort({ elo: -1 })
    .limit(5)
    .toArray();
  
  // Récupération des meilleurs joueurs
  const topPlayers = await db.collection('users')
    .find()
    .sort({ elo: -1 })
    .limit(5)
    .toArray();
  
  // Compter les utilisateurs par rang
  const usersByRankResult = await db.collection('users')
    .aggregate([
      { 
        $group: { 
          _id: "$rank", 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ])
    .toArray();
  
  // Formatage des données pour usersByRank
  const ranks = ['unranked', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const usersByRank = ranks.map(rank => {
    const found = usersByRankResult.find(item => item._id === rank);
    return {
      label: rank.charAt(0).toUpperCase() + rank.slice(1),
      value: found ? found.count : 0
    };
  });
  
  // Matches par jour (pour le graphique)
  const matchesByDay = [];
  const days = range === 'week' ? 7 : range === 'month' ? 30 : 31;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    // Compter les matchs pour ce jour
    const count = await db.collection('matchmakings').countDocuments({
      status: 'completed',
      updatedAt: { $gte: date, $lt: nextDay }
    });
    
    matchesByDay.unshift({
      label: date.getDate().toString(),
      value: count
    });
  }
  
  // Récupérer les matchs récents
  const recentMatches = await db.collection('matchmakings')
    .find({ status: 'completed' })
    .sort({ updatedAt: -1 })
    .limit(5)
    .toArray();
  
  // Récupérer les nouveaux utilisateurs récents
  const recentUsers = await db.collection('users')
    .find()
    .sort({ createdAt: -1 })
    .limit(5)
    .project({ 
      iduser: 1, 
      pseudo: 1, 
      createdAt: 1 
    })
    .toArray();
  
  // Nouvelles inscriptions (aujourd'hui)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newUsersToday = await db.collection('users').countDocuments({
    createdAt: { $gte: today }
  });
  
  // Calcul des taux de croissance
  const previousPeriodStartDate = new Date(startDate);
  if (range === 'week') {
    previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - 7);
  } else if (range === 'month') {
    previousPeriodStartDate.setMonth(previousPeriodStartDate.getMonth() - 1);
  } else {
    previousPeriodStartDate.setFullYear(previousPeriodStartDate.getFullYear() - 1);
  }
  
  const [
    previousPeriodUsers,
    previousPeriodMatches,
    previousPeriodClans
  ] = await Promise.all([
    db.collection('users').countDocuments({
      createdAt: { $gte: previousPeriodStartDate, $lt: startDate }
    }),
    db.collection('matchmakings').countDocuments({
      status: 'completed',
      updatedAt: { $gte: previousPeriodStartDate, $lt: startDate }
    }),
    db.collection('clans').countDocuments({
      createdAt: { $gte: previousPeriodStartDate, $lt: startDate }
    })
  ]);
  
  // Calculer les taux de croissance
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };
  
  const userGrowth = calculateGrowth(usersCreatedInRange, previousPeriodUsers);
  const matchGrowth = calculateGrowth(matchesInRange, previousPeriodMatches);
  const clanGrowth = calculateGrowth(
    await db.collection('clans').countDocuments({ createdAt: { $gte: startDate } }),
    previousPeriodClans
  );
  
  // Récupérer des statistiques sur les matchs
  const matchStats = await db.collection('matchmakings')
    .aggregate([
      { $match: { status: 'completed' } },
      { 
        $group: {
          _id: null,
          totalMatches: { $sum: 1 },
          // Si vous avez un champ pour la durée du match, vous pourriez calculer la moyenne ici
          // avgDuration: { $avg: "$duration" }
        }
      }
    ])
    .toArray();
    
  const avgMatchTime = 12; // Valeur fictive - à remplacer par un calcul réel si vous avez les données
  
  // Retourner les statistiques formatées
  return {
    totalUsers,
    totalClans,
    totalMatches,
    activeUsers,
    matchesToday: matchesByDay[matchesByDay.length - 1]?.value || 0,
    userGrowth: parseFloat(userGrowth),
    matchGrowth: parseFloat(matchGrowth),
    clanGrowth: parseFloat(clanGrowth),
    newUsersToday,
    retentionRate: Math.round((activeUsers / totalUsers) * 100) || 0,
    avgMatchTime,
    matchesPerUser: totalUsers > 0 ? parseFloat((totalMatches / totalUsers).toFixed(2)) : 0,
    usersByRank,
    matchesByDay,
    topClans: topClans.map(convertDocToObj).map(clan => ({
      id: clan.idClan,
      name: clan.Name,
      elo: clan.elo,
      winRate: clan.winRate || 0,
      logo: clan.profilepicture,
      members: clan.members?.length || 0
    })),
    topPlayers: topPlayers.map(convertDocToObj).map(player => ({
      id: player.iduser,
      name: player.pseudo,
      elo: player.elo,
      winRate: player.winRate || 0,
      avatar: player.avatar,
      rank: player.rank
    })),
    recentMatches: recentMatches.map(convertDocToObj).map(match => ({
      id: match.matchId,
      player1: match.player1,
      player2: match.player2,
      winner: match.winner,
      date: match.updatedAt
    })),
    recentUsers: recentUsers.map(convertDocToObj).map(user => ({
      id: user.iduser,
      pseudo: user.pseudo,
      date: user.createdAt
    })),
    currentSeason: {
      name: 'Saison 3',
      endDate: '2025-03-01T23:59:59',
      startDate: '2024-12-01T00:00:00'
    }
  };
}