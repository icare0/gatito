// pages/api/tournaments/[id]/generate-bracket.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { connectToDatabase } from '../../../../lib/mongodb';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }
  
  // Get the current session
  const session = await getServerSession(req, res, authOptions);
  
  // Check if the user is authenticated and is admin
  if (!session || !session.user.isAdmin) {
    return res.status(403).json({ success: false, error: 'Non autorisé - Seuls les administrateurs peuvent générer l\'arbre du tournoi' });
  }
  
  // Connect to the database
  const { db } = await connectToDatabase();
  
  // Get the tournament ID from the URL query
  const { id } = req.query;
  
  // Validate the ID
  if (!id) {
    return res.status(400).json({ success: false, error: 'ID de tournoi manquant' });
  }
  
  try {
    // Get the tournament
    const tournament = await db.collection('tournaments').findOne({ _id: id });
    
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournoi non trouvé' });
    }
    
    // Check if the tournament has enough participants
    if (!tournament.participants || tournament.participants.length < 2) {
      return res.status(400).json({ success: false, error: 'Le tournoi doit avoir au moins 2 participants pour générer l\'arbre' });
    }
    
    // Check if the tournament is in draft or registration state
    if (tournament.status !== 'draft' && tournament.status !== 'registration') {
      return res.status(400).json({ success: false, error: 'L\'arbre du tournoi ne peut être généré que pour les tournois en préparation ou en phase d\'inscription' });
    }
    
    // Generate the bracket
    const numParticipants = tournament.participants.length;
    const numRounds = Math.ceil(Math.log2(numParticipants));
    const totalMatches = Math.pow(2, numRounds) - 1;
    
    // Create matches array
    const matches = [];
    
    // Create the final match (championship)
    matches.push({
      matchId: `match-final-${id}`,
      round: numRounds,
      position: 1,
      player1: null,
      player2: null,
      scores: { player1: 0, player2: 0 },
      status: 'pending',
      tournamentId: id,
      format: getRoundFormat(tournament.roundFormats, numRounds) || 'bo1'
    });
    
    // Create remaining matches from top-down
    for (let round = numRounds - 1; round > 0; round--) {
      const matchesInRound = Math.pow(2, round - 1);
      for (let position = 1; position <= matchesInRound; position++) {
        const matchId = `match-r${round}-p${position}-${id}`;
        const nextMatchPosition = Math.ceil(position / 2);
        const nextMatchId = round === numRounds - 1 
          ? `match-final-${id}` 
          : `match-r${round + 1}-p${nextMatchPosition}-${id}`;
          
        matches.push({
          matchId,
          round,
          position,
          player1: null,
          player2: null,
          scores: { player1: 0, player2: 0 },
          status: 'pending',
          tournamentId: id,
          format: getRoundFormat(tournament.roundFormats, round) || 'bo1',
          nextMatchId
        });
      }
    }
    
    // Create first round matches and seed players
    const firstRoundMatches = Math.pow(2, Math.ceil(Math.log2(numParticipants)) - 1);
    const byes = firstRoundMatches * 2 - numParticipants;
    
    // Sort participants by seed
    const sortedParticipants = [...tournament.participants].sort((a, b) => a.seed - b.seed);
    let participantIndex = 0;
    
    for (let position = 1; position <= firstRoundMatches; position++) {
      const matchId = `match-r1-p${position}-${id}`;
      const nextMatchPosition = Math.ceil(position / 2);
      const nextMatchId = numRounds > 1 ? `match-r2-p${nextMatchPosition}-${id}` : `match-final-${id}`;
      
      // Check if this match gets a bye
      const hasBye = position <= byes;
      
      const match = {
        matchId,
        round: 1,
        position,
        scores: { player1: 0, player2: 0 },
        status: 'pending',
        tournamentId: id,
        format: getRoundFormat(tournament.roundFormats, 1) || 'bo1',
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
    propagateByes(matches);
    
    // Update the tournament with the bracket and update status
    await db.collection('tournaments').updateOne(
      { _id: id },
      { 
        $set: { 
          matches,
          status: 'registration', // Set to registration as the bracket is now generated
          updatedAt: new Date()
        }
      }
    );
    
    // Get the updated tournament
    const updatedTournament = await db.collection('tournaments').findOne({ _id: id });
    
    return res.status(200).json({ success: true, tournament: updatedTournament });
  } catch (error) {
    console.error('Error generating tournament bracket:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur lors de la génération de l\'arbre du tournoi' });
  }
}

// Helper function to get format for a specific round
function getRoundFormat(roundFormats, round) {
  if (!roundFormats || !Array.isArray(roundFormats)) return 'bo1';
  const roundConfig = roundFormats.find(r => r.round === round);
  return roundConfig ? roundConfig.format : 'bo1';
}

// Helper function to propagate byes up the bracket
function propagateByes(matches) {
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
        propagateByes([nextMatch], matchMap);
      } else if (nextMatch.player2 && nextMatch.player1 === null) {
        nextMatch.winner = nextMatch.player2;
        nextMatch.status = 'completed';
        nextMatch.completedAt = new Date();
        // Recursively propagate
        propagateByes([nextMatch], matchMap);
      }
    }
  });
}