import { FilterField } from '../../components/filter-field';
import type { IconName } from '../../components/icon';
import { MenuDropdown } from '../../components/menu-dropdown';
import { MenuItem } from '../../components/menu-item';

/**
 * FilterMenu — a story-level stand-in, not a DS component: a filter bar's
 * dropdown ("All Status", "All Types", "All Roles"). Figma draws only the
 * trigger (`Filter / Field`, Type=Dropdown) and leaves the panel to the
 * pattern. FilterField's docs suggest a Select in a Popover, but Select brings
 * its own trigger, so here the panel is a MenuDropdown of MenuItems: the
 * menu button pattern, fully keyboard-driven, with no new code.
 *
 * What it lacks (a design question in docs/patterns.md): MenuItem has no
 * selected state, so the open menu doesn't mark the current value; the
 * trigger shows it ("Status: Completed").
 */
export interface FilterMenuProps {
  /** Names the trigger and the menu: "Status" → the button reads "Status: All Status". */
  label: string;
  /** The chosen option, shown on the trigger. */
  value: string;
  /** The choices, "All …" first. */
  options: readonly string[];
  onValueChange: (value: string) => void;
  /** The trigger's leading icon. Default `funnel`. */
  icon?: IconName;
  /** Styles the wrapper (its width in the bar). */
  className?: string;
}

export function FilterMenu({ label, value, options, onValueChange, icon, className }: FilterMenuProps) {
  return (
    <MenuDropdown
      className={className}
      label={label}
      trigger={<FilterField type="dropdown" label={label} value={value} icon={icon} />}
    >
      {options.map((option) => (
        <MenuItem key={option} onClick={() => onValueChange(option)}>
          {option}
        </MenuItem>
      ))}
    </MenuDropdown>
  );
}
