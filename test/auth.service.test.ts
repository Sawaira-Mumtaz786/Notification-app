import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../server/modules/auth/auth.service.ts';
import { validateRegisterDto } from '../server/modules/auth/dto/register.dto.ts';
import { validateLoginDto } from '../server/modules/auth/dto/login.dto.ts';

describe('AuthService & DTOs', () => {
  const authService = new AuthService();
  const testUsername = `testuser_${Date.now()}`;
  const testPassword = 'validPassword123';

  describe('Register Validation DTO', () => {
    it('should reject missing full name', () => {
      const result = validateRegisterDto({ fullName: '', username: 'john', password: 'password123' });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Full name')));
    });

    it('should reject short passwords (< 6 characters)', () => {
      const result = validateRegisterDto({ fullName: 'John Doe', username: 'john', password: '123' });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('at least 6 characters')));
    });

    it('should accept valid registration payloads', () => {
      const result = validateRegisterDto({ fullName: 'Jane Doe', username: 'janedoe', password: 'password123' });
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe('Login Validation DTO', () => {
    it('should reject empty credentials', () => {
      const result = validateLoginDto({ username: '', password: '' });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 2);
    });

    it('should accept non-empty credentials', () => {
      const result = validateLoginDto({ username: 'janedoe', password: 'password123' });
      assert.strictEqual(result.valid, true);
    });
  });

  describe('Registration & Authentication Flow', () => {
    it('should register a new user with bcrypt hash and return sanitized user without password', async () => {
      const res = await authService.register({
        fullName: 'Test Unit Engineer',
        username: testUsername,
        password: testPassword,
      });

      assert.ok(res.token, 'Must return JWT token');
      assert.strictEqual(res.user.username, testUsername);
      assert.strictEqual(res.user.fullName, 'Test Unit Engineer');
      // Crucial requirement: Never expose password or password hash
      assert.strictEqual((res.user as any).password, undefined);
      assert.strictEqual((res.user as any).passwordHash, undefined);
    });

    it('should reject duplicate username registration', async () => {
      await assert.rejects(
        async () => {
          await authService.register({
            fullName: 'Another Engineer',
            username: testUsername, // duplicate
            password: 'differentPassword456',
          });
        },
        {
          statusCode: 409,
        }
      );
    });

    it('should successfully log in with valid credentials', async () => {
      const res = await authService.login({
        username: testUsername,
        password: testPassword,
      });

      assert.ok(res.token);
      assert.strictEqual(res.user.username, testUsername);
    });

    it('should reject invalid password with 401', async () => {
      await assert.rejects(
        async () => {
          await authService.login({
            username: testUsername,
            password: 'wrongPasswordHere',
          });
        },
        {
          statusCode: 401,
        }
      );
    });

    it('should verify and decode valid JWT tokens', async () => {
      const loginRes = await authService.login({
        username: testUsername,
        password: testPassword,
      });

      const decoded = authService.verifyToken(loginRes.token);
      assert.strictEqual(decoded.username, testUsername);
      assert.strictEqual(decoded.userId, loginRes.user.id);
    });
  });
});
