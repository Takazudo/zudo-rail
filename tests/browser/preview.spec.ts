import { test, expect } from "@playwright/test";
import { selections, productId } from "../../src/assembly";
test("all 16 variants render with correct part counts", async ({ page }) => {
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
    await expect(page.locator(".scene-message")).toHaveAttribute(
      "data-state",
      "ready",
    );
    const count =
      s.height === "3U"
        ? s.style === "NY"
          ? 8
          : 6
        : s.style === "NY"
          ? 18
          : 12;
    await expect(page.locator(".scene-message")).toHaveText(
      `${count}部品を表示中`,
    );
    await expect(page.locator("canvas")).toBeVisible();
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
    route.request().resourceType() === "fetch"
      ? route.abort()
      : route.continue(),
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

test("integration lifecycle, camera, visibility, explode, rapid selection and CSS isolation", async ({
  page,
}) => {
  await page.goto("/tests/browser/fixture.html");
  await expect(page.locator(".scene-message")).toHaveAttribute(
    "data-state",
    "ready",
  );
  expect(
    await page
      .locator("#host-main")
      .evaluate((el) => getComputedStyle(el).display),
  ).toBe("block");
  const snapshot = () => page.evaluate(() => window.rail.snapshot()!);
  const initial = await snapshot();
  await page.getByRole("button", { name: "正面", exact: true }).click();
  expect((await snapshot()).camera).not.toEqual(initial.camera);
  const front = await snapshot();
  await page.getByRole("button", { name: "拡大", exact: true }).click();
  expect((await snapshot()).camera).not.toEqual(front.camera);
  await page.getByRole("button", { name: "側面", exact: true }).click();
  expect((await snapshot()).camera).not.toEqual(front.camera);
  await page.getByRole("button", { name: "全体・リセット" }).click();
  (await snapshot()).camera.forEach((value, index) =>
    expect(value).toBeCloseTo(initial.camera[index], 8),
  );
  const canvas = page.locator("canvas");
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 60,
    box.y + box.height / 2 + 30,
    { steps: 5 },
  );
  await page.mouse.up();
  await page.getByRole("button", { name: "全体・リセット" }).click();
  await page.waitForTimeout(200);
  (await snapshot()).camera.forEach((value, index) =>
    expect(value).toBeCloseTo(initial.camera[index], 8),
  );
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 70,
    box.y + box.height / 2 + 30,
    { steps: 5 },
  );
  await page.mouse.up();
  expect((await snapshot()).camera).not.toEqual(initial.camera);
  await page.locator(".explode").fill("100");
  expect(
    (await snapshot()).items.every((x) => x.position.some((v) => v !== 0)),
  ).toBe(true);
  await page.locator("[data-layer=panel]").uncheck();
  expect((await snapshot()).items.filter((x) => !x.visible)).toHaveLength(4);
  await page.locator("[data-layer=panel]").check();
  await page.locator(".explode").fill("0");
  expect(
    (await snapshot()).items.every((x) => x.position.every((v) => v === 0)),
  ).toBe(true);
  await page.route("**/working/nuts-single-v3-60hp.stl*", async (route) => {
    if (route.request().resourceType() === "fetch")
      await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });
  await page.evaluate(() => {
    window.rail.setSelection({
      height: "3U",
      width: 60,
      style: "NU",
      color: "BK",
    });
    window.rail.setSelection({
      height: "3U",
      width: 40,
      style: "NY",
      color: "WH",
    });
  });
  await expect(page.locator(".product-id")).toHaveText("RAIL-3U-NY-WH-40");
  await expect(page.locator(".scene-message")).toHaveAttribute(
    "data-state",
    "ready",
  );
  await page.waitForTimeout(400);
  expect((await snapshot()).parts).toBe(8);
  await page.evaluate(() => window.rail.dispose());
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator("#fixture")).toBeEmpty();
});

declare global {
  interface Window {
    rail: ReturnType<typeof import("../../src/preview").mountRailPreview>;
  }
}
