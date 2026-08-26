"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth, useRedirectIfAuthenticated } from "@/hooks/useAuth";
import {
  Basket,
  Compass,
  Crayon,
  Envelope,
  Eraser,
  Eye,
  GlueStick,
  Lock,
  Notebook,
  Paperclip,
  Parcel,
  Pencil,
  PushPin,
  Ruler,
  Scissors,
  Sharpener,
  StickyNote,
  Truck,
} from "./icons";

// Shown under the button so testers know what to type.
const DEMO_USER = { email: "admin@example.com", password: "Admin@12345" };

// Who the shop serves — cycled by the typewriter line.
const TYPED_WORDS = ["students", "professionals", "institutions"];

// How an order actually gets out the door.
const STEPS = [
  {
    Icon: Basket,
    label: "Picked by hand",
    note: "Every item pulled off the shelf in person",
    color: "text-brand-yellow",
  },
  {
    Icon: Parcel,
    label: "Packed by hand",
    note: "Checked and wrapped before it is sealed",
    color: "text-brand-teal",
  },
  {
    Icon: Truck,
    label: "Sent the same day",
    note: "Out the door on the day you order",
    color: "text-brand-pink",
  },
];

const SUPPLIES = [
  "Pens",
  "Envelopes",
  "Note books",
  "Markers",
  "File folders",
  "Glue sticks",
  "Erasers",
  "Rulers",
  "Staplers",
  "Sticky notes",
  "Sketch pads",
  "Highlighters",
];

/**
 * Stationery drifting behind the brand page, tinted from the logo.
 *
 * Positions are picked to stay out from behind the headline block, which sits
 * roughly between 30% and 75% of the height on the left half of the panel.
 * Each doodle drifts on its own duration and delay so the field never pulses
 * in step; `prefers-reduced-motion` freezes the lot (see globals.css).
 */
const NIGHT_DOODLES = [
  {
    Icon: Pencil,
    className: "h-20 w-20 text-brand-yellow/20",
    style: { top: "16%", left: "62%", "--r": "-14deg", "--dx": "20px", "--dy": "-28px", "--dur": "13s" },
  },
  {
    Icon: Eraser,
    className: "h-16 w-16 text-brand-pink/25",
    style: { top: "8%", left: "84%", "--r": "18deg", "--dx": "-18px", "--dy": "22px", "--dur": "15s", "--d": "150ms" },
  },
  {
    Icon: Notebook,
    className: "h-24 w-24 text-brand-pink/20",
    style: { top: "58%", left: "70%", "--r": "12deg", "--dx": "-22px", "--dy": "24px", "--dur": "19s", "--d": "300ms" },
  },
  {
    Icon: Sharpener,
    className: "h-14 w-14 text-brand-teal/25",
    style: { top: "80%", left: "58%", "--r": "-20deg", "--dx": "16px", "--dy": "-18px", "--dur": "21s", "--d": "450ms" },
  },
  {
    Icon: Paperclip,
    className: "h-14 w-14 text-brand-blue/25",
    style: { top: "36%", left: "8%", "--r": "22deg", "--dx": "-16px", "--dy": "-20px", "--dur": "17s", "--d": "600ms" },
  },
  {
    Icon: Ruler,
    className: "h-24 w-24 text-brand-orange/20",
    style: { top: "88%", left: "12%", "--r": "-8deg", "--dx": "24px", "--dy": "-14px", "--dur": "23s", "--d": "750ms" },
  },
  {
    Icon: Crayon,
    className: "h-16 w-16 text-brand-teal/20",
    style: { top: "6%", left: "22%", "--r": "26deg", "--dx": "-14px", "--dy": "26px", "--dur": "16s", "--d": "900ms" },
  },
  {
    Icon: Scissors,
    className: "h-16 w-16 text-brand-blue/20",
    style: { top: "70%", left: "88%", "--r": "-24deg", "--dx": "-20px", "--dy": "-22px", "--dur": "20s", "--d": "1050ms" },
  },
  {
    Icon: PushPin,
    className: "h-12 w-12 text-brand-yellow/25",
    style: { top: "46%", left: "90%", "--r": "16deg", "--dx": "14px", "--dy": "18px", "--dur": "14s", "--d": "1200ms" },
  },
];

/**
 * The same idea on the form page, but whisper-quiet: the form is the only
 * thing that matters here, so these sit in the margins at a fraction of the
 * opacity and drift slowly.
 */
