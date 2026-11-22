import { describe, expect, it } from "vitest";

import { getCountdownParts } from "@/lib/countdown";
import { wedding } from "@/data/wedding";
import { weddingRsvpSchema } from "@/lib/wedding-validation";
import { prependWeddingWish } from "@/lib/wedding-wishes";

describe("The Odyssey wedding details", () => {
  it("keeps the couple, title, date, day, and ceremony time editable in one place", () => {
    expect(wedding.title).toBe("The Odyssey");
    expect(wedding.brideName).toBe("Theertha");
    expect(wedding.groomName).toBe("Anigith");
    expect(wedding.dateIso).toBe("2027-01-10");
    expect(new Date(`${wedding.dateIso}T00:00:00`).getDay()).toBe(0);
    expect(wedding.weekday).toBe("Sunday");
    expect(wedding.timeLabel).toBe("11:30 AM – 12:15 PM");
  });

  it("uses the exact eight colors from the wedding brief", () => {
    expect(wedding.palette.map((color) => color.hex)).toEqual([
      "#76783E",
      "#7A863F",
      "#96A12F",
      "#C5D187",
      "#D4C01E",
      "#F3D51D",
      "#F5DE83",
      "#FFF3CA",
    ]);
  });

  it("counts down to the configured time and never returns negative values", () => {
    const target = new Date(wedding.dateTimeLocal).getTime();
    expect(getCountdownParts(target, target - 86_400_000)).toEqual({
      complete: false,
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
    expect(getCountdownParts(target, target + 1_000)).toEqual({
      complete: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it("accepts both invitation responses and rejects unknown responses", () => {
    const base = { guestName: "A Guest", phone: "+91 98765 43210", guestCount: "2" };
    expect(weddingRsvpSchema.safeParse({ ...base, attendance: "accepted" }).success).toBe(true);
    expect(weddingRsvpSchema.safeParse({ ...base, attendance: "declined" }).success).toBe(true);
    expect(weddingRsvpSchema.safeParse({ ...base, attendance: "maybe" }).success).toBe(false);
  });

  it("shows a newly submitted wish together with all previously visible wishes", () => {
    const earlierWish = {
      guest_name: "A Guest",
      message: "Wishing you a lifetime of joy.",
      submitted_at: "2026-11-21T10:00:00.000Z",
    };
    const newWish = {
      guest_name: "Another Guest",
      message: "May your journey be beautiful.",
      submitted_at: "2026-11-22T10:00:00.000Z",
    };

    expect(prependWeddingWish([earlierWish], newWish)).toEqual([newWish, earlierWish]);
  });
});