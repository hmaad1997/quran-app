/**
 * Biometric gate using the WebAuthn Platform Authenticator (FaceID / Touch ID /
 * Windows Hello / Android biometrics). We do NOT bind identity here — auth is
 * handled by Supabase. WebAuthn is used purely as a local "user presence +
 * verification" gate, then we forward the credential id as `biometric_token_id`.
 *
 * For an MVP without server challenges, the safest fallback is
 * `isUserVerifyingPlatformAuthenticatorAvailable()` plus a synthetic
 * `navigator.credentials.create()` on first use to bind a device-scoped token.
 */

export interface BiometricResult {
  ok: boolean;
  credentialId?: string;
  reason?: string;
}

function isPlatformAuthAvailable(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !==
      'function'
  ) {
    return Promise.resolve(false);
  }
  return window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

const LS_KEY = 'basma:biometric_credential_id';

function randomChallenge(bytes = 32): Uint8Array {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return buf;
}

function b64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Triggers the OS biometric prompt. On first use it creates a
 * platform-bound resident credential; subsequent calls perform a
 * `get()` assertion to reverify presence.
 */
export async function requireBiometric(options?: {
  userId: string;
  userName: string;
}): Promise<BiometricResult> {
  const available = await isPlatformAuthAvailable();
  if (!available) {
    return { ok: false, reason: 'platform_authenticator_unavailable' };
  }

  try {
    const existingId = localStorage.getItem(LS_KEY);

    if (existingId) {
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: randomChallenge(),
          timeout: 60_000,
          userVerification: 'required',
          allowCredentials: [
            {
              type: 'public-key',
              id: Uint8Array.from(atob(existingId.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
                c.charCodeAt(0),
              ),
              transports: ['internal'],
            },
          ],
        },
      })) as PublicKeyCredential | null;

      if (!assertion) return { ok: false, reason: 'assertion_cancelled' };
      return { ok: true, credentialId: existingId };
    }

    // First-time enrollment
    if (!options) {
      return { ok: false, reason: 'enrollment_requires_user_context' };
    }

    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: 'Basma' },
        user: {
          id: new TextEncoder().encode(options.userId),
          name: options.userName,
          displayName: options.userName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60_000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (!cred) return { ok: false, reason: 'enrollment_cancelled' };

    const id = b64url(cred.rawId);
    localStorage.setItem(LS_KEY, id);
    return { ok: true, credentialId: id };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'biometric_error',
    };
  }
}

export function clearBiometric(): void {
  localStorage.removeItem(LS_KEY);
}
