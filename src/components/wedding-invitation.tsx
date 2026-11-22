import { useEffect, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Heart,
  Lock,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Search,
  Unlock,
  Users,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { wedding } from "@/data/wedding";
import { getCountdownParts, type CountdownParts } from "@/lib/countdown";
import {
  getWeddingRsvps,
  getWeddingWishes,
  submitWeddingRsvp,
  submitWeddingWish,
  type WeddingRsvpItem,
} from "@/lib/wedding.functions";
import { weddingRsvpSchema, weddingWishSchema } from "@/lib/wedding-validation";
import { prependWeddingWish, type WeddingWish } from "@/lib/wedding-wishes";

type Attendance = "accepted" | "declined";
type FormState = "idle" | "submitting" | "success" | "error";
const navigation = [
  { label: "Home", href: "#home" },
  { label: "Our Story", href: "#our-story" },
  { label: "Countdown", href: "#countdown" },
  { label: "Location", href: "#location" },
  { label: "RSVP", href: "#rsvp" },
  { label: "Dress Code", href: "#dress-code" },
  { label: "Wishes", href: "#wishes" },
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
  const [guestWishes, setGuestWishes] = useState<WeddingWish[]>([]);
  const [showWishes, setShowWishes] = useState(false);
  const [guestCount, setGuestCount] = useState("1");
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const saveRsvp = useServerFn(submitWeddingRsvp);
  const saveWish = useServerFn(submitWeddingWish);
  const loadWeddingWishes = useServerFn(getWeddingWishes);
  const loadRsvps = useServerFn(getWeddingRsvps);

  const [bridePortalOpen, setBridePortalOpen] = useState(false);
  const [bridePin, setBridePin] = useState("");
  const [isPinAuthenticated, setIsPinAuthenticated] = useState(false);
  const [pinError, setPinError] = useState("");
  const [rsvps, setRsvps] = useState<WeddingRsvpItem[]>([]);
  const [rsvpsLoading, setRsvpsLoading] = useState(false);
  const [rsvpFilter, setRsvpFilter] = useState<"all" | "accepted" | "declined">("all");
  const [rsvpSearch, setRsvpSearch] = useState("");

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#bride-portal") {
        setBridePortalOpen(true);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleUnlockBridePortal = async (e: FormEvent) => {
    e.preventDefault();
    if (bridePin !== "0106") {
      setPinError("Incorrect PIN !");
      return;
    }
    setPinError("");
    setRsvpsLoading(true);
    try {
      const res = await loadRsvps({ data: { pin: bridePin } });
      if (res.ok) {
        setIsPinAuthenticated(true);
        setRsvps(res.rsvps);
      } else {
        setPinError(res.error || "Could not load responses.");
      }
    } catch {
      setPinError("Connection error. Please try again.");
    } finally {
      setRsvpsLoading(false);
    }
  };

  const exportRsvpsCsv = () => {
    if (!rsvps.length) return;
    const headers = ["Guest Name", "Phone", "Attendance", "Number of Guests", "Date Submitted"];
    const rows = rsvps.map((r) => [
      `"${r.guest_name.replace(/"/g, '""')}"`,
      `"${r.phone.replace(/"/g, '""')}"`,
      r.attendance === "accepted" ? "Attending" : "Declined",
      r.guest_count,
      `"${new Date(r.submitted_at).toLocaleString()}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Theertha_Anigith_RSVP_List_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const audio = new Audio("/music.mp3");
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");
    audio.setAttribute("webkit-playsinline", "true");
    audioRef.current = audio;

    // Attempt direct autoplay immediately
    audio
      .play()
      .then(() => setIsPlayingMusic(true))
      .catch(() => {
        // Expected on mobile browsers with strict autoplay policies
      });

    // Fallback: unlock and play on first user interaction across mobile & desktop
    const unlockEvents = ["click", "touchstart", "touchend", "pointerdown", "scroll", "keydown"];
    const unlockAudio = () => {
      if (audio.paused) {
        audio
          .play()
          .then(() => setIsPlayingMusic(true))
          .catch(() => {});
      }
      unlockEvents.forEach((evt) => {
        window.removeEventListener(evt, unlockAudio);
        document.removeEventListener(evt, unlockAudio);
      });
    };

    unlockEvents.forEach((evt) => {
      window.addEventListener(evt, unlockAudio, { passive: true });
      document.addEventListener(evt, unlockAudio, { passive: true });
    });

    return () => {
      audio.pause();
      unlockEvents.forEach((evt) => {
        window.removeEventListener(evt, unlockAudio);
        document.removeEventListener(evt, unlockAudio);
      });
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlayingMusic(true))
        .catch(() => {});
    }
  };

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
    void loadWeddingWishes().then((result) => {
      if (active && result.ok) setGuestWishes(result.wishes);
    });
    return () => {
      active = false;
    };
  }, [loadWeddingWishes]);

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [guestWishes, showWishes]);

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
    const form = event.currentTarget;
    const formData = new FormData(form);
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
      setGuestWishes((wishes) => prependWeddingWish(wishes, {
        guest_name: submission.data.guestName,
        message: submission.data.message,
        submitted_at: new Date().toISOString(),
      }));
      setShowWishes(true);
      form.reset();
    } catch (error) {
      console.error("Error submitting wish:", error);
      setWishesState("error");
      setWishesFeedback("We couldn't send your wish just now. Please try again.");
    }
  };

  const directionsUrl = wedding.venue.mapLink.startsWith("https://") ? wedding.venue.mapLink : "";

  return (
    <div className="min-h-screen overflow-x-hidden bg-warm-cream text-olive-deep">
      <a
        href="#home"
        className="skip-link fixed left-3 top-3 z-[60] -translate-y-20 bg-olive-deep px-4 py-2 text-sm text-warm-cream focus:translate-y-0"
      >
        Skip to invitation
      </a>

      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-olive-deep/15 bg-warm-cream/95 shadow-sm backdrop-blur-sm py-2"
            : "border-transparent bg-warm-cream/90 py-3 sm:py-4"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          {/* Centered Grand Title above cover photo */}
          <div className="relative flex w-full items-center justify-center py-1">
            <a
              href="#home"
              className="mx-auto text-center font-serif text-2xl sm:text-4xl lg:text-5xl font-medium tracking-[0.2em] sm:tracking-[0.25em] uppercase text-olive-deep transition-colors hover:text-olive-green px-10"
            >
              The Odyssey
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 md:hidden"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </Button>
          </div>

          {/* Centered Navigation Menu */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center justify-center gap-8 pt-3 border-t border-olive-deep/10 mt-2.5"
          >
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="nav-link text-xs font-medium uppercase tracking-wider text-olive-deep/80 transition-colors hover:text-moss-green"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="absolute left-0 right-0 top-full grid gap-1 border-b border-olive-deep/15 bg-warm-cream px-5 py-4 shadow-md md:hidden">
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
        </div>
      </header>

      <main id="home">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-12 pt-7 sm:px-8 sm:pb-16 sm:pt-10 md:min-h-[calc(100svh-4rem)] md:grid-cols-[1.05fr_.95fr] md:gap-12 md:px-12 md:py-12 lg:gap-20">
          <figure className="fade-in-up image-card-hover group relative mx-auto w-full max-w-[34rem] md:mx-0">
            <div className="overflow-hidden border border-olive-deep/15 bg-sage-green/20 p-2 sm:p-3 shadow-md">
              <img
                src={wedding.photos.opening}
                alt="Theertha and Anigith outdoors in greenery, smiling together."
                className="aspect-[4/5] w-full object-cover object-[50%_44%] transition-transform duration-700 group-hover:scale-105"
                fetchPriority="high"
              />
            </div>
            <figcaption className="mt-3 flex items-center justify-between gap-3 text-[0.65rem] uppercase text-olive-deep/70 sm:text-xs">
              <span>A little moment, held forever</span>
              <span className="shrink-0">01 / 09</span>
            </figcaption>
          </figure>

          <div className="fade-in-up mx-auto w-full max-w-xl py-4 text-center md:mx-0 md:text-left">
            <p className="text-xs uppercase text-olive-green sm:text-sm tracking-widest font-medium">Together with their families</p>
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

            <p className="mt-7 text-xs uppercase text-olive-green sm:mt-9 sm:text-sm font-medium tracking-widest">
              {wedding.title}
            </p>
            <div className="mx-auto my-5 h-px w-16 bg-mustard-yellow md:mx-0" />
              <p className="mx-auto max-w-md text-sm leading-7 text-olive-deep/80 sm:text-base text-center md:text-left">
              An odyssey of two souls, who decide to step into a lifetime, side by side.
            </p>
            <p className="mx-auto mt-3 max-w-md font-serif text-xl leading-relaxed text-olive-deep sm:text-2xl text-center md:text-left">
              Our love story is written in the little moments we never want to forget.
            </p>
            <a
              href="#our-story"
              className="mt-8 inline-flex items-center gap-3 text-xs uppercase text-olive-green transition-all hover:text-olive-deep hover:translate-y-1"
            >
              Scroll to discover our story
              <ArrowDown size={15} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section id="our-story" className="scroll-mt-20 bg-sage-green/25 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-20">
            {/* <div className="reveal-on-scroll reveal-left grid grid-cols-[1.1fr_.9fr] items-end gap-3 sm:gap-5">
              <figure className="image-card-hover group min-w-0">
                <div className="overflow-hidden border border-olive-deep/15 bg-warm-cream/40 p-2 shadow-sm">
                  <img
                    src={wedding.photos.story}
                    alt="Theertha and Anigith sharing a smile indoors."
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover object-[50%_15%] transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <figcaption className="mt-2 text-[0.65rem] uppercase text-olive-deep/65 sm:text-xs">
                  A moment together
                </figcaption>
              </figure>
              <figure className="image-card-hover group min-w-0 pb-7 sm:pb-12">
                <div className="overflow-hidden border border-olive-deep/15 bg-warm-cream/40 p-2 shadow-sm">
                  <img
                    src={wedding.photos.childhood}
                    alt="Theertha and Anigith as children, standing together."
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <figcaption className="mt-2 text-[0.65rem] uppercase text-olive-deep/65 sm:text-xs">
                  Where everything started
                </figcaption>
              </figure>
            </div> */}
            <div className="reveal-on-scroll reveal-left grid grid-cols-2 items-end gap-3 sm:gap-5">
            <figure className="image-card-hover group min-w-0">
              <div className="overflow-hidden border border-olive-deep/15 bg-warm-cream/40 p-2 shadow-sm">
                <img
                  src={wedding.photos.story}
                  alt="Theertha and Anigith sharing a smile indoors."
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover object-[50%_15%] transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <figcaption className="mt-2 text-[0.65rem] uppercase text-olive-deep/65 sm:text-xs">
                A moment together
              </figcaption>
            </figure>
            <figure className="image-card-hover group min-w-0">
              <div className="overflow-hidden border border-olive-deep/15 bg-warm-cream/40 p-2 shadow-sm">
                <img
                  src={wedding.photos.childhood}
                  alt="Theertha and Anigith as children, standing together."
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover object-[50%_20%] transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <figcaption className="mt-2 text-[0.65rem] uppercase text-olive-deep/65 sm:text-xs">
                Where everything started
              </figcaption>
            </figure>
          </div>
            <div className="reveal-on-scroll reveal-right max-w-lg">
              {/* <p className="text-xs uppercase text-olive-green">Where everything started.</p> */}
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

        <section id="countdown" className="relative scroll-mt-20 overflow-hidden bg-olive-deep px-5 py-16 text-warm-cream sm:px-8 sm:py-24 lg:px-12">
          {/* Subtle photographic background overlay - starts below the date and time tab */}
          <div className="pointer-events-none absolute inset-x-0 top-24 sm:top-32 bottom-0 z-0 overflow-hidden">
            <img
              src={wedding.photos.holdingHands}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-top opacity-30 mix-blend-luminosity filter contrast-125 scale-105"
            />
            {/* Color blend layers to harmonize with the olive theme and preserve text readability */}
            <div className="absolute inset-0 bg-olive-deep/75 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-b from-olive-deep via-transparent to-olive-deep opacity-90" />
          </div>

          <div className="reveal-on-scroll relative z-10 mx-auto max-w-5xl text-center">
            {/* Highlighted Wedding Date & Time Panel */}
            <div className="inline-block animate-float mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 rounded-2xl sm:rounded-full border border-pastel-yellow/50 bg-pastel-yellow/15 px-7 py-3.5 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <span className="text-pastel-yellow text-base">✦</span>
                  <span className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider text-pastel-yellow">
                    {wedding.dateLabel}
                  </span>
                  <span className="text-pastel-yellow/60 text-lg">·</span>
                  <span className="font-sans text-xs sm:text-sm font-semibold uppercase tracking-widest text-warm-cream">
                    {wedding.weekday}
                  </span>
                </div>
                <span className="hidden sm:inline text-pastel-yellow/60 text-lg">|</span>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg sm:text-xl md:text-2xl font-semibold tracking-wide text-pastel-yellow">
                    {wedding.timeLabel}
                  </span>
                  <span className="text-pastel-yellow text-base">✦</span>
                </div>
              </div>
            </div>

            <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-medium leading-tight sm:text-6xl">
              Until We Begin Our Forever
            </h2>
            <p className="mt-5 font-hand text-2xl text-pastel-yellow sm:text-3xl">
              “To have and to hold from this day forward.”
            </p>

            <p className="mt-8 mb-2 sm:mt-10 sm:mb-4 font-hand text-3xl sm:text-4xl md:text-5xl text-pastel-yellow tracking-wide animate-fade-in">
              The countdown Begins
            </p>

            {countdown?.complete ? (
              <p className="mt-8 font-serif text-3xl text-pastel-yellow sm:text-4xl animate-pulse-subtle">
                The day we've been waiting for is here.
              </p>
            ) : (
              <div
                aria-label="Wedding countdown"
                aria-live="off"
                className="mx-auto mt-4 grid max-w-3xl grid-cols-4 gap-2 sm:gap-4 md:gap-6 px-1 sm:px-0"
              >
                {[
                  { label: "Days", value: countdown?.days },
                  { label: "Hours", value: countdown?.hours },
                  { label: "Minutes", value: countdown?.minutes },
                  { label: "Seconds", value: countdown?.seconds },
                ].map((unit) => (
                  <div
                    key={unit.label}
                    className="flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-pastel-yellow/30 bg-warm-cream/10 p-2.5 sm:p-5 md:p-6 shadow-xl shadow-black/25 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-warm-cream/15 hover:border-pastel-yellow/60 hover:shadow-2xl"
                  >
                    <p className="font-serif text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-medium tabular-nums text-pastel-yellow drop-shadow-sm">
                      {unit.value === undefined ? "—" : String(unit.value).padStart(2, "0")}
                    </p>
                    <p className="mt-1 sm:mt-2 text-[0.6rem] sm:text-xs font-semibold uppercase tracking-wider text-warm-cream/80">
                      {unit.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <a
              href="#location"
              className="mt-9 inline-flex items-center gap-2 text-xs uppercase text-pastel-yellow transition-all hover:text-warm-cream hover:translate-y-1"
            >
              Find the celebration
              <ArrowDown size={14} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section id="location" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
              {/* Venue Photos */}
              <div className="reveal-on-scroll reveal-left space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <figure className="image-card-hover group overflow-hidden border border-olive-deep/15 bg-sage-green/20 p-2 sm:p-2.5 shadow-md">
                    <img
                      src={wedding.photos.venue1}
                      alt={`${wedding.venue.name} view 1`}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover rounded-sm transition-transform duration-700 group-hover:scale-105"
                    />
                    <figcaption className="mt-2.5 text-center text-xs uppercase tracking-wider text-olive-deep/75 font-medium">
                      Venue Photograph
                    </figcaption>
                  </figure>
                  <figure className="image-card-hover group overflow-hidden border border-olive-deep/15 bg-sage-green/20 p-2 sm:p-2.5 shadow-md">
                    <img
                      src={wedding.photos.venue2}
                      alt={`${wedding.venue.name} view 2`}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover rounded-sm transition-transform duration-700 group-hover:scale-105"
                    />
                    <figcaption className="mt-2.5 text-center text-xs uppercase tracking-wider text-olive-deep/75 font-medium">
                      Celebration Grounds
                    </figcaption>
                  </figure>
                </div>
              </div>

              {/* Venue Information */}
              <div className="max-w-xl reveal-on-scroll reveal-right">
                <p className="text-xs uppercase text-olive-green tracking-wider">The gathering</p>
                <h2 className="mt-3 font-serif text-4xl font-medium leading-tight sm:text-6xl text-olive-deep">
                  Join Us as We Begin Forever
                </h2>
                <div className="my-6 h-px w-16 bg-mustard-yellow" />
                <p className="max-w-lg text-sm leading-7 text-olive-deep/75 sm:text-base">
                  {wedding.venue.description || "Find the details to the place where we begin this next chapter."}
                </p>
                <div className="mt-7 grid gap-5 border-y border-olive-deep/15 py-6 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.65rem] uppercase text-olive-green font-medium">Venue</p>
                    <p className="mt-1 font-serif text-xl font-medium text-olive-deep">{wedding.venue.name || "Venue name to be added"}</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase text-olive-green font-medium">When</p>
                    <p className="mt-1 font-serif text-xl font-medium text-olive-deep">{wedding.dateLabel}</p>
                    <p className="text-sm text-olive-deep/70">{wedding.weekday} · {wedding.timeLabel}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[0.65rem] uppercase text-olive-green font-medium">Address</p>
                    <p className="mt-1 text-sm leading-6 text-olive-deep/80">
                      {[wedding.venue.address, wedding.venue.city].filter(Boolean).join(", ") || "Full address and city to be added"}
                    </p>
                  </div>
                </div>
                {directionsUrl ? (
                  <Button asChild className="mt-6 rounded-sm bg-mustard-yellow text-olive-deep hover:bg-bright-yellow shadow-sm hover:shadow transition-all text-sm font-medium px-6 py-2.5">
                    <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                      <MapPin size={16} aria-hidden="true" />
                      Get Directions <ArrowUpRight size={15} aria-hidden="true" />
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
          </div>
        </section>

        <section id="rsvp" className="scroll-mt-20 bg-sage-green/25 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="reveal-on-scroll mx-auto max-w-4xl text-center">
            <p className="text-xs uppercase text-olive-green tracking-wider">A note from us</p>
            <h2 className="mt-3 font-serif text-4xl font-medium sm:text-6xl text-olive-deep">Kindly RSVP</h2>
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
                className={`h-auto min-h-14 rounded-sm border-olive-deep px-5 py-4 font-serif text-lg transition-all duration-300 ${attendance === "accepted" ? "bg-mustard-yellow text-olive-deep shadow-md" : "bg-warm-cream/70 text-olive-deep hover:bg-pastel-yellow"}`}
              >
                ♡ Yes, I can make it for you
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-pressed={attendance === "declined"}
                onClick={() => chooseAttendance("declined")}
                className={`h-auto min-h-14 rounded-sm border-olive-deep/40 px-5 py-4 font-serif text-lg transition-all duration-300 ${attendance === "declined" ? "bg-olive-green text-warm-cream shadow-md" : "bg-warm-cream/70 text-olive-deep hover:bg-sage-green"}`}
              >
                ♡ Sorry!, I can't make it
              </Button>
            </div>

            {attendance && rsvpState !== "success" && (
              <form onSubmit={(event) => void handleRsvpSubmit(event)} className="mt-8 border-y border-olive-deep/20 py-8 text-left">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-olive-green font-medium">Your response</p>
                    <p className="mt-1 font-serif text-2xl text-olive-deep">
                      {attendance === "accepted" ? "Yes, I can make it for you" : "Sorry!, I can't make it"}
                    </p>
                  </div>
                  <Button type="button" variant="link" onClick={() => chooseAttendance(attendance === "accepted" ? "declined" : "accepted")}>
                    Choose the other response
                  </Button>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2 sm:col-span-2">
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
                </div>
                <div className="honeypot-field" aria-hidden="true">
                  <label htmlFor="rsvp-website">Website</label>
                  <input id="rsvp-website" name="website" tabIndex={-1} autoComplete="off" />
                </div>
                {rsvpState === "error" && <p role="alert" className="mt-4 text-sm text-olive-deep">{rsvpFeedback}</p>}
                <Button
                  type="submit"
                  disabled={rsvpState === "submitting"}
                  className="mt-6 rounded-sm bg-mustard-yellow px-6 text-olive-deep hover:bg-bright-yellow shadow-sm hover:shadow transition-all"
                >
                  {rsvpState === "submitting" ? "Sending…" : "Submit RSVP"}
                </Button>
              </form>
            )}

            {rsvpState === "success" && (
              <p role="status" className="mt-8 border-y border-olive-deep/20 py-6 font-serif text-2xl text-olive-deep sm:text-3xl animate-pulse-subtle">
                {rsvpFeedback}
              </p>
            )}
          </div>
        </section>

        <section id="colour-code" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="reveal-on-scroll mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase text-olive-green tracking-wider">A little invitation in colour</p>
              <h2 className="mt-3 font-serif text-4xl font-medium sm:text-6xl text-olive-deep">A Touch of Our Colours</h2>
              <p className="mt-4 text-sm leading-7 text-olive-deep/75 sm:text-base">
                We will be happy if you wear our colour code.
              </p>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-8">
              {wedding.palette.map((color, index) => (
                <li key={color.hex} className={`min-w-0 transition-transform duration-300 hover:-translate-y-1.5 delay-${(index % 5) * 100}`}>
                  <div className={`h-20 border border-olive-deep/10 sm:h-24 shadow-xs rounded-xs ${color.swatchClass}`} aria-label={`${color.name}, ${color.hex}`} />
                  <p className="mt-2 text-xs font-medium text-olive-deep">{color.name}</p>
                  <p className="text-[0.7rem] text-olive-deep/70">{color.hex}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="dress-code" className="scroll-mt-20 bg-sage-green/25 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto grid max-w-7xl items-center gap-9 lg:grid-cols-[1fr_.85fr] lg:gap-20">
            <figure className="reveal-on-scroll reveal-left image-card-hover group">
              <div className="overflow-hidden border border-olive-deep/15 bg-warm-cream/30 p-2 shadow-sm">
                <img
                  src={wedding.photos.dressCode}
                  alt="Wedding guests in olive, sage, and soft golden sarees gathered in a garden courtyard."
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover object-[50%_62%] sm:aspect-[5/4] lg:aspect-[4/5] transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <figcaption className="mt-3 text-xs uppercase text-olive-deep/70">
                A gathering in the colours we love
              </figcaption>
            </figure>
            <div className="reveal-on-scroll reveal-right max-w-xl">
              <p className="text-xs uppercase text-olive-green tracking-wider">Wear what feels like you</p>
              <h2 className="mt-3 font-serif text-4xl font-medium leading-tight sm:text-6xl text-olive-deep">Dress Code</h2>
              <div className="my-6 h-px w-16 bg-mustard-yellow" />
              <p className="text-base leading-8 text-olive-deep/80">
                We kindly ask you to support the aesthetic of our wedding with these colours.
              </p>
              <p className="mt-4 text-sm leading-7 text-olive-deep/75">
                Olive, sage, moss, mustard, soft yellow, and cream are lovely ways to join the palette. Please wear whatever makes you feel comfortable and at home.
              </p>
              <a href="#colour-code" className="mt-6 inline-flex items-center gap-2 text-xs uppercase text-olive-green hover:text-olive-deep transition-colors">
                See the colour palette <ArrowUp size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section id="wishes" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
            <div className="reveal-on-scroll reveal-left">
              <p className="text-xs uppercase text-olive-green tracking-wider">A note for the years ahead</p>
              <h2 className="mt-3 font-serif text-4xl font-medium leading-tight sm:text-6xl text-olive-deep">
                Share Your Love and Thoughts
              </h2>
              <div className="my-6 h-px w-16 bg-mustard-yellow" />
              <p className="max-w-md text-sm leading-7 text-olive-deep/75 sm:text-base">
                Your blessings and wishes mean the world to us.
              </p>
            </div>
            <div className="reveal-on-scroll reveal-right">
              {wishesState === "success" ? (
                <p role="status" className="border-y border-olive-deep/20 py-6 font-serif text-2xl text-olive-deep animate-pulse-subtle">
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
                      className="rounded-sm bg-mustard-yellow px-6 text-olive-deep hover:bg-bright-yellow shadow-sm hover:shadow transition-all"
                    >
                      {wishesState === "submitting" ? "Sending…" : "Send Your Wishes"}
                    </Button>
                  </div>
                </form>
              )}

              {/* Expandable Wishes Drawer */}
              <div className="mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWishes((prev) => !prev)}
                  className="group inline-flex items-center gap-2.5 rounded-full border-2 border-olive-deep/25 bg-warm-cream/90 px-6 py-3 font-serif text-base text-olive-deep shadow-sm transition-all duration-300 hover:border-olive-deep hover:bg-pastel-yellow/40 hover:shadow-md active:scale-95"
                >
                  <Heart className="h-4 w-4 text-olive-green fill-olive-green/20 group-hover:scale-125 transition-transform" />
                  <span className="font-medium">
                    {showWishes ? "Hide Wishes Shared by Loved Ones" : "Find Wishes Shared by Others"}
                  </span>
                  {guestWishes.length > 0 && (
                    <span className="ml-1 rounded-full bg-olive-deep/15 px-2.5 py-0.5 text-xs font-sans font-semibold text-olive-deep">
                      {guestWishes.length}
                    </span>
                  )}
                  {showWishes ? (
                    <ChevronUp className="h-4 w-4 text-olive-deep/70 transition-transform" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-olive-deep/70 transition-transform" />
                  )}
                </Button>

                {showWishes && (
                  <div className="mt-6 rounded-xl border border-olive-deep/20 bg-warm-cream/95 p-5 sm:p-7 shadow-lg backdrop-blur-sm transition-all duration-300">
                    <div className="flex items-center justify-between border-b border-olive-deep/15 pb-4">
                      <div>
                        <h3 className="font-serif text-xl font-medium text-olive-deep flex items-center gap-2">
                          <span>Warm Blessings &amp; Words of Love</span>
                        </h3>
                        <p className="text-xs text-olive-deep/65 mt-0.5">Notes and congratulations from friends &amp; family</p>
                      </div>
                      <span className="rounded-full bg-olive-green/10 px-3 py-1 text-xs font-medium text-olive-green uppercase tracking-wider">
                        {guestWishes.length} {guestWishes.length === 1 ? "Wish" : "Wishes"}
                      </span>
                    </div>

                    {guestWishes.length === 0 ? (
                      <p className="py-8 text-center font-serif text-base text-olive-deep/70 italic">
                        No wishes shared yet. Be the first to share your blessing for Theertha &amp; Anigith!
                      </p>
                    ) : (
                      <div className="mt-4 max-h-72 overflow-y-auto pr-2 space-y-3.5 scrollbar-thin">
                        {guestWishes.map((wish, index) => (
                          <div
                            key={`${wish.submitted_at}-${index}`}
                            className="rounded-lg border border-olive-deep/15 bg-sage-green/20 p-4 transition-all duration-200 hover:bg-sage-green/30 hover:border-olive-deep/30 shadow-xs"
                          >
                            <p className="font-serif text-base sm:text-lg italic leading-relaxed text-olive-deep">
                              “{wish.message}”
                            </p>
                            <div className="mt-3 flex items-center justify-between text-xs text-olive-green font-medium border-t border-olive-deep/10 pt-2">
                              <span className="flex items-center gap-1.5 font-semibold text-olive-deep">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-mustard-yellow" />
                                {wish.guest_name}
                              </span>
                              {wish.submitted_at && (
                                <span className="text-[0.7rem] text-olive-deep/60">
                                  {new Date(wish.submitted_at).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="reveal-on-scroll bg-pastel-yellow/35 px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
            <figure className="image-card-hover group">
              <div className="overflow-hidden border border-olive-deep/15 bg-warm-cream/40 p-2 shadow-sm">
                <img
                  src={wedding.photos.closing}
                  alt="Theertha and Anigith together outdoors in greenery."
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover object-[50%_44%] transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </figure>
            <div className="py-4 text-center lg:text-left">
              <p className="font-hand text-2xl text-olive-green sm:text-3xl">“Some moments are meant to be felt, not explained.”</p>
              <div className="mx-auto my-6 h-px w-16 bg-mustard-yellow lg:mx-0" />
              <p className="text-xs uppercase tracking-widest text-olive-green font-medium">With all our hearts</p>
              <p className="mt-2 font-serif text-3xl text-olive-deep sm:text-4xl">
                {wedding.brideName} &amp; {wedding.groomName}
              </p>
              <div className="mx-auto my-6 h-px w-16 bg-mustard-yellow lg:mx-0" />
              <h2 className="mt-2 font-serif text-4xl font-medium leading-tight text-olive-deep sm:text-6xl">
                WE CAN'T WAIT TO SEE YOU!
              </h2>
              <p className="mt-2 text-sm text-olive-green">{wedding.dateLabel}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col items-center justify-between gap-3 px-5 py-7 text-center text-xs text-olive-deep/70 sm:flex-row sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={() => setBridePortalOpen(true)}
          className="inline-flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity text-xs uppercase tracking-wider text-olive-deep/75 hover:text-olive-deep"
        >
          <Lock size={12} aria-hidden="true" />
          <span>Bride's Corner</span>
        </button>
        <span className="font-hand text-xl text-olive-green">Made with love.</span>
        <a href="#home" className="inline-flex items-center gap-1 uppercase hover:text-olive-deep">
          Back to top <CalendarDays size={13} aria-hidden="true" />
        </a>
      </footer>

      {/* Floating Background Music Controller */}
      <div className="fixed bottom-5 right-5 z-50">
        <button
          type="button"
          onClick={toggleMusic}
          aria-label={isPlayingMusic ? "Pause background music" : "Play background music"}
          title={isPlayingMusic ? "Mute background music" : "Play background music"}
          className={`group flex h-12 w-12 items-center justify-center rounded-full border border-olive-deep/20 bg-warm-cream/95 text-olive-deep shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-olive-deep hover:bg-mustard-yellow active:scale-95 ${
            isPlayingMusic ? "ring-2 ring-mustard-yellow/70 shadow-mustard-yellow/20" : ""
          }`}
        >
          {isPlayingMusic ? (
            <Volume2 className="h-5 w-5 animate-pulse text-olive-deep" />
          ) : (
            <VolumeX className="h-5 w-5 text-olive-deep/60 group-hover:text-olive-deep" />
          )}
        </button>
      </div>

      {/* Bride's RSVP Portal Modal */}
      {bridePortalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-olive-deep/20 bg-warm-cream shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-olive-deep/15 px-6 py-4 bg-sage-green/20">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mustard-yellow/40 text-olive-deep">
                  {isPinAuthenticated ? <Unlock size={16} /> : <Lock size={16} />}
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-semibold text-olive-deep">
                    Bride's RSVP Portal
                  </h3>
                  <p className="text-[0.7rem] text-olive-deep/70 uppercase tracking-wider">
                    {isPinAuthenticated ? "Private Guest Tracker" : "Protected Access"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBridePortalOpen(false)}
                className="rounded-full p-1.5 text-olive-deep/70 hover:bg-olive-deep/10 hover:text-olive-deep transition-colors"
                aria-label="Close portal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {!isPinAuthenticated ? (
                /* PIN Entry Form */
                <form onSubmit={handleUnlockBridePortal} className="mx-auto max-w-sm py-8 text-center space-y-5">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pastel-yellow/50 text-olive-deep">
                    <Lock size={26} />
                  </div>
                  <div>
                    <h4 className="font-serif text-2xl font-medium text-olive-deep">Enter 4-Digit PIN</h4>
                    <p className="mt-1 text-xs text-olive-deep/75">
                      Please enter your private passcode to view all guest responses.
                    </p>
                  </div>
                  <div className="mx-auto max-w-[200px]">
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      pattern="[0-9]*"
                      autoFocus
                      placeholder="••••"
                      value={bridePin}
                      onChange={(e) => setBridePin(e.target.value)}
                      className="text-center font-mono text-2xl tracking-[0.5em] h-12 bg-warm-cream/80 border-olive-deep/20"
                    />
                  </div>
                  {pinError && (
                    <p className="text-xs text-red-600 font-medium">{pinError}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={rsvpsLoading || bridePin.length < 4}
                    className="w-full bg-olive-deep text-warm-cream hover:bg-olive-green"
                  >
                    {rsvpsLoading ? "Verifying..." : "Unlock RSVP Responses"}
                  </Button>
                </form>
              ) : (
                /* Authenticated Dashboard */
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-olive-deep/15 bg-sage-green/20 p-3 sm:p-4 text-center">
                      <p className="text-[0.65rem] sm:text-xs uppercase tracking-wider text-olive-deep/70 font-medium">Attending</p>
                      <p className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-olive-deep">
                        {rsvps
                          .filter((r) => r.attendance === "accepted")
                          .reduce((sum, r) => sum + (Number(r.guest_count) || 1), 0)}
                      </p>
                      <span className="text-[0.65rem] text-olive-green">Guests confirmed</span>
                    </div>

                    <div className="rounded-xl border border-olive-deep/15 bg-pastel-yellow/30 p-3 sm:p-4 text-center">
                      <p className="text-[0.65rem] sm:text-xs uppercase tracking-wider text-olive-deep/70 font-medium">Responses</p>
                      <p className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-olive-deep">
                        {rsvps.length}
                      </p>
                      <span className="text-[0.65rem] text-olive-green">Total submissions</span>
                    </div>

                    <div className="rounded-xl border border-olive-deep/15 bg-warm-cream/60 p-3 sm:p-4 text-center">
                      <p className="text-[0.65rem] sm:text-xs uppercase tracking-wider text-olive-deep/70 font-medium">Can't Make It</p>
                      <p className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-olive-deep/80">
                        {rsvps.filter((r) => r.attendance === "declined").length}
                      </p>
                      <span className="text-[0.65rem] text-olive-deep/60">Regrets</span>
                    </div>
                  </div>

                  {/* Actions Bar: Search, Filter & Download */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-deep/50" />
                      <Input
                        type="text"
                        placeholder="Search guest or phone..."
                        value={rsvpSearch}
                        onChange={(e) => setRsvpSearch(e.target.value)}
                        className="pl-8 text-xs bg-warm-cream/80 border-olive-deep/20 h-9"
                      />
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-1 rounded-lg border border-olive-deep/15 p-0.5 bg-sage-green/15 text-xs">
                      {(["all", "accepted", "declined"] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setRsvpFilter(filter)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                            rsvpFilter === filter
                              ? "bg-olive-deep text-warm-cream shadow-xs"
                              : "text-olive-deep/75 hover:text-olive-deep"
                          }`}
                        >
                          {filter === "all"
                            ? `All (${rsvps.length})`
                            : filter === "accepted"
                            ? `Yes (${rsvps.filter((r) => r.attendance === "accepted").length})`
                            : `No (${rsvps.filter((r) => r.attendance === "declined").length})`}
                        </button>
                      ))}
                    </div>

                    {/* Export CSV button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={exportRsvpsCsv}
                      className="border-olive-deep/20 hover:bg-mustard-yellow text-xs gap-1.5 h-9 shrink-0"
                    >
                      <Download size={13} />
                      <span>Download CSV</span>
                    </Button>
                  </div>

                  {/* Guest List */}
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {rsvps
                      .filter((r) => {
                        if (rsvpFilter !== "all" && r.attendance !== rsvpFilter) return false;
                        if (!rsvpSearch.trim()) return true;
                        const query = rsvpSearch.toLowerCase();
                        return (
                          r.guest_name.toLowerCase().includes(query) ||
                          r.phone.toLowerCase().includes(query)
                        );
                      })
                      .map((item) => {
                        const cleanPhone = item.phone.replace(/[^0-9]/g, "");
                        const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                        return (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-olive-deep/15 bg-warm-cream/90 p-3.5 shadow-xs transition-all hover:border-olive-deep/30"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-serif text-base font-semibold text-olive-deep">
                                  {item.guest_name}
                                </span>
                                {item.attendance === "accepted" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-olive-green/15 px-2 py-0.5 text-[0.65rem] font-semibold text-olive-green">
                                    <CheckCircle2 size={11} />
                                    Attending ({item.guest_count} {item.guest_count === 1 ? "guest" : "guests"})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-semibold text-red-700">
                                    <XCircle size={11} />
                                    Can't Make It
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-olive-deep/70">
                                <span>Phone: {item.phone}</span>
                                <span className="mx-2 text-olive-deep/30">·</span>
                                <span>
                                  {new Date(item.submitted_at).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </p>
                              {item.message && (
                                <p className="text-xs italic text-olive-deep/80 pt-1">
                                  “{item.message}”
                                </p>
                              )}
                            </div>

                            {/* Contact Shortcuts: Call & WhatsApp */}
                            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-olive-deep/10">
                              <a
                                href={`tel:${item.phone}`}
                                title={`Call ${item.guest_name}`}
                                className="inline-flex items-center gap-1 rounded-md border border-olive-deep/20 bg-warm-cream px-2.5 py-1 text-xs text-olive-deep hover:bg-olive-deep hover:text-warm-cream transition-colors"
                              >
                                <Phone size={12} />
                                <span>Call</span>
                              </a>
                              <a
                                href={`https://wa.me/${waPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                title={`WhatsApp ${item.guest_name}`}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-600/30 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800 hover:bg-emerald-600 hover:text-white transition-colors"
                              >
                                <MessageCircle size={12} />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}

                    {rsvps.length === 0 && (
                      <div className="py-12 text-center text-xs text-olive-deep/60">
                        No RSVP responses received yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-olive-deep/15 px-6 py-3 bg-sage-green/10 text-xs text-olive-deep/70">
              <span>Bride Security: Passcode Protected</span>
              {isPinAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPinAuthenticated(false);
                    setBridePin("");
                  }}
                  className="text-xs font-semibold text-olive-deep hover:underline"
                >
                  Lock Portal
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}