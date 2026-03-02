// ================================================
// M@SA PLATFORM - DATABASE SETUP SCRIPT
// src/db/setup.js
// Run with: npm run db:setup
// ================================================

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

async function setup() {
  console.log('\n  M@SA — Database Setup\n');

  // Connect as postgres superuser first to create DB and user
  const adminPool = new Pool({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: 'postgres',
    user:     'postgres',
    password: process.env.PG_SUPERUSER_PASSWORD || 'postgres',
  });

  try {
    // Create user if not exists
    console.log('  Creating database user...');
    await adminPool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${process.env.DB_USER || 'masa_user'}') THEN
          CREATE USER ${process.env.DB_USER || 'masa_user'}
          WITH PASSWORD '${process.env.DB_PASSWORD}';
        END IF;
      END $$;
    `);
    console.log('  ✓ User ready');

    // Create database if not exists
    console.log('  Creating database...');
    const dbCheck = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME || 'masa_db']
    );
    if (dbCheck.rowCount === 0) {
      await adminPool.query(
        `CREATE DATABASE ${process.env.DB_NAME || 'masa_db'} OWNER ${process.env.DB_USER || 'masa_user'}`
      );
      console.log('  ✓ Database created');
    } else {
      console.log('  ✓ Database already exists');
    }

    await adminPool.end();

    // Now connect to the masa_db and run schema
    const appPool = new Pool({
      host:     process.env.DB_HOST || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'masa_db',
      user:     process.env.DB_USER || 'masa_user',
      password: process.env.DB_PASSWORD,
    });

    console.log('  Running schema...');
    const schema = fs.readFileSync(
      path.join(__dirname, 'schema.sql'), 'utf8'
    );
    await appPool.query(schema);
    console.log('  ✓ Schema applied');

    // Create first admin user
    console.log('  Creating admin user...');
    const email = process.env.ADMIN_SETUP_EMAIL || 'admin@masa.org.za';
    const password = process.env.ADMIN_SETUP_PASSWORD || 'Admin@MASA2024!';
    const hash = await bcrypt.hash(password, 12);

    await appPool.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, 'M@SA Administrator', 'super_admin')
      ON CONFLICT (email) DO NOTHING
    `, [email, hash]);
    console.log(`  ✓ Admin user: ${email}`);

    // Insert default site settings
    await appPool.query(`
      INSERT INTO site_settings (key, value) VALUES
        ('site_logo', '/assets/logo.svg'),
        ('site_name', 'Messelaar @ STEM Academy NPC'),
        ('site_tagline', 'Empowering South African STEM Education')
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('  ✓ Site settings initialized');

    await appPool.end();

    console.log('\n  ✅ Setup complete!');
    console.log('  Now run: npm run db:seed\n');

  } catch (err) {
    console.error('\n  ✗ Setup failed:', err.message);
    console.error('  Make sure PostgreSQL is running and PG_SUPERUSER_PASSWORD is set in .env\n');
    process.exit(1);
  }
}

setup();
