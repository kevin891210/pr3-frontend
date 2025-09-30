import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import { Upload, Download, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CsvImportModal = ({ 
  open, 
  onOpenChange, 
  brands, 
  workspaceMembers, 
  shiftTemplates, 
  onBrandChange, 
  onSubmit 
}) => {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [csvData, setCsvData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef(null);

  const csvTemplate = `member_id,member_name,date,shift_template_id,shift_template_name
user123,John Doe,2025-01-20,template1,Morning Shift
user456,Jane Smith,2025-01-20,template2,Evening Shift
user123,John Doe,2025-01-21,template1,Morning Shift`;

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file must contain at least a header row and one data row.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const expectedHeaders = ['member_id', 'member_name', 'date', 'shift_template_id', 'shift_template_name'];
      
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        alert(`Missing required headers: ${missingHeaders.join(', ')}`);
        return;
      }

      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        row.rowIndex = index + 2; // +2 because we start from line 2 (after header)
        return row;
      });

      setCsvData(data);
      validateCsvData(data);
    };

    reader.readAsText(file);
  };

  const validateCsvData = (data) => {
    setIsValidating(true);
    const results = [];

    data.forEach((row, index) => {
      const errors = [];
      const warnings = [];

      // Validate required fields
      if (!row.member_id) errors.push('Member ID is required');
      if (!row.date) errors.push('Date is required');
      if (!row.shift_template_id) errors.push('Shift Template ID is required');

      // Validate date format
      if (row.date && isNaN(new Date(row.date))) {
        errors.push('Invalid date format (use YYYY-MM-DD)');
      }

      // Validate member exists
      if (row.member_id && !workspaceMembers.find(m => m.id === row.member_id)) {
        warnings.push('Member ID not found in selected brand');
      }

      // Validate template exists
      if (row.shift_template_id && !shiftTemplates.find(t => t.id === row.shift_template_id)) {
        warnings.push('Shift Template ID not found');
      }

      // Check for duplicate assignments (same member, same date)
      const duplicates = data.filter((otherRow, otherIndex) => 
        otherIndex !== index && 
        otherRow.member_id === row.member_id && 
        otherRow.date === row.date
      );
      if (duplicates.length > 0) {
        errors.push('Duplicate assignment for same member on same date');
      }

      results.push({
        rowIndex: row.rowIndex,
        data: row,
        errors,
        warnings,
        isValid: errors.length === 0
      });
    });

    setValidationResults(results);
    setIsValidating(false);
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = () => {
    if (!selectedBrand) {
      alert('Please select a brand first.');
      return;
    }

    const validRows = validationResults.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows to import.');
      return;
    }

    const assignments = validRows.map(result => ({
      member_id: result.data.member_id,
      shift_template_id: result.data.shift_template_id,
      date: result.data.date
    }));

    onSubmit(assignments);
  };

  const handleReset = () => {
    setCsvData([]);
    setValidationResults([]);
    setSelectedBrand('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = validationResults.filter(r => r.isValid).length;
  const errorCount = validationResults.filter(r => !r.isValid).length;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Import Schedule from CSV"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReset} variant="outline">
            Reset
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={validCount === 0}
          >
            Import {validCount} Valid Assignments
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Brand Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Brand *</label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              onBrandChange(e.target.value);
              // Re-validate if we have data
              if (csvData.length > 0) {
                validateCsvData(csvData);
              }
            }}
            required
          >
            <option value="">Select Brand</option>
            {brands.filter(brand => brand.is_active).map(brand => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </div>

        {/* Template Download */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CSV Template</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Download the CSV template to ensure your file has the correct format.
            </p>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
              <strong>Required columns:</strong>
              <ul className="mt-2 space-y-1">
                <li>• <code>member_id</code> - The member's unique ID</li>
                <li>• <code>member_name</code> - The member's display name (for reference)</li>
                <li>• <code>date</code> - Assignment date (YYYY-MM-DD format)</li>
                <li>• <code>shift_template_id</code> - The shift template ID</li>
                <li>• <code>shift_template_name</code> - The shift template name (for reference)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-3">
                Click to select a CSV file or drag and drop
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedBrand}
              >
                Select CSV File
              </Button>
              {!selectedBrand && (
                <p className="text-xs text-red-500 mt-2">Please select a brand first</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Validation Results */}
        {validationResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Validation Results
                {isValidating && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{validCount} Valid</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <X className="w-4 h-4" />
                  <span>{errorCount} Errors</span>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {validationResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded border ${
                      result.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        Row {result.rowIndex}: {result.data.member_name} - {result.data.date}
                      </span>
                      {result.isValid ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    
                    {result.errors.length > 0 && (
                      <div className="text-sm text-red-600">
                        <strong>Errors:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {result.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.warnings.length > 0 && (
                      <div className="text-sm text-yellow-600">
                        <strong>Warnings:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {result.warnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default CsvImportModal;