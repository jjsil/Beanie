/**
 * User-facing date and time labels.
 *
 * Every label goes through here so the locale and time zone are one explicit
 * input instead of an ambient default read at each call site. The app never
 * sets a context, so labels follow the user's own locale and time zone. Tests
 * wrap rendering in `withDateFormatContext` to get the same labels on every
 * machine.
 */
export interface DateFormatContext {
  readonly locale?: string;
  readonly timeZone?: string;
}

let context: DateFormatContext = {};

/**
 * Runs `fn` with labels pinned to `pinned`, then restores the previous
 * context, even if `fn` throws. Synchronous by design: a pin must not outlive
 * the code that asked for it.
 */
export function withDateFormatContext<T>(pinned: DateFormatContext, fn: () => T): T {
  const previous = context;
  context = { ...pinned };
  try {
    return fn();
  } finally {
    context = previous;
  }
}

/** Month and day, e.g. "Jun 5". */
export function formatShortDate(date: Date): string {
  return format(date, { month: 'short', day: 'numeric' });
}

/** Month, day and time, e.g. "Jun 5, 11:30 PM". */
export function formatShortDateTime(date: Date): string {
  return format(date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Full date and time, e.g. "Jun 5, 2026, 11:30 PM". */
export function formatDateTimeWithYear(date: Date): string {
  return format(date, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Hours and minutes, e.g. "11:30 PM" or "23:30". Uses the locale's 12- or
 * 24-hour clock unless `hours` asks for one explicitly.
 */
export function formatHourMinute(date: Date, hours?: 12 | 24): string {
  const clock: Intl.DateTimeFormatOptions =
    hours === 24 ? { hourCycle: 'h23' } : hours === 12 ? { hour12: true } : {};
  return format(date, { hour: '2-digit', minute: '2-digit', ...clock });
}

function format(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(context.locale, { ...options, timeZone: context.timeZone }).format(date);
}
