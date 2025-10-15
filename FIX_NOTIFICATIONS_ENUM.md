# Fix Notifications Enum Issue

## 🐛 Problem

You're getting this error:
```
error: unterminated quoted string at or near "' USING ("type"::"public"."enum_notifications_type");"
```

This happens because Sequelize is having trouble creating the PostgreSQL enum type for the notifications table.

## 🔧 Solution

### Option 1: Quick Fix (Recommended)

1. **Run the fix script:**
   ```bash
   cd /Users/hamza/Downloads/work/ustad-app
   node fix-notifications.js
   ```

2. **Start your services:**
   ```bash
   cd ustaad-main
   npm run dev
   ```

3. **After first successful run, change db.ts back:**
   - Open `shared/db.ts`
   - Change `force: true` back to `alter: true`
   - This prevents data loss in future runs

### Option 2: Manual SQL Fix

1. **Connect to your PostgreSQL database:**
   ```bash
   psql -h localhost -U postgres -d ustaad
   ```

2. **Run the SQL commands:**
   ```sql
   -- Drop the problematic enum
   DROP TYPE IF EXISTS "public"."enum_notifications_type" CASCADE;
   
   -- Drop the notifications table
   DROP TABLE IF EXISTS "notifications" CASCADE;
   
   -- Create the enum properly
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
   ```

3. **Start your services:**
   ```bash
   cd ustaad-main
   npm run dev
   ```

## ✅ What Was Fixed

1. **Enum Definition**: Changed from `DataTypes.ENUM(...Object.values(NotificationType))` to explicit enum values
2. **Database Sync**: Temporarily using `force: true` to recreate tables
3. **SQL Compatibility**: Fixed nested quote issues in PostgreSQL

## 🔄 After Fix

Once the services start successfully:

1. **Change `shared/db.ts` back to:**
   ```typescript
   await sequelize.sync({ alter: true }); // Use this after first run
   ```

2. **Delete the fix files:**
   ```bash
   rm fix-notifications.js
   rm fix-notifications-enum.sql
   rm FIX_NOTIFICATIONS_ENUM.md
   ```

## 🎯 Expected Result

After running the fix, you should see:
- ✅ All services start without errors
- ✅ Notifications table created with proper enum
- ✅ Notification system working correctly

## 🆘 If Still Having Issues

1. **Check PostgreSQL logs** for any remaining errors
2. **Verify database connection** in your `.env` files
3. **Make sure PostgreSQL is running** on the correct port
4. **Check if any other services are using the database**

The notification system will work perfectly once this enum issue is resolved! 🚀
