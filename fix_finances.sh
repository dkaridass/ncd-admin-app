#!/bin/bash
sed -i '' '/import ExportMenu/a\
import WeeklyFinanceReport from '"'"'../components/finance/WeeklyFinanceReport'"'"';
' pages/FinancesPage.tsx

sed -i '' '/const \[isSubmitting/a\
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
' pages/FinancesPage.tsx

sed -i '' '/<\/PageTransition/i\
      <AnimatePresence>\
        {showWeeklyReport \&\& (\
          <WeeklyFinanceReport \
            records={financeRecords || []} \
            onClose={() => setShowWeeklyReport(false)} \
          />\
        )}\
      </AnimatePresence>
' pages/FinancesPage.tsx

sed -i '' 's/map(\[category, data\])/map(([category, data]: [string, any])/g' pages/FinancesPage.tsx

sed -i '' 's/dates.forEach(date/dates.forEach((date: string)/g' components/finance/WeeklyFinanceReport.tsx
sed -i '' 's/services.forEach(service/services.forEach((service: string)/g' components/finance/WeeklyFinanceReport.tsx
