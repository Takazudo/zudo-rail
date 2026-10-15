import { test, expect } from "@playwright/test";
import { selections, productId } from "../../src/assembly";
test("16 option states, 8 renderable 3U variants; 7U explicitly blocked", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const failures: string[] = [];
  page.on("requestfailed", (r) => failures.push(r.url()));
  await page.goto("/");
  for (const s of selections) {
    await page.locator("[name=height]").selectOption(s.height);
    await page.locator("[name=width]").selectOption(String(s.width));
    await page.locator(`[name=style][value=${s.style}]`).check();
    await page.locator(`[name=color][value=${s.color}]`).check();
    await expect(page.locator(".product-id")).toHaveText(productId(s));
    if (s.height === "7U") {
      await expect(page.locator(".scene-message")).toHaveAttribute(
        "data-state",
        "error",
      );
      await expect(page.locator(".scene-message")).toContainText("確認中");
    } else {
      await expect(page.locator(".scene-message")).toHaveAttribute(
        "data-state",
        "ready",
      );
      await expect(page.locator("canvas")).toBeVisible();
    }
    if (
      (s.style === "NY" && s.color === "WH") ||
      (s.style === "NU" && s.color === "BK")
    )
      await page.screenshot({
        path: `docs/screenshots/${productId(s)}.png`,
        fullPage: true,
      });
  }
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
  await page.locator("[name=height]").selectOption("3U");
  await expect(page.locator(".scene-message")).toHaveAttribute(
    "data-state",
    "ready",
  );
  await page.getByRole("button", { name: "側面", exact: true }).click();
  await page.getByRole("button", { name: "全体・リセット" }).click();
  await page.locator(".explode").fill("100");
  await page.screenshot({
    path: "docs/screenshots/exploded.png",
    fullPage: true,
  });
  await page.locator(".explode").fill("0");
  await page.locator("[data-layer=panel]").uncheck();
  await page.locator("[data-layer=panel]").check();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
test("failed asset is visible and later selection recovers", async ({
  page,
}) => {
  await page.route("**/working/nylon-single-v3-40hp.stl*", (route) =>
    route.abort(),
  );
  await page.goto("/");
  await expect(page.locator(".scene-message")).toHaveAttribute(
    "data-state",
    "error",
  );
  await page.unrouteAll();
  await page.locator("[name=width]").selectOption("60");
  await expect(page.locator(".scene-message")).toHaveAttribute(
    "data-state",
    "ready",
  );
});
