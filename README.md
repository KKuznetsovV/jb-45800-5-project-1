# Expense Tracking System

A multi-page frontend web application for tracking personal expenses directly in the browser. The app supports creating, editing, deleting, filtering, charting, and exporting expenses without a backend.

## Features

- Add new expense records with type, description, amount, and date
- Update existing expenses from the main table
- Delete expenses with a confirmation prompt
- Store all records in browser local storage
- Filter expenses by year, month, and day
- Visualize spending by category (pie chart)
- Visualize spending by month (bar chart)
- Export data to CSV
- Export reports to PDF

## Tech Stack

- HTML5
- CSS3
- TypeScript (compiled to browser JavaScript)
- Chart.js (for charts)
- jsPDF + jsPDF AutoTable (for PDF export)
- Browser localStorage (data persistence)

## Project Structure

```
.
|- about.html
|- charts.html
|- filters.html
|- home.html
|- style.css
|- package.json
|- tsconfig.json
|- src/
|  |- app.ts
|- dist/
|  |- app.js
```

### Run the App

This project is static (no backend server required). After building:

1. Open `home.html` in your browser.
2. Use the top menu to navigate to Filters, Charts, and About pages.

Tip: A local static server is recommended for a smoother development flow.

## Pages

- `home.html`: Add/edit/delete expenses and view summary stats
- `filters.html`: Filter expenses by date components and view filtered results
- `charts.html`: Display pie and histogram charts, export CSV/PDF
- `about.html`: Project and developer information

## Notes

- Data is stored per browser in local storage and is not shared across devices.
- Chart and export libraries are loaded from CDN on the charts page.
- The code currently uses the identifier `expense` in several places; this reflects the current implementation naming.

