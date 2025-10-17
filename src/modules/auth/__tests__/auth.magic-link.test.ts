import jwt from 'jsonwebtoken';

describe('Magic Link Auth (unit smoke)', () => {
  it('signs magic link token with expected claims', () => {
    const token = jwt.sign(
      { userId: 'test-user', type: 'magic_link', email: 'u@example.com', jti: 'abc' },
      'testsecret',
      { expiresIn: '15m' }
    );
    const decoded: any = jwt.verify(token, 'testsecret');
    expect(decoded.type).toBe('magic_link');
    expect(decoded.userId).toBe('test-user');
    expect(decoded.email).toBe('u@example.com');
    expect(decoded.jti).toBe('abc');
  });
});


