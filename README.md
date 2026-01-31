# MEET - Monthly Expense Entry & Tracking

<p align="center">
  <strong>A privacy-first, offline-capable expense tracker built with React and Capacitor</strong>
</p>

MEET is a hybrid mobile expense tracking application that runs as a Progressive Web App (PWA) or as a native Android app. It provides comprehensive expense management with full offline support—all data stays on your device.

## 🌟 Key Highlights

- **100% Offline** - No backend, no cloud. Your data stays on your device
- **Multi-Currency Support** - Track expenses in 17+ currencies
- **Freemium Model** - Core features free forever, premium features available
- **Native Android App** - Built with Capacitor for native mobile experience
- **PWA Support** - Install on any device as a web app

---

## 📱 Features

### Expense Management
- **Add, edit, and delete expenses** with amount, date, time, and optional notes
- **11 built-in categories** with emoji icons: Food, Transport, Shopping, Bills, Medical, Subscriptions, Education, Tax, Liabilities, Investments, Misc
- **Subcategories** for detailed tracking (e.g., Bills → Electricity, Rent, Internet)
- **Custom categories and subcategories** - Create your own with custom icons
- **Hide unused categories** from the expense entry screen
- **Purpose tagging** - Tag expenses with custom purposes (e.g., "Vacation", "Wedding") for tracking goal-specific spending
- **Date and time picker** - Log expenses for any date/time, not just today

### Dashboard & Analytics
- **Monthly spending overview** with total amount and transaction count
- **Yearly spending view** with monthly breakdown and drill-down
- **Category doughnut chart** visualizing spending distribution
- **Spending by category breakdown** with expandable lists
- **Multi-currency carousel** - Swipe through spending totals by currency
- **Recent transactions list** showing the latest 3 expenses
- **Today's spending** quick view
- **Savings tracker** - View net savings by currency (Base Savings + Income - Expenses)
- **Purpose-based view** - Browse expenses grouped by purpose
- **Dashboard customization** - Toggle visibility of spending card, category breakdown, and upcoming payments

### Income Tracking
- **Add income entries** with amount, source, date, and notes
- **Built-in income sources**: Salary, Rent Income, Other
- **Custom income sources** - Add your own with custom icons
- **Recurring income** - Set income to auto-add monthly on a specific day
- **Auto-update duration** - Configure how many months recurring income should apply
- **Monthly income summary** showing total for the current month

### Recurring Expenses
- **Schedule recurring payments** (subscriptions, bills, etc.)
- **Flexible frequency**: Days, Months, or Years
- **Preset frequencies**: Monthly, Quarterly, Half-yearly, Yearly
- **Custom start date** for when the recurring expense begins
- **Auto-generation** - Recurring expenses automatically create regular expense entries when due
- **Upcoming payments widget** on dashboard showing next 5 due payments
- **Toggle active/inactive** to pause recurring expenses without deleting
- **Expected monthly total** calculation

### Multi-Currency Support
- **17 supported currencies**: USD, EUR, GBP, INR, JPY, CAD, AUD, SGD, MYR, CHF, THB, AED, PHP, NZD, RUB, CNY, PLN
- **Primary currency setting** - Set your default currency
- **Add expenses in any currency** (Freemium feature)
- **Currency-specific totals** on dashboard and reports
- **Savings by currency** - Track savings separately for each currency
- **Currency migration** - Automatically assign currency to older expenses

### Data Import & Export
- **Export to JSON** - Full backup including all expense data and IDs
- **Export to CSV** - Spreadsheet-compatible format with date range filtering
- **Export to PDF** (Freemium) - Professional reports with:
  - Cover page with summary
  - Category breakdown tables
  - Bar charts for visual analysis
  - Transaction details
  - Savings overview
  - Multiple color themes (Green, Blue, Black, Mixed)
  - Portrait/Landscape orientation
  - Currency filtering
  - Preview before export
- **Import from JSON** - Restore backups with duplicate detection
- **Import from CSV** (Freemium) - Import from spreadsheets

### Security & Privacy
- **6-digit PIN protection** - Lock the app with a PIN
- **PIN change** - Update your PIN anytime
- **All data stored locally** - No server, no tracking, no ads
- **Privacy policy** accessible in-app

### Settings & Customization
- **Theme support**: Light, Dark, or System (auto-switch)
- **Country selection** with automatic currency setting
- **User display name** for personalized greeting
- **App reset** - Clear all data and start fresh

### User Experience
- **Onboarding flow** - Country and currency selection on first launch
- **Feature tour** - 4-screen interactive guide to app features
- **Native Android back button** support with exit confirmation
- **Splash screen** with app branding
- **PWA install prompt** for web users
- **In-app update** checking for Android (via Google Play)
- **Toast notifications** for user feedback

---

## 💎 Freemium Tiers

