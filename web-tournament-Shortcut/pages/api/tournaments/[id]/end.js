// pages/api/tournaments/[id]/end.js
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
    return res.status(403).json({ success: false, error: 'Non autorisé - Seuls les administrateurs peuvent terminer le tournoi' });
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
    
    // Check if the tournament is in ongoing state
    if (tournament.status !== 'ongoing') {
      return res.status(400).json({ success: false, error: 'Le tournoi ne peut être terminé que s\'il est en cours' });
    }
    
    // Find the final match
    const finalMatch = tournament.matches.find(match => 
      match.round === Math.max(...tournament.matches.map(m => m.round))
    );
    
    let winner = null;
    
    // If the final match is completed, use its winner
    if (finalMatch && finalMatch.status === 'completed' && finalMatch.winner) {
      winner = finalMatch.winner;
    }
    
    // Update tournament status to completed
    await db.collection('tournaments').updateOne(
      { _id: id },
      { 
        $set: { 
          status: 'completed',
          winner: winner,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
    
    // If there's a winner, update participant status
    if (winner) {
      await db.collection('tournaments').updateOne(
        { _id: id, 'participants.userId': winner },
        { 
          $set: { 
            'participants.$.status': 'winner'
          }
        }
      );
    }
    
    // Get the updated tournament
    const updatedTournament = await db.collection('tournaments').findOne({ _id: id });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Tournoi terminé avec succès',
      tournament: updatedTournament
    });
  } catch (error) {
    console.error('Error ending tournament:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur lors de la clôture du tournoi' });
  }
}