const PAPER_DOODLES = [
  {
    Icon: Pencil,
    className: "h-16 w-16 text-brand-purple/10",
    style: { top: "14%", left: "6%", "--r": "-18deg", "--dx": "14px", "--dy": "-16px", "--dur": "25s" },
  },
  {
    Icon: Eraser,
    className: "h-14 w-14 text-brand-pink/10",
    style: { top: "26%", left: "86%", "--r": "20deg", "--dx": "-12px", "--dy": "16px", "--dur": "29s", "--d": "400ms" },
  },
  {
    Icon: StickyNote,
    className: "h-16 w-16 text-brand-yellow/12",
    style: { top: "72%", left: "8%", "--r": "14deg", "--dx": "12px", "--dy": "14px", "--dur": "27s", "--d": "800ms" },
  },
  {
    Icon: GlueStick,
    className: "h-14 w-14 text-brand-teal/10",
    style: { top: "84%", left: "82%", "--r": "-16deg", "--dx": "-14px", "--dy": "-12px", "--dur": "31s", "--d": "1200ms" },
  },
  {
    Icon: Compass,
    className: "h-16 w-16 text-brand-blue/10",
    style: { top: "50%", left: "93%", "--r": "10deg", "--dx": "-10px", "--dy": "-18px", "--dur": "33s", "--d": "1600ms" },
  },
];

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

/** Types a word out, holds it, deletes it, moves to the next one. */
function useTypewriter(words, enabled) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const word = words[index];

    if (!deleting && typed === word) {
      const hold = setTimeout(() => setDeleting(true), 1700);
      return () => clearTimeout(hold);
    }

    if (deleting && typed === "") {
      // Beat of silence, then move to the next word.
      const next = setTimeout(() => {
        setDeleting(false);
        setIndex((n) => (n + 1) % words.length);
      }, 260);
      return () => clearTimeout(next);
    }

    const step = setTimeout(
      () =>
        setTyped(
          deleting ? word.slice(0, typed.length - 1) : word.slice(0, typed.length + 1),
        ),
      deleting ? 45 : 85,
    );
    return () => clearTimeout(step);
  }, [words, index, typed, deleting, enabled]);

  return enabled ? typed : words[0];
}

/** Live clock — stays null on the server so the markup matches on hydration. */
function useClock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    const read = () => setNow(new Date());
    const first = setTimeout(read, 0);
    const tick = setInterval(read, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
    };
  }, []);

  return now;
}

