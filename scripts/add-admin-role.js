#!/usr/bin/env node

const { Client } = require('pg');
require('dotenv').config();

async function addAdminRole() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔄 Connexion à la base de données...');
    await client.connect();

    // Ajouter la colonne is_admin si elle n'existe pas
    console.log('📊 Ajout de la colonne is_admin...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false
    `);

    console.log('✅ Colonne is_admin ajoutée avec succès');

    // Mettre à jour l'utilisateur admin existant
    const adminEmail = 'admin@mdmcmusicads.com';
    const result = await client.query(
      'UPDATE users SET is_admin = true WHERE email = $1 RETURNING id, email, is_admin',
      [adminEmail]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Utilisateur ${adminEmail} configuré comme super admin`);
    } else {
      console.log(`⚠️ Utilisateur ${adminEmail} non trouvé`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addAdminRole().catch(console.error);