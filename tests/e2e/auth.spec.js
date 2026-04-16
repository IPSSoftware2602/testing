const { test, expect } = require("@playwright/test");

async function seedMenuState(page, {
  orderType = "pickup",
  outletId = "1",
  estimatedTime = null,
  deliveryAddress = null,
  latestSettings = null,
} = {}) {
  await page.addInitScript((payload) => {
    const RealDate = Date;
    const fixedNow = new RealDate("2026-03-09T09:00:00");

    class MockDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          return new RealDate(fixedNow);
        }
        return new RealDate(...args);
      }

      static now() {
        return fixedNow.getTime();
      }
    }

    window.Date = MockDate;

    localStorage.setItem("orderType", payload.orderType);
    localStorage.setItem(
      "outletDetails",
      JSON.stringify({
        outletId: payload.outletId,
        outletTitle: "US Pizza Test Outlet",
        isHQ: false,
        isOperate: true,
        delivery_settings: [
          {
            delivery_available_days: "1",
            delivery_start: "09:00",
            delivery_end: "13:00",
            delivery_interval: "30",
            lead_time: "30",
          },
        ],
      })
    );

    if (payload.estimatedTime) {
      localStorage.setItem("estimatedTime", JSON.stringify(payload.estimatedTime));
    } else {
      localStorage.removeItem("estimatedTime");
    }

    if (payload.deliveryAddress) {
      localStorage.setItem("deliveryAddressDetails", JSON.stringify(payload.deliveryAddress));
    } else {
      localStorage.removeItem("deliveryAddressDetails");
    }
  }, { orderType, outletId, estimatedTime, deliveryAddress });

  await page.route(`**/outlets/${outletId}`, async (route) => {
    const resolvedLatestSettings = latestSettings || [
      {
        delivery_available_days: "1",
        delivery_start: "10:00",
        delivery_end: "12:00",
        delivery_interval: "30",
        lead_time: "60",
      },
    ];

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          id: outletId,
          title: "US Pizza Test Outlet",
          lead_time: resolvedLatestSettings[0]?.lead_time || "60",
          delivery_start: resolvedLatestSettings[0]?.delivery_start || "10:00",
          delivery_end: resolvedLatestSettings[0]?.delivery_end || "12:00",
          delivery_interval: resolvedLatestSettings[0]?.delivery_interval || "30",
          delivery_available_days: resolvedLatestSettings[0]?.delivery_available_days || "1",
          delivery_settings: resolvedLatestSettings,
        },
      }),
    });
  });

  await page.route(`**/menu/all/${outletId}/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        Items: [],
        Categories: [],
      }),
    });
  });

  await page.route("**/cart/get**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "success",
        data: [],
        order_summary: {
          selected_date: estimatedTime?.date || null,
          selected_time: estimatedTime?.time || null,
        },
      }),
    });
  });
}

test.describe("App web auth", () => {
  test("keeps delivery context when menu is opened from stored state without route params", async ({ page }) => {
    await seedMenuState(page, {
      orderType: "delivery",
      estimatedTime: {
        estimatedTime: "Today 10:30",
        date: "2026-03-09",
        time: "10:30",
      },
      deliveryAddress: {
        address: "Test Address",
        latitude: "3.1390",
        longitude: "101.6869",
      },
      latestSettings: [
        {
          delivery_available_days: "1",
          delivery_start: "09:00",
          delivery_end: "12:00",
          delivery_interval: "30",
          lead_time: "30",
        },
      ],
    });

    await page.goto("/screens/menu");

    await expect(page.getByText("Today 10:30")).toBeVisible();
    await expect(page.getByText(/Test Addre/)).toBeVisible();
    await expect(page.getByText("Please Select Time")).toHaveCount(0);
  });

  test("opens datetime modal with explanation when stored time is no longer available", async ({ page }) => {
    await seedMenuState(page, {
      orderType: "pickup",
      estimatedTime: {
        estimatedTime: "Mar 9 12:30",
        date: "2026-03-09",
        time: "12:30",
      },
    });

    await page.goto("/screens/menu?orderType=pickup&outletId=1");

    await expect(page.getByText("Select Desire Time")).toBeVisible();
    await expect(
      page.getByText("Your selected pickup time is no longer available. Please choose another slot.")
    ).toBeVisible();
  });

  test("opens datetime modal when delivery time is missing on first menu entry", async ({ page }) => {
    await seedMenuState(page, {
      orderType: "delivery",
      deliveryAddress: {
        address: "Test Address",
        latitude: "3.1390",
        longitude: "101.6869",
      },
    });

    await page.goto("/screens/menu?orderType=delivery&outletId=1");

    await expect(page.getByText("Select Desire Time")).toBeVisible();
    await expect(
      page.getByText("Please select your delivery date and time.")
    ).toBeVisible();
  });

  test("opens datetime modal with lead time message when stored time is too early", async ({ page }) => {
    await seedMenuState(page, {
      orderType: "delivery",
      estimatedTime: {
        estimatedTime: "Mar 9 09:30",
        date: "2026-03-09",
        time: "09:30",
      },
      deliveryAddress: {
        address: "Test Address",
        latitude: "3.1390",
        longitude: "101.6869",
      },
      latestSettings: [
        {
          delivery_available_days: "1",
          delivery_start: "09:00",
          delivery_end: "12:00",
          delivery_interval: "30",
          lead_time: "60",
        },
      ],
    });

    await page.goto("/screens/menu?orderType=delivery&outletId=1");

    await expect(page.getByText("Select Desire Time")).toBeVisible();
    await expect(
      page.getByText("Your selected delivery time is no longer within the required lead time. Please choose again.")
    ).toBeVisible();
  });

  test("renders the login screen", async ({ page }) => {
    await page.goto("/screens/auth/login");

    await expect(page.getByText("US Pizza Malaysia Official")).toBeVisible();
    await expect(page.locator('[data-testid="phone-input"] input')).toBeVisible();
    await expect(page.locator('[data-testid="sms-button"]')).toBeVisible();
  });

  test("moves to OTP screen after a successful SMS request", async ({ page }) => {
    await page.route("**/send-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
        }),
      });
    });

    await page.goto("/screens/auth/login");

    await page.locator('[data-testid="phone-input"] input').fill("123456789");
    await page.locator('[data-testid="sms-button"]').click();

    await expect(page).toHaveURL(/\/screens\/auth\/otp/);
    await expect(
      page.getByText("Your one-time password (OTP) has been sent to +60123456789")
    ).toBeVisible();
  });

  test("shows a get latest location action on outlet select", async ({ page }) => {
    await page.route("**/outlets/nearest/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: [],
        }),
      });
    });

    await page.goto("/screens/home/outlet_select");

    await expect(page.getByText("Get latest location")).toBeVisible();
  });
});
