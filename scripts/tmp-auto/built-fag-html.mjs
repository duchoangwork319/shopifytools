#!/usr/bin/env node
// built-fag-html.mjs
// Temporary automation script (not part of the admin CLI architecture):
// converts the raw FAQ text in the 2nd column of a CSV (handle, raw FAQ
// text) into the same FAQ HTML structure used by the `.c5dla-seo-guide__faq`
// section in 5dla-data/pages/fusion-cycling-guide.html, then overwrites the
// CSV's 2nd column - and the CSV file itself - with the generated HTML.
import { Command } from 'commander';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Papa from 'papaparse';
import { minify } from 'html-minifier-terser';

const HEADING_ID = 'c5dla-cycling-faq-heading';

// Numbered question lines look like "1. What features..." or "1) ...".
const QUESTION_LINE = /^\s*\d+[.)]\s*(.+)$/;

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Writes `raw` to a tmp file and reads it back line by line, grouping them
// into { question, answer } pairs: a line starting with "N." or "N)" is a
// question, and the non-empty line(s) that follow it (until the next
// question line or the end of the content) are its answer.
function parseFaqPairs(raw) {
  const tmpFile = path.join(os.tmpdir(), `faq-raw-${crypto.randomUUID()}.txt`);
  fs.writeFileSync(tmpFile, raw, 'utf8');
  const lines = fs.readFileSync(tmpFile, 'utf8').split(/\r?\n/);
  fs.rmSync(tmpFile, { force: true });

  const pairs = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(QUESTION_LINE);

    if (match) {
      if (current) pairs.push(current);
      current = { question: match[1].trim(), answerLines: [] };
    } else if (trimmed && current) {
      current.answerLines.push(trimmed);
    }
  }
  if (current) pairs.push(current);

  return pairs.map(({ question, answerLines }) => ({ question, answer: answerLines.join(' ') }));
}

// Renders one row's raw FAQ text into the `.c5dla-seo-guide__faq` section
// markup, matching fusion-cycling-guide.html's structure. The heading
// always reads "FAQ", per spec, rather than a custom question.
export function buildFaqHtml(raw) {
  const pairs = parseFaqPairs(raw);

  const items = pairs
    .map(({ question, answer }) => (
      '        <details class="c5dla-seo-guide__faq-item">\n' +
      `          <summary>${escapeHtml(question)}<span class="c5dla-seo-guide__faq-icon" aria-hidden="true">+</span></summary>\n` +
      `          <p class="c5dla-seo-guide__faq-answer">${escapeHtml(answer)}</p>\n` +
      '        </details>'
    ))
    .join('\n');

  return (
    `    <section class="c5dla-seo-guide__faq" aria-labelledby="${HEADING_ID}">\n` +
    `      <h2 id="${HEADING_ID}" class="c5dla-seo-guide__section-heading">FAQ</h2>\n` +
    '      <div class="c5dla-seo-guide__faq-list">\n' +
    `${items}\n` +
    '      </div>\n' +
    '    </section>'
  );
}

const program = new Command();
program
  .name('built-fag-html')
  .description("Converts a CSV's raw FAQ column into .c5dla-seo-guide__faq HTML, in place.")
  .argument('<csvPath>', 'path to the handle/FAQ CSV file')
  .action(async (csvPath) => {
    const csvFile = path.resolve(csvPath);
    if (!fs.existsSync(csvFile)) {
      console.error(`Missing CSV file: ${csvFile}`);
      process.exitCode = 1;
      return;
    }

    const parsed = Papa.parse(fs.readFileSync(csvFile, 'utf8'), { skipEmptyLines: true });
    if (parsed.errors.length) {
      console.error('CSV parse errors:', JSON.stringify(parsed.errors, null, 2));
      process.exitCode = 1;
      return;
    }

    const [header, ...rows] = parsed.data;
    const converted = [];
    for (const [handle, raw] of rows) {
      console.log(`Building FAQ HTML for "${handle}"...`);
      const html = buildFaqHtml(raw ?? '');
      const minified = await minify(html, {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: true,
      });
      converted.push([handle, minified]);
    }

    const csv = Papa.unparse([header, ...converted]);
    const outputFile = path.resolve(path.dirname(csvFile), `converted_${path.basename(csvFile)}`);
    fs.writeFileSync(outputFile, csv, 'utf8');
    console.log(`Saved ${converted.length} row(s) to ${outputFile}`);
  });

program.parseAsync(process.argv);
