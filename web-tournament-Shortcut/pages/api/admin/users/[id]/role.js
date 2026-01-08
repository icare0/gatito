// pages/api/admin/users/[id]/role.js
import { connectToDatabase } from '../../../../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';

export default async function handler(req, res) {
  // Vérifier l'authentification et les droits d'admin
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user.isAdmin) {
    return res.status(403).json({ success: false, error: 'Accès non autorisé' });
  }
  
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ success: false, error: 'ID utilisateur manquant' });
  }
  
  // PUT - Mettre à jour le rôle d'un utilisateur
  if (req.method === 'PUT') {
    try {
      const { role } = req.body;
      
      // Validation
      if (!role || !['admin', 'moderator', 'user'].includes(role)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Rôle invalide. Les rôles valides sont: admin, moderator, user' 
        });
      }
      
      const { db } = await connectToDatabase();
      
      // Vérifier que l'administrateur ne se rétrograde pas lui-même
      if (id === session.user.id && role !== 'admin') {
        return res.status(400).json({ 
          success: false, 
          error: 'Vous ne pouvez pas vous rétrograder vous-même' 
        });
      }
      
      // Mettre à jour le rôle de l'utilisateur
      const result = await db.collection('users').updateOne(
        { iduser: id },
        { 
          $set: {
            role,
            updatedAt: new Date()
          } 
        }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: `Rôle de l'utilisateur mis à jour en "${role}"` 
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la mise à jour du rôle de l\'utilisateur' 
      });
    }
  }
  
  // GET - Obtenir le rôle actuel de l'utilisateur
  if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      
      const user = await db.collection('users').findOne(
        { iduser: id },
        { projection: { role: 1 } }
      );
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
      }
      
      return res.status(200).json({ 
        success: true, 
        role: user.role || 'user'
      });
    } catch (error) {
      console.error('Error getting user role:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération du rôle de l\'utilisateur' 
      });
    }
  }
  
  // Méthode non prise en charge
  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}