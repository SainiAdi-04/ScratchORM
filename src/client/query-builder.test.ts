import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModelClient } from "./query-builder";
import type { Pool } from "pg";

describe("ModelClient", () => {
  const mockQuery = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  const mockPool = { query: mockQuery } as unknown as Pool;

  const client = new ModelClient<{ id: number; name: string }, { name: string }>(
    mockPool,
    "users"
  );

  beforeEach(() => {
    mockQuery.mockClear();
  });

  describe("findMany", () => {
    it("should build a basic SELECT query", async () => {
      await client.findMany();
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM "users"', []);
    });

    it("should build a SELECT query with selected columns", async () => {
      await client.findMany({ select: { id: true } });
      expect(mockQuery).toHaveBeenCalledWith('SELECT "id" FROM "users"', []);
    });

    it("should build a query with a simple WHERE clause", async () => {
      await client.findMany({ where: { id: 1 } });
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM "users" WHERE "id" = $1', [1]);
    });

    it("should safely build a query with an ORDER BY clause", async () => {
      await client.findMany({ orderBy: { field: "name", direction: "desc" } });
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM "users" ORDER BY "name" DESC', []);
    });

    it("prevents SQL injection in the ORDER BY direction", async () => {
      // Forcefully injecting an invalid SQL direction via untyped payload
      await client.findMany({ orderBy: { field: "name", direction: "ASC, DROP TABLE users--" as any } });
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM "users" ORDER BY "name" ASC', []);
    });

    it("should build a query with a LIMIT clause", async () => {
      await client.findMany({ limit: 10 });
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM "users" LIMIT $1', [10]);
    });
    
    it("should build a complex query with SELECT, WHERE, ORDER BY, and LIMIT", async () => {
      await client.findMany({
        select: { id: true, name: true },
        where: { name: "Alice" },
        orderBy: { field: "id", direction: "desc" },
        limit: 5,
      });
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT "id", "name" FROM "users" WHERE "name" = $1 ORDER BY "id" DESC LIMIT $2',
        ["Alice", 5]
      );
    });
  });

  describe("findOne", () => {
    it("should build a valid SELECT query with LIMIT 1", async () => {
      await client.findOne({ where: { id: 1 } });
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM "users" WHERE "id" = $1 LIMIT 1', [1]);
    });

    it("should throw an error if the WHERE clause is empty", async () => {
      await expect(client.findOne({ where: {} })).rejects.toThrow("findOne requires at least one where field.");
    });
  });

  describe("create", () => {
    it("should build an INSERT query", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: "Alice" }], rowCount: 1 });
      await client.create({ name: "Alice" });
      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO "users" ("name") VALUES ($1) RETURNING *',
        ["Alice"]
      );
    });

    it("should build an INSERT query with DEFAULT VALUES if no fields are provided", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });
      await client.create({} as any);
      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO "users" DEFAULT VALUES RETURNING *',
        []
      );
    });
  });

  describe("update", () => {
    it("should build an UPDATE query", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: "Bob" }], rowCount: 1 });
      await client.update({ id: 1 }, { name: "Bob" });
      
      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE "users" SET "name" = $1 WHERE "id" = $2 RETURNING *',
        ["Bob", 1]
      );
    });

    it("should throw an error if WHERE clause is empty", async () => {
      await expect(client.update({}, { name: "Bob" })).rejects.toThrow("update requires at least one where field.");
    });

    it("should throw an error if data object is empty", async () => {
      await expect(client.update({ id: 1 }, {})).rejects.toThrow("update requires at least one data field.");
    });
  });

  describe("delete", () => {
    it("should build a DELETE query", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
      await client.delete({ id: 1 });
      
      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM "users" WHERE "id" = $1 RETURNING *',
        [1]
      );
    });

    it("should throw an error if WHERE clause is empty", async () => {
      await expect(client.delete({})).rejects.toThrow("delete requires at least one where field.");
    });
  });
});
