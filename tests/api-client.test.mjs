import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, apiRequest, getApiHealth } from "../services/api-client.ts";

test("reads the backend health envelope without cookies", async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:4000/health");
    assert.equal(options.credentials, "omit");
    assert.equal(new Headers(options.headers).get("Accept"), "application/json");
    return new Response(JSON.stringify({ success: true, message: "Service is healthy", data: { status: "ok", database: "disconnected" } }), { status: 200 });
  };
  assert.deepEqual(await getApiHealth({ baseUrl: "http://localhost:4000" }), { status: "ok", database: "disconnected" });
});

test("sends explicit Bearer tokens and JSON for versioned routes", async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.example.test/api/v1/bookings");
    assert.equal(options.method, "POST");
    assert.equal(options.credentials, "omit");
    assert.equal(options.body, '{"roomId":"room-1"}');
    assert.equal(new Headers(options.headers).get("Authorization"), "Bearer sample-token");
    assert.equal(new Headers(options.headers).get("Content-Type"), "application/json");
    return new Response(JSON.stringify({ success: true, message: "Created", data: { id: "booking-1" } }), { status: 201 });
  };
  assert.deepEqual(await apiRequest("/api/v1/bookings", { baseUrl: "https://api.example.test", token: "sample-token", method: "POST", body: { roomId: "room-1" } }), { id: "booking-1" });
});

test("normalizes rejected API responses", async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false, message: "Authentication required" }), { status: 401 });
  await assert.rejects(apiRequest("/api/v1/auth/me", { baseUrl: "https://api.example.test" }), error => error instanceof ApiError && error.status === 401 && error.message === "Authentication required");
});

test("rejects invalid origins and external paths before sending a request", async () => {
  await assert.rejects(apiRequest("/health", { baseUrl: "" }), /not been configured/);
  await assert.rejects(apiRequest("//another-host.invalid/path", { baseUrl: "https://api.example.test" }), /relative/);
  await assert.rejects(apiRequest("/health", { baseUrl: "ftp://api.example.test" }), /HTTP\(S\) origin/);
  await assert.rejects(apiRequest("/health", { baseUrl: "https://api.example.test/api/v1" }), /HTTP\(S\) origin/);
});

test("converts network and invalid-response failures into readable errors", async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => { throw new TypeError("Network unreachable"); };
  await assert.rejects(apiRequest("/health", { baseUrl: "https://api.example.test" }), /Unable to connect/);
  globalThis.fetch = async () => new Response("not-json", { status: 502 });
  await assert.rejects(apiRequest("/health", { baseUrl: "https://api.example.test" }), error => error instanceof ApiError && error.status === 502);
});
