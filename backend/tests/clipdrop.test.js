import { jest, describe, it, expect, beforeAll } from "@jest/globals";

// Mock the cloudinary.service.js module using unstable_mockModule for ESM compatibility
jest.unstable_mockModule("../src/services/cloudinary.service.js", () => ({
  uploadMedia: jest.fn().mockResolvedValue({ url: "https://cloudinary.com/test-image.png" }),
}));

// Statically declare our functions, but dynamically import the service in beforeAll
let generateImageFromPrompt;

describe("ClipDrop Image Service", () => {
  beforeAll(async () => {
    const service = await import("../src/services/clipdrop.service.js");
    generateImageFromPrompt = service.generateImageFromPrompt;
  });

  it("should return fallback Pollinations URL if CLIPDROP_API_KEY is not defined", async () => {
    const originalEnv = process.env.CLIPDROP_API_KEY;
    delete process.env.CLIPDROP_API_KEY;

    const url = await generateImageFromPrompt("Test prompt");
    expect(url).toContain("pollinations.ai/prompt");

    process.env.CLIPDROP_API_KEY = originalEnv;
  });

  it("should successfully generate content and upload to Cloudinary if key is provided", async () => {
    const originalEnv = process.env.CLIPDROP_API_KEY;
    process.env.CLIPDROP_API_KEY = "test_key";

    // Mock global fetch to return an ArrayBuffer response
    const mockResponse = {
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const url = await generateImageFromPrompt("Test prompt");
    expect(url).toBe("https://cloudinary.com/test-image.png");

    process.env.CLIPDROP_API_KEY = originalEnv;
    delete global.fetch;
  });
});
