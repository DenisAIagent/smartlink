#!/usr/bin/env node

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createUser() {
  // Récupérer les arguments de la ligne de commande
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: npm run user:create:cli -- <email> <password> <displayName> [plan]');
    console.log('Example: npm run user:create:cli -- user@example.com password123 "John Doe" pro');
    process.exit(1);
  }

  const [email, password, displayName, plan = 'free'] = args;

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Validation
    if (!email.includes('@')) {
      console.error('❌ Email invalide');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Le mot de passe doit contenir au moins 6 caractères');
      process.exit(1);
    }

    // Connexion à la base de données
    console.log('🔄 Connexion à la base de données...');
    await client.connect();

    // Vérifier si l'email existe déjà
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.error('❌ Un utilisateur avec cet email existe déjà');
      process.exit(1);
    }

    // Hasher le mot de passe
    console.log('🔒 Hashage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    console.log('✨ Création de l\'utilisateur...');
    const result = await client.query(
      `INSERT INTO users (email, password_hash, display_name, plan, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, email, display_name, plan`,
      [email, hashedPassword, displayName, plan]
    );

    const newUser = result.rows[0];

    console.log('\n✅ Utilisateur créé avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${newUser.email}`);
    console.log(`👤 Nom: ${newUser.display_name}`);
    console.log(`📦 Plan: ${newUser.plan}`);
    console.log(`🆔 ID: ${newUser.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 Connectez-vous sur http://localhost:3003/login');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Lancer le script
createUser().catch(console.error);