### Free Tier (Always Available)
- Add, edit, delete expenses in primary currency
- View expenses monthly and yearly
- Savings tracking with automatic updates
- Add custom income sources
- Recurring income support
- Category doughnut chart
- Manage categories and subcategories
- Import/Export JSON
- Export CSV
- PIN protection
- Theme switching
- App reset

### Freemium Tier (7-Day Trial or Paid)
- Change country after initial setup
- Change default currency
- **Multiple currencies** - Add expenses in any supported currency
- View expenses and savings by currency
- **Purposes** - Manage and assign purposes to expenses
- Purpose-wise insights across all time
- **Import CSV** data
- **Export PDF reports** with customization:
  - Pie/Bar chart selection
  - Color theme selection
  - Page orientation
  - Currency filter and preview

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 with TypeScript |
| Build Tool | Vite |
| UI Components | shadcn/ui + Radix UI primitives |
| Styling | Tailwind CSS |
| Charts | Recharts |
| PDF Generation | jsPDF |
| Mobile Framework | Capacitor 8 |
| State Management | Custom React Hooks + localStorage |
| Forms | React Hook Form + Zod validation |
| Date Handling | date-fns |

---

## 📂 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui primitives
│   ├── Dashboard.tsx   # Main dashboard view
│   ├── AddExpense.tsx  # Expense entry form
│   ├── ExpenseList.tsx # List/edit expenses
│   ├── IncomePanel.tsx # Income management
│   ├── RecurringExpensesPanel.tsx
│   ├── CategoryManager.tsx
│   ├── PurposeManager.tsx
│   ├── SettingsPanel.tsx
│   ├── FinanceMenu.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useExpenses.ts  # Expense CRUD & calculations
│   ├── useSettings.ts  # User preferences
│   ├── useIncome.ts    # Income management
│   ├── useRecurringExpenses.ts
│   ├── useSubscription.ts
│   └── ...
├── lib/                # Utility functions
│   ├── exportUtils.ts  # CSV/JSON export
│   ├── pdfExport.ts    # PDF generation
│   ├── fileExport.ts   # File system operations
│   └── ...
├── types/              # TypeScript definitions
│   ├── expense.ts      # Core data types
│   └── subscription.ts # Freemium tier types
├── pages/              # Route pages
│   ├── Index.tsx       # Main app (view router)
│   └── Privacy.tsx     # Privacy policy
└── main.tsx            # App entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or bun

### Development

```bash
# Install dependencies
npm install

# Start development server (port 8080)
npm run dev

# Run ESLint
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Android Build

After building for web:

```bash
# Sync web build with Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Or build APK directly
cd android && ./gradlew assembleDebug
```

### Android Configuration
- **App ID**: `com.moonshakers.meet.app`
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 36
- **Capacitor Config**: `capacitor.config.ts`

---

## 💾 Data Storage

All data is persisted to browser `localStorage`:

| Key | Description |
|-----|-------------|
| `meet_expenses` | All expense records |
| `meet_settings` | User preferences, categories, purposes |
| `meet_income` | Income entries |
| `meet_recurring` | Recurring expense definitions |
| `meet_subscription` | Freemium tier state |

---

## 🎨 Supported Categories

| Category | Icon | Subcategories |
|----------|------|---------------|
| Food | 🍔 | Online Order, Dining Out, Groceries |
| Transport | 🚗 | Taxi, Bus, Train, Flight, Fuel |
| Shopping | 🛍️ | Online, In-Store |
| Bills | 💡 | Electricity, Rent, Internet, Mobile, Gas |
| Medical | 🏥 | Treatment, Diagnosis, Medicines, Equipment |
| Subscriptions | 📺 | TV, OTT, Software, MOOC, Job Portals |
| Education | 📚 | Tuition, Supplies |
| Tax | 🏛️ | Water Tax, Property Tax |
| Liabilities | 🏦 | House EMI, Loan EMI |
| Investments | 📈 | RD, SIP, Gold/Silver |
| Misc | 📦 | Gifts, Repairs, Others |

---

## 🌍 Supported Countries & Currencies

**Countries**: Australia, Austria, Canada, China, France, Germany, India, Italy, Malaysia, Netherlands, New Zealand, Poland, Russia, Singapore, Switzerland, Thailand, United Kingdom, United States

**Currencies**: USD, EUR, GBP, INR, JPY, CAD, AUD, SGD, MYR, CHF, THB, AED, PHP, NZD, RUB, CNY, PLN

---

## 📄 License

This project is proprietary software developed by MoonShaker Labs.

---

## 🤝 Contributing

This is a private project. For bug reports or feature requests, please contact the development team.

---

<p align="center">
  <strong>Built with ❤️ by MoonShaker Labs</strong><br>
  Version 3.1.0
</p>
