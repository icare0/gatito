// lib/mongodb.js
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

// Vérification des variables d'environnement
if (!MONGODB_URI) {
  throw new Error('Veuillez définir la variable d\'environnement MONGODB_URI');
}

if (!MONGODB_DB) {
  throw new Error('Veuillez définir la variable d\'environnement MONGODB_DB');
}

/**
 * Global est utilisé ici pour maintenir la connexion à la base de données
 * entre les rechargements de hot-reloading en développement.
 * Cela évite de se connecter à la base de données à chaque requête API.
 */
let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts).then((client) => {
      return {
        client,
        db: client.db(MONGODB_DB),
      };
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Fonction utilitaire pour convertir les _id en chaînes
export function convertDocToObj(doc) {
  if (doc._id) {
    doc.id = doc._id.toString();
    delete doc._id;
  }
  return doc;
}