#!/usr/bin/env node

const { Client } = require('pg');
const bcrypt = require('bcrypt');
const readline = require('readline');
require('dotenv').config();

// Interface pour lire les entrées utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Collecter les informations
    console.log('🔐 Création d\'un nouvel utilisateur MDMC Admin\n');

    const email = await question('📧 Email: ');
    const password = await question('🔑 Mot de passe: ');
    const displayName = await question('👤 Nom d\'affichage: ');
    const planInput = await question('📦 Plan (free/pro) [free]: ');
    const plan = planInput || 'free';

    // Validation
    if (!email || !password || !displayName) {
      console.error('❌ Tous les champs sont requis');
      process.exit(1);
    }

    if (!email.includes('@')) {
      console.error('❌ Email invalide');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Le mot de passe doit contenir au moins 6 caractères');
      process.exit(1);
    }

    // Connexion à la base de données
    console.log('\n🔄 Connexion à la base de données...');
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
    console.log('\n🚀 Vous pouvez maintenant vous connecter sur http://localhost:3003/login');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await client.end();
  }
}

// Lancer le script
createUser().catch(console.error);