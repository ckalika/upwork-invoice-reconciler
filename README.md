# Upwork Invoice Reconciler
A quickhack Node.js script for renaming Upwork Invoices based on an accompanying CSV file.

## Overview
This script is hardcoded with April as the cutoff for an accounting period as that's what I use and it's common in the UK (where I'm based).

Feel free to do with it what you will. It's not meant to be beautiful code, I just needed something to be able to more easily hand my invoices over to my accountants, so pairing this with drive syncing, a shell script to move the copied files, and/or [Alfred](https://www.alfredapp.com/) makes life significantly easier.

## Dependencies
This project used Glob to do file pattern matching in subdirectories.

## Setup
```shell
$ npm install # This will install Glob which is the only requirement
```

## Usage
Visit [https://www.upwork.com/ab/payments/reports/transaction-history](https://www.upwork.com/ab/payments/reports/transaction-history) and download the relevant invoice and CSV files. Extract the zip files and copy the CSV file into the directory you want to run in, then run the following.

```shell
# Extract your invoice zip files in the directory you're running in.
# Copy your Statement CSV File
$ node reconcile.js <Statement CSV File>
```


Licensed under [WTFPL](https://en.wikipedia.org/wiki/WTFPL) & [MIT](https://opensource.org/licenses/MIT) (for those of you who care about such things.)
