import { jest, describe, beforeAll, beforeEach, afterAll, it, expect } from "@jest/globals";

// Mock mongoose connection & worker before importing app
jest.mock("../src/config/db.js", () => jest.fn());
jest.mock("../src/jobs/publish-post-worker.js", () => ({
  startWorker: jest.fn(),
}));

import request from "supertest";
import Post from "../src/models/Post.js";
import SocialAccount from "../src/models/SocialAccount.js";
import AIGeneration from "../src/models/AIGeneration.js";
import ActivityLog from "../src/models/ActivityLog.js";
import { generateAccessToken } from "../src/utils/token.js";
import mongoose from "mongoose";

jest.mock("../src/services/groq.service.js", () => ({
  generatePostContent: jest.fn().mockResolvedValue({
    text: "Mock generated social post",
    imagePrompt: "Mock image prompt",
  }),
}));

jest.mock("../src/services/zernio.service.js", () => ({
  publishToPlatform: jest.fn().mockResolvedValue(true),
  fetchConnectedProfiles: jest.fn().mockResolvedValue([]),
}));

jest.mock("../src/services/scheduler.service.js", () => ({
  schedulePost: jest.fn().mockResolvedValue(true),
  cancelScheduledPost: jest.fn().mockResolvedValue(true),
  executePublishPostJob: jest.fn().mockResolvedValue(true),
}));

describe("API Endpoints", () => {
  let token;
  let app;
  const mockUser = {
    _id: "6650b299e5256e2978d38b6a",
    role: "user",
  };

  beforeAll(async () => {
    jest.spyOn(mongoose, "connect").mockResolvedValue({
      connection: { host: "mock-db" }
    });
    jest.spyOn(mongoose, "disconnect").mockResolvedValue();
    token = generateAccessToken(mockUser);
    const appModule = await import("../src/app.js");
    app = appModule.default;
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("GET /api/dashboard/stats", () => {
    it("should return correct dashboard statistics", async () => {
      jest.spyOn(Post, "countDocuments").mockImplementation(({ status }) => {
        if (status === "scheduled") return Promise.resolve(5);
        if (status === "published") return Promise.resolve(10);
        return Promise.resolve(0);
      });
      jest.spyOn(SocialAccount, "countDocuments").mockResolvedValue(3);

      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.stats.scheduled).toEqual(5);
      expect(res.body.stats.published).toEqual(10);
      expect(res.body.stats.accounts).toEqual(3);
    });
  });

  describe("POST /api/ai/generate", () => {
    it("should generate post text content successfully", async () => {
      const expectedText = `
Mock Title

Mock generated social post

#Mock #Social
`;
      jest.spyOn(AIGeneration, "create").mockResolvedValue({
        _id: "6650b299e5256e2978d38b6d",
        prompt: "Write a startup post",
        tone: "Professional",
        title: "Mock Title",
        content: "Mock generated social post",
        hashtags: ["#Mock", "#Social"],
        imagePrompt: "Mock image prompt",
        text: expectedText,
        imageUrl: "",
        createdAt: new Date(),
      });
      jest.spyOn(ActivityLog, "create").mockResolvedValue({});

      const res = await request(app)
        .post("/api/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({
          prompt: "Write a startup post",
          tone: "Professional",
          generateImage: false,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.generation.text).toEqual(expectedText);
    });
  });

  describe("POST /api/posts", () => {
    it("should create and schedule a post successfully", async () => {
      const mockPost = {
        _id: "6650b299e5256e2978d38b6b",
        platforms: ["x"],
        content: "Hello world post",
        status: "scheduled",
        scheduledAt: new Date(Date.now() + 3600000),
      };

      jest.spyOn(Post, "create").mockResolvedValue(mockPost);
      jest.spyOn(Post, "findById").mockResolvedValue(mockPost);
      jest.spyOn(ActivityLog, "create").mockResolvedValue({});

      const res = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${token}`)
        .send({
          platforms: ["x"],
          content: "Hello world post",
          scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual("Post created successfully");
    });
  });
});
