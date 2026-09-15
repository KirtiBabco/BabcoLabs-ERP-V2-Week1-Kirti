import { afterEach, describe, expect, it } from "vitest";
import { getSqlConnectionString } from "../src/config/env";

const original = process.env.AZURE_SQL_CONNECTION_STRING;

afterEach(() => {
  if (original === undefined) {
    delete process.env.AZURE_SQL_CONNECTION_STRING;
  } else {
    process.env.AZURE_SQL_CONNECTION_STRING = original;
  }
});

describe("environment configuration", () => {
  it("rejects a missing Azure SQL connection string", () => {
    delete process.env.AZURE_SQL_CONNECTION_STRING;
    expect(() => getSqlConnectionString()).toThrow(
      "Missing required environment variable: AZURE_SQL_CONNECTION_STRING"
    );
  });

  it("returns the configured Azure SQL connection string", () => {
    process.env.AZURE_SQL_CONNECTION_STRING = "Server=test;Database=week1;";
    expect(getSqlConnectionString()).toBe("Server=test;Database=week1;");
  });
});
