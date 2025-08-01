import { Request, Response, NextFunction } from 'express';
import jwt , { JsonWebTokenError, TokenExpiredError }  from 'jsonwebtoken';
import { User } from '@ustaad/shared';
import { NotAuthorizedError } from '../errors/not-authorized-error';
import { CustomError } from '../errors/custom-error';

const JWT_SECRET = process.env.JWT_SECRET!;

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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new NotAuthorizedError('Token missing');
    }

    const token = authHeader.split(' ')[1];

     let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
    console.error('Token expired:', err.expiredAt);
    throw new NotAuthorizedError('TokenExpired');
  } else if (err instanceof JsonWebTokenError) {
    console.error('Invalid token:', err.message);
    throw new NotAuthorizedError('InvalidToken');
  } else {
    console.error('JWT error:', err);
    throw new NotAuthorizedError('Authentication failed');
  }
    }

    const user = await User.findByPk(decoded.user.id);

    if (!user) {
      throw new NotAuthorizedError("User dose not exist");
    }
    if (user.isActive == false) {
      throw new NotAuthorizedError("User is not active");
    }
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
  throw new NotAuthorizedError('Authentication failed');
  }
}
