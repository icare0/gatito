import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  // Get the current session
  const session = await getServerSession(req, res, authOptions);
  
  // Connect to the database
  const { db } = await connectToDatabase();
  
  try {
    // GET - List tournaments
    if (req.method === 'GET') {
      // Parse query parameters
      const { status, limit = 20, sort = 'startDate', direction = 'desc' } = req.query;
      
      // Build the query
      const query = {};
      if (status && status !== 'all') {
        query.status = status;
      }
      
      // If not admin, only show non-draft tournaments
      if (!session?.user?.isAdmin) {
        query.status = { $ne: 'draft' };
      }
      
      // Get tournaments from DB
      const tournaments = await db.collection('tournaments')
        .find(query)
        .sort({ [sort]: direction === 'desc' ? -1 : 1 })
        .limit(parseInt(limit))
        .toArray();
      
      return res.status(200).json({ success: true, tournaments });
    }
    
    // POST - Create a new tournament
    if (req.method === 'POST') {
      // Check if the user is authenticated and is admin
      if (!session || !session.user.isAdmin) {
        return res.status(403).json({ success: false, error: 'Non autorisé - Seuls les administrateurs peuvent créer des tournois' });
      }
      
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
      
      // Create the tournament document
      const tournament = {
        _id: new Date().getTime().toString(), // Simple ID generation using timestamp
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationEndDate: new Date(registrationEndDate),
        status,
        format,
        rules: rules || '',
        participants: [],
        matches: [],
        roundFormats: roundFormats || [],
        prizes: prizes || [],
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Insert the tournament into the database
      await db.collection('tournaments').insertOne(tournament);
      
      return res.status(201).json({ success: true, tournament });
    }
    
    // Method not allowed for other HTTP methods
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Error handling tournaments request:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}