import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import * as classApi from '../services/classApi';
import * as exportApi from '../services/exportApi';

export default function ExportTimetables() {
  const [classes, setClasses] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [format, setFormat] = useState('excel');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await classApi.getClasses({ page: 1, limit: 200 });
      setClasses(res.data || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      toast.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleClassToggle = (classId) => {
    setSelectedClassIds(prev => 
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classes.map(c => c._id));
    }
  };

  const handleExport = async () => {
    if (selectedClassIds.length === 0) {
      toast.error('Please select at least one class to export');
      return;
    }

    setExporting(true);
    try {
      await exportApi.exportBulkTimetables(selectedClassIds, format);
      toast.success(`${selectedClassIds.length} timetable(s) exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.error || 'Failed to export timetables');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading classes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Timetables</h1>
          <p className="text-gray-600">Export timetables for multiple classes in bulk</p>
        </div>
      </div>

      {/* Export Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Configuration</h2>
        
        {/* Step 1: Select Classes */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-medium text-gray-800">Step 1: Select Classes</h3>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedClassIds.length === classes.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          {classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No classes found. Please add classes first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {classes.map((classItem) => (
                <label
                  key={classItem._id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedClassIds.includes(classItem._id)}
                    onChange={() => handleClassToggle(classItem._id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {classItem.code || `${classItem.class_name}-${classItem.year}${classItem.section}`}
                  </span>
                </label>
              ))}
            </div>
          )}
          
          {selectedClassIds.length > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              {selectedClassIds.length} class{selectedClassIds.length !== 1 ? 'es' : ''} selected
            </div>
          )}
        </div>

        {/* Step 2: Export Type */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-3">Step 2: Select Export Format</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="excel"
                checked={format === 'excel'}
                onChange={(e) => setFormat(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Excel (.xlsx)</span>
              </div>
              <span className="text-xs text-gray-500">- Each class in separate worksheet</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={format === 'pdf'}
                onChange={(e) => setFormat(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">PDF (.pdf)</span>
              </div>
              <span className="text-xs text-gray-500">- Each class on separate page</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="text-sm font-medium text-gray-700">JSON (.json)</span>
              </div>
              <span className="text-xs text-gray-500">- Structured data for integrations</span>
            </label>
          </div>
        </div>

        {/* Step 3: Export Button */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-3">Step 3: Export</h3>
          <button
            onClick={handleExport}
            disabled={selectedClassIds.length === 0 || exporting}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedClassIds.length === 0 || exporting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {exporting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Selected Timetables</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <h4 className="font-medium mb-1">Export Information</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Excel:</strong> Each class will be exported in a separate worksheet within a single Excel file.</li>
              <li>• <strong>PDF:</strong> Each class will be displayed on a separate page within a single PDF file.</li>
              <li>• <strong>JSON:</strong> Structured data format with all classes in a single file, perfect for API integrations.</li>
              <li>• All exports include institute name, class information, break/lunch periods, and generation timestamp.</li>
              <li>• Only admin users can export timetables for security purposes.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}