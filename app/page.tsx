"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Users,
  Zap,
  Bell,
  Wallet,
  Check,
  Home as HomeIcon,
  LogOut,
  Sparkles,
} from "lucide-react";
import { PayEasyLogo } from "@/components/ui/payeasy-logo";
import { Reveal } from "@/components/ui/reveal";
import { useEmailAuth } from "@/context/EmailAuthContext";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PayEasy",
  description:
    "Split rent with roommates and pay securely through protected escrow. Everyone pays their share, held safely until the rent is complete.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  url: "https://payeasy.dev",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const STEPS = [
  {
    icon: HomeIcon,
    title: "Set up your home",
    body: "Add your flat, the monthly rent, and who lives there. Split it evenly, by room, or however you agreed.",
  },
  {
    icon: Users,
    title: "Everyone pays their share",
    body: "Each roommate pays from their phone in a tap. No chasing, no awkward reminders on the group chat.",
  },
  {
    icon: ShieldCheck,
    title: "Held safely, released together",
    body: "Money is protected until everyone has paid, then the full rent is released to your landlord automatically.",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Protected payments",
    body: "Your share is locked safely and only released when the whole rent is in — or refunded if it isn't.",
  },
  {
    icon: Zap,
    title: "Settles in seconds",
    body: "Payments clear in about five seconds with fees so small you'll forget they exist.",
  },
  {
    icon: Bell,
    title: "Gentle nudges",
    body: "PayEasy reminds the roommate who hasn't paid yet — so you never have to be the bad guy.",
  },
  {
    icon: Users,
    title: "Built for the group",
    body: "Everyone in the flat sees who's paid and what's left, in real time. No spreadsheets.",
  },
  {
    icon: Wallet,
    title: "Think in dollars",
    body: "Amounts are shown in plain dollars. The blockchain does the work quietly in the background.",
  },
  {
    icon: Sparkles,
    title: "No crypto knowledge needed",
    body: "Join from a link and pay with a passkey. No seed phrases, no browser extensions required.",
  },
];

