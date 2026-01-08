// pages/api/users/[id]/matches.js
import { connectToDatabase } from '../../../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  const { id } = req.query;
  const limit = parseInt(req.query.limit) || 30; // Higher default limit for better initial load
  
  if (!id) {
    return res.status(400).json({ success: false, error: 'User ID required' });
  }
  
  try {
    const { db } = await connectToDatabase();
    
    // Get the user for verification
    const user = await db.collection('users').findOne({ iduser: id });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Get all completed matches for this user
    const matchesQuery = {
      status: 'completed',
      $or: [
        { player1: id },
        { player2: id }
      ]
    };
    
    // Get the total count first for pagination info
    const totalMatches = await db.collection('matchmakings').countDocuments(matchesQuery);
    
    // Then get the actual matches
    const matches = await db.collection('matchmakings')
      .find(matchesQuery)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
    
    // Get all opponent IDs from matches
    const opponentIds = matches.map(match => 
      match.player1 === id ? match.player2 : match.player1
    ).filter(Boolean);
    
    // Get opponents data in a single query
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
    
    // Create a map for quick opponent lookup
    const opponentsMap = {};
    opponents.forEach(opponent => {
      opponentsMap[opponent.iduser] = opponent;
    });
    
    // Process matches data with detailed opponent info
    const enrichedMatches = matches.map(match => {
      // Get opponent ID
      const opponentId = match.player1 === id ? match.player2 : match.player1;
      const opponent = opponentsMap[opponentId] || null;
      
      // Calculate match duration if not already set
      let duration = match.duration;
      if (!duration && match.createdAt && match.updatedAt) {
        duration = Math.floor((new Date(match.updatedAt) - new Date(match.createdAt)) / 1000);
      }
      
      return {
        id: match._id.toString(),
        matchId: match.matchId,
        createdAt: match.createdAt || null,
        updatedAt: match.updatedAt || null,
        completedAt: match.completedAt || match.updatedAt || null,
        player1Id: match.player1,
        player2Id: match.player2,
        winner: match.winner,
        duration: duration,
        opponent: opponent ? {
          id: opponent.iduser,
          pseudo: opponent.pseudo,
          avatar: opponent.avatar,
          elo: opponent.elo,
          rank: opponent.rank
        } : null,
        gameDetails: match.gameDetails || null,
        matchNotes: match.matchNotes || null
      };
    });
    
    // Return the processed matches
    return res.status(200).json({
      success: true,
      matches: enrichedMatches,
      total: totalMatches
    });
  } catch (error) {
    console.error('Error fetching user matches:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error fetching user matches' 
    });
  }
}