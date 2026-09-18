import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("Week 1 smoke baseline", () => {
  it("returns a healthy response", async () => {
    const response = await request(createApp()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", week: 1, projects: [1, 2, 3, 4] });
  });
});
