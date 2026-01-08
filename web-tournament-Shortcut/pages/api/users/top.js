
// pages/api/users/top.js
import { getTopUsers } from '../../../lib/db';

export default async function handler(req, res) {
  const { sort = 'elo', limit = 10 } = req.query;
  
  try {
    const users = await getTopUsers(parseInt(limit), sort);
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error in API route /api/users/top:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des utilisateurs' 
    });
  }
}
