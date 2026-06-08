-- SQL Migration: Add GUEST role to enum_users_role type
-- This migration updates the existing enum_users_role PostgreSQL enum to support the GUEST role.

ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'GUEST';
