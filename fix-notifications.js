#!/usr/bin/env node

/**
 * Fix Notifications Enum Issue
 * 
 * This script helps fix the PostgreSQL enum issue with the notifications table.
 * Run this script to clean up the database and recreate tables properly.
 */

const { Client } = require('pg');
require('dotenv').config();

async function fixNotificationsEnum() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ustaad',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '12345',
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🗑️  Dropping existing enum type...');
    await client.query('DROP TYPE IF EXISTS "public"."enum_notifications_type" CASCADE;');
    
    console.log('🗑️  Dropping notifications table...');
    await client.query('DROP TABLE IF EXISTS "notifications" CASCADE;');

    console.log('✨ Creating new enum type...');
    await client.query(`
      CREATE TYPE "public"."enum_notifications_type" AS ENUM (
        'NEW_MESSAGE',
        'OFFER_RECEIVED', 
        'OFFER_ACCEPTED',
        'OFFER_REJECTED',
        'SESSION_REMINDER',
        'SESSION_CANCELLED_BY_PARENT',
        'SESSION_CANCELLED_BY_TUTOR',
        'TUTOR_CHECKED_IN',
        'TUTOR_CHECKED_OUT',
        'TUTOR_ON_LEAVE',
        'TUTOR_HOLIDAY',
        'SUBSCRIPTION_CANCELLED_BY_PARENT',
        'SUBSCRIPTION_CANCELLED_BY_TUTOR',
        'REVIEW_RECEIVED_TUTOR',
        'REVIEW_RECEIVED_CHILD',
        'SYSTEM_NOTIFICATION'
      );
    `);

    console.log('✅ Enum type created successfully');
    console.log('🎉 Database cleanup completed!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Start your services: cd ustaad-main && npm run dev');
    console.log('2. Sequelize will recreate the notifications table with the correct enum');
    console.log('3. After first successful run, change db.ts back to alter: true');

  } catch (error) {
    console.error('❌ Error fixing notifications enum:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
fixNotificationsEnum();
