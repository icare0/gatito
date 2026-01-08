// pages/api/admin/check-admin.js
import { connectToDatabase } from '../../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // Vérifier si l'utilisateur est connecté
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ 
      success: false, 
      isAdmin: false, 
      message: 'Non authentifié',
      debug: {
        hasSession: false
      }
    });
  }
  
  try {
    const { db } = await connectToDatabase();
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await db.collection('users').findOne({ iduser: session.user.id });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        isAdmin: false, 
        message: 'Utilisateur non trouvé dans la base de données',
        debug: {
          hasSession: true,
          userId: session.user.id,
          userFound: false
        }
      });
    }
    
    // Vérifier si l'utilisateur est admin
    const isAdmin = user.role === 'admin';
    
    return res.status(200).json({ 
      success: true, 
      isAdmin,
      message: isAdmin ? 'Utilisateur administrateur' : 'Utilisateur non administrateur',
      debug: {
        hasSession: true,
        userId: session.user.id,
        userFound: true,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la vérification des droits administrateur',
      debug: {
        hasSession: true,
        userId: session.user.id,
        error: error.message
      }
    });
  }
}