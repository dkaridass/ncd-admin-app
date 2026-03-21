#!/bin/bash
# Replaces specific styling sections in the WeeklyFinanceReport to match the Excel closely

# 1. Update the main table headers to have specific widths and background colors according to the screenshot
sed -i '' 's/<tr className="bg-gray-100">/<tr className="bg-white border-2 border-black">/g' components/finance/WeeklyFinanceReport.tsx

# 2. Add the Dimes Header dynamically
# We will do this via a multi_replace instead to be safer
