const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Check arguments.
if (process.argv.length < 3) {
  console.log("You must specify a statements CSV file for reference.");
  console.log(`eg. node ${path.basename(process.argv[1])} ./statements_2020-03-01_2021-10-03.csv`)
  process.exit();
}

// Parse Lines
let lines = fs.readFileSync(process.argv[2]).toString()
  .replace(/\r/g, '').split('\n')
  .map(a => a.trim().length > 0 ? a : null)
  .filter(a => a)

// Get Headers
const headers = lines.shift().split(',')

// Initialize New CSV File (Indexed with new names)
const newCSVLines = [];

// Set Base Folder
const baseFolder = "./fixed";

// Directory for Period not found. Create it.
if (!fs.existsSync(baseFolder)) {
  fs.mkdirSync(baseFolder);
}

lines.forEach(line => {
  const originalLine = line;
  const lineData = {}

  // First entry is a quoted date stamp so this so skips it.
  let values = [ line.substr(0, line.indexOf(",", line.indexOf(",") + 2)) ]

  // Initialize Current Value
  let currentValue = "";
  line.substr(values[0].length + 1)
    .split(",")
    .forEach((v) => {
      if (v.substr(0, 1) === '"') {
        currentValue = v.substr(1);
        return;
      }

      if (v.substr(v.length - 1) === '"') {
        currentValue += v.substr(0, v.length - 1);
        values.push(v);
        currentValue = "";
        return;
      }

      if (currentValue !== "") {
        currentValue += v;
      } else {
        values.push(v);
      }
    })

  // Get Values
  values.forEach((v, i) => {
    lineData[headers[i]] = v.substr(0, 60).replace(/\"/g, '');
  });

  // See if we have a corresponding Invoice file
  let invoiceFiles = glob.sync(`./**/T${lineData['Ref ID']}.pdf`);
  lineData['Team'] = lineData['Team'] === "Stoked Ventures Limited" ? "Freddie Tilbrook" : lineData['Team'];

  // Withdrawals and VAT don't have corresponding invoices
  if (invoiceFiles.length === 0 && (lineData['Type'].indexOf("Withdrawal") === -1) && (lineData['Type'] !== "VAT")) {
    console.log(`No invoice could be found for T${lineData['Ref ID']}. Have you unzipped your invoice files in this directory?`);
  } else {

    // Convert Date
    const entryDate = new Date(Date.parse(lineData['Date']));

    // Calculate Period (before April is the year before)
    const accountingPeriod = (entryDate.getMonth() < 3) ? entryDate.getFullYear() - 1 : entryDate.getFullYear();
    const periodFolder = `${baseFolder}/${accountingPeriod}`;

    let entryType, subType = "";
    switch (lineData['Type'].toLowerCase()) {
      case "hourly":
      case "fixed price":
        entryType = "Income";
        break;

      case "withdrawal fee":
      case "withdrawal":
        // entryType = "Withdrawal";
        newCSVLines.push(`"${accountingPeriod}",${line},"No corresponding invoice"`);
        return;
        break;

      case "refund":
        entryType = "Refund";
        break;

      case "membership fee":
      case "service fee":
      case "payment":
        entryType = "Expense";
        subType = "Upwork Fee";
        break;

      case "vat":
        newCSVLines.push(`"${accountingPeriod}",${line},"No corresponding invoice"`);
        return;

    }

    // Directory for Period not found. Create it.
    if (!fs.existsSync(periodFolder)) {
      fs.mkdirSync(periodFolder);
    }

    // Format the Date String for Easy Searching
    const dateString = `${entryDate.getFullYear()}${(entryDate.getMonth() + 1).toString().padStart(2, "0")}${(entryDate.getDate()).toString().padStart(2, "0")}`;

    // Get the absolute value of the amount
    const amount = Math.abs(parseFloat(lineData['Amount']));

    // @ERROR: This should never happen.
    if (isNaN(amount) || (!invoiceFiles[0])) {
      console.log(lineData['Amount'], lineData, originalLine);
      process.exit();
    }

    // Determine New File Name
    const newName = `${periodFolder}/${dateString} - T${lineData['Ref ID']} - ${entryType} ${subType.trim().length > 0 ? "- " + subType : ""} - \$${amount.toFixed(2)}${lineData['Team'].trim().length > 0 ? " - " + lineData['Team'] : ""} - ${lineData['Description'].replace(/\//g, "-")}.pdf`;

    // We're missing this file. Write it.
    if (!fs.existsSync(newName)) {
      fs.copyFileSync(invoiceFiles[0], newName);
    }

    // Add Line to CSV File
    newCSVLines.push(`"${accountingPeriod}",${line},"${accountingPeriod}/${path.basename(newName)}"`);
  }
});

// Write New CSV File
fs.writeFileSync(`${baseFolder}/upwork-invoices.csv`, newCSVLines.join("\n"));
