import { describe, expect, it } from "vitest";
import { buildManifest, manifestHref, parsePhoneStart } from "./manifest";

describe("parsePhoneStart", () => {
  it("accepts phone pages, with or without a locale prefix", () => {
    expect(parsePhoneStart("/t")).toEqual({ path: "/t", locale: "es" });
    expect(parsePhoneStart("/t/K7QM4P")).toEqual({
      path: "/t/K7QM4P",
      locale: "es",
    });
    expect(parsePhoneStart("/en/t/demo/quick")).toEqual({
      path: "/en/t/demo/quick",
      locale: "en",
    });
    expect(parsePhoneStart("/ca/t")).toEqual({ path: "/ca/t", locale: "ca" });
  });

  it("falls back to the phone home for anything else", () => {
    const fallback = { path: "/t", locale: "es" };
    for (const raw of [
      null,
      "",
      "/coach",
      "/fr/t",
      "https://evil.example/t",
      "//evil.example/t",
      "/t/../coach",
      "/t/a/b/c",
      "/t?x=1",
      "/tt",
    ]) {
      expect(parsePhoneStart(raw)).toEqual(fallback);
    }
  });
});

describe("manifestHref", () => {
  it("encodes the page path in the query", () => {
    expect(manifestHref("/en/t/K7QM4P")).toBe(
      "/app.webmanifest?start=%2Fen%2Ft%2FK7QM4P",
    );
  });
});

describe("buildManifest", () => {
  const texts = { name: "Box Timer", shortName: "Timer", description: "d" };

  it("starts the installed app on the page it was installed from", () => {
    const manifest = buildManifest(
      { path: "/ca/t/K7QM4P", locale: "ca" },
      texts,
    );
    expect(manifest).toMatchObject({
      id: "/ca/t/K7QM4P",
      start_url: "/ca/t/K7QM4P",
      lang: "ca",
      display: "standalone",
      name: "Box Timer",
      short_name: "Timer",
    });
  });

  it("lists regular and maskable icons", () => {
    const manifest = buildManifest({ path: "/t", locale: "es" }, texts);
    expect(manifest.icons?.map((icon) => icon.purpose ?? "any")).toEqual([
      "any",
      "any",
      "maskable",
    ]);
  });
});
