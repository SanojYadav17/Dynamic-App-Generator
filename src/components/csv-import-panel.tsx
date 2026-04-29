'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';

type ColumnMapping = Record<string, string>;

type CSVImportData = {
  headers: string[];
  rows: Record<string, string>[];
};

export function CSVImportPanel() {
  const [csvData, setCSVData] = useState<CSVImportData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'complete'>('upload');
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        if (data.length === 0) {
          setMessage('No data found in CSV file');
          return;
        }

        const headers = Object.keys(data[0]);
        setCSVData({
          headers,
          rows: data
        });

        // Initialize mapping
        const mapping: ColumnMapping = {};
        headers.forEach((header) => {
          mapping[header] = header;
        });
        setColumnMapping(mapping);
        setStep('map');
        setMessage('');
      },
      error: (error) => {
        setMessage(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const handleImport = async () => {
    if (!csvData) return;

    setImporting(true);
    try {
      const response = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: csvData.headers,
          rows: csvData.rows,
          mapping: columnMapping
        })
      });

      if (!response.ok) throw new Error('Import failed');

      const result = await response.json();
      setMessage(`Successfully imported ${result.imported || csvData.rows.length} rows`);
      setStep('complete');
    } catch (error) {
      setMessage(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setCSVData(null);
    setColumnMapping({});
    setStep('upload');
    setMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 space-y-4">
      <h3 className="font-semibold text-lg">CSV Import</h3>

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Choose CSV File
            </button>
            <p className="text-sm text-gray-600 mt-2">or drag and drop</p>
          </div>
        </div>
      )}

      {/* Column Mapping Step */}
      {step === 'map' && csvData && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Map CSV columns to database fields</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {csvData.headers.map((header) => (
              <div key={header} className="flex gap-2">
                <label className="w-1/3 text-sm font-medium">{header}</label>
                <input
                  type="text"
                  value={columnMapping[header] || ''}
                  onChange={(e) =>
                    setColumnMapping({
                      ...columnMapping,
                      [header]: e.target.value
                    })
                  }
                  className="w-2/3 px-3 py-2 border border-gray-300 rounded"
                  placeholder="Field name"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep('preview')}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Next: Preview
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && csvData && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Preview: First 5 rows</p>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  {csvData.headers.map((header) => (
                    <th key={header} className="px-2 py-1 text-left">
                      {columnMapping[header] || header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.rows.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    {csvData.headers.map((header) => (
                      <td key={header} className="px-2 py-1">
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-600">
            Total rows: {csvData.rows.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded"
            >
              {importing ? 'Importing...' : 'Import Data'}
            </button>
            <button
              onClick={() => setStep('map')}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <div className="space-y-4 text-center">
          <div className="text-green-600 text-4xl">✓</div>
          <p className="text-green-600 font-semibold">Import Completed!</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Import Another File
          </button>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`px-4 py-2 rounded text-sm ${
          message.includes('error') || message.includes('Error')
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
