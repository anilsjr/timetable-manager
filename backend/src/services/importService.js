/**
 * Import service – parse CSV/Excel/JSON and bulk-import teachers, subjects, labs.
 */
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import Lab from '../models/Lab.js';
import logger from '../utils/logger.js';

const EXCEL_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];
const CSV_MIMES = ['text/csv', 'text/plain', 'application/csv'];
const JSON_MIMES = ['application/json'];

/**
 * Detect format from mimetype or filename and parse buffer to array of row objects.
 * @param {Buffer} buffer
 * @param {string} [mimetype]
 * @param {string} [originalname] - original filename
 * @returns {{ rows: Array<Record<string, string|number>>, format: string }}
 */
export function parseFile(buffer, mimetype = '', originalname = '') {
  const ext = (originalname || '').split('.').pop()?.toLowerCase();
  const mime = (mimetype || '').toLowerCase();

  if (EXCEL_MIMES.some((x) => mime.includes(x)) || ['xlsx', 'xls'].includes(ext)) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    return { rows: normalizeHeaders(rows), format: 'excel' };
  }

  if (CSV_MIMES.some((x) => mime.includes(x)) || ext === 'csv') {
    const text = buffer.toString('utf8').trim();
    const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true });
    return { rows: normalizeHeaders(rows), format: 'csv' };
  }

  if (JSON_MIMES.some((x) => mime.includes(x)) || ext === 'json') {
    const text = buffer.toString('utf8').trim();
    const data = JSON.parse(text);
    const rows = Array.isArray(data) ? data : [data];
    return { rows: normalizeHeaders(rows), format: 'json' };
  }

  throw new Error('Unsupported file type. Use CSV, Excel (.xlsx/.xls), or JSON.');
}

/**
 * Normalize object keys: lowercase, replace spaces/underscores/dash to single underscore,
 * then map common aliases to schema field names.
 */
function normalizeHeaders(rows) {
  const alias = (key) => {
    const k = String(key)
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .replace(/_+/g, '_')
      .trim();
    const map = {
      fullname: 'full_name',
      full_name: 'full_name',
      shortname: 'short_name',
      short_name: 'short_name',
      shortabbr: 'short_abbr',
      short_abbr: 'short_abbr',
      abbreviation: 'short_abbr',
      weekly_frequency: 'weekly_frequency',
      weeklyfrequency: 'weekly_frequency',
      frequency: 'weekly_frequency',
      room_number: 'room_number',
      roomnumber: 'room_number',
      max_load_per_day: 'max_load_per_day',
      maxloadperday: 'max_load_per_day',
      max_load: 'max_load_per_day',
    };
    return map[k] || k;
  };

  return rows.map((row) => {
    const out = {};
    for (const [key, value] of Object.entries(row)) {
      if (key === undefined || key === '') continue;
      const field = alias(key);
      const v = value === '' || value === null || value === undefined ? undefined : value;
      if (typeof v === 'string' && v.trim() === '') out[field] = undefined;
      else out[field] = v;
    }
    return out;
  });
}

/**
 * Subject row: full_name, short_name, code, weekly_frequency, duration (optional).
 */
function toSubjectDoc(row) {
  const full_name = row.full_name ?? row.name;
  const short_name = row.short_name ?? row.shortname;
  const code = row.code;
  const weekly_frequency = num(row.weekly_frequency, 1);
  const duration = num(row.duration, 50);
  if (!full_name || !short_name || !code) {
    throw new Error(`Subject row missing required field: full_name, short_name, code. Got: ${JSON.stringify(row)}`);
  }
  return { full_name: String(full_name).trim(), short_name: String(short_name).trim(), code: String(code).trim(), weekly_frequency, duration };
}

/**
 * Lab row: name, short_name, code, room_number (optional), capacity (optional).
 */
function toLabDoc(row) {
  const name = row.name ?? row.full_name;
  const short_name = row.short_name ?? row.shortname ?? name;
  const code = row.code;
  const room_number = row.room_number != null ? String(row.room_number).trim() : undefined;
  const capacity = num(row.capacity, 0);
  if (!name || !code) {
    throw new Error(`Lab row missing required field: name, code. Got: ${JSON.stringify(row)}`);
  }
  return { name: String(name).trim(), short_name: String(short_name).trim(), code: String(code).trim(), room_number, capacity };
}

