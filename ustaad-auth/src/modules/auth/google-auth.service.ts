import { User } from '@ustaad/shared';
import jwt from 'jsonwebtoken';
import { UserRole, IsOnBaord } from '@ustaad/shared';

export interface GoogleUserData {
  email: string;
  googleId: string;
  fullName: string;
  image?: string;
  accessToken?: string;
  role: UserRole;
}

export class GoogleAuthService {
  
  public async processGoogleLogin(googleUserData: GoogleUserData, deviceId?: string) {
    try {
      const { email, googleId, fullName, image, role } = googleUserData;

      // Validate required fields
      if (!email || !googleId) {
        throw new Error('Email and Google ID are required');
      }

      // Check if user already exists with this Google ID
      let user = await User.findOne({ where: { googleId } });

      if (user) {
        // User exists with Google ID, update deviceId if provided
        if (deviceId) {
          user.deviceId = deviceId;
          await user.save();
        }
        return user;
      }

      // Check if user exists with this email (for account linking)
      user = await User.findOne({ where: { email } });

      if (user) {
        // User exists with email but no Google ID, link accounts
        user.googleId = googleId;
        if (!user.image && image) {
          user.image = image; // Set Google profile picture if user doesn't have one
        }
        if (deviceId) {
          user.deviceId = deviceId;
        }
        await user.save();
        return user;
      }

      // Create new user
      user = await User.create({
        googleId,
        email,
        fullName,
        role: role, // Default role
        isActive: true,
        isEmailVerified: true, // Google emails are pre-verified
        isOnBoard: IsOnBaord.REQUIRED, // Still needs onboarding
        password: null, // No password for Google users
        image: image || null,
        deviceId: deviceId || null,
      });

      return user;
    } catch (error) {
      console.error('Google login processing error:', error);
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
      { expiresIn: '6d' } // Longer expiry for OAuth users
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
