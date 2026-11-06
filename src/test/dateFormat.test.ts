import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatDateTimeWithYear,
  formatHourMinute,
  formatShortDate,
  formatShortDateTime,
  withDateFormatContext
} from '../domain/dateFormat';

const US_UTC = { locale: 'en-US', timeZone: 'UTC' } as const;
// 23:30 UTC on Jun 5 is already Jun 6 in Tokyo (UTC+9).
const LATE_JUN_5_UTC = new Date('2026-06-05T23:30:00.000Z');

run('short dates follow the pinned locale and time zone', () => {
  equal(withDateFormatContext(US_UTC, () => formatShortDate(LATE_JUN_5_UTC)), 'Jun 5');
  equal(
    withDateFormatContext({ locale: 'en-GB', timeZone: 'Asia/Tokyo' }, () => formatShortDate(LATE_JUN_5_UTC)),
    '6 Jun'
  );
});

run('date-time labels include the pinned hour and minute', () => {
  const label = withDateFormatContext(US_UTC, () => formatShortDateTime(LATE_JUN_5_UTC));
  equal(label.normalize('NFKC'), 'Jun 5, 11:30 PM');
  const withYear = withDateFormatContext(US_UTC, () => formatDateTimeWithYear(LATE_JUN_5_UTC));
  equal(withYear.normalize('NFKC'), 'Jun 5, 2026, 11:30 PM');
});

run('hour-minute labels use the locale clock unless 12 or 24 hours is requested', () => {
  withDateFormatContext(US_UTC, () => {
    equal(formatHourMinute(LATE_JUN_5_UTC).normalize('NFKC'), '11:30 PM');
    equal(formatHourMinute(LATE_JUN_5_UTC, 24), '23:30');
  });
  withDateFormatContext({ locale: 'en-GB', timeZone: 'UTC' }, () => {
    equal(formatHourMinute(LATE_JUN_5_UTC), '23:30');
    equal(formatHourMinute(LATE_JUN_5_UTC, 12).normalize('NFKC'), '11:30 pm');
  });
});

run('without a pinned context labels use the runtime locale and time zone', () => {
  equal(
    formatShortDate(LATE_JUN_5_UTC),
    LATE_JUN_5_UTC.toLocaleDateString([], { month: 'short', day: 'numeric' })
  );
});

run('a pinned context is restored after the callback, even when it throws', () => {
  const runtimeLabel = formatShortDate(LATE_JUN_5_UTC);
  try {
    withDateFormatContext({ locale: 'en-GB', timeZone: 'Asia/Tokyo' }, () => {
      throw new Error('boom');
    });
  } catch {
    // expected
  }
  equal(formatShortDate(LATE_JUN_5_UTC), runtimeLabel);
});

run('production code formats dates only through domain/dateFormat', () => {
  const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..');
  const allowed = 'domain/dateFormat.ts';
  const pattern = /\.toLocale(?:Date|Time)?String\(|Intl\.DateTimeFormat\b/;
  const offenders: string[] = [];
  for (const file of productionSources(srcDir)) {
    const path = relative(srcDir, file).split('\\').join('/');
    if (path === allowed) continue;
    readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
      if (pattern.test(line)) offenders.push(`${path}:${index + 1}`);
    });
  }
  if (offenders.length > 0) {
    throw new Error(
      `Format user-facing dates with src/${allowed} so tests can pin the locale and time zone ` +
        `(use Intl.NumberFormat for numbers). Found: ${offenders.join(', ')}`
    );
  }
});

function productionSources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'test' ? [] : productionSources(path);
    return name.endsWith('.ts') ? [path] : [];
  });
}

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function equal<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}
