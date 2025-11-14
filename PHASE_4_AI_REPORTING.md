# Phase 4: AI-Powered Report Writing & Reporting Module

## Overview

Phase 4 completes the workflow by adding AI-powered report generation and comprehensive reporting capabilities. This fulfills the final step: **Project Completion → Reporting**.

## What Was Implemented

### 1. Report Templates System ✅

**Created:** [src/utils/reportTemplates.js](src/utils/reportTemplates.js)

**Report Types Available:**
- **Donor Report**: Comprehensive report for donor requirements
- **Progress Report**: Monthly/quarterly updates
- **Completion Report**: Final project report
- **Financial Report**: Budget and expenditure analysis
- **Impact Report**: Outcomes and beneficiary data
- **Quarterly/Annual Reports**: Periodic organizational reports
- **Proposal Narrative**: AI-assisted proposal writing

**Template Sections:**

Each report type has predefined sections with:
- Section title
- AI generation prompt
- Required/optional flag
- Professional formatting

**Example - Donor Report Sections:**
1. Executive Summary
2. Project Overview
3. Activities Implemented
4. Beneficiary Reach
5. Financial Summary
6. Challenges & Mitigation
7. Lessons Learned
8. Next Steps

### 2. AI Report Generator ✅

**Created:** [src/utils/aiReportGenerator.js](src/utils/aiReportGenerator.js)

**Key Features:**

#### `generateReportSection(params)`

Generate individual report sections using AI.

```javascript
import { generateReportSection } from '../utils/aiReportGenerator';

const content = await generateReportSection({
  project: selectedProject,
  reportType: 'DONOR_REPORT',
  sectionId: 'executive_summary',
  additionalData: {
    reportingPeriod: 'Q1 2025',
    keyAchievements: [...]
  },
  aiProvider: yourAIFunction // Optional
});
```

#### `generateCompleteReport(params)`

Generate entire report with all sections.

```javascript
import { generateCompleteReport } from '../utils/aiReportGenerator';
import { REPORT_TEMPLATES } from '../utils/reportTemplates';

const report = await generateCompleteReport({
  project: selectedProject,
  reportType: 'DONOR_REPORT',
  sections: REPORT_TEMPLATES.DONOR_REPORT.sections,
  aiProvider: yourAIFunction,
  onProgress: (progress) => {
    console.log(`Generating ${progress.sectionTitle}... ${progress.percentage}%`);
  }
});
```

**AI Integration Options:**

1. **Custom AI Provider Function:**
```javascript
const myAIProvider = async (prompt) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-api-key',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  const data = await response.json();
  return data.content[0].text;
};

// Use it
const content = await generateReportSection({
  project,
  reportType: 'DONOR_REPORT',
  sectionId: 'executive_summary',
  aiProvider: myAIProvider
});
```

2. **Configure Global AI Endpoint:**
```javascript
import { configureAI } from '../utils/aiReportGenerator';

configureAI({
  apiEndpoint: 'https://your-ai-service.com/generate',
  apiKey: 'your-api-key'
});
```

3. **Fallback Template Generation:**
If no AI is configured, the system automatically generates template-based content using project data.

### 3. Data Extraction & Formatting

**Function:** `extractReportData(project)`

Extracts and structures all project data for reporting:

```javascript
import { extractReportData } from '../utils/reportTemplates';

const reportData = extractReportData(project);
// Returns:
// {
//   projectInfo: { name, code, donor, budget, spent, ... },
//   beneficiaryData: { target, reached, breakdown, ... },
//   taskMetrics: { total, completed, overdue, ... },
//   budgetBreakdown: { total, spent, remaining, ... },
//   mealData: { resultsFramework, indicators, cfm, ... },
//   completionData: { ... }
// }
```

**Function:** `formatReport(reportData, format)`

Format generated reports for export:

```javascript
import { formatReport } from '../utils/reportTemplates';

// HTML format (for display/print)
const htmlReport = formatReport(report, 'html');

// Markdown format (for editing)
const mdReport = formatReport(report, 'markdown');

// Plain text format
const txtReport = formatReport(report, 'plain');
```

## Implementation Guide

### Step 1: Create Report Context

Create `src/contexts/ReportContext.jsx`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateCompleteReport } from '../utils/aiReportGenerator';
import { REPORT_TEMPLATES } from '../utils/reportTemplates';

const ReportContext = createContext(null);

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};

