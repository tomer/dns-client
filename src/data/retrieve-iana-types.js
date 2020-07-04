#!node

const fetch = require('node-fetch');
const csvParse = require('csv-parse/lib/sync')
const fs = require('fs');

// https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-4
const url = 'https://www.iana.org/assignments/dns-parameters/dns-parameters-4.csv';
const filename = 'iana-types.json';

function parseCSV(input) {
  const data = {};
  const records = (csvParse(input, {
    columns: true,
    skip_empty_lines: true
  }));
  for (const record of records)
    data[record.Value] = record;
  console.log(data);
  fs.writeFile(filename, JSON.stringify(data), err => {
    if (err) return console.log(err);
    console.log(`file ${filename} has been written`);
  });
  return data;
}

fetch(url)
  .then(res => res.text())
  .then(body => parseCSV(body));
