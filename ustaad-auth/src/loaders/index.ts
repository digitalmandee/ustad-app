import expressLoader from './express';
import { Application } from 'express';
// import { connectToPostgres } from '../connection/postgres';
import { connectToPostgres, Gender, IsOnBaord, User, UserRole } from "@ustaad/shared";
import { initializeFirebase } from "../services/firebase-con";
import { hashPassword } from "../helper/generic";

export default async ({ expressApp }: { expressApp: Application }) => {
  console.log("hello1")
  
  await connectToPostgres();

  // Ensure super admin exists (owned by auth service; password is hashed here)
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || "admin@ustaad.com";
    const passwordPlain = process.env.SUPER_ADMIN_PASSWORD || "Pass123@";
    const phone = process.env.SUPER_ADMIN_PHONE || "03000000000";

    const existing = await User.findOne({
      where: { email, role: UserRole.SUPER_ADMIN },
    });

    if (!existing) {
      const hashed = await hashPassword(passwordPlain);
      await User.create({
        email,
        password: hashed,
        role: UserRole.SUPER_ADMIN,
        fullName: "Super Admin",
        phone,
        gender: Gender.OTHER,
        isActive: true,
        isAdminVerified: true,
        isOnBoard: IsOnBaord.APPROVED,
        isEmailVerified: true,
        isPhoneVerified: true,
        cnic: null,
        address: "",
        city: "",
        state: "",
        country: "",
        image: null,
        googleId: null,
        deviceId: null,
        isDeleted: false,
      });
      console.log("✅ Super admin ensured by auth service");
    }
  } catch (e) {
    console.error("❌ Failed to ensure super admin in auth:", e);
  }
  
  // Initialize Firebase for notifications
  try {
    initializeFirebase();
  } catch (error) {
    console.warn("⚠️ Firebase initialization failed, notifications may not work:", error);
  }
  
  expressLoader({ app: expressApp });
  // Logger.info("✌️ Express loaded ");
};
