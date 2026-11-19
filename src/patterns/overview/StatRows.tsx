import * as React from 'react';
import { StatCard } from '../../components/stat-card';
import { StatRow, type StatRowProps } from '../../components/stat-row';
import { formatShortDate, type Announcement } from '../fixtures';

/**
 * The two Stat Rows the CAF Figma library draws as their own components
 * (page "Cards"): story-level organisms, not DS components (COMPONENT-PLAN
 * decision 4). They are content for the DS's StatRow and StatCard, with
 * `_Stat Icon`'s Type taken apart into StatCard's `icon` and `tone` (the
 * table in StatCard's docs).
 *
 * Pattern 13 (529:6821): "Card / Stat Row sits between the page header and
 * the filter bar. Each card shows one total with a coloured icon. The stats
 * reflect the whole collection, not just the current page." So the rows take
 * totals, not the rows on screen. Each row is a group named after what it
 * counts; each card is named by its label.
 */

export interface ExportStats {
  total: number;
  completed: number;
  processing: number;
  failed: number;
}

export interface ExportsStatRowProps extends Omit<StatRowProps, 'children'> {
  /** The totals across every export (fixtures' `exportStats`). */
  stats: ExportStats;
}

/** Card / Stat Row – Exports (387:3601): Total Exports, Completed, Processing, Failed. */
export const ExportsStatRow = React.forwardRef<HTMLDivElement, ExportsStatRowProps>(function ExportsStatRow(
  { stats, ...props },
  ref,
) {
  return (
    <StatRow ref={ref} role="group" aria-label="Export totals" {...props}>
      <StatCard label="Total Exports" value={String(stats.total)} icon="file-text" tone="info" />
      <StatCard label="Completed" value={String(stats.completed)} icon="check-circle" tone="success" />
      <StatCard label="Processing" value={String(stats.processing)} icon="clock" tone="info" />
      <StatCard label="Failed" value={String(stats.failed)} icon="x-circle" tone="critical" />
    </StatRow>
  );
});
ExportsStatRow.displayName = 'ExportsStatRow';

export interface AnnouncementStats {
  total: number;
  /** The newest release's version, "2.5.6". */
  latestVersion: string;
  /** The newest release's date, as an ISO date. */
  lastUpdated: string;
}

/** The Announcements row's totals, from the list: how many, and the newest release's version and date. */
export function summariseAnnouncements(list: readonly Announcement[]): AnnouncementStats {
  const newest = [...list].sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))[0];
  return { total: list.length, latestVersion: newest?.version ?? '-', lastUpdated: newest?.releasedAt ?? '' };
}

export interface AnnouncementsStatRowProps extends Omit<StatRowProps, 'children'> {
  stats: AnnouncementStats;
}

/** Card / Stat Row – Announcements (389:163): Total Announcements, Latest Version, Last Updated ("Aug 10, 2026"). */
export const AnnouncementsStatRow = React.forwardRef<HTMLDivElement, AnnouncementsStatRowProps>(
  function AnnouncementsStatRow({ stats, ...props }, ref) {
    return (
      <StatRow ref={ref} role="group" aria-label="Announcement totals" {...props}>
        <StatCard label="Total Announcements" value={String(stats.total)} icon="bell" tone="info" />
        <StatCard label="Latest Version" value={stats.latestVersion} icon="tag" tone="success" />
        <StatCard
          label="Last Updated"
          value={stats.lastUpdated ? formatShortDate(stats.lastUpdated) : '-'}
          icon="calendar-blank"
          tone="info"
        />
      </StatRow>
    );
  },
);
AnnouncementsStatRow.displayName = 'AnnouncementsStatRow';
