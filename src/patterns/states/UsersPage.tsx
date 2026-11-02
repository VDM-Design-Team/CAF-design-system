import * as React from 'react';
import { Alert } from '../../components/alert';
import { Button } from '../../components/button';
import { EmptyState } from '../../components/empty-state';
import { FilterField } from '../../components/filter-field';
import { Icon } from '../../components/icon';
import { useToast } from '../../components/toast';
import { emptyStateCopy, userRoles, users as fixtureUsers, type User } from '../fixtures';
import { AddUserDialog } from '../feedback/AddUserDialog';
import { FilterMenu } from '../overview/FilterMenu';
import { PageHeader } from '../page/PageHeader';
import { UsersTable } from './UsersTable';

/**
 * UsersPage — a story-level page, not a DS component: the Users screen that
 * patterns 11 and 12 both draw (528:5768, 528:6194). The PageHeader with Add
 * New, a filter bar (Search users, All Roles), and the UsersTable.
 *
 * Loading (pattern 11): with `load`, the page asks for its rows when it
 * opens. The header and filters are in place at once; the table shows
 * Skeleton / Table Rows and is `aria-busy` until they arrive, and a visually
 * hidden status says "Loading users". `load.outcomes` scripts the answers,
 * one per request ("rows" or "error"; the last repeats); `latency: null`
 * never answers, for a snapshot of the loading state.
 *
 * A failed load (Figma draws none: docs/patterns.md): an Error Alert above
 * the table, "Couldn't load users." / "Check your connection and try
 * again.", with a Retry Button under it (Alert has no action slot). Retry
 * loads again and moves focus to the table, since the button goes away.
 *
 * Filters narrow the loaded rows; nothing found shows the Compact Empty
 * State ("No items.") in the table, with the filters still there.
 *
 * Add New opens AddUserDialog (pattern 12). Saving adds the user to the
 * table and raises a Success toast, so the page needs a ToastProvider.
 */
export type UsersLoadOutcome = 'rows' | 'error';

export interface UsersPageProps {
  /** Load the rows when the page opens. Leave it out for rows already there. */
  load?: { latency: number | null; outcomes?: UsersLoadOutcome[] };
  /** Open Add New User on first render (the overlay stories). */
  dialogOpen?: boolean;
  /** Date Created for a new user, ISO. Pinned so stories stay stable. */
  today?: string;
}

const ROLE_OPTIONS = ['All Roles', ...userRoles];

export function UsersPage({ load, dialogOpen = false, today = '2026-11-02' }: UsersPageProps) {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<User[]>(fixtureUsers);
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>(load ? 'loading' : 'ready');
  const [attempt, setAttempt] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [role, setRole] = React.useState(ROLE_OPTIONS[0]);
  const [adding, setAdding] = React.useState(dialogOpen);
  const tableRef = React.useRef<HTMLTableElement>(null);

  const latency = load?.latency;
  const outcomes = load?.outcomes;
  React.useEffect(() => {
    if (state !== 'loading' || latency === null || latency === undefined) return;
    const answers = outcomes ?? ['rows'];
    const answer = answers[Math.min(attempt, answers.length - 1)];
    const timer = window.setTimeout(() => setState(answer === 'error' ? 'error' : 'ready'), latency);
    return () => window.clearTimeout(timer);
  }, [state, attempt, latency, outcomes]);

  const retry = () => {
    setAttempt((n) => n + 1);
    setState('loading');
    /* The Retry button is about to go: put focus on what is loading. */
    tableRef.current?.focus();
  };

  const q = query.trim().toLowerCase();
  const shown =
    state === 'ready'
      ? users.filter(
          (u) =>
            (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
            (role === ROLE_OPTIONS[0] || u.role === role),
        )
      : [];

  return (
    <main className="flex flex-col gap-6 p-6 pb-64">
      <PageHeader
        title="Users"
        actions={
          <Button leftIcon={<Icon name="plus" />} onClick={() => setAdding(true)}>
            Add New
          </Button>
        }
      />
      <div className="flex flex-wrap gap-4">
        <FilterField
          label="Search users"
          placeholder="Search users"
          className="w-64"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <FilterMenu className="w-64" label="Role" value={role} options={ROLE_OPTIONS} onValueChange={setRole} />
      </div>
      <p role="status" className="sr-only">
        {state === 'loading' ? 'Loading users' : ''}
      </p>
      {state === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <Alert type="error" title="Couldn’t load users." message="Check your connection and try again." />
          <Button variant="outlined" size="small" onClick={retry}>
            Retry
          </Button>
        </div>
      )}
      <UsersTable
        ref={tableRef}
        tabIndex={-1}
        rows={shown}
        loading={state === 'loading'}
        empty={state === 'ready' ? <EmptyState size="compact" title={emptyStateCopy.noResults.title} /> : undefined}
      />
      <AddUserDialog
        open={adding}
        onClose={() => setAdding(false)}
        onSave={(user) => {
          const id = String(Math.max(...users.map((u) => Number(u.id))) + 1);
          setUsers((all) => [...all, { ...user, id, createdAt: today, updatedAt: today }]);
          setAdding(false);
          toast({ type: 'success', message: 'User added.' });
        }}
      />
    </main>
  );
}
