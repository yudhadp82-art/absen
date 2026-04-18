const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * xlsx-reader.js
 * Tool for Antigravity AI to read Excel files in the workspace.
 * Usage: node scripts/xlsx-reader.js "path/to/file.xlsx" [sheetName]
 */

const filePath = process.argv[2];
const targetSheet = process.argv[3];

if (!filePath) {
    console.error('Error: Please provide a file path.');
    console.error('Usage: node scripts/xlsx-reader.js "path/to/file.xlsx" [sheetName]');
    process.exit(1);
}

const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found at ${absolutePath}`);
    process.exit(1);
}

try {
    const workbook = XLSX.readFile(absolutePath);
    const sheetNames = workbook.SheetNames;
    
    const result = {
        sheets: sheetNames,
        data: {}
    };

    if (targetSheet) {
        if (!sheetNames.includes(targetSheet)) {
            console.error(`Error: Sheet "${targetSheet}" not found. Available sheets: ${sheetNames.join(', ')}`);
            process.exit(1);
        }
        result.data[targetSheet] = XLSX.utils.sheet_to_json(workbook.Sheets[targetSheet], { defval: '' });
    } else {
        // Default to first sheet
        const firstSheet = sheetNames[0];
        result.data[firstSheet] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
    }

    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    console.error(`Error reading Excel file: ${error.message}`);
    process.exit(1);
}