export default function Home() {
  const router = useRouter();
  const { user, logout } = useEmailAuth();

  return (
    <main
      id="main-content"
      aria-label="PayEasy home"
      className="brand-canvas min-h-screen overflow-hidden"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ---------------------------------------------------------------- Nav */}
      <header className="sticky top-0 z-50 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="PayEasy home">
            <PayEasyLogo size={30} />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
            <a href="#how" className="transition-colors hover:text-ink">How it works</a>
            <a href="#features" className="transition-colors hover:text-ink">Features</a>
            <a href="#trust" className="transition-colors hover:text-ink">Safety</a>
          </nav>
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <span className="hidden text-sm font-medium text-muted sm:inline">
                  Hi, {user.name?.split(" ")[0] ?? "there"}
                </span>
                <button
                  onClick={logout}
                  className="btn-pill btn-pill-ghost !px-4 !py-2.5 text-sm"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-ink transition-colors hover:text-brand-600 sm:inline"
              >
                Sign in
              </Link>
            )}
            <button
              onClick={() => router.push("/connect")}
              className="btn-pill btn-pill-primary !px-5 !py-2.5 text-sm"
            >
              Get started
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------- Hero */}
      <section className="relative">
        {/* soft ambient wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 15% 0%, rgba(47,91,255,0.08) 0%, transparent 60%), radial-gradient(45% 40% at 95% 20%, rgba(255,107,74,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-8 pt-16 md:grid-cols-2 md:pt-24">
          {/* copy */}
          <div>
            <Reveal>
              <span className="chip chip-info mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                Rent splitting, made human
              </span>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="text-balance text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
                Split the rent,<br />
                keep the{" "}
                <span className="relative whitespace-nowrap text-brand-600">
                  friendship
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 9C60 3 240 3 298 9"
                      stroke="#ff6b4a"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-7 max-w-md text-lg leading-relaxed text-muted">
                Everyone pays their share into one protected payment. Nobody
                fronts the whole rent, nobody chases anyone, and your landlord
                gets paid on time — automatically.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => router.push("/connect")}
                  className="btn-pill btn-pill-primary text-base !px-7 !py-3.5"
                >
                  Start a rent split
                  <ArrowRight size={17} />
                </button>
                <a href="#how" className="btn-pill btn-pill-ghost text-base !px-7 !py-3.5">
                  See how it works
                </a>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-2.5">
                  {[
                    "https://i.pravatar.cc/80?img=11",
                    "https://i.pravatar.cc/80?img=32",
                    "https://i.pravatar.cc/80?img=45",
                    "https://i.pravatar.cc/80?img=15",
                  ].map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="h-9 w-9 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted">
                  <span className="font-semibold text-ink">3,000+ roommates</span>{" "}
                  split rent the easy way
                </p>
              </div>
            </Reveal>
          </div>

          {/* product mock */}
          <Reveal delay={140} className="relative">
            <div className="card-soft relative z-10 mx-auto w-full max-w-sm p-6 shadow-[0_40px_80px_-40px_rgba(18,20,26,0.35)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Flat 4B · March rent</p>
                  <p className="text-xs text-muted">Due in 5 days</p>
                </div>
                <span className="chip chip-wait">2 of 3 paid</span>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <span className="font-mono text-3xl font-extrabold tracking-tight text-ink tabular-nums">
                    $1,240
                  </span>
                  <span className="ml-1 text-sm text-muted">/ $1,860</span>
                </div>
                <div className="flex -space-x-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-brand-500 text-xs font-bold text-white">MA</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-mint-500 text-xs font-bold text-white">JD</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-line text-xs font-bold text-muted">+1</span>
                </div>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-brand-500" style={{ width: "66%" }} />
              </div>

              <div className="mt-5 space-y-2.5">
                {[
                  { name: "Maya A.", status: "paid", amt: "$620" },
                  { name: "Jordan D.", status: "paid", amt: "$620" },
                  { name: "You", status: "due", amt: "$620" },
                ].map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center justify-between rounded-xl border border-line-soft bg-canvas px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      {r.status === "paid" ? (
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-mint-100 text-mint-600">
                          <Check size={13} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="h-6 w-6 rounded-full border-2 border-dashed border-brand-300" />
                      )}
                      <span className="text-sm font-medium text-ink">{r.name}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-ink tabular-nums">{r.amt}</span>
                  </div>
                ))}
              </div>

              <button className="btn-pill btn-pill-primary mt-5 w-full">
                Pay my share · $620
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
                <ShieldCheck size={13} className="text-mint-500" />
                Held safely until everyone pays
              </p>
            </div>

            {/* floating accent chip */}
            <div className="absolute -right-3 -top-4 z-20 hidden rotate-3 items-center gap-2 rounded-2xl border border-line bg-white px-3.5 py-2.5 shadow-lg sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-coral-500 text-white">
                <Bell size={14} />
              </span>
              <span className="text-xs font-semibold text-ink">Reminded Sam to pay</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- Stats */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <Reveal className="grid grid-cols-2 gap-4 rounded-3xl border border-line bg-white px-6 py-8 md:grid-cols-4">
          {[
            { v: "~5 sec", l: "to settle a payment" },
            { v: "~$0.001", l: "in fees per split" },
            { v: "100%", l: "protected in escrow" },
            { v: "3,000+", l: "roommates paid" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-mono text-2xl font-extrabold tracking-tight text-ink tabular-nums md:text-3xl">
                {s.v}
              </div>
              <div className="mt-1 text-xs text-muted md:text-sm">{s.l}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ---------------------------------------------------------- How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
            How it works
          </span>
          <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-tight md:text-5xl">
            Rent sorted in three steps
          </h2>
          <p className="mt-4 text-lg text-muted">
            No spreadsheets, no one person covering everyone, no month-end stress.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90} className="card-soft p-7">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <s.icon size={22} />
                </span>
                <span className="font-mono text-sm font-bold text-faint">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- Features */}
      <section id="features" className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal className="max-w-2xl">
            <span className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
              Why PayEasy
            </span>
            <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-tight md:text-5xl">
              Everything the group chat can&apos;t do
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal
                key={f.title}
                delay={(i % 3) * 80}
                className="rounded-2xl border border-line bg-canvas p-6 transition-colors hover:border-brand-200"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-600 shadow-sm">
                  <f.icon size={20} />
                </span>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Trust */}
      <section id="trust" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Reveal>
            <span className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
              Is my money safe?
            </span>
            <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-tight md:text-5xl">
              Your share is protected, always
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Every payment goes into a protected escrow, not into someone&apos;s
              personal account. The rent is only released once{" "}
              <span className="font-semibold text-ink">everyone</span> has paid.
              If the full amount never comes together, everyone gets refunded —
              no arguments.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "No single roommate ever holds the money",
                "Auto-released to the landlord when complete",
                "Fully refunded if the rent isn't met by the deadline",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint-100 text-mint-600">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="text-ink">{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} className="card-soft p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mint-100 text-mint-600">
                <ShieldCheck size={24} />
              </span>
              <div>
                <p className="font-bold text-ink">Protected payment</p>
                <p className="text-sm text-muted">Flat 4B · March rent</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { label: "Maya paid her share", tone: "done" },
                { label: "Jordan paid his share", tone: "done" },
                { label: "Waiting on your $620", tone: "active" },
                { label: "Rent released to landlord", tone: "pending" },
              ].map((row, i) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span
                    className={
                      row.tone === "done"
                        ? "grid h-7 w-7 place-items-center rounded-full bg-mint-500 text-white"
                        : row.tone === "active"
                        ? "grid h-7 w-7 place-items-center rounded-full border-2 border-brand-400 bg-brand-50 text-brand-600"
                        : "grid h-7 w-7 place-items-center rounded-full border-2 border-dashed border-line text-faint"
                    }
                  >
                    {row.tone === "done" ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={
                      row.tone === "pending"
                        ? "text-sm text-faint"
                        : "text-sm font-medium text-ink"
                    }
                  >
                    {row.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-7 rounded-2xl bg-canvas p-4 text-center">
              <p className="text-xs text-muted">Powered by Stellar — secure, instant settlement</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal className="relative overflow-hidden rounded-3xl bg-brand-600 px-8 py-16 text-center md:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(50% 60% at 20% 20%, rgba(255,255,255,0.18) 0%, transparent 60%), radial-gradient(40% 50% at 90% 90%, rgba(255,107,74,0.35) 0%, transparent 60%)",
            }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              Never front the whole rent again
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/80">
              Set up your first rent split in a couple of minutes. Your roommates
              will thank you.
            </p>
            <button
              onClick={() => router.push("/connect")}
              className="btn-pill mt-8 bg-white text-base !px-8 !py-4 font-bold text-brand-700 hover:bg-brand-50"
            >
              Get started free
              <ArrowRight size={18} />
            </button>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------ Footer */}
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
          <PayEasyLogo size={26} />
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
            <Link href="/faq" className="hover:text-ink">FAQ</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <a
              href="https://github.com/Ogstevyn/payeasy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink"
            >
              GitHub
            </a>
          </nav>
          <p className="text-sm text-faint">© 2026 PayEasy</p>
        </div>
      </footer>
    </main>
  );
}
