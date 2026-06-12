#!/usr/bin/env node
/**
 * Translation coverage validator + reporter.
 *
 * Validate (CI / lint — exits 1 on any problem):
 *   node scripts/check-locales.js
 * Report (human-readable coverage table, always exits 0):
 *   node scripts/check-locales.js --report
 *
 * Rules enforced against the reference locale (en):
 *  - every locale has the same namespace files
 *  - every namespace has exactly the same key set in every locale
 *  - no empty-string values
 *  - interpolation placeholders ({{var}}) must match the reference
 */
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'public', 'locales');
const REFERENCE = 'en';
const REPORT_MODE = process.argv.includes('--report');

const flatten = (obj, prefix = '') =>
	Object.entries(obj).reduce((acc, [key, value]) => {
		const full = prefix ? `${prefix}.${key}` : key;
		if (value !== null && typeof value === 'object') Object.assign(acc, flatten(value, full));
		else acc[full] = value;
		return acc;
	}, {});

const placeholders = (str) =>
	(typeof str === 'string' ? str.match(/\{\{\s*[\w.]+\s*\}\}/g) || [] : [])
		.map((p) => p.replace(/\s/g, ''))
		.sort()
		.join(',');

const locales = fs
	.readdirSync(LOCALES_DIR)
	.filter((d) => fs.statSync(path.join(LOCALES_DIR, d)).isDirectory());

if (!locales.includes(REFERENCE)) {
	console.error(`Reference locale "${REFERENCE}" not found in ${LOCALES_DIR}`);
	process.exit(1);
}

const namespaces = fs
	.readdirSync(path.join(LOCALES_DIR, REFERENCE))
	.filter((f) => f.endsWith('.json'))
	.map((f) => f.replace(/\.json$/, ''));

const problems = [];
const report = [];

const load = (locale, ns) => {
	const file = path.join(LOCALES_DIR, locale, `${ns}.json`);
	if (!fs.existsSync(file)) return null;
	try {
		return JSON.parse(fs.readFileSync(file, 'utf8'));
	} catch (e) {
		problems.push(`${locale}/${ns}.json: invalid JSON — ${e.message}`);
		return null;
	}
};

for (const ns of namespaces) {
	const ref = flatten(load(REFERENCE, ns) ?? {});
	const refKeys = Object.keys(ref);

	for (const locale of locales) {
		if (locale === REFERENCE) {
			// reference still gets the empty-value check
			for (const key of refKeys) {
				if (ref[key] === '') problems.push(`${locale}/${ns}.json: "${key}" is an empty string`);
			}
			continue;
		}

		const data = load(locale, ns);
		if (data === null) {
			problems.push(`${locale}/${ns}.json: file missing`);
			report.push({ locale, ns, translated: 0, total: refKeys.length });
			continue;
		}
		const flat = flatten(data);

		const missing = refKeys.filter((k) => !(k in flat));
		const extra = Object.keys(flat).filter((k) => !(k in ref));
		const empty = refKeys.filter((k) => flat[k] === '');
		const badVars = refKeys.filter((k) => k in flat && placeholders(flat[k]) !== placeholders(ref[k]));

		missing.forEach((k) => problems.push(`${locale}/${ns}.json: missing key "${k}"`));
		extra.forEach((k) => problems.push(`${locale}/${ns}.json: extra key "${k}" (not in ${REFERENCE})`));
		empty.forEach((k) => problems.push(`${locale}/${ns}.json: "${k}" is an empty string`));
		badVars.forEach((k) =>
			problems.push(`${locale}/${ns}.json: "${k}" placeholders differ from ${REFERENCE} (${placeholders(ref[k]) || 'none'})`),
		);

		report.push({ locale, ns, translated: refKeys.length - missing.length - empty.length, total: refKeys.length });
	}
}

if (REPORT_MODE) {
	console.log(`\nTranslation coverage (reference: ${REFERENCE})\n`);
	const pad = (s, n) => String(s).padEnd(n);
	console.log(pad('namespace', 14) + locales.filter((l) => l !== REFERENCE).map((l) => pad(l, 12)).join(''));
	for (const ns of namespaces) {
		const cells = locales
			.filter((l) => l !== REFERENCE)
			.map((l) => {
				const row = report.find((r) => r.locale === l && r.ns === ns);
				if (!row) return pad('-', 12);
				const pct = row.total === 0 ? 100 : Math.round((row.translated / row.total) * 100);
				return pad(`${row.translated}/${row.total} ${pct}%`, 12);
			});
		console.log(pad(ns, 14) + cells.join(''));
	}
	const totals = locales
		.filter((l) => l !== REFERENCE)
		.map((l) => {
			const rows = report.filter((r) => r.locale === l);
			const done = rows.reduce((a, r) => a + r.translated, 0);
			const total = rows.reduce((a, r) => a + r.total, 0);
			return pad(`${done}/${total} ${total === 0 ? 100 : Math.round((done / total) * 100)}%`, 12);
		});
	console.log(pad('TOTAL', 14) + totals.join(''));
	if (problems.length) console.log(`\n${problems.length} problem(s) — run without --report for details`);
	process.exit(0);
}

if (problems.length) {
	console.error(`Translation check FAILED — ${problems.length} problem(s):\n`);
	problems.forEach((p) => console.error('  ✗ ' + p));
	console.error('\nEvery key must exist in all locales (en is the reference). See AGENTS.md → i18n.');
	process.exit(1);
}
console.log(`Translation check passed: ${namespaces.length} namespaces × ${locales.length} locales in sync.`);
