// pages/api/tournaments/[id]/matches/[matchId].js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { connectToDatabase } from '../../../../../lib/mongodb';

export default async function handler(req, res) {
  // Only accept GET and PUT requests
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }
  
  // Get the current session
  const session = await getServerSession(req, res, authOptions);
  
  // Check if the user is authenticated
  if (!session) {
    return res.status(401).json({ success: false, error: 'Non authentifié' });
  }
  
  // Connect to the database
  const { db } = await connectToDatabase();
  
  // Get the tournament ID and match ID from the URL query
  const { id, matchId } = req.query;
  
  // Validate the IDs
  if (!id || !matchId) {
    return res.status(400).json({ success: false, error: 'ID de tournoi ou de match manquant' });
  }
  
  try {
    // Get the tournament
    const tournament = await db.collection('tournaments').findOne({ _id: id });
    
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournoi non trouvé' });
    }
    
    // Find the match
    const match = tournament.matches.find(m => m.matchId === matchId);
    
    if (!match) {
      return res.status(404).json({ success: false, error: 'Match non trouvé' });
    }
    
    // GET - Fetch match details
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, match });
    }
    
    // PUT - Update match results
    if (req.method === 'PUT') {
      // Extract data from request body
      const { scores, reportedBy } = req.body;
      
      // Validate the scores
      if (!scores || typeof scores.player1 !== 'number' || typeof scores.player2 !== 'number') {
        return res.status(400).json({ success: false, error: 'Scores de match invalides' });
      }
      
      // Check if the tournament is in the ongoing state
      if (tournament.status !== 'ongoing' && !session.user.isAdmin) {
        return res.status(400).json({ success: false, error: 'Le tournoi n\'est pas en cours' });
      }
      
      // Check if the match is pending or in progress
      if (match.status === 'completed' && !session.user.isAdmin) {
        return res.status(400).json({ success: false, error: 'Ce match est déjà terminé' });
      }
      
      // Check if the user is a participant in the match or an admin
      if (!session.user.isAdmin && match.player1 !== session.user.id && match.player2 !== session.user.id) {
        return res.status(403).json({ success: false, error: 'Vous n\'êtes pas autorisé à mettre à jour ce match' });
      }
      
      // Determine the winner based on scores
      let winner = null;
      let matchStatus = 'completed';
      
      if (scores.player1 > scores.player2) {
        winner = match.player1;
      } else if (scores.player2 > scores.player1) {
        winner = match.player2;
      } else {
        // In case of a tie, don't update the winner
        matchStatus = 'in_progress';
      }
      
      // Update the match
      const matchIndex = tournament.matches.findIndex(m => m.matchId === matchId);
      
      if (matchIndex === -1) {
        return res.status(404).json({ success: false, error: 'Match non trouvé dans le tournoi' });
      }
      
      // Create updated match object
      const updatedMatch = {
        ...match,
        scores,
        status: matchStatus,
        winner: winner,
        updatedAt: new Date(),
        reportedBy: reportedBy || session.user.id
      };
      
      if (matchStatus === 'completed') {
        updatedMatch.completedAt = new Date();
      }
      
      // Update the tournament's matches array
      const updatedMatches = [...tournament.matches];
      updatedMatches[matchIndex] = updatedMatch;
      
      // If the match is completed and has a winner, propagate to the next match
      if (matchStatus === 'completed' && winner && match.nextMatchId) {
        const nextMatch = updatedMatches.find(m => m.matchId === match.nextMatchId);
        
        if (nextMatch) {
          // Determine which slot (player1 or player2) to advance the winner to
          if (match.position % 2 === 1) {
            nextMatch.player1 = winner;
          } else {
            nextMatch.player2 = winner;
          }
          
          // If both players are now assigned, update the next match status to in_progress
          if (nextMatch.player1 && nextMatch.player2) {
            nextMatch.status = 'in_progress';
          }
        }
      }
      
      // Save the updated tournament
      await db.collection('tournaments').updateOne(
        { _id: id },
        { 
          $set: { 
            matches: updatedMatches,
            updatedAt: new Date()
          }
        }
      );
      
      // Check if this is the final match and update tournament status if needed
      const finalMatch = updatedMatches.find(m => m.round === Math.max(...updatedMatches.map(m => m.round)));
      if (finalMatch && finalMatch.status === 'completed' && finalMatch.winner) {
        // Final match is completed, update tournament status to completed
        await db.collection('tournaments').updateOne(
          { _id: id },
          { 
            $set: { 
              status: 'completed',
              winner: finalMatch.winner,
              updatedAt: new Date()
            }
          }
        );
        
        // Update the participant status to 'winner'
        await db.collection('tournaments').updateOne(
          { _id: id, 'participants.userId': finalMatch.winner },
          { 
            $set: { 
              'participants.$.status': 'winner',
              updatedAt: new Date()
            }
          }
        );
      }
      
      // Get the updated tournament
      const updatedTournament = await db.collection('tournaments').findOne({ _id: id });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Match mis à jour avec succès',
        match: updatedTournament.matches.find(m => m.matchId === matchId),
        tournament: updatedTournament
      });
    }
  } catch (error) {
    console.error('Error handling tournament match request:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur lors de la mise à jour du match' });
  }
}