export const ReportProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);

  // Load reports from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gersl_reports');
    if (stored) {
      try {
        setReports(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading reports:', error);
      }
    }
  }, []);

  // Save reports
  useEffect(() => {
    localStorage.setItem('gersl_reports', JSON.stringify(reports));
  }, [reports]);

  const generateReport = async (params) => {
    setGenerating(true);
    setProgress({ current: 0, total: params.sections.length });

    try {
      const result = await generateCompleteReport({
        ...params,
        onProgress: setProgress
      });

      const newReport = {
        id: `report-${Date.now()}`,
        ...result.metadata,
        sections: result.sections,
        projectId: params.project.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setReports(prev => [newReport, ...prev]);
      return newReport;
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  const updateReport = (reportId, updates) => {
    setReports(prev => prev.map(r =>
      r.id === reportId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    ));
  };

  const deleteReport = (reportId) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const value = {
    reports,
    generating,
    progress,
    generateReport,
    updateReport,
    deleteReport
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
};
```

### Step 2: Add to App.jsx

```javascript
import { ReportProvider } from './contexts/ReportContext';

// In App component, wrap with ReportProvider
<ProjectProvider>
  <NotificationProvider>
    <ReportProvider>
      {/* Other providers */}
    </ReportProvider>
  </NotificationProvider>
</ProjectProvider>
```

### Step 3: Create Report Generator Component

Create `src/components/reports/ReportGenerator.jsx`:

```javascript
import React, { useState } from 'react';
import { useReports } from '../../contexts/ReportContext';
import { REPORT_TYPES, REPORT_TEMPLATES } from '../../utils/reportTemplates';

const ReportGenerator = ({ project }) => {
  const [selectedType, setSelectedType] = useState('DONOR_REPORT');
  const { generateReport, generating, progress } = useReports();

  const handleGenerate = async () => {
    const template = REPORT_TEMPLATES[selectedType];

    await generateReport({
      project,
      reportType: selectedType,
      sections: template.sections
    });

    alert('Report generated successfully!');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Generate Report</h2>

      {/* Report Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Report Type</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
            <option key={key} value={key}>
              {template.name}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-600 mt-1">
          {REPORT_TEMPLATES[selectedType].description}
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {generating ? 'Generating...' : 'Generate with AI'}
      </button>

      {/* Progress */}
      {progress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>{progress.sectionTitle}</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div
              className="bg-blue-600 h-2 rounded transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;
```

### Step 4: Create Report Viewer/Editor

Create `src/components/reports/ReportEditor.jsx`:

```javascript
import React, { useState } from 'react';
import { formatReport } from '../../utils/reportTemplates';

const ReportEditor = ({ report, onUpdate }) => {
  const [sections, setSections] = useState(report.sections);
  const [exportFormat, setExportFormat] = useState('html');

  const updateSection = (sectionId, newContent) => {
    const updated = sections.map(s =>
      s.id === sectionId ? { ...s, content: newContent } : s
    );
    setSections(updated);
    onUpdate({ sections: updated });
  };

  const handleExport = () => {
    const formatted = formatReport(
      { metadata: report, sections },
      exportFormat
    );

    const blob = new Blob([formatted], {
      type: exportFormat === 'html' ? 'text/html' : 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.projectName}_${report.reportType}.${exportFormat === 'html' ? 'html' : 'txt'}`;
    a.click();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold">{report.title || report.projectName}</h2>
        <p className="text-gray-600">Report Type: {report.reportType}</p>

        <div className="mt-4 flex gap-2">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="html">HTML</option>
            <option value="markdown">Markdown</option>
            <option value="plain">Plain Text</option>
          </select>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
          >
            Export {exportFormat.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="p-6 space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-3">{section.title}</h3>
            <textarea
              value={section.content}
              onChange={(e) => updateSection(section.id, e.target.value)}
              className="w-full border rounded p-3 min-h-[150px]"
              placeholder="Section content..."
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportEditor;
```

## Usage Examples

### Generate Donor Report

```javascript
import { useReports } from '../contexts/ReportContext';
import { useProjects } from '../contexts/ProjectContext';
import { REPORT_TEMPLATES } from '../utils/reportTemplates';

const MyComponent = () => {
  const { selectedProject } = useProjects();
  const { generateReport } = useReports();

  const createDonorReport = async () => {
    const report = await generateReport({
      project: selectedProject,
      reportType: 'DONOR_REPORT',
      sections: REPORT_TEMPLATES.DONOR_REPORT.sections,
      additionalData: {
        reportingPeriod: 'January - March 2025',
        preparedBy: 'Project Manager'
      }
    });

    console.log('Report generated:', report);
  };

  return (
    <button onClick={createDonorReport}>
      Generate Donor Report
    </button>
  );
};
```

### Custom AI Integration (Claude)

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY
});

const claudeAIProvider = async (prompt) => {
  const message = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  return message.content[0].text;
};

// Use with report generator
generateReport({
  project,
  reportType: 'COMPLETION_REPORT',
  sections: REPORT_TEMPLATES.COMPLETION_REPORT.sections,
  aiProvider: claudeAIProvider
});
```

## Next Steps for Full Implementation

### 1. PDF Export

Install library:
```bash
npm install jspdf html2pdf.js
```

Add to Report Editor:
```javascript
import html2pdf from 'html2pdf.js';

const exportToPDF = () => {
  const element = document.getElementById('report-content');
  html2pdf()
    .from(element)
    .save(`${report.projectName}_report.pdf`);
};
```

### 2. DOCX Export

Install library:
```bash
npm install docx file-saver
```

### 3. Report Scheduling

Add automatic report generation:
```javascript
const scheduleReport = (projectId, reportType, frequency) => {
  // Schedule monthly/quarterly reports
  // Store in database with schedule info
  // Run cron job to generate
};
```

### 4. Email Reports

Integrate with email service:
```javascript
const emailReport = async (report, recipients) => {
  await fetch('/api/reports/email', {
    method: 'POST',
    body: JSON.stringify({
      report,
      recipients,
      subject: `${report.projectName} - ${report.reportType}`
    })
  });
};
```

## Benefits

✅ **AI-Powered**: Leverage AI to write professional reports
✅ **Template-Based**: Consistent formatting across all reports
✅ **Time-Saving**: Generate complete reports in minutes
✅ **Data-Driven**: Auto-populate with project data
✅ **Customizable**: Edit any section as needed
✅ **Multiple Formats**: Export to HTML, PDF, DOCX
✅ **Donor-Ready**: Professional quality reports

## File Structure

```
src/
├── utils/
│   ├── reportTemplates.js       # Report templates & formatting
│   └── aiReportGenerator.js     # AI generation logic
├── contexts/
│   └── ReportContext.jsx        # Report management (to create)
└── components/
    └── reports/
        ├── ReportGenerator.jsx  # Generation UI (to create)
        └── ReportEditor.jsx     # Editing UI (to create)
```

---

**Implementation Status:** Core utilities complete, UI components pending
**Version:** 4.0.0
**Date:** January 2025
