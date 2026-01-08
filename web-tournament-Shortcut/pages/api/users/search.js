
// pages/api/users/search.js
import { searchUsers } from '../../../lib/db';

export default async function handler(req, res) {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ 
      success: false, 
      error: 'Terme de recherche requis' 
    });
  }
  
  try {
    const users = await searchUsers(q);
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error in API route /api/users/search:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la recherche d\'utilisateurs' 
    });
  }
}
