export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isAdminToken(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  // Spring Security can expose the role as perfil, role, roles, or authorities
  if (payload.perfil === 'ADMIN') return true;
  if (payload.role === 'ADMIN') return true;
  if (Array.isArray(payload.roles) && payload.roles.includes('ADMIN')) return true;
  if (Array.isArray(payload.authorities)) {
    return (payload.authorities as string[]).some(
      (a) => a === 'ADMIN' || a === 'ROLE_ADMIN',
    );
  }
  return false;
}
