// pages/api/tournaments/[id]/start.js
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
    return res.status(403).json({ success: false, error: 'Non autorisé - Seuls les administrateurs peuvent démarrer le tournoi' });
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
    
    // Check if the tournament is in registration state
    if (tournament.status !== 'registration') {
      return res.status(400).json({ success: false, error: 'Le tournoi ne peut être démarré que s\'il est en phase d\'inscription' });
    }
    
    // Check if the tournament has a bracket generated
    if (!tournament.matches || tournament.matches.length === 0) {
      return res.status(400).json({ success: false, error: 'L\'arbre du tournoi doit être généré avant de pouvoir démarrer le tournoi' });
    }
    
    // Update first round matches status to in_progress
    const firstRoundMatches = tournament.matches.filter(match => match.round === 1 && match.status !== 'completed');
    
    if (firstRoundMatches.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun match de premier tour disponible' });
    }
    
    // Update matches status
    const updatedMatches = tournament.matches.map(match => {
      if (match.round === 1 && match.status === 'pending' && match.player1 && match.player2) {
        return {
          ...match,
          status: 'in_progress'
        };
      }
      return match;
    });
    
    // Update tournament status to ongoing
    await db.collection('tournaments').updateOne(
      { _id: id },
      { 
        $set: { 
          status: 'ongoing',
          matches: updatedMatches,
          startedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
    
    // Get the updated tournament
    const updatedTournament = await db.collection('tournaments').findOne({ _id: id });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Tournoi démarré avec succès',
      tournament: updatedTournament
    });
  } catch (error) {
    console.error('Error starting tournament:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur lors du démarrage du tournoi' });
  }
}