'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarDays, Loader2, MapPin, PartyPopper, ShieldCheck, Truck, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { ItemGlyph } from '@/components/ItemGlyph';
import { MiniPreview } from '@/components/MiniPreview';
import { usePlace } from '@/components/usePlace';
import { cn } from '@/lib/dnd';
import { ItemIcon } from '@/lib/icons';
import { cartTotal, DURATION_KEYS, DURATIONS, formatIDR, priceFor, savings, type Duration } from '@/lib/pricing';
import { groupByCategory, useHydrated, useSetup } from '@/store/useSetup';

type Order = {
  id: string;
  name: string;
  email: string;
  address: string;
  start: string;
  end: string;
  duration: Duration;
  count: number;
  total: number;
};

const toISO = (d: Date) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

function endDate(start: string, duration: Duration) {
  const d = new Date(`${start}T00:00:00`);
  if (duration === 'week') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + (duration === 'month' ? 1 : 3));
  return toISO(d);
}

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const orderId = () => `MNS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export default function CheckoutPage() {
  const hydrated = useHydrated();
  const placed = useSetup((s) => s.placed);
  const duration = useSetup((s) => s.duration);
  const setDuration = useSetup((s) => s.setDuration);
  const [step, setStep] = useState<'review' | 'details'>('review');
  const [order, setOrder] = useState<Order | null>(null);
  const [start, setStart] = useState(() => addDays(toISO(new Date()), 1));

  if (order) return <Success order={order} />;

  return (
    <>
      <Header title="Rent Your Setup" />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-5 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-jungle-800/70 hover:text-jungle-900"
        >
          <ArrowLeft size={16} aria-hidden /> Back to builder
        </Link>

        {!hydrated ? (
          <div className="mt-10 grid place-items-center text-jungle-800/50">
            <Loader2 className="animate-spin" aria-label="Loading your setup" />
          </div>
        ) : placed.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_24rem]">
            <ReviewItems duration={duration} />
            <aside className="md:sticky md:top-20 md:self-start">
              <div className="overflow-hidden rounded-3xl bg-white/80 shadow-lift ring-1 ring-jungle-900/5">
                <AnimatePresence mode="wait" initial={false}>
                  {step === 'review' ? (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <Summary
                        duration={duration}
                        setDuration={setDuration}
                        start={start}
                        setStart={setStart}
                        onRent={() => setStep('details')}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <DetailsForm
                        total={cartTotal(placed, duration)}
                        onBack={() => setStep('review')}
                        onSubmit={(f) => {
                          setOrder({
                            id: orderId(),
                            ...f,
                            start,
                            end: endDate(start, duration),
                            duration,
                            count: placed.length,
                            total: cartTotal(placed, duration),
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

function ReviewItems({ duration }: { duration: Duration }) {
  const placed = useSetup((s) => s.placed);
  const groups = useMemo(() => groupByCategory(placed), [placed]);
  const { removeItem } = usePlace();

  return (
    <section aria-labelledby="your-setup" className="min-w-0 space-y-5">
      <div>
        <h2 id="your-setup" className="font-display text-2xl font-extrabold tracking-tight">
          Your setup
        </h2>
        <p className="text-sm text-jungle-800/60">Delivered and assembled at your place in Bali.</p>
      </div>
      <MiniPreview />

      <div className="space-y-4">
        {groups.map(({ category, lines }) => (
          <div key={category.key} className="rounded-3xl bg-white/70 p-4 ring-1 ring-jungle-900/5">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold" style={{ color: category.color }}>
              <ItemIcon icon={category.icon} emoji={category.emoji} size={16} />
              {category.label}
              <span className="ml-auto font-sans text-xs font-medium text-jungle-800/50">{lines.length}</span>
            </h3>
            <ul className="mt-2 divide-y divide-jungle-900/5">
              <AnimatePresence initial={false}>
                {lines.map(({ placed: p, item }) => (
                  <motion.li
                    key={p.uid}
                    layout
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 py-2"
                  >
                    <ItemGlyph item={item} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatIDR(priceFor(item.pricePerMonth, duration))}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(p.uid)}
                      aria-label={`Remove ${item.name}`}
                      className="grid size-7 place-items-center rounded-full text-jungle-800/50 hover:bg-sunset-100 hover:text-sunset-600"
                    >
                      <X size={14} aria-hidden />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Summary({
  duration,
  setDuration,
  start,
  setStart,
  onRent,
}: {
  duration: Duration;
  setDuration: (d: Duration) => void;
  start: string;
  setStart: (s: string) => void;
  onRent: () => void;
}) {
  const placed = useSetup((s) => s.placed);
  const total = cartTotal(placed, duration);
  const saved = savings(placed, duration);
  const today = toISO(new Date());

  return (
    <div className="p-5">
      <h2 className="font-display text-lg font-bold">Rental summary</h2>

      <fieldset className="mt-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-jungle-800/60">Duration</legend>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-jungle-900/5 p-1">
          {DURATION_KEYS.map((key) => {
            const d = DURATIONS[key];
            const activeKey = key === duration;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={activeKey}
                onClick={() => setDuration(key)}
                className={cn(
                  'relative rounded-xl px-2 py-2 text-sm font-semibold transition',
                  activeKey ? 'text-sand-50' : 'text-jungle-800 hover:bg-white/60',
                )}
              >
                {activeKey && (
                  <motion.span
                    layoutId="duration-pill"
                    className="absolute inset-0 rounded-xl bg-jungle-900"
                    transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                  />
                )}
                <span className="relative">{d.label}</span>
                {d.badge && (
                  <span className="absolute -right-1 -top-2.5 rounded-full bg-sunset-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                    {d.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-jungle-800/55">{DURATIONS[duration].note}</p>
      </fieldset>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-jungle-800/60">Start date</span>
        <span className="mt-2 flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-jungle-900/10 focus-within:ring-2 focus-within:ring-lagoon-400">
          <CalendarDays size={16} className="text-jungle-800/60" aria-hidden />
          <input
            type="date"
            value={start}
            min={today}
            onChange={(e) => e.target.value && setStart(e.target.value)}
            className="w-full bg-transparent text-sm font-medium outline-none"
          />
        </span>
        <span className="mt-1.5 block text-xs text-jungle-800/55">
          {fmtDate(start)} → {fmtDate(endDate(start, duration))}
        </span>
      </label>

      <dl className="mt-5 space-y-2 border-t border-dashed border-jungle-900/15 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-jungle-800/70">
            {placed.length} {placed.length === 1 ? 'item' : 'items'} × {DURATIONS[duration].label}
          </dt>
          <dd className="tabular-nums">{formatIDR(total + saved)}</dd>
        </div>
        {saved > 0 && (
          <div className="flex justify-between text-jungle-700">
            <dt>Long-stay discount</dt>
            <dd className="font-semibold tabular-nums">−{formatIDR(saved)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="flex items-center gap-1.5 text-jungle-800/70">
            <Truck size={14} aria-hidden /> Delivery and setup
          </dt>
          <dd className="font-semibold text-jungle-700">Free</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-jungle-900/10 pt-3">
          <dt className="font-display text-base font-bold">Total</dt>
          <dd>
            <motion.span
              key={total}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="block font-display text-2xl font-extrabold tabular-nums"
            >
              {formatIDR(total)}
            </motion.span>
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onRent}
        className="group mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-sunset-500 py-3.5 font-display text-base font-bold text-white shadow-[0_10px_28px_-10px_#e2683c] transition hover:bg-sunset-400 active:scale-[0.98]"
      >
        Rent Now
        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden />
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-jungle-800/50">
        <ShieldCheck size={12} aria-hidden /> Demo checkout. No payment is taken.
      </p>
    </div>
  );
}

function DetailsForm({
  total,
  onBack,
  onSubmit,
}: {
  total: number;
  onBack: () => void;
  onSubmit: (f: { name: string; email: string; address: string }) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const field =
    'mt-1.5 w-full rounded-2xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-jungle-900/10 outline-none transition placeholder:text-jungle-800/35 focus:ring-2 focus:ring-lagoon-400 user-invalid:ring-danger-500';

  return (
    <form
      className="p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setSubmitting(true);
        // Fake a short network round-trip so the button state is visible.
        setTimeout(
          () =>
            onSubmit({
              name: String(data.get('name')).trim(),
              email: String(data.get('email')).trim(),
              address: String(data.get('address')).trim(),
            }),
          700,
        );
      }}
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-semibold text-jungle-800/60 hover:text-jungle-900"
      >
        <ArrowLeft size={14} aria-hidden /> Summary
      </button>
      <h2 className="mt-2 font-display text-lg font-bold">Where should we bring it?</h2>

      <label className="mt-4 block text-sm font-semibold">
        Full name
        <input name="name" required autoComplete="name" placeholder="Alex Nomad" className={field} />
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Email
        <input name="email" type="email" required autoComplete="email" placeholder="alex@example.com" className={field} />
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Bali address
        <span className="relative block">
          <textarea
            name="address"
            required
            minLength={8}
            rows={3}
            autoComplete="street-address"
            placeholder="Villa Kopi, Jl. Pantai Batu Bolong 12, Canggu"
            className={cn(field, 'resize-none pl-9')}
          />
          <MapPin size={16} className="pointer-events-none absolute left-3 top-4 text-jungle-800/45" aria-hidden />
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-jungle-900 py-3.5 font-display text-base font-bold text-sand-50 transition hover:bg-jungle-800 active:scale-[0.98] disabled:opacity-70"
      >
        {submitting ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
        {submitting ? 'Confirming…' : `Confirm rental · ${formatIDR(total)}`}
      </button>
    </form>
  );
}

function EmptyCart() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-3xl bg-white/70 p-8 text-center ring-1 ring-jungle-900/5">
      <p className="text-4xl" aria-hidden>
        🏝️
      </p>
      <h2 className="mt-3 font-display text-xl font-bold">Your room is empty</h2>
      <p className="mt-1 text-sm text-jungle-800/60">Add a desk and a chair first, then come back to rent it.</p>
      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-sunset-500 px-5 py-2.5 font-display font-bold text-white hover:bg-sunset-400"
      >
        Start building <ArrowRight size={16} aria-hidden />
      </Link>
    </div>
  );
}

function Success({ order }: { order: Order }) {
  const reset = useSetup((s) => s.reset);
  const router = useRouter();
  const confetti = ['#e2683c', '#2fb5a8', '#f7a36c', '#4f8a6b', '#ffd79a'];

  return (
    <>
      <Header title="You're all set" />
      <main className="mx-auto max-w-xl px-4 pb-16 pt-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="relative overflow-hidden rounded-[32px] bg-white/85 p-6 text-center shadow-lift ring-1 ring-jungle-900/5 sm:p-8"
        >
          {Array.from({ length: 18 }, (_, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute top-16 left-1/2 size-2 rounded-sm"
              style={{ backgroundColor: confetti[i % confetti.length] }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{
                x: Math.cos((i / 18) * Math.PI * 2) * (120 + (i % 3) * 30),
                y: Math.sin((i / 18) * Math.PI * 2) * 90 + 120,
                opacity: 0,
                rotate: 360,
              }}
              transition={{ duration: 1.4, ease: 'easeOut', delay: 0.15 }}
            />
          ))}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
            className="mx-auto grid size-16 place-items-center rounded-2xl bg-sunset-100 text-sunset-600"
          >
            <PartyPopper size={32} aria-hidden />
          </motion.div>
          <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Setup booked, {order.name.split(' ')[0]}!
          </h2>
          <p className="mt-1 text-sm text-jungle-800/60">We sent the details to {order.email}.</p>

          <div className="mx-auto mt-5 inline-block rounded-2xl border-2 border-dashed border-jungle-900/15 px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-jungle-800/50">Order ID</p>
            <p className="font-mono text-2xl font-bold tracking-wider">{order.id}</p>
          </div>

          <dl className="mt-6 space-y-2 text-left text-sm">
            {[
              ['Items', `${order.count}`],
              ['Duration', DURATIONS[order.duration].label],
              ['Rental period', `${fmtDate(order.start)} → ${fmtDate(order.end)}`],
              ['Deliver to', order.address],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-jungle-900/5 pb-2">
                <dt className="shrink-0 text-jungle-800/60">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between pt-1">
              <dt className="font-display font-bold">Total</dt>
              <dd className="font-display text-xl font-extrabold">{formatIDR(order.total)}</dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/"
              className="flex-1 rounded-full bg-jungle-900/5 py-3 text-sm font-semibold hover:bg-jungle-900/10"
            >
              Back to my setup
            </Link>
            <button
              type="button"
              onClick={() => {
                reset();
                router.push('/');
              }}
              className="flex-1 rounded-full bg-sunset-500 py-3 text-sm font-bold text-white hover:bg-sunset-400"
            >
              Build another setup
            </button>
          </div>
        </motion.div>
      </main>
    </>
  );
}
