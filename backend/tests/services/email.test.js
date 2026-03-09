/**
 * file: backend/tests/services/email.test.js
 * Unit tests for email service logging behavior (dev/test mode)
 */
const { sendLoginInfoEmail } = require('../../src/services/email');

describe('Email Service', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('logs email info when SMTP is not configured', async () => {
    // Clear SMTP env vars to simulate dev/test mode
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const email = 'testuser@example.com';
    const firstName = 'Test';
    await sendLoginInfoEmail(email, firstName);

    // Check log output
    // 1st call: '[email] SMTP not configured; login info email not sent (dev/test).'
    expect(logSpy.mock.calls[0][0]).toContain('SMTP not configured');
    // 2nd call: '[email] Would send to:', email, '| Subject:', subject
    expect(logSpy.mock.calls[1]).toContain(email);
    expect(logSpy.mock.calls[1][0]).toContain('Would send to');
    // 3rd call: '[email] Login URL:', loginUrl
    expect(logSpy.mock.calls[2][0]).toContain('Login URL');
    expect(logSpy.mock.calls[2][1]).toBeDefined();
  });
});
