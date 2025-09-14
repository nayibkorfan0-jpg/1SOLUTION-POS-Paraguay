# Design Guidelines for 1SOLUTION - Car Wash POS System

## Design Approach
**System-Based Approach**: Following Material Design principles adapted for enterprise dashboard applications, prioritizing functionality and data clarity while maintaining visual appeal through strategic use of color and spacing.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Brand Blue: 210 100% 50% (main brand color)
- Deep Blue: 210 90% 25% (navigation, headers)
- Success Green: 120 60% 45% (completed services, positive metrics)
- Warning Orange: 35 85% 55% (low stock alerts)
- Critical Red: 0 70% 50% (critical alerts, overdue items)

**Background & Surface Colors:**
- Light Gray: 210 15% 98% (main background)
- Card White: 0 0% 100% (card backgrounds)
- Border Gray: 210 10% 90% (subtle borders)

### B. Typography
**Font Family**: Inter (Google Fonts)
- Headings: Inter 600 (semibold)
- Body text: Inter 400 (regular)
- Numbers/metrics: Inter 500 (medium)
- Small text: Inter 400 (regular)

**Font Sizes:**
- Large metrics: text-3xl (30px)
- Section headers: text-xl (20px)
- Body text: text-base (16px)
- Secondary text: text-sm (14px)

### C. Layout System
**Spacing Units**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 or p-6
- Section margins: m-6 or m-8
- Grid gaps: gap-4 or gap-6
- Icon spacing: mr-2 or ml-2

### D. Component Library

**Dashboard Cards:**
- White background with subtle shadow
- Rounded corners (rounded-lg)
- 6-unit padding
- Clear metric hierarchy with large numbers and descriptive labels

**Status Indicators:**
- Color-coded badges for service states
- Critical/warning icons with appropriate colors
- Progress indicators for services in process

**Navigation:**
- Left sidebar with company branding
- Clean navigation items with icons
- Active state highlighting
- User profile section at bottom

**Data Tables:**
- Clean borders and alternating row colors
- Clear column headers
- Action buttons aligned right
- Status badges inline

**Alert System:**
- Prominent critical alerts (timbrado vencido)
- Color-coded inventory warnings
- Dismissible notifications

### E. Specific UI Patterns

**Metric Cards:**
- Large primary number
- Percentage change indicators with arrows
- Descriptive icons
- Trend visualization when applicable

**Service Status Flow:**
- Visual progression indicators
- Color-coded status badges
- Time stamps for each status change

**Inventory Alerts:**
- Critical/low stock visual hierarchy
- Provider information easily accessible
- Quick action buttons for reordering

**Fiscal Compliance:**
- Prominent timbrado status display
- Clear validation messaging
- Disabled states when compliance issues exist

## Visual Hierarchy
- Primary actions in brand blue
- Secondary information in muted gray
- Critical information in red with bold typography
- Metrics emphasized through size and color contrast

## Responsive Considerations
- Desktop-first design for POS terminal usage
- Sidebar collapses to icons on smaller screens
- Card layouts stack vertically on mobile
- Maintain readability of critical metrics across all screen sizes