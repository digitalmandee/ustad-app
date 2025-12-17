import { User } from "@ustaad/shared";
import jwt from "jsonwebtoken";
import { UserRole, IsOnBaord, Gender } from "@ustaad/shared";
import { UnProcessableEntityError } from "src/errors/unprocessable-entity.error";

export interface GoogleUserData {
  email: string;
  googleId: string;
  fullName: string;
  gender?: Gender;
  image?: string;
  accessToken?: string;
  role: UserRole;
}

export class GoogleAuthService {
  public async processGoogleSignup(
    googleUserData: GoogleUserData,
    deviceId?: string
  ) {
    try {
      const { email, googleId, fullName, image, role, gender } = googleUserData;

      if (!email || !googleId) {
        throw new Error("Email and Google ID are required");
      }

      // 1. Find by Google ID first
      let user = await User.findOne({ where: { googleId } });
      if (user) {
        throw new UnProcessableEntityError("User already exists");
      }

      // 2. Check if email exists → Link account
      user = await User.findOne({ where: { email } });

      if (user) {
        throw new UnProcessableEntityError("User already exists");
      }

      // 3. Create new user
      if (!role) {
        throw new UnProcessableEntityError("Role is required");
      }

      user = await User.create({
        googleId,
        email,
        fullName,
        role, // ideally enforce a safe default
        gender: gender || Gender.OTHER,
        isActive: true,
        isEmailVerified: true,
        isOnBoard: IsOnBaord.REQUIRED,
        password: null,
        image: image || null,
        deviceId: deviceId || null,
      });

      return user;
    } catch (error) {
      console.error("Google login processing error:", error);
      throw error;
    }
  }

  public generateJWT(user: any): string {
    return jwt.sign(
      {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      process.env.JWT_SECRET!,
      { expiresIn: "6d" } // Longer expiry for OAuth users
    );
  }

  public sanitizeUser(user: any): any {
    const sanitizedUser = user.toJSON();
    delete sanitizedUser.password;
    delete sanitizedUser.googleId; // Don't expose Google ID in response
    return sanitizedUser;
  }
}

export default GoogleAuthService;
