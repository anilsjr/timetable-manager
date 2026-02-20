# Sample Data Import Files

This folder contains sample CSV and JSON files that demonstrate the correct format for importing data into the Timetable IPS system.

## Available Formats

Each import type has sample files in both formats:
- **CSV format** (`*-sample.csv`) - Comma-separated values
- **JSON format** (`*-sample.json`) - Array of objects

Both formats contain the same data and can be used interchangeably.

## Import Order

**IMPORTANT**: Import data in this specific order to maintain referential integrity:

1. **Subjects** (first) - No dependencies
2. **Labs** (second) - No dependencies
3. **Teachers** (third) - References subjects by code
4. **Classes** (fourth) - References subjects and labs by code

## File Formats

### 1. subjects-import-sample.csv

Import subjects/courses offered by the institution.

**Required Fields:**
- `full_name`: Full name of the subject (e.g., "Introduction to Computer Science")
- `short_name`: Short/abbreviated name (e.g., "Intro CS")
- `code`: Unique subject code (e.g., "CS101")

**Example:**
```csv
full_name,short_name,code
"Introduction to Computer Science",Intro CS,CS101
"Data Structures and Algorithms",DSA,CS102
```

**JSON Example:**
```json
[
  {
    "full_name": "Introduction to Computer Science",
    "short_name": "Intro CS",
    "code": "CS101"
  },
  {
    "full_name": "Data Structures and Algorithms",
    "short_name": "DSA",
    "code": "CS102"
  }
]
```

### 2. labs-import-sample.csv

Import laboratory/practical rooms.

**Required Fields:**
- `name`: Full name of the lab (e.g., "Computer Science Lab 1")
- `short_name`: Short name (e.g., "CS Lab 1")
- `code`: Unique lab code (e.g., "LAB-CS1")

**Optional Fields:**
- `room_number`: Physical room number (e.g., "101")
- `capacity`: Maximum student capacity (default: 0)

**Example:**
```csv
name,short_name,code,room_number,capacity
"Computer Science Lab 1",CS Lab 1,LAB-CS1,101,60
"Physics Lab",Physics Lab,LAB-PHY,201,40
```

### 3. teachers-import-sample.csv

Import teacher/faculty information.

**Required Fields:**
- `name`: Full name of the teacher (e.g., "Dr. Rajesh Kumar")
- `short_abbr`: Short abbreviation (e.g., "DRK")

**Optional Fields:**
- `code`: Unique teacher code (e.g., "TCH001")
- `max_load_per_day`: Maximum teaching load per day in periods (default: 4)
- `subjects`: Comma-separated subject codes the teacher can teach (e.g., "CS101,CS102,CS103")

**Example:**
```csv
name,short_abbr,code,max_load_per_day,subjects
"Dr. Rajesh Kumar",DRK,TCH001,6,"CS101,CS102,CS103"
"Prof. Anjali Sharma",PAS,TCH002,5,"MATH201,MATH202"
```

**Note:** Subject codes must exist in the database before importing teachers.

### 4. classes-import-sample.csv

Import student classes/sections.

**Required Fields:**
- `class_name`: Name of the class (e.g., "BCA", "MCA", "BSc")
- `year`: Academic year (must be 1, 2, 3, or 4)
- `section`: Section number (must be '1', '2', '3', or '4')

**Optional Fields:**
- `student_count`: Number of students in the class (default: 0)
- `subjects`: Comma-separated subject codes for this class (e.g., "CS101,MATH101,ENG101")
- `labs`: Comma-separated lab codes for this class (e.g., "LAB-CS1,LAB-DS")

**Example:**
```csv
class_name,year,section,student_count,subjects,labs
BCA,1,1,45,"CS101,MATH101,ENG101","LAB-CS1,LAB-DS"
MCA,1,1,30,"CS201,MATH301,CS103","LAB-AI,LAB-DS"
```

**Note:** 
- Subject and lab codes must exist in the database before importing classes.
- The system auto-generates a unique `code` field based on class_name, year, and section.

## How to Import

### Using API Endpoints

1. **Import Subjects:**
   ```bash
   POST /api/import/subjects
   Content-Type: multipart/form-data
   Field name: file
   File: subjects-import-sample.csv
   ```

2. **Import Labs:**
   ```bash
   POST /api/import/labs
   Content-Type: multipart/form-data
   Field name: file
   File: labs-import-sample.csv
   ```

3. **Import Teachers:**
   ```bash
   POST /api/import/teachers
   Content-Type: multipart/form-data
   Field name: file
   File: teachers-import-sample.csv
   ```

4. **Import Classes:**
   ```bash
   POST /api/import/classes
   Content-Type: multipart/form-data
   Field name: file
   File: classes-import-sample.csv
   ```

### Using Postman

1. Create a new POST request
2. Set URL to: `http://localhost:5000/api/import/subjects` (or teachers/labs/classes)
3. Go to "Body" tab
4. Select "form-data"
5. Add key "file" with type "File"
6. Choose your CSV file
7. Add Authorization header if required
8. Click "Send"

### Using cURL

```bash
# Import subjects
curl -X POST http://localhost:5000/api/import/subjects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@subjects-import-sample.csv"

# Import labs
curl -X POST http://localhost:5000/api/import/labs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@labs-import-sample.csv"

# Import teachers
curl -X POST http://localhost:5000/api/import/teachers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@teachers-import-sample.csv"

# Import classes
curl -X POST http://localhost:5000/api/import/classes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@classes-import-sample.csv"
```

## Supported File Formats

The import system accepts three file formats:

- **CSV** (.csv) - Comma-separated values (e.g., `subjects-import-sample.csv`)
- **Excel** (.xlsx, .xls) - Microsoft Excel format
- **JSON** (.json) - Array of objects (e.g., `subjects-import-sample.json`)

All sample files are provided in both CSV and JSON formats for your convenience.

## Field Name Aliases

The import system is flexible and accepts various column name formats:

- Spaces, dashes, and underscores are normalized
- Case-insensitive matching
- Common aliases are supported:
  - `fullname`, `full_name`, `Full Name` → `full_name`
  - `shortname`, `short_name`, `Short Name` → `short_name`
  - `abbreviation`, `shortabbr`, `short_abbr` → `short_abbr`
  - `roomnumber`, `room_number`, `Room Number` → `room_number`
  - etc.

## Error Handling

The import process:
- Validates each row individually
- Continues processing even if some rows fail
- Returns a summary with:
  - Total rows processed
  - Successfully created records
  - Failed rows with error messages
- Prevents duplicate codes (both within the file and in the database)
- Validates required fields before creating records

## Important Notes

1. **Encoding**: Use UTF-8 encoding for CSV files to support special characters
2. **Duplicates**: The system will reject duplicate codes and report them in errors
3. **References**: When using subject/lab codes in teachers/classes, ensure those codes exist
4. **File Size**: Maximum file size is 5 MB
5. **Authentication**: Import endpoints require admin authentication

## Example Response

```json
{
  "success": true,
  "created": 8,
  "errors": 2,
  "total": 10,
  "details": {
    "errors": [
      { "row": 3, "message": "Duplicate code in file: CS101" },
      { "row": 7, "message": "Subject row missing required field: code" }
    ]
  }
}
```
