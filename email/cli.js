#!/usr/bin/env node

const parse = require('./parse');
const send = require('./send');
const path = require('path');

let argv = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command('generate', 'Parse markdown and generate email from template')
  .command('send', 'Send generated email')
  .command('start', 'Generate and send email')
  .describe('f', 'Load a source file of the post')
  .describe('s', 'Specific issue Subject of the Email')
  .describe('i', 'Specific GitHub issue number of the Email')
  .describe('e', 'Specific editors, must use half-width comma divider. eg. "John,Doe"')
  .describe('to', 'Specific receiver TO')
  .describe('bcc', 'Specific receiver BCC')
  .demandOption(['f', 's', 'i', 'e'])
  .help('h')
  .argv

let file = argv.f;
let subject = argv.s;
let issue_number = argv.i;
let editors = argv.e;
let to = argv.to;
let bcc = argv.bcc;
let action = argv._[0];

if (action === 'start') {
  parse(file, subject, issue_number, editors)
    .then(html => {
      send(to, bcc,subject, html)
    })
}

if (action === 'send') {
  let html = require('fs').readFileSync(path.resolve(__dirname, './email.html'))
  send(to, bcc,subject, html)
}


if (action === 'generate') {
  parse(file, subject, issue_number, editors)
}
