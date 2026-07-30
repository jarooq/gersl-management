import React from 'react';

// ConsoleShell — HubSpot-style secondary-sidebar layout.
//
// Meant to replace horizontal tab bars on tool pages (Finance, HR, etc.)
// with a left secondary sidebar of sections plus a scrollable main panel.
// Renders inside the app's main layout, so no route change needed — the
// section switch stays local state on the parent page.
//
// Props:
//   title       — console name shown at top of secondary sidebar
//   subtitle    — optional secondary line under the title
//   sections    — [{ id, label, icon, badge, group }]
//   activeId    — currently selected section id
//   onSelect    — (id) => void
//   headerRight — optional actions (buttons) rendered on the top bar
//   children    — main panel content (the active section body)
const ConsoleShell = ({
  title,
  subtitle,
  sections = [],
  activeId,
  onSelect,
  headerRight,
  children,
}) => {
  // Sections may be flat OR grouped. If any section has `group`, we split
  // into groups; otherwise render as a single ungrouped list.
  const hasGroups = sections.some((s) => s.group);
  const grouped = hasGroups
    ? sections.reduce((acc, s) => {
        const g = s.group || 'General';
        acc[g] = acc[g] || [];
        acc[g].push(s);
        return acc;
      }, {})
    : { _: sections };

  const active = sections.find((s) => s.id === activeId);

  return (
    <div className="flex h-full min-h-0 bg-hs-slate-50">
      {/* Secondary sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-hs-slate-200">
        <div className="px-5 py-4 border-b border-hs-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-hs-slate-500">
            Console
          </p>
          <h2 className="text-base font-display font-semibold text-hs-navy-700 mt-0.5">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-hs-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {Object.entries(grouped).map(([groupName, items]) => (
            <div key={groupName}>
              {hasGroups && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-hs-slate-500">
                  {groupName}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((s) => {
                  const isActive = s.id === activeId;
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelect?.(s.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left transition ${
                        isActive
                          ? 'bg-orange-50 text-orange-700 font-semibold'
                          : 'text-hs-navy-700 hover:bg-hs-slate-50'
                      }`}
                    >
                      {Icon && (
                        <Icon
                          size={16}
                          className={isActive ? 'text-orange-600' : 'text-hs-slate-500'}
                        />
                      )}
                      <span className="flex-1 truncate">{s.label}</span>
                      {s.badge != null && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-hs-slate-100 text-hs-slate-600'
                          }`}
                        >
                          {s.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main panel */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Console top bar — active section title + right actions */}
        <div className="bg-white border-b border-hs-slate-200 px-5 md:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-10">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-hs-slate-500 md:hidden">
              {title}
            </p>
            <h1 className="text-lg font-display font-semibold text-hs-navy-800 truncate">
              {active?.label || title}
            </h1>
          </div>
          {headerRight && <div className="flex items-center gap-2 shrink-0">{headerRight}</div>}
        </div>

        {/* Mobile section picker */}
        <div className="md:hidden bg-white border-b border-hs-slate-200 px-3 py-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {sections.map((s) => {
              const isActive = s.id === activeId;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect?.(s.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'bg-hs-slate-100 text-hs-navy-700 hover:bg-hs-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
};

export default ConsoleShell;
