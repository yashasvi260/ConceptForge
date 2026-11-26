import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRunner, type WorkerLike, type WorkerReply } from "./client";
import { LOAD_ERROR_MESSAGE, TIMEOUT_MESSAGE, type RunRequest, type RunResult } from "./program";

const REQ: RunRequest = { learnerCode: "x = 1", prelude: "", checks: "", data: null, packages: [] };
const PASS: RunResult = { status: "pass", stdout: "", checks: [], error: null };

class FakeWorker implements WorkerLike {
  onmessage: ((e: { data: WorkerReply }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onmessageerror: ((e: unknown) => void) | null = null;
  terminated = false;
  sent: { id: number; req: RunRequest }[] = [];
  postMessage(m: { id: number; req: RunRequest }) {
    this.sent.push(m);
  }
  terminate() {
    this.terminated = true;
  }
  reply(r: WorkerReply) {
    this.onmessage?.({ data: r });
  }
}

let workers: FakeWorker[];
const spawn = () => {
  const w = new FakeWorker();
  workers.push(w);
  return w;
};

beforeEach(() => {
  workers = [];
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("createRunner", () => {
  it("spawns lazily and resolves with the worker's result, reporting status", async () => {
    const run = createRunner(spawn, 10_000);
    expect(workers).toHaveLength(0);
    const statuses: string[] = [];
    const p = run(REQ, (s) => statuses.push(s));
    const w = workers[0]!;
    const id = w.sent[0]!.id;
    w.reply({ id, kind: "status", status: "loading" });
    w.reply({ id, kind: "status", status: "running" });
    w.reply({ id, kind: "result", result: PASS });
    await expect(p).resolves.toEqual(PASS);
    expect(statuses).toEqual(["loading", "running"]);
  });

  it("stops a run that exceeds the limit once Python is ready, then uses a fresh worker", async () => {
    const run = createRunner(spawn, 10_000);
    const p = run(REQ, () => {});
    const w = workers[0]!;
    w.reply({ id: w.sent[0]!.id, kind: "status", status: "running" });
    vi.advanceTimersByTime(10_001);
    await expect(p).resolves.toEqual({ status: "timeout", stdout: "", checks: [], error: TIMEOUT_MESSAGE });
    expect(w.terminated).toBe(true);

    const p2 = run(REQ, () => {});
    expect(workers).toHaveLength(2);
    const w2 = workers[1]!;
    w2.reply({ id: w2.sent[0]!.id, kind: "result", result: PASS });
    await expect(p2).resolves.toEqual(PASS);
  });

  it("does not count Python's first download against the limit", async () => {
    const run = createRunner(spawn, 10_000);
    const p = run(REQ, () => {});
    const w = workers[0]!;
    w.reply({ id: w.sent[0]!.id, kind: "status", status: "loading" });
    vi.advanceTimersByTime(30_000);
    w.reply({ id: w.sent[0]!.id, kind: "result", result: PASS });
    await expect(p).resolves.toEqual(PASS);
  });

  it("gives a load error (and a fresh worker next time) if Python never loads", async () => {
    const run = createRunner(spawn, 10_000, 120_000);
    const p = run(REQ, () => {});
    vi.advanceTimersByTime(120_001);
    await expect(p).resolves.toMatchObject({ status: "load-error", error: LOAD_ERROR_MESSAGE });
    run(REQ, () => {});
    expect(workers).toHaveLength(2);
  });

  it("ignores replies for an older request", async () => {
    const run = createRunner(spawn, 10_000);
    const p = run(REQ, () => {});
    const w = workers[0]!;
    w.reply({ id: 999, kind: "result", result: { ...PASS, status: "fail" } });
    w.reply({ id: w.sent[0]!.id, kind: "result", result: PASS });
    await expect(p).resolves.toEqual(PASS);
  });

  it("reports a load error at once if the worker script itself fails, and replaces the worker", async () => {
    const run = createRunner(spawn, 10_000, 120_000);
    const p = run(REQ, () => {});
    workers[0]!.onerror?.(new Event("error"));
    await expect(p).resolves.toMatchObject({ status: "load-error", error: LOAD_ERROR_MESSAGE });
    expect(workers[0]!.terminated).toBe(true);
    run(REQ, () => {});
    expect(workers).toHaveLength(2);
  });
});
