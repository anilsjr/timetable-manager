import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { uploadImportFile } from '../services/importApi';

const IMPORT_TYPES = [
  { value: 'subjects', label: 'Subjects' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'labs', label: 'Labs' },
  { value: 'classes', label: 'Classes' },
];

const ACCEPT = '.csv,.xlsx,.xls,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export default function Import() {
  const [importType, setImportType] = useState('subjects');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await uploadImportFile(importType, file);
      setResult(data);
      if (data.errors === 0 && data.created > 0) {
        toast.success(`Imported ${data.created} ${importType} successfully`);
      } else if (data.created > 0) {
        toast.success(`Imported ${data.created}; ${data.errors} row(s) had errors`);
      } else if (data.errors > 0) {
        toast.error(`No rows imported. ${data.errors} error(s).`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Import failed';
      toast.error(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Import Data</h1>
      <p className="text-gray-600 mb-6">
        Upload a CSV, Excel (.xlsx/.xls), or JSON file to import Subjects, Teachers, Labs, or Classes. Ensure columns match the expected format.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Import type</label>
          <select
            value={importType}
            onChange={(e) => { setImportType(e.target.value); setResult(null); }}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {IMPORT_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
          />
          {file && (
            <p className="mt-1 text-sm text-gray-500">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !file}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing…' : 'Import'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Result</h2>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>Total rows: <strong>{result.total}</strong></li>
            <li>Created: <strong className="text-green-700">{result.created}</strong></li>
            <li>Errors: <strong className={result.errors ? 'text-red-600' : ''}>{result.errors}</strong></li>
          </ul>
          {result.details?.errors?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Row errors</h3>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1 max-h-48 overflow-y-auto">
                {result.details.errors.map((err, i) => (
                  <li key={i}>Row {err.row}: {err.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-gray-700">
        <h3 className="font-medium text-gray-800 mb-2">Expected columns</h3>
        <p className="space-x-1">
          {importType === 'subjects' && (
            <>Subjects: <code className="bg-white px-1 rounded">full_name</code>, <code className="bg-white px-1 rounded">short_name</code>, <code className="bg-white px-1 rounded">code</code></>
          )}
          {importType === 'teachers' && (
            <>Teachers: <code className="bg-white px-1 rounded">name</code>, <code className="bg-white px-1 rounded">short_abbr</code>, <code className="bg-white px-1 rounded">code</code>, <code className="bg-white px-1 rounded">max_load_per_day</code>, <code className="bg-white px-1 rounded">subjects</code> (comma-separated subject codes). Import subjects first.</>
          )}
          {importType === 'labs' && (
            <>Labs: <code className="bg-white px-1 rounded">name</code>, <code className="bg-white px-1 rounded">short_name</code>, <code className="bg-white px-1 rounded">code</code>, <code className="bg-white px-1 rounded">room_number</code>, <code className="bg-white px-1 rounded">capacity</code></>
          )}
          {importType === 'classes' && (
            <>Classes: <code className="bg-white px-1 rounded">class_name</code>, <code className="bg-white px-1 rounded">year</code> (1-4), <code className="bg-white px-1 rounded">section</code> ('1'-'4'), <code className="bg-white px-1 rounded">student_count</code>, <code className="bg-white px-1 rounded">subjects</code> (comma-separated codes), <code className="bg-white px-1 rounded">labs</code> (comma-separated codes). Import subjects and labs first.</>
          )}
        </p>
      </div>
    </div>
  );
}
