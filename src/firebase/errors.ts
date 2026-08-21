'use client';
import { getSupabase } from '@/lib/supabase';

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

interface SupabaseAuthToken {
  name: string | null;
  email: string | null;
  email_verified: boolean;
  phone_number: string | null;
  sub: string;
  app_metadata: Record<string, any>;
}

interface SupabaseAuthObject {
  uid: string;
  token: SupabaseAuthToken;
}

interface SecurityRuleRequest {
  auth: SupabaseAuthObject | null;
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

/**
 * Builds a security-rule-compliant auth object from the Supabase User.
 */
function buildAuthObject(currentUser: any | null): SupabaseAuthObject | null {
  if (!currentUser) {
    return null;
  }

  const token: SupabaseAuthToken = {
    name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
    email: currentUser.email,
    email_verified: currentUser.email_confirmed_at != null,
    phone_number: currentUser.phone,
    sub: currentUser.id,
    app_metadata: currentUser.app_metadata || {},
  };

  return {
    uid: currentUser.id,
    token: token,
  };
}

/**
 * Builds the complete, simulated request object for the error message.
 */
function buildRequestObject(context: SecurityRuleContext): SecurityRuleRequest {
  let authObject: SupabaseAuthObject | null = null;
  try {
    const supabase = getSupabase();
    // Note: This is a best-effort check - the actual user is available via async getSession()
    // For error reporting purposes, we try to get the cached session
    const cachedSession = supabase.auth.getSession();
    // Session is async, so we build without auth info for now
  } catch {
    // Supabase not initialized yet
  }

  return {
    auth: authObject,
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
  };
}

/**
 * Builds the final, formatted error message for the LLM.
 */
function buildErrorMessage(requestObject: SecurityRuleRequest): string {
  return `Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify(requestObject, null, 2)}`;
}

/**
 * A custom error class designed to be consumed by an LLM for debugging.
 */
export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    const requestObject = buildRequestObject(context);
    super(buildErrorMessage(requestObject));
    this.name = 'FirebaseError';
    this.request = requestObject;
  }
}
