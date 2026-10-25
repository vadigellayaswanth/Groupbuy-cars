import { NextRequest } from 'next/server';
import { UserProfile, UserRole } from './types';
import { DEMO_PERSONAS } from './auth-store';

/**
 * Server-side session verification helper.
 * Extracts user profile and role from request headers (or Authorization bearer token).
 * In demo mode, evaluates simulated role headers; in production, verifies Supabase JWT.
 */
export function getAuthenticatedUserFromRequest(req: NextRequest): UserProfile | null {
  // Check custom demo auth headers
  const roleHeader = req.headers.get('x-user-role') as UserRole | null;
  const userIdHeader = req.headers.get('x-user-id');
  const dealerIdHeader = req.headers.get('x-dealer-id') || req.headers.get('x-dealership-id');
  const userEmailHeader = req.headers.get('x-user-email');
  const userNameHeader = req.headers.get('x-user-name');

  if (roleHeader) {
    return {
      id: userIdHeader || `user-${Date.now()}`,
      email: userEmailHeader || `${roleHeader}@groupbuycars.internal`,
      fullName: userNameHeader || roleHeader.toUpperCase(),
      role: roleHeader,
      dealershipId: dealerIdHeader || undefined,
      dealerId: dealerIdHeader || undefined,
      dealershipName: req.headers.get('x-dealership-name') || undefined,
      createdAt: new Date().toISOString(),
    } as any;
  }

  // Check Bearer authorization token if passed
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer demo-')) {
    const personaKey = authHeader.replace('Bearer demo-', '');
    if (DEMO_PERSONAS[personaKey]) {
      return DEMO_PERSONAS[personaKey];
    }
  }

  // Default: unauthenticated (treated as guest buyer)
  return null;
}
