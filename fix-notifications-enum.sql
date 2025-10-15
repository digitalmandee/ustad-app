-- Fix notifications enum issue
-- Run this SQL script to fix the enum type issue

-- Drop the existing enum type if it exists
DROP TYPE IF EXISTS "public"."enum_notifications_type" CASCADE;

-- Create the enum type with proper values
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

-- If notifications table exists, drop it and recreate
DROP TABLE IF EXISTS "notifications" CASCADE;

-- The table will be recreated by Sequelize sync