function greetingFor(date) {
  if (!date) return "Hello";
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function LoginPage() {
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState("idle"); // idle | loading | success
  const [shakeKey, setShakeKey] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState([]);
  const rippleId = useRef(0);

  const router = useRouter();
  const { login } = useAuth();
  // A signed-in admin never sees this page.
  useRedirectIfAuthenticated("/dashboard");

  const reduced = useReducedMotion();
  const word = useTypewriter(TYPED_WORDS, !reduced);
  const now = useClock();

  const busy = status === "loading" || status === "success";

  // Background layers slide against the cursor for a little depth.
  function handlePointer(event) {
    if (reduced) return;
    const box = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((event.clientX - box.left) / box.width - 0.5) * 2,
      y: ((event.clientY - box.top) / box.height - 0.5) * 2,
    });
  }

  function parallax(depth) {
    return {
      transform: `translate3d(${tilt.x * depth}px, ${tilt.y * depth}px, 0)`,
    };
  }

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (formError) setFormError("");
  }

  function validate() {
    const next = {};
    if (!values.email.trim()) next.email = "Email is required.";
    else if (!isEmail(values.email)) next.email = "That does not look like an email.";
    if (!values.password) next.password = "Password is required.";
    else if (values.password.length < 6) next.password = "At least 6 characters.";
    return next;
  }

  function addRipple(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const id = rippleId.current++;
    setRipples((prev) => [
      ...prev,
      { id, x: event.clientX - box.left, y: event.clientY - box.top },
    ]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setShakeKey((n) => n + 1);
      return;
    }

    setStatus("loading");

    // POST /auth/login — the store keeps the access token in memory and the
    // API sets the httpOnly refresh cookie.
    const outcome = await login({
      email: values.email.trim(),
      password: values.password,
    });

    if (!outcome.ok) {
      setFormError(outcome.message);
      setShakeKey((n) => n + 1);
      setStatus("idle");
      return;
    }

    setStatus("success");
    router.replace("/dashboard");
  }

  const fieldShell =
    "group relative flex items-center rounded-xl border bg-canvas transition-all duration-200 focus-within:bg-card focus-within:ring-2 focus-within:ring-brand-purple/20 dark:bg-white/[0.04]";

  return (
    // h-dvh + overflow-hidden: the login screen is exactly one viewport, never scrolls.
    <div
      onMouseMove={handlePointer}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className="relative flex h-dvh w-full overflow-hidden bg-canvas"
    >
      {/* ================= Left page — the brand side ================= */}
      <section className="night-panel relative hidden w-1/2 flex-col justify-between overflow-hidden px-10 py-8 text-white lg:flex xl:px-14 xl:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-transform duration-300 ease-out"
          style={parallax(-18)}
        >
          <span
            className="animate-aurora absolute -left-24 -top-24 block h-[26rem] w-[26rem] rounded-full bg-brand-pink/35 blur-[100px]"
            style={{ "--dur": "24s" }}
          />
          <span
            className="animate-aurora absolute -bottom-28 left-1/4 block h-[24rem] w-[24rem] rounded-full bg-brand-blue/35 blur-[100px]"
            style={{ "--dur": "19s", "--d": "-6s" }}
          />
          <span
            className="animate-aurora absolute right-0 top-1/3 block h-72 w-72 rounded-full bg-brand-orange/25 blur-[90px]"
            style={{ "--dur": "27s", "--d": "-11s" }}
          />
          {NIGHT_DOODLES.map(({ Icon, style, className }, i) => (
            <Icon key={i} style={style} className={`animate-drift absolute ${className}`} />
          ))}
          {/* ruled lines, like a page */}
          <span className="absolute inset-0 block opacity-[0.07] [background-image:linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:100%_2.25rem]" />
        </div>

        {/* wordmark */}
        <header className="animate-rise relative flex items-center gap-3.5">
          <span className="relative grid h-14 w-14 shrink-0 place-items-center">
            <span
              aria-hidden
              className="halo-ring animate-spin-slow absolute inset-0 rounded-full"
              style={{ "--dur": "14s" }}
            />
            <span aria-hidden className="absolute inset-[3px] rounded-full bg-white" />
            <Image
              src="/logo.png"
              alt="ChoiceKraft"
              width={200}
              height={190}
              priority
              className="animate-bob relative h-9 w-9 object-contain"
            />
          </span>
          <span>
            <span className="block text-lg font-bold leading-tight tracking-tight">
              ChoiceKraft
            </span>
            <span className="block text-xs tracking-wide text-brand-yellow/90">
              Right choice to success
            </span>
          </span>
        </header>

        {/* headline + typewriter */}
        <div className="relative">
          <h1
            className="animate-rise text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl"
            style={{ "--d": "120ms" }}
          >
            Affordable, reliable
            <br />
            stationery for <span className="text-brand-yellow">{word}</span>
            <span
              aria-hidden
              className="animate-caret ml-1 inline-block h-9 w-0.75 translate-y-0.75 bg-brand-yellow xl:h-11"
            />
          </h1>

          <p
            className="animate-rise mt-5 max-w-md text-lg leading-8 text-white/65"
            style={{ "--d": "220ms" }}
          >
            Pens, envelopes and note books — picked by hand, packed by hand, and
            sent out the same day you order them.
          </p>

          {/* how an order leaves the shop */}
          <ol className="mt-8 flex gap-3">
            {STEPS.map(({ Icon, label, note, color }, i) => (
              <li
                key={label}
                className="animate-rise-x flex-1 rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
                style={{ "--d": `${340 + i * 120}ms` }}
              >
                <span className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                  <span className="font-mono text-[10px] text-white/35">
                    0{i + 1}
                  </span>
                </span>
                <span className="mt-2.5 block text-sm font-semibold leading-snug">
                  {label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-white/45">
                  {note}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* supplies ticker */}
        <div
          className="animate-rise relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
          style={{ "--d": "700ms" }}
        >
          <div className="flex w-max animate-marquee gap-2.5" style={{ "--dur": "32s" }}>
            {[...SUPPLIES, ...SUPPLIES].map((item, i) => (
              <span
                key={i}
                className="whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs text-white/65 backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Spiral binding ================= */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-1/2 z-20 hidden w-9 -translate-x-1/2 flex-col items-center justify-evenly py-4 lg:flex"
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className="animate-rise h-3.5 w-9 rounded-full bg-white/80 shadow-[0_1px_3px_rgba(43,35,80,0.35)] ring-1 ring-ink/10"
            style={{ "--d": `${300 + i * 35}ms` }}
          />
        ))}
      </div>

      {/* ================= Right page — the form side ================= */}
      <section className="relative flex w-full flex-col overflow-hidden lg:w-1/2">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-transform duration-300 ease-out"
          style={parallax(14)}
        >
          {/* one restrained wash — the form side stays clean */}
          <span
            className="animate-aurora absolute -right-32 -top-24 block h-112 w-md rounded-full bg-brand-purple/10 blur-[110px]"
            style={{ "--dur": "28s" }}
          />
          <span className="absolute inset-0 block bg-size-[24px_24px] opacity-30 bg-[radial-gradient(var(--line)_1px,transparent_1px)] dark:opacity-15" />
          {/* stationery in the margins — hidden on small screens, where the
              form fills the width and there are no margins to spare */}
          {PAPER_DOODLES.map(({ Icon, style, className }, i) => (
            <Icon
              key={i}
              style={style}
              className={`animate-drift absolute hidden sm:block ${className}`}
            />
          ))}
        </div>

        {/* top bar: greeting + live clock */}
        <div className="animate-rise relative flex items-center justify-between px-6 py-5 sm:px-10">
          <span className="flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white shadow-sm">
              <Image
                src="/logo.png"
                alt="ChoiceKraft"
                width={200}
                height={190}
                priority
                className="h-7 w-7 object-contain"
              />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight text-ink">
                ChoiceKraft
              </span>
              <span className="block text-[10px] tracking-wide text-ink-soft">
                Right choice to success
              </span>
            </span>
          </span>
          <span className="hidden text-sm font-medium text-ink-soft lg:block">
            {greetingFor(now)}
          </span>
          <span
            suppressHydrationWarning
            className="rounded-full border border-line bg-card/70 px-3 py-1 font-mono text-xs text-ink-soft backdrop-blur-sm"
          >
            {now
              ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "--:--"}
          </span>
        </div>

        {/* the form itself */}
        <div className="relative flex flex-1 items-center justify-center overflow-y-auto px-6 pb-6 sm:px-10">
          <div
            key={shakeKey}
            className={`w-full max-w-sm ${shakeKey ? "animate-shake" : ""}`}
          >
            <div className="animate-page-in" style={{ "--d": "120ms" }}>
              <h2 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
                Sign in
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Use your administrator credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              {/* Email */}
              <div className="animate-rise" style={{ "--d": "260ms" }}>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-semibold text-ink"
                >
                  Email address
                </label>
                <div
                  className={`${fieldShell} ${
                    errors.email
                      ? "border-brand-coral focus-within:border-brand-coral"
                      : "border-line focus-within:border-brand-purple"
                  }`}
                >
                  <Envelope className="pointer-events-none absolute left-4 h-5 w-5 text-ink-soft transition-colors group-focus-within:text-brand-purple" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
                    value={values.email}
                    onChange={(e) => update("email", e.target.value)}
                    disabled={busy}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className="w-full bg-transparent py-3 pl-12 pr-4 text-[15px] text-ink outline-none placeholder:text-ink-soft/50 disabled:opacity-60"
                  />
                </div>
                {errors.email ? (
                  <p
                    id="email-error"
                    className="animate-drop-in mt-1.5 text-sm text-brand-coral"
                  >
                    {errors.email}
                  </p>
                ) : null}
              </div>

              {/* Password */}
              <div className="animate-rise" style={{ "--d": "330ms" }}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label htmlFor="password" className="text-sm font-semibold text-ink">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-sm font-medium text-brand-purple underline-offset-4 transition-colors hover:text-brand-pink hover:underline"
                  >
                    Forgot?
                  </a>
                </div>
                <div
                  className={`${fieldShell} ${
                    errors.password
                      ? "border-brand-coral focus-within:border-brand-coral"
                      : "border-line focus-within:border-brand-purple"
                  }`}
                >
                  <Lock className="pointer-events-none absolute left-4 h-5 w-5 text-ink-soft transition-colors group-focus-within:text-brand-purple" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={values.password}
                    onChange={(e) => update("password", e.target.value)}
                    onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                    onBlur={() => setCapsLock(false)}
                    disabled={busy}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className="w-full bg-transparent py-3 pl-12 pr-12 text-[15px] text-ink outline-none placeholder:text-ink-soft/50 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 grid h-8 w-8 place-items-center rounded-xl text-ink-soft transition-all hover:scale-110 hover:bg-brand-purple/10 hover:text-brand-purple"
                  >
                    <Eye closed={showPassword} className="h-5 w-5" />
                  </button>
                </div>
                {errors.password ? (
                  <p
                    id="password-error"
                    className="animate-drop-in mt-1.5 text-sm text-brand-coral"
                  >
                    {errors.password}
                  </p>
                ) : null}
                {capsLock && !errors.password ? (
                  <p className="animate-drop-in mt-1.5 text-sm text-brand-orange">
                    Caps Lock is on.
                  </p>
                ) : null}
              </div>

              {/* Remember me */}
              <label
                className="animate-rise flex w-fit cursor-pointer select-none items-center gap-2.5 text-sm text-ink-soft"
                style={{ "--d": "390ms" }}
              >
                <span className="relative grid h-5 w-5 place-items-center">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="h-5 w-5 rounded-md border border-line bg-card transition-all duration-200 peer-checked:border-brand-purple peer-checked:bg-brand-purple peer-focus-visible:ring-2 peer-focus-visible:ring-brand-pink dark:bg-white/5" />
                  <svg
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute h-3.5 w-3.5 scale-50 text-white opacity-0 transition-all duration-200 peer-checked:scale-100 peer-checked:opacity-100"
                    fill="none"
                  >
                    <path
                      d="M5 12.5l4.5 4.5L19 7"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Keep me signed in
              </label>

              {/* Form-level error */}
              {formError ? (
                <p
                  role="alert"
                  className="animate-drop-in flex items-start gap-2 rounded-xl border border-brand-coral/40 bg-brand-coral/10 px-3.5 py-2.5 text-sm text-brand-coral"
                >
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M12 7.5v5.5M12 16.2v.6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {formError}
                </p>
              ) : null}

              {/* Submit */}
              <button
                type="submit"
                disabled={busy}
                onPointerDown={addRipple}
                style={{ "--d": "450ms" }}
                className={`animate-rise group/btn relative w-full overflow-hidden rounded-xl py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-90 ${
                  status === "success"
                    ? "bg-brand-teal"
                    : "bg-brand-purple hover:bg-brand-indigo"
                }`}
              >
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    aria-hidden
                    onAnimationEnd={() =>
                      setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
                    }
                    className="animate-ripple pointer-events-none absolute h-24 w-24 rounded-full bg-white"
                    style={{ left: ripple.x - 48, top: ripple.y - 48 }}
                  />
                ))}
                <span className="relative flex items-center justify-center gap-2">
                  {status === "loading" ? (
                    <>
                      <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin" fill="none">
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="opacity-30"
                        />
                        <path
                          d="M21 12a9 9 0 00-9-9"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : status === "success" ? (
                    <>
                      <svg viewBox="0 0 24 24" className="animate-pop h-5 w-5" fill="none">
                        <path
                          d="M5 12.5l4.5 4.5L19 7"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="animate-draw"
                          style={{ "--len": "30" }}
                        />
                      </svg>
                      Signed in
                    </>
                  ) : (
                    <>
                      Sign in
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1"
                        fill="none"
                      >
                        <path
                          d="M4 12h15M13 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </span>
              </button>

              {/* demo credentials, directly under the submit button */}
              <div
                className="animate-rise rounded-xl border border-line bg-canvas/70 px-4 py-3 dark:bg-white/3"
                style={{ "--d": "520ms" }}
              >
                <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Demo credentials
                </span>
                <span className="mt-2 flex items-baseline gap-2 text-xs">
                  <span className="w-16 shrink-0 text-ink-soft">Email</span>
                  <span className="font-mono text-ink">{DEMO_USER.email}</span>
                </span>
                <span className="mt-1 flex items-baseline gap-2 text-xs">
                  <span className="w-16 shrink-0 text-ink-soft">Password</span>
                  <span className="font-mono text-ink">{DEMO_USER.password}</span>
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* footer */}
        <div
          className="animate-rise relative flex items-center justify-between gap-4 border-t border-line px-6 py-4 text-xs text-ink-soft sm:px-10"
          style={{ "--d": "600ms" }}
        >
          <span>ChoiceKraft — admin console</span>
          <a
            href="#"
            className="font-medium text-ink-soft underline-offset-4 transition-colors hover:text-brand-purple hover:underline"
          >
            Need help?
          </a>
        </div>
      </section>
    </div>
  );
}