/**
 * Teacher row: name, short_abbr, code (optional), max_load_per_day (optional), subjects (optional comma-separated codes).
 */
function toTeacherDoc(row) {
  const name = row.name;
  const short_abbr = row.short_abbr ?? row.short_abbreviation ?? row.abbr;
  const code = row.code != null ? String(row.code).trim() : undefined;
  const max_load_per_day = row.max_load_per_day != null ? num(row.max_load_per_day, 4) : undefined;
  if (!name || !short_abbr) {
    throw new Error(`Teacher row missing required field: name, short_abbr. Got: ${JSON.stringify(row)}`);
  }
  return { name: String(name).trim(), short_abbr: String(short_abbr).trim(), code, max_load_per_day, subjectCodes: row.subjects };
}

function num(val, defaultVal) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const n = Number(val);
  return Number.isFinite(n) ? n : defaultVal;
}

/**
 * Import subjects. Returns { created, errors }.
 */
export async function importSubjects(rows) {
  const created = [];
  const errors = [];
  for (let i = 0; i < rows.length; i++) {
    try {
      const doc = toSubjectDoc(rows[i]);
      const existing = await Subject.findOne({ code: doc.code });
      if (existing) {
        errors.push({ row: i + 1, message: `Subject code already exists: ${doc.code}` });
        continue;
      }
      const subject = await Subject.create(doc);
      created.push(subject);
    } catch (e) {
      errors.push({ row: i + 1, message: e.message || String(e) });
    }
  }
  logger.info('Import subjects', { total: rows.length, created: created.length, errors: errors.length });
  return { created, errors };
}

/**
 * Import labs. Returns { created, errors }.
 */
export async function importLabs(rows) {
  const created = [];
  const errors = [];
  for (let i = 0; i < rows.length; i++) {
    try {
      const doc = toLabDoc(rows[i]);
      const existing = await Lab.findOne({ code: doc.code });
      if (existing) {
        errors.push({ row: i + 1, message: `Lab code already exists: ${doc.code}` });
        continue;
      }
      const lab = await Lab.create(doc);
      created.push(lab);
    } catch (e) {
      errors.push({ row: i + 1, message: e.message || String(e) });
    }
  }
  logger.info('Import labs', { total: rows.length, created: created.length, errors: errors.length });
  return { created, errors };
}

/**
 * Import teachers. Resolves subject codes to IDs. subjects column can be comma-separated codes.
 * Returns { created, errors }.
 */
export async function importTeachers(rows) {
  const created = [];
  const errors = [];
  const subjectByCode = new Map();
  const subjects = await Subject.find({}).lean();
  subjects.forEach((s) => subjectByCode.set(String(s.code).trim().toLowerCase(), s._id));

  for (let i = 0; i < rows.length; i++) {
    try {
      const doc = toTeacherDoc(rows[i]);
      const subjectCodes = doc.subjectCodes;
      delete doc.subjectCodes;
      let subjectIds = [];
      if (subjectCodes != null && subjectCodes !== '') {
        const codes = String(subjectCodes)
          .split(/[,;|]/)
          .map((c) => c.trim())
          .filter(Boolean);
        subjectIds = codes
          .map((c) => subjectByCode.get(c.toLowerCase()))
          .filter(Boolean);
        const missing = codes.filter((c) => !subjectByCode.has(c.toLowerCase()));
        if (missing.length) {
          logger.debug('Teacher import: unknown subject codes', { missing, row: i + 1 });
        }
      }
      doc.subjects = subjectIds;

      const existingByCode = doc.code ? await Teacher.findOne({ code: doc.code }) : null;
      if (existingByCode) {
        errors.push({ row: i + 1, message: `Teacher code already exists: ${doc.code}` });
        continue;
      }
      const teacher = await Teacher.create(doc);
      created.push(teacher);
    } catch (e) {
      errors.push({ row: i + 1, message: e.message || String(e) });
    }
  }
  logger.info('Import teachers', { total: rows.length, created: created.length, errors: errors.length });
  return { created, errors };
}
