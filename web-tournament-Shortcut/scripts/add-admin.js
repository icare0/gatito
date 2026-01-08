// scripts/add-admin.js
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

// Discord ID de l'utilisateur à promouvoir en admin
const DISCORD_ID = process.argv[2];

if (!DISCORD_ID) {
  console.error('Veuillez fournir l\'ID Discord de l\'utilisateur à promouvoir en admin');
  console.log('Usage: node scripts/add-admin.js <DISCORD_ID>');
  process.exit(1);
}

async function main() {
  if (!MONGODB_URI) {
    throw new Error('Veuillez définir la variable d\'environnement MONGODB_URI');
  }
  
  if (!MONGODB_DB) {
    throw new Error('Veuillez définir la variable d\'environnement MONGODB_DB');
  }
  
  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  try {
    await client.connect();
    console.log('Connecté à la base de données');
    
    const db = client.db(MONGODB_DB);
    
    // Vérifier si l'utilisateur existe
    const user = await db.collection('users').findOne({ iduser: DISCORD_ID });
    
    if (!user) {
      console.error(`Utilisateur avec l'ID ${DISCORD_ID} non trouvé dans la base de données`);
      return;
    }
    
    // Promouvoir l'utilisateur au rang d'administrateur
    await db.collection('users').updateOne(
      { iduser: DISCORD_ID },
      { $set: { role: 'admin', updatedAt: new Date() } }
    );
    
    console.log(`✅ L'utilisateur ${user.pseudo || DISCORD_ID} a été promu administrateur avec succès.`);
  } catch (error) {
    console.error('Une erreur est survenue:', error);
  } finally {
    await client.close();
    console.log('Déconnecté de la base de données');
  }
}

main().catch(console.error);