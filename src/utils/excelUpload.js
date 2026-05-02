// Lazy-loaded XLSX (~600KB) — only pulled in when an upload/template feature runs.
let _xlsxPromise = null;
const loadXLSX = () => (_xlsxPromise ??= import('xlsx'));

/**
 * Parse Excel or CSV file to JSON
 * @param {File} file - The uploaded file
 * @returns {Promise<Array>} - Array of row objects
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const XLSX = await loadXLSX();
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false, // Don't use raw values (keep formatted dates, etc.)
          defval: '', // Default value for empty cells
        });

        resolve(jsonData);
      } catch (error) {
        reject(new Error('Failed to parse file: ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Generate Excel template for Orphans
 * @returns {Blob} - Excel file blob
 */
export const generateOrphansTemplate = async () => {
  const XLSX = await loadXLSX();
  const headers = [
    'Full Name *',
    'Date of Birth (YYYY-MM-DD) *',
    'Gender (Male/Female) *',
    'Guardian Name *',
    'Guardian NIC *',
    'Contact Number *',
    'Address *',
    'District *',
    'DS Division *',
    'GN Division',
    'School Name',
    'Current Grade',
    'Stipend Amount',
    'Donor',
    'Latitude',
    'Longitude',
    'Notes'
  ];

  const sampleData = [
    {
      'Full Name *': 'Example: Mohamed Ali',
      'Date of Birth (YYYY-MM-DD) *': '2015-05-15',
      'Gender (Male/Female) *': 'Male',
      'Guardian Name *': 'Fatima Ali',
      'Guardian NIC *': '197812345678',
      'Contact Number *': '0771234567',
      'Address *': 'No. 123, Main Street',
      'District *': 'Colombo',
      'DS Division *': 'Colombo',
      'GN Division': 'Example GN',
      'School Name': 'Example School',
      'Current Grade': '5',
      'Stipend Amount': '5000',
      'Donor': 'Example Donor',
      'Latitude': '6.9271',
      'Longitude': '79.8612',
      'Notes': 'Example notes'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Full Name
    { wch: 25 }, // Date of Birth
    { wch: 15 }, // Gender
    { wch: 25 }, // Guardian Name
    { wch: 15 }, // Guardian NIC
    { wch: 15 }, // Contact Number
    { wch: 30 }, // Address
    { wch: 15 }, // District
    { wch: 20 }, // DS Division
    { wch: 15 }, // GN Division
    { wch: 25 }, // School Name
    { wch: 12 }, // Current Grade
    { wch: 15 }, // Stipend Amount
    { wch: 20 }, // Donor
    { wch: 12 }, // Latitude
    { wch: 12 }, // Longitude
    { wch: 30 }, // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orphans Template');

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Generate Excel template for Beneficiaries
 * @returns {Blob} - Excel file blob
 */
export const generateBeneficiariesTemplate = async () => {
  const XLSX = await loadXLSX();
  const headers = [
    'NIC *',
    'Full Name *',
    'Age *',
    'Gender (Male/Female) *',
    'Beneficiary Type *',
    'District *',
    'DS Division *',
    'GN Division',
    'Address',
    'Primary Phone',
    'Secondary Phone',
    'Email',
    'Household Size',
    'Monthly Income',
    'Notes'
  ];

  const sampleData = [
    {
      'NIC *': '199512345678',
      'Full Name *': 'Example: Nimal Perera',
      'Age *': '30',
      'Gender (Male/Female) *': 'Male',
      'Beneficiary Type *': 'Widow',
      'District *': 'Colombo',
      'DS Division *': 'Colombo',
      'GN Division': 'Example GN',
      'Address': 'No. 456, Sample Road',
      'Primary Phone': '0771234567',
      'Secondary Phone': '0112345678',
      'Email': 'example@email.com',
      'Household Size': '4',
      'Monthly Income': '25000',
      'Notes': 'Example notes'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // NIC
    { wch: 25 }, // Full Name
    { wch: 8 },  // Age
    { wch: 15 }, // Gender
    { wch: 20 }, // Beneficiary Type
    { wch: 15 }, // District
    { wch: 20 }, // DS Division
    { wch: 15 }, // GN Division
    { wch: 30 }, // Address
    { wch: 15 }, // Primary Phone
    { wch: 15 }, // Secondary Phone
    { wch: 25 }, // Email
    { wch: 12 }, // Household Size
    { wch: 15 }, // Monthly Income
    { wch: 30 }, // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Beneficiaries Template');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Validate orphan data row
 * @param {Object} row - Row data
 * @param {number} rowIndex - Row index for error reporting
 * @returns {Object} - { isValid, errors, data }
 */
export const validateOrphanRow = (row, rowIndex) => {
  const errors = [];
  const data = {};

  // Required field mapping
  const fieldMap = {
    'Full Name *': 'fullName',
    'Date of Birth (YYYY-MM-DD) *': 'dateOfBirth',
    'Gender (Male/Female) *': 'gender',
    'Guardian Name *': 'guardianName',
    'Guardian NIC *': 'guardianNIC',
    'Contact Number *': 'contactNumber',
    'Address *': 'address',
    'District *': 'district',
    'DS Division *': 'dsDivision'
  };

  // Optional fields
  const optionalFieldMap = {
    'GN Division': 'gnDivision',
    'School Name': 'schoolName',
    'Current Grade': 'currentGrade',
    'Stipend Amount': 'stipendAmount',
    'Donor': 'donor',
    'Latitude': 'latitude',
    'Longitude': 'longitude',
    'Notes': 'notes'
  };

  // Check required fields
  Object.entries(fieldMap).forEach(([excelField, dbField]) => {
    const value = row[excelField]?.toString().trim();
    if (!value) {
      errors.push(`${excelField} is required`);
    } else {
      data[dbField] = value;
    }
  });

  // Process optional fields
  Object.entries(optionalFieldMap).forEach(([excelField, dbField]) => {
    const value = row[excelField]?.toString().trim();
    if (value) {
      data[dbField] = value;
    }
  });

  // Validate date format
  if (data.dateOfBirth) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.dateOfBirth)) {
      errors.push('Date of Birth must be in YYYY-MM-DD format');
    }
  }

  // Validate gender
  if (data.gender) {
    if (!['Male', 'Female'].includes(data.gender)) {
      errors.push('Gender must be either "Male" or "Female"');
    }
  }

  // Validate NIC (basic check)
  if (data.guardianNIC && data.guardianNIC.length !== 12) {
    errors.push('Guardian NIC should be 12 digits');
  }

  // Validate coordinates if provided
  if (data.latitude) {
    const lat = parseFloat(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Invalid latitude (must be between -90 and 90)');
    } else {
      data.latitude = lat;
    }
  }

  if (data.longitude) {
    const lon = parseFloat(data.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      errors.push('Invalid longitude (must be between -180 and 180)');
    } else {
      data.longitude = lon;
    }
  }

  // Validate stipend amount if provided
  if (data.stipendAmount) {
    const amount = parseFloat(data.stipendAmount);
    if (isNaN(amount) || amount < 0) {
      errors.push('Invalid stipend amount');
    } else {
      data.stipendAmount = amount;
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? [`Row ${rowIndex + 2}: ${errors.join(', ')}`] : [],
    data
  };
};

/**
 * Validate beneficiary data row
 * @param {Object} row - Row data
 * @param {number} rowIndex - Row index for error reporting
 * @returns {Object} - { isValid, errors, data }
 */
export const validateBeneficiaryRow = (row, rowIndex) => {
  const errors = [];
  const data = {};

  // Required field mapping
  const fieldMap = {
    'NIC *': 'nic',
    'Full Name *': 'full_name',
    'Age *': 'age',
    'Gender (Male/Female) *': 'gender',
    'Beneficiary Type *': 'beneficiary_type',
    'District *': 'district',
    'DS Division *': 'ds_division'
  };

  // Optional fields
  const optionalFieldMap = {
    'GN Division': 'gn_division',
    'Address': 'address',
    'Primary Phone': 'primary_phone',
    'Secondary Phone': 'secondary_phone',
    'Email': 'email',
    'Household Size': 'household_size',
    'Monthly Income': 'monthly_income',
    'Notes': 'notes'
  };

  // Check required fields
  Object.entries(fieldMap).forEach(([excelField, dbField]) => {
    const value = row[excelField]?.toString().trim();
    if (!value) {
      errors.push(`${excelField} is required`);
    } else {
      data[dbField] = value;
    }
  });

  // Process optional fields
  Object.entries(optionalFieldMap).forEach(([excelField, dbField]) => {
    const value = row[excelField]?.toString().trim();
    if (value) {
      data[dbField] = value;
    }
  });

  // Validate age
  if (data.age) {
    const age = parseInt(data.age);
    if (isNaN(age) || age < 0 || age > 150) {
      errors.push('Invalid age');
    } else {
      data.age = age;
    }
  }

  // Validate gender
  if (data.gender) {
    if (!['Male', 'Female'].includes(data.gender)) {
      errors.push('Gender must be either "Male" or "Female"');
    }
  }

  // Validate NIC
  if (data.nic && data.nic.length !== 12) {
    errors.push('NIC should be 12 digits');
  }

  // Validate email if provided
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
  }

  // Validate household size if provided
  if (data.household_size) {
    const size = parseInt(data.household_size);
    if (isNaN(size) || size < 1) {
      errors.push('Invalid household size');
    } else {
      data.household_size = size;
    }
  }

  // Validate monthly income if provided
  if (data.monthly_income) {
    const income = parseFloat(data.monthly_income);
    if (isNaN(income) || income < 0) {
      errors.push('Invalid monthly income');
    } else {
      data.monthly_income = income;
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? [`Row ${rowIndex + 2}: ${errors.join(', ')}`] : [],
    data
  };
};

/**
 * Validate all rows in the upload
 * @param {Array} rows - Array of row objects
 * @param {string} type - 'orphans' or 'beneficiaries'
 * @returns {Object} - { isValid, validData, errors }
 */
export const validateUpload = (rows, type) => {
  const validData = [];
  const allErrors = [];

  const validateFn = type === 'orphans' ? validateOrphanRow : validateBeneficiaryRow;

  rows.forEach((row, index) => {
    const result = validateFn(row, index);

    if (result.isValid) {
      validData.push(result.data);
    } else {
      allErrors.push(...result.errors);
    }
  });

  return {
    isValid: allErrors.length === 0,
    validData,
    errors: allErrors,
    stats: {
      total: rows.length,
      valid: validData.length,
      invalid: rows.length - validData.length
    }
  };
};

export default {
  parseExcelFile,
  generateOrphansTemplate,
  generateBeneficiariesTemplate,
  downloadBlob,
  validateOrphanRow,
  validateBeneficiaryRow,
  validateUpload
};
