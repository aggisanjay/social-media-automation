import { jest, describe, beforeAll, beforeEach, afterAll, it, expect } from "@jest/globals";

// Mock mongoose connection before importing app
jest.mock("../src/config/db.js", () => jest.fn());
jest.mock("../src/jobs/publish-post-worker.js", () => ({
  startWorker: jest.fn(),
}));

import request from "supertest";
import User from "../src/models/User.js";
import ActivityLog from "../src/models/ActivityLog.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

describe("Auth Endpoints", () => {
  let app;

  beforeAll(async () => {
    jest.spyOn(mongoose, "connect").mockResolvedValue({
      connection: { host: "mock-db" }
    });
    jest.spyOn(mongoose, "disconnect").mockResolvedValue();
    const appModule = await import("../src/app.js");
    app = appModule.default;
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should successfully register a new user", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);
      jest.spyOn(User, "create").mockResolvedValue({
        _id: "6650b299e5256e2978d38b6a",
        name: "Test User",
        email: "test@example.com",
        role: "user",
      });
      jest.spyOn(ActivityLog, "create").mockResolvedValue({});

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.user.email).toEqual("test@example.com");
    });

    it("should return 400 if user email already exists", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue({ email: "test@example.com" });

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual("User with this email already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      const mockUser = {
        _id: "6650b299e5256e2978d38b6a",
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashedpassword",
        role: "user",
      };

      jest.spyOn(User, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
      jest.spyOn(ActivityLog, "create").mockResolvedValue({});

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.user.name).toEqual("Test User");
    });

    it("should return 401 with incorrect password", async () => {
      const mockUser = {
        _id: "6650b299e5256e2978d38b6a",
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashedpassword",
        role: "user",
      };

      jest.spyOn(User, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual("Invalid email or password");
    });
  });
});
