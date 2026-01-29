/**
 * Request Types
 * Type definitions for Express requests with authentication
 */

import { Request } from 'express';

/**
 * JWT Payload after authentication
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * User object attached to request after authentication
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
}

/**
 * Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * OAuth profile from external providers
 */
export interface GitHubProfile {
  id: string;
  username: string;
  displayName: string;
  emails: Array<{ value: string; verified: boolean }>;
  photos: Array<{ value: string }>;
  provider: 'github';
  _json: {
    login: string;
    id: number;
    avatar_url: string;
    name: string;
    email: string;
  };
}

export interface GoogleProfile {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  emails: Array<{ value: string; verified: boolean }>;
  photos: Array<{ value: string }>;
  provider: 'google';
  _json: {
    sub: string;
    email: string;
    email_verified: boolean;
    name: string;
    picture: string;
  };
}

export type OAuthProfile = GitHubProfile | GoogleProfile;

/**
 * Link explanation metadata
 */
export interface LinkExplanation {
  deterministicScore: number;
  mlScore?: number;
  semanticScore?: number;
  structuralScore?: number;
  method: 'deterministic' | 'ml_assisted' | 'ml_shadow' | 'rejected';
  reason: string;
  signals?: {
    titleSimilarity?: number;
    bodySimilarity?: number;
    urlMatch?: boolean;
    authorMatch?: boolean;
    participantOverlap?: number;
    temporalProximity?: number;
  };
}

/**
 * Type guard for AuthenticatedRequest
 */
export function isAuthenticatedRequest(
  req: Request,
): req is AuthenticatedRequest {
  return 'user' in req && req.user !== undefined;
}
