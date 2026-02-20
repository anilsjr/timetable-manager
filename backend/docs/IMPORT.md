# Data import (Teachers, Subjects, Labs)

Import teachers, subjects, and labs from **CSV**, **Excel** (`.xlsx`/`.xls`), or **JSON** via the API.

- **Auth:** Admin only (Bearer token required).
- **Method:** `POST` with multipart form, field name: `file`.
- **Max file size:** 5 MB.

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/import/subjects` | Import subjects from file |
| `POST /api/import/teachers` | Import teachers from file |
| `POST /api/import/labs` | Import labs from file |

## Response

```json
{
  "success": true,
  "created": 5,
  "errors": 0,
  "total": 5,
  "details": { "errors": [] }
}
```

If some rows fail (e.g. duplicate code), `details.errors` lists `{ row, message }` for each.

## Duplicate and ID handling

- **Duplicate code in file:** If the same `code` appears in multiple rows (e.g. two rows with `PCC CL13` for subjects), the first row is created and later rows get an error: *"Duplicate code in file: PCC CL13"*.
- **Code already in database:** If a row’s `code` already exists in the DB, that row is skipped with: *"Subject/Lab/Teacher code already exists in database: …"*.
- **Mongoose duplicate key (11000):** If a unique index violation still occurs (e.g. race), the error is mapped to a clear message: *"Duplicate … code (in file or already in database): …"*.
- **`id` / `_id` in file:** Any `id` or `_id` column in CSV/Excel/JSON is **ignored**. New records are always created with server-generated IDs. You cannot “update by id” via import.

---

## File formats

### Subjects

| Column (any case) | Required | Description |
|-------------------|----------|-------------|
| full_name         | Yes      | Full subject name |
| short_name        | Yes      | Short name / abbreviation |
| code              | Yes      | Unique code (e.g. PCC CL13) |

**CSV example:**
```csv
full_name,short_name,code
Natural Language Processing,NLP,PCC CL13
Software Engineering,SE,PEC CL02
```

**JSON example:**
```json
[
  { "full_name": "NLP", "short_name": "NLP", "code": "PCC CL13" }
]
```

---

### Labs

| Column     | Required | Description |
|------------|----------|-------------|
| name       | Yes      | Lab name |
| code       | Yes      | Unique code |
| short_name | No       | Defaults to name |
| room_number| No       | Room number string |
| capacity   | No       | Default 0 |

**CSV example:**
```csv
name,short_name,code,room_number,capacity
NLP Lab,NLP Lab,N107,N-107,60
```

---

### Teachers

| Column           | Required | Description |
|------------------|----------|-------------|
| name             | Yes      | Full name |
| short_abbr       | Yes      | Short abbreviation (e.g. SS, PN) |
| code             | No       | Unique code |
| max_load_per_day | No       | Max slots per day |
| subjects         | No       | Comma-/semicolon-separated **subject codes** (resolved to IDs) |

**CSV example:**
```csv
name,short_abbr,code,max_load_per_day,subjects
Mr. John Doe,JDOE,10,4,PCC CL13;PEC CL02
```

Import subjects first so teacher `subjects` codes can be resolved.
