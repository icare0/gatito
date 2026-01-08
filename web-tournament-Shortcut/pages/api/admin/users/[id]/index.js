// pages/api/admin/users/[id]/index.js
import { connectToDatabase } from '../../../../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';

export default async function handler(req, res) {
  // Check authentication and admin rights
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user.isAdmin) {
    return res.status(403).json({ success: false, error: 'Accès non autorisé' });
  }
  
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ success: false, error: 'ID utilisateur manquant' });
  }
  
  const { db } = await connectToDatabase();
  
  // GET - Retrieve a user
  if (req.method === 'GET') {
    try {
      const user = await db.collection('users').findOne({ iduser: id });
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
      }
      
      // Look up clan data if user is in a clan
      let clanData = null;
      const clan = await db.collection('clans').findOne({
        "members.userId": id
      });
      
      if (clan) {
        const userMember = clan.members.find(member => member.userId === id);
        clanData = {
          clanId: clan.idClan,
          clanName: clan.Name,
          clanRole: userMember?.role || 'Member'
        };
      }
      
      return res.status(200).json({ 
        success: true, 
        user: { ...user, ...clanData }
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération de l\'utilisateur' 
      });
    }
  }
  
  // PUT - Update a user
  if (req.method === 'PUT') {
    try {
      const { pseudo, email, role, elo, rank, codeAmis } = req.body;
      
      // Validation
      if (!pseudo) {
        return res.status(400).json({ 
          success: false, 
          error: 'Le pseudo est requis' 
        });
      }
      
      // Check if new pseudo is already taken by another user
      if (pseudo) {
        const existingUser = await db.collection('users').findOne({
          iduser: { $ne: id },
          pseudo: pseudo
        });
        
        if (existingUser) {
          return res.status(409).json({
            success: false,
            error: 'Ce pseudo est déjà utilisé par un autre utilisateur'
          });
        }
      }
      
      // Build update object
      const updateFields = {
        pseudo,
        role,
        elo: parseInt(elo, 10),
        rank,
        updatedAt: new Date()
      };
      
      // Add optional fields if provided
      if (email) updateFields.email = email;
      if (codeAmis) updateFields.codeAmis = codeAmis;
      
      // Update the user
      const result = await db.collection('users').updateOne(
        { iduser: id },
        { $set: updateFields }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Utilisateur non trouvé' 
        });
      }
      
      // Recalculate user's winRate
      await db.collection('users').updateOne(
        { iduser: id },
        [{
          $set: {
            winRate: {
              $cond: [
                { $gt: ["$totalMatches", 0] },
                { $multiply: [{ $divide: ["$victories", "$totalMatches"] }, 100] },
                0
              ]
            }
          }
        }]
      );
      
      // Fetch the updated user
      const updatedUser = await db.collection('users').findOne({ iduser: id });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Utilisateur mis à jour avec succès',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la mise à jour de l\'utilisateur' 
      });
    }
  }
  
  // Method not supported
  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}