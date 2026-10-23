import { describe, expect, it } from "vitest";
import {
  allowsExtraEmails,
  decideCoachAccess,
  isCoachDomainOnly,
  parseEmailList,
  type AccessEnvironment,
} from "./coach-access";

const production: AccessEnvironment = {
  vercelEnv: "production",
  nodeEnv: "production",
  extraEmails: "dev@gmail.com",
};
const preview: AccessEnvironment = { ...production, vercelEnv: "preview" };
const localDev: AccessEnvironment = {
  vercelEnv: undefined,
  nodeEnv: "development",
  extraEmails: "dev@gmail.com",
};

const workspaceCoach = {
  email: "hola@yaqbot.com",
  email_verified: true,
  hd: "yaqbot.com",
};
const developer = { email: "dev@gmail.com", email_verified: true };

describe("decideCoachAccess", () => {
  it.each([
    ["production", production],
    ["preview", preview],
    ["local development", localDev],
  ])("lets a verified @yaqbot.com Workspace account in (%s)", (_label, env) => {
    expect(decideCoachAccess("google", workspaceCoach, env)).toEqual({
      allowed: true,
      via: "workspace",
    });
  });

  it("normalises case and spaces in the email and domain", () => {
    const profile = {
      email: " Hola@YAQBOT.com ",
      email_verified: true,
      hd: "YaqBot.com",
    };
    expect(decideCoachAccess("google", profile, production).allowed).toBe(true);
  });

  it("accepts email_verified sent as the string 'true'", () => {
    const profile = { ...workspaceCoach, email_verified: "true" };
    expect(decideCoachAccess("google", profile, production).allowed).toBe(true);
  });

  it("rejects a @yaqbot.com email without the Workspace hd claim", () => {
    // A consumer Google account created with a @yaqbot.com address.
    const profile = { email: "someone@yaqbot.com", email_verified: true };
    expect(decideCoachAccess("google", profile, production)).toEqual({
      allowed: false,
      reason: "not_a_coach",
    });
  });

  it("rejects an hd claim from another Workspace domain", () => {
    const profile = {
      email: "coach@otherbox.com",
      email_verified: true,
      hd: "otherbox.com",
    };
    expect(decideCoachAccess("google", profile, production)).toMatchObject({
      reason: "not_a_coach",
    });
  });

  it("rejects hd = yaqbot.com with an email from another domain", () => {
    const profile = {
      email: "x@gmail.com",
      email_verified: true,
      hd: "yaqbot.com",
    };
    expect(decideCoachAccess("google", profile, production).allowed).toBe(
      false,
    );
  });

  it("rejects an unverified email, even with the right domain", () => {
    const profile = { ...workspaceCoach, email_verified: false };
    expect(decideCoachAccess("google", profile, production)).toEqual({
      allowed: false,
      reason: "email_not_verified",
    });
  });

  it("rejects a profile without email", () => {
    expect(
      decideCoachAccess(
        "google",
        { email_verified: true, hd: "yaqbot.com" },
        production,
      ),
    ).toMatchObject({ reason: "email_not_verified" });
  });

  it("rejects other providers and a missing profile", () => {
    expect(
      decideCoachAccess("github", workspaceCoach, production),
    ).toMatchObject({
      reason: "not_google",
    });
    expect(decideCoachAccess("google", undefined, production)).toMatchObject({
      reason: "not_google",
    });
  });

  it("lets the developer's extra email in on Preview and local development", () => {
    expect(decideCoachAccess("google", developer, preview)).toEqual({
      allowed: true,
      via: "extra-email",
    });
    expect(decideCoachAccess("google", developer, localDev).allowed).toBe(true);
  });

  it("never lets the extra email in on Production, even if it is set there", () => {
    expect(decideCoachAccess("google", developer, production)).toEqual({
      allowed: false,
      reason: "not_a_coach",
    });
  });

  it("rejects emails that are not on the allowlist outside production", () => {
    const stranger = { email: "stranger@gmail.com", email_verified: true };
    expect(decideCoachAccess("google", stranger, preview).allowed).toBe(false);
  });

  it("requires the extra email to be verified too", () => {
    const unverified = { ...developer, email_verified: false };
    expect(decideCoachAccess("google", unverified, preview).allowed).toBe(
      false,
    );
  });
});

describe("allowsExtraEmails", () => {
  it.each<[string, AccessEnvironment, boolean]>([
    ["Vercel production", production, false],
    ["Vercel preview", preview, true],
    ["vercel dev", { ...production, vercelEnv: "development" }, true],
    ["local next dev", localDev, true],
    [
      "a production build outside Vercel",
      { ...localDev, nodeEnv: "production" },
      false,
    ],
    [
      "an unknown VERCEL_ENV value",
      { ...production, vercelEnv: "staging" },
      false,
    ],
  ])("%s → %s", (_label, env, expected) => {
    expect(allowsExtraEmails(env)).toBe(expected);
    expect(isCoachDomainOnly(env)).toBe(!expected);
  });
});

describe("parseEmailList", () => {
  it("splits, trims, lower-cases and drops junk", () => {
    expect(parseEmailList(" A@Gmail.com, ,b@x.es,not-an-email ")).toEqual([
      "a@gmail.com",
      "b@x.es",
    ]);
  });

  it("returns an empty list when unset", () => {
    expect(parseEmailList(undefined)).toEqual([]);
  });
});
