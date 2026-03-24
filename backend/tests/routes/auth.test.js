/**
 * @file backend/tests/routes/auth.test.js
 */
const request = require("supertest");
const express = require("express");

jest.mock("../../src/services/email", () => ({
  sendLoginInfoEmail: jest.fn(),
}));

jest.mock("../../src/db", () => ({
  query: jest.fn(),
}));

const authRouter = require("../../src/routes/auth");
const pool = require("../../src/db");
const { sendLoginInfoEmail } = require("../../src/services/email");

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);

describe("Auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /api/auth/resend-login-email — 400 for non-BSU email", async () => {
    const res = await request(app)
      .post("/api/auth/resend-login-email")
      .send({ email: "someone@gmail.com" });
    expect(res.status).toBe(400);
    expect(sendLoginInfoEmail).not.toHaveBeenCalled();
  });

  test("POST /api/auth/resend-login-email — 200 generic when user not found", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app)
      .post("/api/auth/resend-login-email")
      .send({ email: "missing@u.boisestate.edu" });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/spam/i);
    expect(sendLoginInfoEmail).not.toHaveBeenCalled();
  });

  test("POST /api/auth/resend-login-email — 200 and sends when user exists", async () => {
    pool.query.mockResolvedValue({
      rows: [{ user_id: 1, first_name: "Pat", email: "pat@u.boisestate.edu" }],
    });
    sendLoginInfoEmail.mockResolvedValue(true);
    const res = await request(app)
      .post("/api/auth/resend-login-email")
      .send({ email: "pat@u.boisestate.edu" });
    expect(res.status).toBe(200);
    expect(sendLoginInfoEmail).toHaveBeenCalledWith("pat@u.boisestate.edu", "Pat", {
      isResend: true,
    });
  });

  test("POST /api/auth/resend-login-email — 503 when SMTP send fails", async () => {
    pool.query.mockResolvedValue({
      rows: [{ user_id: 1, first_name: "Pat", email: "pat@u.boisestate.edu" }],
    });
    sendLoginInfoEmail.mockResolvedValue(false);
    const res = await request(app)
      .post("/api/auth/resend-login-email")
      .send({ email: "pat@u.boisestate.edu" });
    expect(res.status).toBe(503);
    expect(res.body.error).toBeTruthy();
  });
});
