// @vitest-environment node
import { GET } from '@/app/api/user/export/route';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

vi.mock('@/lib/auth/users', () => ({
  findUserById: vi.fn(),
  getNotificationPreferences: vi.fn(),
}));

import { findUserById, getNotificationPreferences } from '@/lib/auth/users';

describe('GET /api/user/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if unauthenticated (missing x-user-id header)', async () => {
    const mockRequest = new Request('http://localhost:3000/api/user/export', {
      method: 'GET',
    });

    const response = await GET(mockRequest);
    expect(response.status).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Unauthenticated');
  });

  it('should return a 200 status and the correct user data fields', async () => {
    (findUserById as Mock).mockReturnValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Jane Doe',
      createdAt: '2023-05-15T10:30:00Z',
    });

    (getNotificationPreferences as Mock).mockReturnValue({
      marketingEmails: false,
      securityAlerts: true,
      pushNotifications: true,
    });

    const mockRequest = new Request('http://localhost:3000/api/user/export', {
      method: 'GET',
      headers: new Headers({
        'x-user-id': 'user-123',
      }),
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);

    expect(data).toHaveProperty('email', 'test@example.com');
    expect(data).toHaveProperty('displayName', 'Jane Doe');
    expect(data).toHaveProperty('accountCreationDate', '2023-05-15T10:30:00Z');
    expect(data).toHaveProperty('notificationPreferences');

    expect(typeof data.email).toBe('string');
    expect(typeof data.displayName).toBe('string');
    expect(typeof data.accountCreationDate).toBe('string');
    expect(typeof data.notificationPreferences).toBe('object');
    expect(data.notificationPreferences.securityAlerts).toBe(true);
  });
});