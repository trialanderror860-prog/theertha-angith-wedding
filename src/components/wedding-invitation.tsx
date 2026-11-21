import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUpRight, CalendarDays, MapPin, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { wedding } from "@/data/wedding";
import { getCountdownParts, type CountdownParts } from "@/lib/countdown";
import {
  getApprovedWeddingWishes,
  submitWeddingRsvp,
  submitWeddingWish,
} from "@/lib/wedding.functions";
import { weddingRsvpSchema, weddingWishSchema } from "@/lib/wedding-validation";

type Attendance = "accepted" | "declined";
type FormState = "idle" | "submitting" | "success" | "error";
type ApprovedWish = { guest_name: string; message: string; submitted_at: string };

const navigation = [
  { label: "Home", href: "#home" },
  { label: "Our Story", href: "#our-story" },
  { label: "Countdown", href: "#countdown" },
  { label: "Location", href: "#location" },
  { label: "RSVP", href: "#rsvp" },
  { label: "Dress Code", href: "#dress-code" },
];

export function WeddingInvitation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [rsvpState, setRsvpState] = useState<FormState>("idle");
  const [rsvpFeedback, setRsvpFeedback] = useState("");
  const [wishesState, setWishesState] = useState<FormState>("idle");
  const [wishesFeedback, setWishesFeedback] = useState("");
  const [approvedWishes, setApprovedWishes] = useState<ApprovedWish[]>([]);
  const [guestCount, setGuestCount] = useState("1");

  const saveRsvp = useServerFn(submitWeddingRsvp);
  const saveWish = useServerFn(submitWeddingWish);
  const loadApprovedWishes = useServerFn(getApprovedWeddingWishes);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const target = new Date(wedding.dateTimeLocal).getTime();
    if (!Number.isFinite(target)) return;

    const updateCountdown = () => setCountdown(getCountdownParts(target, Date.now()));
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    void loadApprovedWishes().then((result) => {
      if (active && result.ok) setApprovedWishes(result.wishes);
    });
    return () => {
      active = false;
    };
  }, [loadApprovedWishes]);

  const chooseAttendance = (choice: Attendance) => {
    setAttendance(choice);
    setRsvpState("idle");
    setRsvpFeedback("");
  };

  const handleRsvpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!attendance) return;

    const formData = new FormData(event.currentTarget);
    const submission = weddingRsvpSchema.safeParse({
      guestName: String(formData.get("guestName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      attendance,
      guestCount: String(formData.get("guestCount") ?? "1"),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
    });

    if (!submission.success) {
      setRsvpState("error");
      setRsvpFeedback(submission.error.issues[0]?.message ?? "Please check your details and try again.");
      return;
    }

    setRsvpState("submitting");
    setRsvpFeedback("");
    try {
      const result = await saveRsvp({ data: submission.data });
      if (!result.ok) {
        setRsvpState("error");
        setRsvpFeedback(result.error);
        return;
      }
      setRsvpState("success");
      setRsvpFeedback(
        attendance === "accepted"
          ? "We are so happy you'll be celebrating with us!"
          : "Thank you for letting us know. You'll be missed, and we appreciate your wishes.",
      );
    } catch {
      setRsvpState("error");
      setRsvpFeedback("We couldn't send your RSVP just now. Please try again.");
    }
  };

  const handleWishSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submission = weddingWishSchema.safeParse({
      guestName: String(formData.get("wishName") ?? ""),
      message: String(formData.get("wishMessage") ?? ""),
      website: String(formData.get("wishWebsite") ?? ""),
    });

    if (!submission.success) {
      setWishesState("error");
      setWishesFeedback(submission.error.issues[0]?.message ?? "Please check your message and try again.");
      return;
    }

    setWishesState("submitting");
    setWishesFeedback("");
    try {
      const result = await saveWish({ data: submission.data });
      if (!result.ok) {
        setWishesState("error");
        setWishesFeedback(result.error);
        return;
      }
      setWishesState("success");
      setWishesFeedback("Thank you for your beautiful wishes!");
      event.currentTarget.reset();
    } catch {
      setWishesState("error");
      setWishesFeedback("We couldn't send your wish just now. Please try again.");
    }
  };

  const locationQuery = [wedding.venue.name, wedding.venue.address, wedding.venue.city]
    .filter(Boolean)
    .join(", ");
  const directionsUrl = wedding.venue.mapLink.startsWith("https://") ? wedding.venue.mapLink : "";
  const mapQuery = locationQuery || directionsUrl;
  const mapEmbedUrl = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : "";

  return (
    <div className="min-h-screen overflow-x-hidden bg-warm-cream text-olive-deep">
      <a
        href="#home"
        className="skip-link fixed left-3 top-3 z-[60] -translate-y-20 bg-olive-deep px-4 py-2 text-sm text-warm-cream focus:translate-y-0"
      >
        Skip to invitation
      </a>

      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
          scrolled
            ? "border-olive-deep/15 bg-warm-cream/95 shadow-sm backdrop-blur-sm"
            : "border-transparent bg-warm-cream/85"
        }`}
      >
        <nav
          aria-label="Main navigation"
          className="relative mx-auto grid min-h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 sm:px-8 lg:px-12"
        >
          <a href="#home" className="font-serif text-xl font-medium text-olive-deep sm:text-2xl">
            The Odyssey
          </a>
          <div className="hidden items-center gap-7 md:flex">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="nav-link text-[0.7rem] font-medium uppercase text-olive-deep/80 transition-colors hover:text-moss-green"
              >
                {item.label}
              </a>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
          {menuOpen && (
            <div className="absolute left-0 right-0 top-full grid gap-1 border-b border-olive-deep/15 bg-warm-cream px-5 py-4 shadow-sm md:hidden">
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="nav-link py-2 text-xs font-medium uppercase text-olive-deep/85"
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </nav>
      </header>

      <main id="home">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-12 pt-7 sm:px-8 sm:pb-16 sm:pt-10 md:min-h-[calc(100svh-4rem)] md:grid-cols-[1.05fr_.95fr] md:gap-12 md:px-12 md:py-12 lg:gap-20">
          <figure className="fade-in-up relative mx-auto w-full max-w-[34rem] md:mx-0">
            <div className="overflow-hidden border border-olive-deep/15 bg-sage-green/20 p-2 sm:p-3">
              <img
                src={wedding.photos.opening}
                alt="Theertha and Anjith outdoors in greenery, smiling together."
                className="aspect-[4/5] w-full object-cover object-[50%_44%]"
                fetchPriority="high"
              />
            </div>
            <figcaption className="mt-3 flex items-center justify-between gap-3 text-[0.65rem] uppercase text-olive-deep/70 sm:text-xs">
              <span>A little moment, held forever</span>
              <span className="shrink-0">01 / 09</span>
            </figcaption>
          </figure>

          <div className="fade-in-up mx-auto w-full max-w-xl py-4 text-center md:mx-0 md:text-left">
            <p className="text-xs uppercase text-olive-green sm:text-sm">Together with their families</p>
            <div className="my-6 flex items-center justify-center gap-4 md:justify-start">
              <span className="h-px w-12 bg-mustard-yellow" />
              <span className="font-hand text-xl text-olive-green sm:text-2xl">a beginning</span>
              <span className="h-px w-12 bg-mustard-yellow" />
            </div>
            <h1 className="font-serif text-5xl font-medium leading-[0.92] text-olive-deep sm:text-7xl lg:text-8xl">
              <span className="block">{wedding.brideName}</span>
              <span className="my-2 block font-hand text-4xl text-olive-green sm:my-3 sm:text-5xl">&amp;</span>
              <span className="block">{wedding.groomName}</span>
            </h1>
            <p className="mt-7 text-xs uppercase text-olive-green sm:mt-9 sm:text-sm">{wedding.title}</p>
            <div className="mx-auto my-5 h-px w-16 bg-mustard-yellow md:mx-0" />
            <p className="mx-auto max-w-md font-serif text-xl leading-relaxed text-olive-deep sm:text-2xl md:mx-0">
              Our love story is written in the little moments we never want to forget.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-olive-deep/75 sm:text-base md:mx-0">
              An odyssey of two souls, who decide to step into a lifetime, side by side.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-olive-deep md:justify-start">
              <span>{wedding.dateLabel}</span>
              <span aria-hidden="true" className="text-mustard-yellow">·</span>
              <span>{wedding.timeLabel}</span>
            </div>
            <a
              href="#our-story"
              className="mt-8 inline-flex items-center gap-3 text-xs uppercase text-olive-green transition-colors hover:text-olive-deep"
            >
              Scroll to discover our story
              <ArrowDown size={15} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section id="our-story" className="scroll-mt-20 bg-sage-green/25 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-20">
            <div className="grid grid-cols-[1.1fr_.9fr] items-end gap-3 sm:gap-5">
              <figure className="min-w-0">
                <img
                  src={wedding.photos.story}
                  alt="Theertha and Anjith sharing a smile indoors."
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover object-[50%_47%]"
                />
                <figcaption className="mt-2 text-[0.65rem] uppercase text-olive-deep/65 sm:text-xs">
                  A moment together
                </figcaption>
              </figure>
              <figure className="min-w-0 pb-7 sm:pb-12">
                <img
                  src={wedding.photos.childhood}
                  alt="Theertha and Anjith as children, standing together."
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover object-center"
                />
                <figcaption className="mt-2 text-[0.65rem] uppercase text-olive-deep/65 sm:text-xs">
                  Where everything started
                </figcaption>
              </figure>
            </div>
            <div className="max-w-lg">
              <p className="text-xs uppercase text-olive-green">Where everything started.</p>
              <h2 className="mt-3 font-serif text-4xl font-medium leading-tight text-olive-deep sm:text-6xl">
                Our Story
              </h2>
              <div className="my-6 h-px w-16 bg-mustard-yellow" />
              <p className="font-serif text-xl leading-relaxed text-olive-green sm:text-2xl">
                Every journey has a beginning.
              </p>
              <p className="mt-4 text-sm leading-8 text-olive-deep/80 sm:text-base">
                {wedding.storyParagraph}
              </p>
            </div>
          </div>
        </section>

        <section id="countdown" className="scroll-mt-20 bg-olive-deep px-5 py-16 text-warm-cream sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs uppercase text-pastel-yellow">{wedding.dateLabel} · {wedding.weekday}</p>
            <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-medium leading-tight sm:text-6xl">
              Until We Begin Our Forever
            </h2>
            <p className="mt-5 font-hand text-2xl text-pastel-yellow sm:text-3xl">
              “To have and to hold from this day forward.”
            </p>
            <p className="mt-3 text-sm text-warm-cream/80">{wedding.timeLabel}</p>

            {countdown?.complete ? (
              <p className="mt-12 font-serif text-3xl text-pastel-yellow sm:text-4xl">
                The day we've been waiting for is here.
              </p>
            ) : (
              <div
                aria-label="Wedding countdown"
                aria-live="off"
                className="mx-auto mt-12 grid max-w-4xl grid-cols-2 border-y border-warm-cream/25 sm:grid-cols-4"
              >
                {[
                  { label: "Days", value: countdown?.days },
                  { label: "Hours", value: countdown?.hours },
                  { label: "Minutes", value: countdown?.minutes },
                  { label: "Seconds", value: countdown?.seconds },
                ].map((unit, index) => (
                  <div
                    key={unit.label}
                    className={`px-3 py-6 sm:px-5 sm:py-8 ${index % 2 === 0 ? "border-r" : ""} ${index < 2 ? "border-b" : ""} border-warm-cream/25 sm:border-b-0 ${index < 3 ? "sm:border-r" : "sm:border-r-0"}`}
                  >
                    <p className="font-serif text-5xl tabular-nums text-pastel-yellow sm:text-6xl">
                      {unit.value === undefined ? "—" : String(unit.value).padStart(2, "0")}
                    </p>
                    <p className="mt-2 text-[0.65rem] uppercase text-warm-cream/75 sm:text-xs">{unit.label}</p>
                  </div>
                ))}
              </div>
            )}
            <a
              href="#location"
              className="mt-9 inline-flex items-center gap-2 text-xs uppercase text-pastel-yellow transition-colors hover:text-warm-cream"
            >
              Find the celebration
              <ArrowDown size={14} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section id="location" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
            <div>
              {mapEmbedUrl ? (
                <iframe
                  title="Wedding location map"
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="aspect-[4/3] w-full border-0"
                />
              ) : (
                <div className="photo-placeholder aspect-[4/3] px-8">
                  <div className="relative z-10 max-w-xs px-4">
                    <span className="font-serif text-5xl text-olive-deep/60">02</span>
                    <p className="mt-3 text-xs uppercase">Venue photograph</p>
                    <p className="mt-2 text-sm leading-6 text-olive-deep/70">
                      To be added once the celebration location is confirmed.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="max-w-xl">
              <p className="text-xs uppercase text-olive-green">The gathering</p>
              <h2 className="mt-3 font-serif text-4xl font-medium leading-tight sm:text-6xl">
                Join Us as We Begin Forever
              </h2>
              <div className="my-6 h-px w-16 bg-mustard-yellow" />
              <p className="max-w-lg text-sm leading-7 text-olive-deep/75 sm:text-base">
                {wedding.venue.description || "The place where we begin this next chapter will be shared here soon."}
              </p>
              <div className="mt-7 grid gap-5 border-y border-olive-deep/15 py-6 sm:grid-cols-2">
                <div>
                  <p className="text-[0.65rem] uppercase text-olive-green">Venue</p>
                  <p className="mt-1 font-serif text-xl">{wedding.venue.name || "Venue name to be added"}</p>
                </div>
                <div>
                  <p className="text-[0.65rem] uppercase text-olive-green">When</p>
                  <p className="mt-1 font-serif text-xl">{wedding.dateLabel}</p>
                  <p className="text-sm text-olive-deep/70">{wedding.weekday} · {wedding.timeLabel}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[0.65rem] uppercase text-olive-green">Address</p>
                  <p className="mt-1 text-sm leading-6 text-olive-deep/80">
                    {[wedding.venue.address, wedding.venue.city].filter(Boolean).join(", ") || "Full address and city to be added"}
                  </p>
                </div>
              </div>
              {directionsUrl ? (
                <Button asChild className="mt-6 rounded-sm bg-mustard-yellow text-olive-deep hover:bg-bright-yellow">
                  <a href={directionsUrl} target="_blank" rel="noreferrer">
                    Get Directions <ArrowUpRight aria-hidden="true" />
                  </a>
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled
                  className="mt-6 rounded-sm bg-mustard-yellow text-olive-deep"
                  title="Directions will be available once the venue is confirmed."
                >
                  <MapPin aria-hidden="true" /> Get Directions
                </Button>
              )}
            </div>
          </div>
        </section>

        <section id="rsvp" className="scroll-mt-20 bg-sage-green/25 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs uppercase text-olive-green">A note from us</p>
            <h2 className="mt-3 font-serif text-4xl font-medium sm:text-6xl">Kindly RSVP</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-olive-deep/75 sm:text-base">
              Your presence would make our celebration even more special.
            </p>
            <p className="mt-8 font-serif text-2xl text-olive-deep sm:text-3xl">Will you be joining us?</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                aria-pressed={attendance === "accepted"}
                onClick={() => chooseAttendance("accepted")}
                className={`h-auto min-h-14 rounded-sm border-olive-deep px-5 py-4 font-serif text-lg ${attendance === "accepted" ? "bg-mustard-yellow text-olive-deep" : "bg-warm-cream/70 text-olive-deep hover:bg-pastel-yellow"}`}
              >
                ♡ Joyfully Accept
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-pressed={attendance === "declined"}
                onClick={() => chooseAttendance("declined")}
                className={`h-auto min-h-14 rounded-sm border-olive-deep/40 px-5 py-4 font-serif text-lg ${attendance === "declined" ? "bg-olive-green text-warm-cream" : "bg-warm-cream/70 text-olive-deep hover:bg-sage-green"}`}
              >
                ♡ Regretfully Decline
              </Button>
            </div>

            {attendance && rsvpState !== "success" && (
              <form onSubmit={(event) => void handleRsvpSubmit(event)} className="mt-8 border-y border-olive-deep/20 py-8 text-left">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-olive-green">Your response</p>
                    <p className="mt-1 font-serif text-2xl">
                      {attendance === "accepted" ? "Joyfully Accept" : "Regretfully Decline"}
                    </p>
                  </div>
                  <Button type="button" variant="link" onClick={() => chooseAttendance(attendance === "accepted" ? "declined" : "accepted")}>
                    Choose the other response
                  </Button>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="guest-name">Full Name</Label>
                    <Input id="guest-name" name="guestName" autoComplete="name" maxLength={120} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="guest-phone">Phone Number</Label>
                    <Input id="guest-phone" name="phone" type="tel" autoComplete="tel" maxLength={32} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="guest-count">Number of Guests</Label>
                    <Input
                      id="guest-count"
                      name="guestCount"
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={guestCount}
                      onChange={(event) => setGuestCount(event.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="guest-message">Personal Message <span className="font-normal text-olive-deep/65">(optional)</span></Label>
                    <Textarea id="guest-message" name="message" rows={3} maxLength={1000} />
                  </div>
                </div>
                <div className="honeypot-field" aria-hidden="true">
                  <label htmlFor="rsvp-website">Website</label>
                  <input id="rsvp-website" name="website" tabIndex={-1} autoComplete="off" />
                </div>
                {rsvpState === "error" && <p role="alert" className="mt-4 text-sm text-olive-deep">{rsvpFeedback}</p>}
                <Button
                  type="submit"
                  disabled={rsvpState === "submitting"}
                  className="mt-6 rounded-sm bg-mustard-yellow px-6 text-olive-deep hover:bg-bright-yellow"
                >
                  {rsvpState === "submitting" ? "Sending…" : "Submit RSVP"}
                </Button>
              </form>
            )}

            {rsvpState === "success" && (
              <p role="status" className="mt-8 border-y border-olive-deep/20 py-6 font-serif text-2xl text-olive-deep sm:text-3xl">
                {rsvpFeedback}
              </p>
            )}
          </div>
        </section>

        <section id="colour-code" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase text-olive-green">A little invitation in colour</p>
              <h2 className="mt-3 font-serif text-4xl font-medium sm:text-6xl">A Touch of Our Colours</h2>
              <p className="mt-4 text-sm leading-7 text-olive-deep/75 sm:text-base">
                We will be happy if you wear our colour code.
              </p>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-8">
              {wedding.palette.map((color) => (
                <li key={color.hex} className="min-w-0">
                  <div className={`h-20 border border-olive-deep/10 sm:h-24 ${color.swatchClass}`} aria-label={`${color.name}, ${color.hex}`} />
                  <p className="mt-2 text-xs font-medium text-olive-deep">{color.name}</p>
                  <p className="text-[0.7rem] text-olive-deep/70">{color.hex}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="dress-code" className="scroll-mt-20 bg-sage-green/25 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto grid max-w-7xl items-center gap-9 lg:grid-cols-[1fr_.85fr] lg:gap-20">
            <figure>
              <img
                src={wedding.photos.dressCode}
                alt="Wedding guests in olive, sage, and soft golden sarees gathered in a garden courtyard."
                loading="lazy"
                className="aspect-[4/5] w-full object-cover object-[50%_62%] sm:aspect-[5/4] lg:aspect-[4/5]"
              />
              <figcaption className="mt-3 text-xs uppercase text-olive-deep/70">
                A gathering in the colours we love
              </figcaption>
            </figure>
            <div className="max-w-xl">
              <p className="text-xs uppercase text-olive-green">Wear what feels like you</p>
              <h2 className="mt-3 font-serif text-4xl font-medium leading-tight sm:text-6xl">Dress Code</h2>
              <div className="my-6 h-px w-16 bg-mustard-yellow" />
              <p className="text-base leading-8 text-olive-deep/80">
                We kindly ask you to support the aesthetic of our wedding with these colours.
              </p>
              <p className="mt-4 text-sm leading-7 text-olive-deep/75">
                Olive, sage, moss, mustard, soft yellow, and cream are lovely ways to join the palette. Please wear whatever makes you feel comfortable and at home.
              </p>
              <a href="#colour-code" className="mt-6 inline-flex items-center gap-2 text-xs uppercase text-olive-green hover:text-olive-deep">
                See the colour palette <ArrowDown size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section id="wishes" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="text-xs uppercase text-olive-green">A note for the years ahead</p>
              <h2 className="mt-3 font-serif text-4xl font-medium leading-tight sm:text-6xl">Share Your Love and Thoughts</h2>
              <div className="my-6 h-px w-16 bg-mustard-yellow" />
              <p className="max-w-md text-sm leading-7 text-olive-deep/75 sm:text-base">
                Your blessings and wishes mean the world to us.
              </p>
            </div>
            <div>
              {wishesState === "success" ? (
                <p role="status" className="border-y border-olive-deep/20 py-6 font-serif text-2xl text-olive-deep">
                  {wishesFeedback}
                </p>
              ) : (
                <form onSubmit={(event) => void handleWishSubmit(event)} className="grid gap-5 border-y border-olive-deep/20 py-7">
                  <div className="grid gap-2">
                    <Label htmlFor="wish-name">Guest Name</Label>
                    <Input id="wish-name" name="wishName" autoComplete="name" maxLength={120} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="wish-message">Message</Label>
                    <Textarea id="wish-message" name="wishMessage" rows={4} maxLength={1000} required />
                  </div>
                  <div className="honeypot-field" aria-hidden="true">
                    <label htmlFor="wish-website">Website</label>
                    <input id="wish-website" name="wishWebsite" tabIndex={-1} autoComplete="off" />
                  </div>
                  {wishesState === "error" && <p role="alert" className="text-sm text-olive-deep">{wishesFeedback}</p>}
                  <div>
                    <Button
                      type="submit"
                      disabled={wishesState === "submitting"}
                      className="rounded-sm bg-mustard-yellow px-6 text-olive-deep hover:bg-bright-yellow"
                    >
                      {wishesState === "submitting" ? "Sending…" : "Send Your Wishes"}
                    </Button>
                  </div>
                </form>
              )}

              {approvedWishes.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs uppercase text-olive-green">Guest wishes</p>
                  <ul className="mt-4 divide-y divide-olive-deep/15">
                    {approvedWishes.map((wish, index) => (
                      <li key={`${wish.submitted_at}-${index}`} className="py-4">
                        <p className="font-serif text-lg text-olive-deep">“{wish.message}”</p>
                        <p className="mt-1 text-xs text-olive-deep/65">{wish.guest_name}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-pastel-yellow/35 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
            <figure>
              <img
                src={wedding.photos.closing}
                alt="Theertha and Anjith together outdoors in greenery."
                loading="lazy"
                className="aspect-[4/5] w-full object-cover object-[50%_44%]"
              />
            </figure>
            <div className="py-4 text-center lg:text-left">
              <p className="font-hand text-2xl text-olive-green sm:text-3xl">“Some moments are meant to be felt, not explained.”</p>
              <div className="mx-auto my-7 h-px w-16 bg-mustard-yellow lg:mx-0" />
              <p className="text-xs uppercase text-olive-green">With all our hearts</p>
              <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-olive-deep sm:text-6xl">
                WE CAN'T WAIT TO SEE YOU!
              </h2>
              <p className="mt-7 font-serif text-3xl text-olive-deep sm:text-4xl">
                {wedding.brideName} &amp; {wedding.groomName}
              </p>
              <p className="mt-2 text-sm text-olive-green">{wedding.dateLabel}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col items-center justify-between gap-3 px-5 py-7 text-center text-xs text-olive-deep/70 sm:flex-row sm:px-8 lg:px-12">
        <span>{wedding.brideName} &amp; {wedding.groomName}</span>
        <span className="font-hand text-xl text-olive-green">Made with love.</span>
        <a href="#home" className="inline-flex items-center gap-1 uppercase hover:text-olive-deep">
          Back to top <CalendarDays size={13} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}