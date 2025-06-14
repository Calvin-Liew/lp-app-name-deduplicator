# App Name Deduplicator

A React application that helps you deduplicate and organize app names through a semi-manual review process.

## Features

- Upload a list of app names from a text or CSV file
- Automatic clustering of similar app names using fuzzy matching
- Manual selection of canonical names for each cluster
- Export results to Excel with canonical names and their variants

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

1. Prepare a text file with one app name per line
2. Click "Upload App Names" and select your file
3. Review the automatically generated clusters
4. For each cluster:
   - Select the canonical name using the radio buttons
   - Or type a custom canonical name in the text field
5. Click "Export to Excel" to download the results

## Input File Format

Create a text file with one app name per line. For example:
```
Zoom
Zoom Pro
Zoom Meetings
Microsoft Teams
MS Teams
Teams
```

## Output Format

The exported Excel file will contain two columns:
- Canonical Name: The selected standard name for each cluster
- Variants: All similar names that were grouped together 