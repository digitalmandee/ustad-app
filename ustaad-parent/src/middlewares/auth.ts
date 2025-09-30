import { Request, Response, NextFunction } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { User, Session } from "@ustaad/shared";
import { Op } from "sequelize";
import { NotAuthorizedError } from "../errors/not-authorized-error";
import { CustomError } from "../errors/custom-error";

const JWT_SECRET = process.env.JWT_SECRET!;

async function validateSession(token: string): Promise<any> {


  console.log("token", token);
  try {
    const session = await Session.findOne({
      where: { 
        token,
        expiresAt: {
          [Op.gt]: new Date(), // Not expired
        },
      },
      include: [
        {
          model: User,
          attributes: ['id', 'email', 'phone', 'role', 'isActive'],
        },
      ],
    });

    if (!session) {
      throw new NotAuthorizedError("Invalid or expired session");
    }

    const user = (session as any).User;
    if (!user || !user.isActive) {
      throw new NotAuthorizedError("User does not exist or is not active");
    }

    if (user.role !== "PARENT") {
      throw new NotAuthorizedError("User is not a parent");
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  } catch (err: any) {
    if (err instanceof NotAuthorizedError) {
      throw err;
    }
    throw new NotAuthorizedError("Session validation failed");
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
    role?: string;
    [key: string]: any;
  };
}

export async function authenticateJwt(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new NotAuthorizedError("Token missing");
    }

    const token = authHeader.split(" ")[1];

    // First verify JWT structure
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        console.error("Token expired:", err.expiredAt);
        throw new NotAuthorizedError("TokenExpired");
      } else if (err instanceof JsonWebTokenError) {
        console.error("Invalid token:", err.message);
        throw new NotAuthorizedError("InvalidToken");
      } else {
        console.error("JWT error:", err);
        throw new NotAuthorizedError("Authentication failed");
      }
    }

    // Then validate session in database
    const user = await validateSession(token);

    req.user = {
      id: user.id.toString(),
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error(err);

    // If it's already a NotAuthorizedError, rethrow it
    if (err instanceof CustomError) {
      throw err;
    }

    // Otherwise, wrap and throw a generic error
    throw new NotAuthorizedError("Authentication failed");
  }
}
