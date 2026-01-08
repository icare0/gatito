

// pages/api/users/[id].js
import { getUserById, getMatchesByUserId } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID utilisateur requis' 
    });
  }
  
  try {
    const user = await getUserById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }
    
    // Récupérer les matchs récents de l'utilisateur
    const recentMatches = await getMatchesByUserId(id, 5);
    
    res.status(200).json({ 
      success: true, 
      user,
      recentMatches
    });
  } catch (error) {
    console.error(`Error in API route /api/users/${id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'utilisateur' 
    });
  }
}
