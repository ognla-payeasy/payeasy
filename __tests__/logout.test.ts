// @vitest-environment node
import { POST } from '@/app/api/auth/logout/route';
import { describe, it, expect } from 'vitest';

describe('POST /api/auth/logout', () => {
  it('should clear the auth cookie and return success', async () => {
    const mockRequest = new Request('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: new Headers({
        'cookie': 'auth_token=some-token-value'
      }),
    });

    const res = await POST(mockRequest as any);
    // Ensure response is JSON and success is true
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('success', true);

    // Check that a Set-Cookie header was included (cookie cleared)
    const setCookie = res.headers.get('set-cookie');
    expect(typeof setCookie).toBe('string');
    expect(setCookie).toContain('auth_token=');
  });
});
