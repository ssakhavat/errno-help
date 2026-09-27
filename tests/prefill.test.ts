import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { prefillTarget, stashPrefill, takePrefill } from "@/lib/detectInputType";

// Minimal in-memory stand-in for the browser's sessionStorage.
class MemoryStorage {
  private items = new Map<string, string>();
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  get size() {
    return this.items.size;
  }
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, "sessionStorage", {
    value: storage,
    configurable: true,
  });
});

const TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.sig";

test("JWT targets have no query string and require a handoff", () => {
  assert.deepEqual(prefillTarget("jwt", TOKEN), {
    href: "/tools/jwt",
    handoff: { tool: "jwt", value: TOKEN },
  });
});

test("non-sensitive targets keep the shareable ?q=", () => {
  assert.deepEqual(prefillTarget("cidr", "10.0.0.0/8"), {
    href: "/tools/cidr?q=10.0.0.0%2F8",
    handoff: null,
  });
  assert.deepEqual(prefillTarget("windows-errors", "0x80070005"), {
    href: "/tools/windows-errors?q=0x80070005",
    handoff: null,
  });
});

test("a stashed value is read once, then cleared", () => {
  stashPrefill("jwt", TOKEN);
  assert.equal(takePrefill("jwt"), TOKEN);
  assert.equal(storage.size, 0);
  assert.equal(takePrefill("jwt"), null);
});

test("a value stashed for another tool is not handed over, but is cleared", () => {
  stashPrefill("cidr", "10.0.0.0/8");
  assert.equal(takePrefill("jwt"), null);
  assert.equal(storage.size, 0);
});

test("unavailable storage degrades to no prefill, never an exception", () => {
  Object.defineProperty(globalThis, "sessionStorage", {
    get() {
      throw new Error("SecurityError");
    },
    configurable: true,
  });
  assert.doesNotThrow(() => stashPrefill("jwt", TOKEN));
  assert.equal(takePrefill("jwt"), null);
});
