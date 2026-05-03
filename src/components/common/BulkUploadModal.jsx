import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { parseExcelFile, validateUpload, generateOrphansTemplate, generateBeneficiariesTemplate, downloadBlob } from '../../utils/excelUpload';

const BulkUploadModal = ({ isOpen, onClose, type, onUpload, title }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile) => {
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      alert('Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file');
      return;
    }

    setFile(selectedFile);
    setValidationResult(null);
    setUploadProgress(null);

    // Parse and validate
    try {
      setUploading(true);
      const rows = await parseExcelFile(selectedFile);

      if (rows.length === 0) {
        alert('The uploaded file is empty');
        setFile(null);
        return;
      }

      // Validate all rows
      const result = validateUpload(rows, type);
      setValidationResult(result);
    } catch (error) {
      alert('Error reading file: ' + error.message);
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const blob = type === 'orphans'
      ? await generateOrphansTemplate()
      : await generateBeneficiariesTemplate();

    const filename = type === 'orphans'
      ? 'Orphans_Upload_Template.xlsx'
      : 'Beneficiaries_Upload_Template.xlsx';

    downloadBlob(blob, filename);
  };

  const handleUpload = async () => {
    if (!validationResult || !validationResult.isValid) {
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: validationResult.validData.length });

    try {
      await onUpload(validationResult.validData, (current) => {
        setUploadProgress({ current, total: validationResult.validData.length });
      });

      alert(`Successfully uploaded ${validationResult.validData.length} records!`);
      handleClose();
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleClose = () => {
    setFile(null);
    setValidationResult(null);
    setUploadProgress(null);
    setUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Upload className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">{title || 'Bulk Upload'}</h2>
                <p className="text-white/80 text-sm mt-1">
                  Upload Excel or CSV file to import multiple records at once
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="text-white/80 hover:text-white transition p-2 hover:bg-white/10 rounded-lg disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Download Template Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Step 1: Download Template</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Download the Excel template, fill in your data, and upload it back.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div>
            <h3 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              Step 2: Upload Your File
            </h3>

            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                dragActive
                  ? 'border-green-500 bg-green-50'
                  : 'border-ink-300 hover:border-green-400 hover:bg-ink-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleChange}
                className="hidden"
              />

              {!file ? (
                <>
                  <Upload className="w-16 h-16 text-ink-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-ink-700 mb-2">
                    Drag & drop your file here
                  </p>
                  <p className="text-sm text-ink-500 mb-4">
                    or click to browse (Excel or CSV files only)
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Choose File
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <FileSpreadsheet className="w-16 h-16 text-green-600 mx-auto" />
                  <div>
                    <p className="font-semibold text-ink-900">{file.name}</p>
                    <p className="text-sm text-ink-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setValidationResult(null);
                      fileInputRef.current.value = '';
                    }}
                    disabled={uploading}
                    className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    Remove File
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-4">
              <h3 className="font-semibold text-ink-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Validation Results
              </h3>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{validationResult.stats.total}</div>
                  <div className="text-sm text-blue-800">Total Rows</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{validationResult.stats.valid}</div>
                  <div className="text-sm text-green-800">Valid</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{validationResult.stats.invalid}</div>
                  <div className="text-sm text-red-800">Invalid</div>
                </div>
              </div>

              {/* Success Message */}
              {validationResult.isValid ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">Ready to Upload!</h4>
                    <p className="text-sm text-green-800">
                      All {validationResult.stats.valid} records are valid and ready to be imported.
                    </p>
                  </div>
                </div>
              ) : (
                // Errors
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">Validation Errors Found</h4>
                      <p className="text-sm text-red-800 mb-2">
                        Please fix the errors below and upload the corrected file.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 max-h-48 overflow-y-auto">
                    <ul className="space-y-1 text-sm text-red-800">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 flex-shrink-0">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="font-semibold text-blue-900">
                  Uploading... {uploadProgress.current} / {uploadProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-ink-200">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-6 py-2 border border-ink-300 text-ink-700 rounded-lg hover:bg-ink-50 transition font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!validationResult || !validationResult.isValid || uploading}
            className="px-6 py-2 bg-navy-900 text-white rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload {validationResult?.stats.valid || 0} Records
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
