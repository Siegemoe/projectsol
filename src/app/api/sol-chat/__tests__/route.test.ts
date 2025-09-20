import { POST } from '../route';
import { NextRequest } from 'next/server';
import { checkRateLimit, envEnabled } from '@/lib/rateLimit';
import { isAllowlisted } from '@/lib/allowlist';
import { createServerClient } from '@supabase/ssr';

// Mock dependencies
jest.mock('@/lib/rateLimit');
jest.mock('@/lib/allowlist');
jest.mock('@supabase/ssr');

global.fetch = jest.fn();

describe('POST /api/sol-chat', () => {
  const mockCheckRateLimit = checkRateLimit as jest.Mock;
  const mockEnvEnabled = envEnabled as jest.Mock;
  const mockIsAllowlisted = isAllowlisted as jest.Mock;
  const mockCreateServerClient = createServerClient as jest.Mock;
  const mockFetch = global.fetch as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 29, reset: Date.now() });
    mockEnvEnabled.mockImplementation((_, defaultOn) => defaultOn); // default behavior
    mockIsAllowlisted.mockReturnValue(true);
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        }),
      },
    });
  });

  const createRequest = (body: any) => {
    const req = new NextRequest('http://localhost/api/sol-chat', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    return req;
  };

  it('should return 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost/api/sol-chat', {
      method: 'POST',
      body: '{"invalid json"',
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid JSON');
  });

  it('should return 401 if auth is required and user is not found', async () => {
    mockCreateServerClient.mockReturnValueOnce({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const req = createRequest({ messages: [{ role: 'user', content: 'Hello' }] });
    const response = await POST(req);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('should return 403 if user is not allowlisted', async () => {
    mockIsAllowlisted.mockReturnValueOnce(false);
    const req = createRequest({ messages: [{ role: 'user', content: 'Hello' }] });
    const response = await POST(req);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });

  it('should return 429 if rate limited', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, remaining: 0, reset: Date.now() });
    const req = createRequest({ messages: [{ role: 'user', content: 'Hello' }] });
    const response = await POST(req);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: 'Too Many Requests' });
  });

  it('should return 400 for invalid messages payload', async () => {
    const req = createRequest({ messages: 'not an array' });
    const response = await POST(req);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'messages must be a non-empty array' });
  });

  it('should successfully proxy a valid request to OpenRouter', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('data: {"foo":"bar"}', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    );
    const req = createRequest({ messages: [{ role: 'user', content: 'Hello' }] });
    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.any(Object)
    );
  });
});
