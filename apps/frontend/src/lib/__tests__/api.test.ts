import { getCookie, setCookie, removeCookie } from '../api';

// Mock document.cookie
let cookieStore: string[] = [];

beforeEach(() => {
  cookieStore = [];
  Object.defineProperty(document, 'cookie', {
    get: () => cookieStore.join('; '),
    set: (value: string) => {
      cookieStore.push(value);
    },
    configurable: true,
  });
});

describe('Cookie utilities', () => {
  it('should get cookie value', () => {
    cookieStore = ['accessToken=test-token-123', 'user=%7B%7D'];
    expect(getCookie('accessToken')).toBe('test-token-123');
  });

  it('should return null for missing cookie', () => {
    cookieStore = [];
    expect(getCookie('nonexistent')).toBeNull();
  });

  it('should decode URL-encoded cookie values', () => {
    cookieStore = ['user=%7B%22nombre%22%3A%22Test%22%7D'];
    expect(getCookie('user')).toBe('{"nombre":"Test"}');
  });

  it('should set cookie with proper encoding', () => {
    setCookie('test', 'hello world');
    expect(cookieStore.some(c => c.includes('test='))).toBe(true);
  });

  it('should remove cookie', () => {
    removeCookie('test');
    expect(cookieStore.some(c => c.includes('test=; path=/; max-age=0'))).toBe(true);
  });
});
