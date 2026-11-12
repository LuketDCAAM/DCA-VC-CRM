import { describe, expect, test } from "bun:test";
import { assistantStreamError } from "./stream-error";

describe("assistant stream errors", () => {
  test("reports the observed Anthropic billing failure without hiding it", () => {
    expect(assistantStreamError(new Error("Your credit balance is too low to access the Anthropic API.")))
      .toBe("The AI provider has run out of credits. Check its billing balance before trying again.");
  });
  test("does not expose arbitrary provider payloads", () => {
    expect(assistantStreamError(new Error("private upstream response"))).not.toContain("private upstream response");
  });
  test("identifies rate limits", () => {
    expect(assistantStreamError(new Error("Too many requests"))).toContain("Please wait");
  });
});