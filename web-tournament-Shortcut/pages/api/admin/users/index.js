// pages/api/admin/users/index.js
import { connectToDatabase } from '../../../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  // Check authentication and admin rights
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user.isAdmin) {
    return res.status(403).json({ success: false, error: 'Accès non autorisé' });
  }
  
  const { db } = await connectToDatabase();
  
  // GET - Retrieve all users
  if (req.method === 'GET') {
    try {
      const { limit = 100, sort = 'createdAt', direction = 'desc', search = '', includeClans = 'true' } = req.query;
      
      // Build the query
      let query = {};
      
      // Add search if present
      if (search) {
        query = {
          $or: [
            { pseudo: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { iduser: { $regex: search, $options: 'i' } }
          ]
        };
      }
      
      // Build the sort option
      const sortOption = {};
      sortOption[sort] = direction === 'asc' ? 1 : -1;
      
      // Execute the query
      let users = await db.collection('users')
        .find(query)
        .sort(sortOption)
        .limit(parseInt(limit))
        .toArray();
      
      // Include clan information if requested
      if (includeClans === 'true') {
        // Get all clans
        const clans = await db.collection('clans').find({}).toArray();
        
        // Map clan data to users
        users = users.map(user => {
          // Find a clan where this user is a member
          const userClan = clans.find(clan => 
            clan.members && clan.members.some(member => member.userId === user.iduser)
          );
          
          // If user belongs to a clan, add clan info
          if (userClan) {
            return {
              ...user,
              clanId: userClan.idClan,
              clanName: userClan.Name,
              clanRole: userClan.members.find(member => member.userId === user.iduser)?.role || 'Member'
            };
          }
          
          return user;
        });
      }
      
      return res.status(200).json({ success: true, users });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des utilisateurs' 
      });
    }
  }
  
  // Method not supported
  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}