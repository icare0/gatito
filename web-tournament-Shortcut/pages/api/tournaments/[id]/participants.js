// pages/api/tournaments/[id]/participants.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { connectToDatabase } from '../../../../lib/mongodb';

export default async function handler(req, res) {
  // Get the current session
  const session = await getServerSession(req, res, authOptions);
  
  // Check if the user is authenticated
  if (!session) {
    return res.status(401).json({ success: false, error: 'Non authentifié' });
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
    
    // GET - List participants
    if (req.method === 'GET') {
      if (tournament.participants && tournament.participants.length > 0) {
        const participantIds = tournament.participants.map(p => p.userId);
        const participants = await db.collection('users')
          .find({ iduser: { $in: participantIds } })
          .toArray();
        
        return res.status(200).json({ success: true, participants });
      }
      
      return res.status(200).json({ success: true, participants: [] });
    }
    
    // POST - Register a user to the tournament
    if (req.method === 'POST') {
      // Check if the tournament is in registration phase
      if (tournament.status !== 'registration' && tournament.status !== 'draft' && !session.user.isAdmin) {
        return res.status(400).json({ success: false, error: 'Les inscriptions pour ce tournoi sont fermées' });
      }
      
      // Get the user ID from the request body
      const { userId } = req.body;
      
      // If not admin, the user can only register themselves
      if (!session.user.isAdmin && userId !== session.user.id) {
        return res.status(403).json({ success: false, error: 'Vous ne pouvez inscrire que vous-même au tournoi' });
      }
      
      // Check if user exists
      const user = await db.collection('users').findOne({ iduser: userId });
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
      }
      
      // Check if user is already registered
      const isRegistered = tournament.participants.some(p => p.userId === userId);
      
      if (isRegistered) {
        return res.status(400).json({ success: false, error: 'Cet utilisateur est déjà inscrit au tournoi' });
      }
      
      // Register the user
      const participant = {
        userId,
        seed: tournament.participants.length + 1, // Simple seeding based on registration order
        registeredAt: new Date(),
        status: 'registered'
      };
      
      // Update the tournament
      await db.collection('tournaments').updateOne(
        { _id: id },
        { 
          $push: { participants: participant },
          $set: { updatedAt: new Date() }
        }
      );
      
      const updatedTournament = await db.collection('tournaments').findOne({ _id: id });
      
      return res.status(200).json({ success: true, participant, tournament: updatedTournament });
    }
    
    // DELETE - Unregister a user from the tournament
    if (req.method === 'DELETE') {
      // Get the user ID from the request body
      const { userId } = req.body;
      
      // If not admin, the user can only unregister themselves
      if (!session.user.isAdmin && userId !== session.user.id) {
        return res.status(403).json({ success: false, error: 'Vous ne pouvez désinscrire que vous-même du tournoi' });
      }
      
      // Check if the tournament is in registration phase or draft
      if (tournament.status !== 'registration' && tournament.status !== 'draft' && !session.user.isAdmin) {
        return res.status(400).json({ success: false, error: 'Les inscriptions pour ce tournoi sont fermées' });
      }
      
      // Check if user is registered
      const isRegistered = tournament.participants.some(p => p.userId === userId);
      
      if (!isRegistered) {
        return res.status(400).json({ success: false, error: 'Cet utilisateur n\'est pas inscrit au tournoi' });
      }
      
      // Remove the user from participants
      await db.collection('tournaments').updateOne(
        { _id: id },
        { 
          $pull: { participants: { userId } },
          $set: { updatedAt: new Date() }
        }
      );
      
      // Re-seed the remaining participants
      const updatedTournament = await db.collection('tournaments').findOne({ _id: id });
      const reseededParticipants = updatedTournament.participants.map((p, index) => ({
        ...p,
        seed: index + 1
      }));
      
      // Update the tournament with reseeded participants
      await db.collection('tournaments').updateOne(
        { _id: id },
        { 
          $set: { 
            participants: reseededParticipants,
            updatedAt: new Date()
          }
        }
      );
      
      const finalTournament = await db.collection('tournaments').findOne({ _id: id });
      
      return res.status(200).json({ success: true, message: 'Utilisateur désinscrit avec succès', tournament: finalTournament });
    }
    
    // Method not allowed for other HTTP methods
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Error handling tournament participants request:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}