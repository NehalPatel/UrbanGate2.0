'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ComponentType } from 'react';
import { useSidebar } from '../context/SidebarContext';
import { cn } from '../lib/cn';

type NavItem = { href: string; label: string; icon: ComponentType };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: GridIcon },
      { href: '/setup', label: 'Setup', icon: SetupIcon },
      { href: '/notifications', label: 'Notifications', icon: BellIcon },
    ],
  },
  {
    label: 'Property',
    items: [
      { href: '/societies', label: 'Societies', icon: BuildingIcon },
      { href: '/buildings', label: 'Buildings', icon: LayersIcon },
      { href: '/units', label: 'Units', icon: DoorIcon },
      { href: '/members', label: 'Members', icon: UsersIcon },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/maintenance', label: 'Maintenance', icon: WrenchIcon },
      { href: '/finance', label: 'Finance', icon: WalletIcon },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/notices', label: 'Notices', icon: MegaphoneIcon },
      { href: '/complaints', label: 'Complaints', icon: AlertIcon },
      { href: '/meetings', label: 'Meetings', icon: CalendarIcon },
    ],
  },
  {
    label: 'Gate',
    items: [{ href: '/gate', label: 'Gate desk', icon: ShieldIcon }],
  },
  {
    label: 'Facilities',
    items: [
      { href: '/amenities', label: 'Amenities', icon: CalendarIcon },
      { href: '/vehicles', label: 'Vehicles', icon: CarIcon },
      { href: '/household', label: 'Household', icon: HomeIcon },
      { href: '/service-personnel', label: 'Service staff', icon: WrenchIcon },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => isActivePath(pathname, item.href));
}

export function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const showLabel = isExpanded || isHovered || isMobileOpen;
  /** All groups start collapsed; user expands categories manually. */
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out lg:mt-0 dark:border-gray-800 dark:bg-gray-900',
        isExpanded || isMobileOpen ? 'w-[290px]' : isHovered ? 'w-[290px]' : 'w-[90px]',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'flex py-8',
          !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start',
        )}
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            UG
          </span>
          {showLabel ? (
            <span className="text-xl font-semibold text-gray-800 dark:text-white/90">
              UrbanGate
            </span>
          ) : null}
        </Link>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6 space-y-2">
          {NAV_GROUPS.map((group) => {
            const isOpen = Boolean(openGroups[group.label]);
            const hasActive = groupHasActive(pathname, group);
            return (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={isOpen}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors',
                    hasActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:hover:bg-white/[0.03] dark:hover:text-white/80',
                    !showLabel ? 'lg:justify-center' : 'justify-between',
                  )}
                  title={group.label}
                >
                  {showLabel ? (
                    <>
                      <span className="text-xs font-semibold tracking-wide uppercase">
                        {group.label}
                      </span>
                      <ChevronIcon open={isOpen} />
                    </>
                  ) : (
                    <span
                      className={cn(
                        'flex h-2 w-2 rounded-full',
                        hasActive ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600',
                      )}
                    />
                  )}
                </button>
                {isOpen ? (
                  <ul className="mt-1 flex flex-col gap-1">
                    {group.items.map((item) => {
                      const active = isActivePath(pathname, item.href);
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              'menu-item group',
                              active ? 'menu-item-active' : 'menu-item-inactive',
                              !showLabel ? 'lg:justify-center' : 'lg:justify-start',
                            )}
                          >
                            <span
                              className={cn(
                                'menu-item-icon-size',
                                active ? 'menu-item-icon-active' : 'menu-item-icon-inactive',
                              )}
                            >
                              <Icon />
                            </span>
                            {showLabel ? (
                              <span className="menu-item-text">{item.label}</span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn('shrink-0 transition-transform duration-200', open ? 'rotate-180' : '')}
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SetupIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M9 21v-4M14 9h5a1 1 0 0 1 1 1v11M4 21h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m12 3 9 5-9 5-9-5 9-5Zm0 8 9 5-9 5-9-5 9-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoorIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M3 21h18M14 12h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5 2.5-2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3m0-2h-5a2 2 0 0 0 0 4h5v-4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m3 11 18-5v12L3 13v-2Zm0 0v7a2 2 0 0 0 2 2h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9ZM10.3 21a1.94 1.94 0 0 0 3.4 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 13h18l-1.5-4.5A2 2 0 0 0 17.6 7H6.4a2 2 0 0 0-1.9 1.5L3 13Zm2 0v4m14-4v4M6.5 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
