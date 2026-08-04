# Graph Report - .  (2026-07-15)

## Corpus Check
- 55 files · ~54,202 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 317 nodes · 598 edges · 19 communities (17 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 15

## God Nodes (most connected - your core abstractions)
1. `AppLanguage` - 47 edges
2. `getLocale()` - 33 edges
3. `App()` - 22 edges
4. `TRANSLATIONS` - 22 edges
5. `compilerOptions` - 16 edges
6. `Transaction` - 11 edges
7. `getAuthUserId()` - 9 edges
8. `Investment` - 8 edges
9. `MonthSummary` - 7 edges
10. `LoginScreen()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Props` --references--> `AppLanguage`  [EXTRACTED]
  components/BalanceCard.tsx → types.ts
- `Props` --references--> `AppLanguage`  [EXTRACTED]
  components/CalculatorModal.tsx → types.ts
- `CalendarModalBase()` --calls--> `getLocale()`  [EXTRACTED]
  components/CalendarModal.tsx → i18n.ts
- `DonationModal()` --calls--> `getLocale()`  [EXTRACTED]
  components/DonationModal.tsx → i18n.ts
- `Props` --references--> `AppLanguage`  [EXTRACTED]
  components/LoginScreen.tsx → types.ts

## Import Cycles
- None detected.

## Communities (19 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (44): AnalyticsModal, App(), currentDate, generateUUID(), getLocalISODateString(), getMonthFromDateStr(), getYearFromDateStr(), INITIAL_PROFILE (+36 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (29): Props, CalendarModal, CalendarModalBase(), Props, Props, DonationModal(), Props, COLORS (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (31): AddAccountModal(), Props, THEMES_CONFIG, AddInvestmentModal(), Props, AnalyticsModal(), BalanceCard(), Props (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (16): AddTransactionModal(), getLocalISODate(), MONTH_MAP, Props, TODAY_KEYWORDS, IconBell(), JeittoLogo(), TransactionIcon() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (32): lucide-react, dependencies, lucide-react, react, react-dom, recharts, @supabase/supabase-js, devDependencies (+24 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (26): background_color, categories, description, dir, display, display_override, iarc_rating_id, icons (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, node, compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (18): background_color, dir, display, display_override, iarc_rating_id, icons, minimal-ui, standalone (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (10): ButtonProps, calculate(), CalculatorAction, CalculatorButton, CalculatorModal(), calculatorReducer(), CalculatorState, formatDisplay() (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.39
Nodes (8): applyDailyYield(), applyYieldToAll(), countBusinessDaysBetween(), FIXED_HOLIDAYS, isBusinessDay(), isHoliday(), MOBILE_HOLIDAYS, toLocalISODate()

### Community 10 - "Community 10"
Cohesion: 0.47
Nodes (5): NotificationModal(), Props, TabType, urlBase64ToUint8Array(), AppNotification

## Knowledge Gaps
- **107 isolated node(s):** `AnalyticsModal`, `SHORT_CODE_TO_FULL`, `currentDate`, `SYSTEM_INITIAL_MONTH`, `INITIAL_PROFILE` (+102 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppLanguage` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 8`, `Community 10`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `getLocale()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 8`, `Community 10`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `TRANSLATIONS` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 8`, `Community 10`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `AnalyticsModal`, `SHORT_CODE_TO_FULL`, `currentDate` to the rest of the system?**
  _107 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08862745098039215 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07922705314009662 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09146341463414634 - nodes in this community are weakly interconnected._