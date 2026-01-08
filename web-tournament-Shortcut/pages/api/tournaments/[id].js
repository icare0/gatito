// pages/api/tournaments/[id].js - VERSION CORRIGÉE
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

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
    // GET - Fetch a specific tournament
    if (req.method === 'GET') {
      // Get the tournament
      const tournament = await db.collection('tournaments').findOne({ _id: id });
      
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournoi non trouvé' });
      }
      
      console.log('🔍 API GET TOURNAMENT - DÉBUT RECHERCHE PARTICIPANTS:', {
        tournamentName: tournament.name,
        participantsInTournament: tournament.participants?.length || 0
      });
      
      // AMÉLIORATION: Récupérer les participants avec logique de recherche améliorée
      let participants = [];
      
      if (tournament.participants && tournament.participants.length > 0) {
        const participantIds = tournament.participants.map(p => p.userId).filter(Boolean);
        
        console.log('🔍 API - IDS À RECHERCHER:', {
          count: participantIds.length,
          ids: participantIds.slice(0, 5),
          types: participantIds.slice(0, 3).map(id => ({ id, type: typeof id }))
        });
        
        // Étape 1: Chercher par iduser
        participants = await db.collection('users')
          .find({ iduser: { $in: participantIds } })
          .project({ 
            iduser: 1, 
            pseudo: 1, 
            username: 1,
            displayName: 1,
            name: 1,
            nickname: 1,
            avatar: 1, 
            elo: 1,
            rank: 1,
            role: 1,
            discordId: 1
          })
          .toArray();
        
        console.log('🔍 API - RECHERCHE PAR IDUSER:', {
          found: participants.length,
          sample: participants.slice(0, 2).map(p => ({ iduser: p.iduser, pseudo: p.pseudo }))
        });
        
        // Étape 2: Si pas trouvé, chercher par discordId
        if (participants.length === 0) {
          console.log('🔄 API - TENTATIVE PAR DISCORD ID...');
          participants = await db.collection('users')
            .find({ discordId: { $in: participantIds } })
            .project({ 
              iduser: 1, 
              pseudo: 1, 
              username: 1,
              displayName: 1,
              name: 1,
              nickname: 1,
              avatar: 1, 
              elo: 1,
              rank: 1,
              role: 1,
              discordId: 1
            })
            .toArray();
          
          console.log('🔍 API - RECHERCHE PAR DISCORD ID:', {
            found: participants.length,
            sample: participants.slice(0, 2).map(p => ({ discordId: p.discordId, pseudo: p.pseudo }))
          });
        }
        
        // Étape 3: Si toujours pas trouvé, chercher par username ou autres champs
        if (participants.length === 0) {
          console.log('🔄 API - TENTATIVE PAR USERNAME...');
          participants = await db.collection('users')
            .find({ username: { $in: participantIds } })
            .project({ 
              iduser: 1, 
              pseudo: 1, 
              username: 1,
              displayName: 1,
              name: 1,
              nickname: 1,
              avatar: 1, 
              elo: 1,
              rank: 1,
              role: 1,
              discordId: 1
            })
            .toArray();
          
          console.log('🔍 API - RECHERCHE PAR USERNAME:', {
            found: participants.length,
            sample: participants.slice(0, 2).map(p => ({ username: p.username, pseudo: p.pseudo }))
          });
        }
        
        // Debug: Afficher quelques utilisateurs de la DB pour comparaison
        if (participants.length === 0) {
          const sampleUsers = await db.collection('users')
            .find({})
            .limit(5)
            .project({ iduser: 1, discordId: 1, username: 1, pseudo: 1, displayName: 1, name: 1 })
            .toArray();
          
          console.log('🔍 API - SAMPLE USERS DANS LA DB:', {
            totalUsers: await db.collection('users').countDocuments(),
            sample: sampleUsers.map(u => ({
              iduser: u.iduser,
              discordId: u.discordId,
              username: u.username,
              pseudo: u.pseudo,
              displayName: u.displayName,
              name: u.name
            }))
          });
          
          console.log('❌ API - AUCUN PARTICIPANT TROUVÉ ! Comparaison IDs:', {
            recherchés: participantIds,
            échantillonDB: sampleUsers.map(u => u.iduser || u.discordId || u.username),
            champsDisponibles: sampleUsers.length > 0 ? Object.keys(sampleUsers[0]) : []
          });
        }
      }
      
      console.log('✅ API GET TOURNAMENT - RÉSULTAT FINAL:', {
        participantsInTournament: tournament.participants?.length || 0,
        participantsFromDB: participants.length,
        success: participants.length > 0
      });
      
      return res.status(200).json({ 
        success: true, 
        tournament,
        participants
      });
    }
    
    // Check if the user is an admin for all other methods
    if (!session.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Non autorisé - Seuls les administrateurs peuvent effectuer cette action' });
    }
    
    // PUT - Update a tournament
    if (req.method === 'PUT') {
      // Extract and validate the fields from the request body
      const { 
        name, 
        description, 
        startDate, 
        endDate, 
        registrationEndDate, 
        status, 
        format, 
        rules, 
        roundFormats, 
        prizes 
      } = req.body;
      
      // Basic validation
      if (!name || !description || !startDate || !endDate || !registrationEndDate || !status || !format) {
        return res.status(400).json({ success: false, error: 'Tous les champs obligatoires doivent être fournis' });
      }
      
      // Create update object
      const updateData = {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationEndDate: new Date(registrationEndDate),
        status,
        format,
        rules: rules || '',
        roundFormats: roundFormats || [],
        prizes: prizes || [],
        updatedAt: new Date(),
      };
      
      // Update the tournament in the database
      const result = await db.collection('tournaments').updateOne(
        { _id: id },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, error: 'Tournoi non trouvé' });
      }
      
      // Get the updated tournament
      const updatedTournament = await db.collection('tournaments').findOne({ _id: id });
      
      return res.status(200).json({ success: true, tournament: updatedTournament });
    }
    
    // DELETE - Delete a tournament
    if (req.method === 'DELETE') {
      // Delete the tournament from the database
      const result = await db.collection('tournaments').deleteOne({ _id: id });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, error: 'Tournoi non trouvé' });
      }
      
      return res.status(200).json({ success: true, message: 'Tournoi supprimé avec succès' });
    }
    
    // Method not allowed for other HTTP methods
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('❌ API ERROR - tournaments/[id]:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}