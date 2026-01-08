// pages/api/users/update.js
import { getServerSession } from 'next-auth/next';
import { connectToDatabase } from '../../../lib/mongodb';
import { authOptions } from '../auth/[...nextauth]';

// Expressions régulières pour la validation
const PSEUDO_REGEX = /^[a-zA-Z0-9_\-.]{3,20}$/;
const FRIEND_CODE_REGEX = /^SW-\d{4}-\d{4}-\d{4}$/;

// Fonction utilitaire pour les réponses d'erreur
const createErrorResponse = (statusCode, message, details = null) => {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    response.details = details;
  }
  
  return { statusCode, response };
};

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    const { statusCode, response } = createErrorResponse(
      405, 
      'Méthode non autorisée'
    );
    return res.status(statusCode).json(response);
  }
  
  try {
    // Get the current session
    const session = await getServerSession(req, res, authOptions);
    
    // Check if the user is authenticated
    if (!session) {
      const { statusCode, response } = createErrorResponse(
        401, 
        'Non authentifié'
      );
      return res.status(statusCode).json(response);
    }
    
    const { userId, updates } = req.body;
    
    // Verify that the user is updating their own profile
    if (session.user.id !== userId) {
      const { statusCode, response } = createErrorResponse(
        403, 
        'Non autorisé à modifier ce profil'
      );
      return res.status(statusCode).json(response);
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Validate updates
    const sanitizedUpdates = {};
    const validationErrors = [];
    
    // Validation du pseudo
    if (updates.hasOwnProperty('pseudo')) {
      const pseudo = updates.pseudo?.trim();
      if (!pseudo) {
        validationErrors.push('Le pseudo ne peut pas être vide');
      } else if (!PSEUDO_REGEX.test(pseudo)) {
        validationErrors.push('Le pseudo doit contenir entre 3 et 20 caractères alphanumériques, tirets, points ou underscores');
      } else {
        sanitizedUpdates.pseudo = pseudo;
        sanitizedUpdates.pseudoCustomized = true;
      }
    }
    
    // Validation du code ami
    if (updates.hasOwnProperty('codeAmis')) {
      const codeAmis = updates.codeAmis?.trim();
      if (codeAmis && !FRIEND_CODE_REGEX.test(codeAmis)) {
        validationErrors.push('Le code ami doit être au format SW-XXXX-XXXX-XXXX');
      } else {
        sanitizedUpdates.codeAmis = codeAmis;
      }
    }
    
    // Vérification des erreurs de validation
    if (validationErrors.length > 0) {
      const { statusCode, response } = createErrorResponse(
        400,
        'Données invalides',
        { validationErrors }
      );
      return res.status(statusCode).json(response);
    }
    
    // Check if there are any valid updates
    if (Object.keys(sanitizedUpdates).length === 0) {
      const { statusCode, response } = createErrorResponse(
        400,
        'Aucune mise à jour valide fournie'
      );
      return res.status(statusCode).json(response);
    }
    
    // Add a timestamp for the update
    sanitizedUpdates.updatedAt = new Date();
    
    // Vérification anti-doublons de pseudo
    if (sanitizedUpdates.pseudo) {
      const existingUser = await db.collection('users').findOne({
        iduser: { $ne: userId },
        pseudo: sanitizedUpdates.pseudo
      });
      
      if (existingUser) {
        const { statusCode, response } = createErrorResponse(
          409,
          'Ce pseudo est déjà utilisé par un autre joueur'
        );
        return res.status(statusCode).json(response);
      }
    }
    
    // Update the user in the database
    const result = await db.collection('users').updateOne(
      { iduser: userId },
      { $set: sanitizedUpdates }
    );
    
    if (result.matchedCount === 0) {
      const { statusCode, response } = createErrorResponse(
        404,
        'Utilisateur non trouvé'
      );
      return res.status(statusCode).json(response);
    }
    
    // Journal d'audit pour les modifications
    await db.collection('userAuditLogs').insertOne({
      userId,
      action: 'profile_update',
      changes: sanitizedUpdates,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });
    
    return res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      updatedFields: Object.keys(sanitizedUpdates).filter(k => k !== 'updatedAt')
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    let errorMessage = 'Erreur serveur lors de la mise à jour du profil';
    let statusCode = 500;
    let details = null;
    
    if (error.name === 'MongoServerError') {
      if (error.code === 11000) { // Violation de contrainte d'unicité
        errorMessage = 'Les informations fournies sont déjà utilisées';
        statusCode = 409;
        details = { code: error.code, duplicateKey: error.keyPattern };
      } else {
        errorMessage = 'Erreur de base de données';
        details = { code: error.code };
      }
    }
    
    const { response } = createErrorResponse(
      statusCode, 
      errorMessage, 
      details
    );
    
    return res.status(statusCode).json(response);
  }
}