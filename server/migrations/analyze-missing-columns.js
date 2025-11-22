import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.prnvhbrepywugrnuctxw',
  database: 'postgres',
  password: 'HBgBnxw1Uo5XvKP1',
  ssl: { rejectUnauthorized: false }
});

// Sequelize type to PostgreSQL type mapping
const typeMap = {
  'INTEGER': 'INTEGER',
  'STRING': 'VARCHAR',
  'TEXT': 'TEXT',
  'BOOLEAN': 'BOOLEAN',
  'DECIMAL': 'DECIMAL',
  'DATEONLY': 'DATE',
  'DATE': 'TIMESTAMP WITH TIME ZONE',
  'TIME': 'TIME',
  'JSON': 'JSONB',
  'ENUM': 'VARCHAR'
};

// Focus on Compliance, HR, and Orphan-related models
const targetModels = [
  // Compliance models
  'compliance_documents',
  'safeguarding_policies',
  'safeguarding_incidents',
  'background_checks',
  'compliance_trainings',
  'data_protection_records',

  // HR models
  'staff',
  'employment_agreements',
  'contract_renewals',
  'terminations',
  'resignations',
  'onboarding_records',
  'appraisal_records',
  'attendance',
  'leave_requests',
  'payroll',

  // Orphan models
  'orphans',
  'orphan_visit_logs',
  'orphan_progress_ratings',
  'generated_orphan_reports'
];

async function getTableColumns(tableName) {
  const query = `
    SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
    ORDER BY ordinal_position;
  `;

  try {
    const result = await client.query(query, [tableName]);
    return result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      maxLength: row.character_maximum_length,
      precision: row.numeric_precision,
      scale: row.numeric_scale
    }));
  } catch (error) {
    console.error(`Error querying table ${tableName}:`, error.message);
    return null;
  }
}

// Parse the model file to extract column definitions
function parseModelColumns() {
  const modelFilePath = path.join(__dirname, '../src/models/index.js');
  const content = fs.readFileSync(modelFilePath, 'utf8');

  const models = {};
  const lines = content.split('\n');

  let currentModel = null;
  let currentTable = null;
  let inAttributes = false;
  let braceDepth = 0;
  let attributesStartDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Find model definition
    if (line.includes('sequelize.define(')) {
      const match = line.match(/const (\w+) = sequelize\.define\('(\w+)'/);
      if (match) {
        currentModel = match[1];
        braceDepth = 0;
        inAttributes = false;
      }
    }

    // Track braces
    for (const char of line) {
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
    }

    // Start of attributes (first { after define)
    if (currentModel && !inAttributes && braceDepth === 1) {
      inAttributes = true;
      attributesStartDepth = 1;
      models[currentModel] = { columns: {}, tableName: null };
    }

    // Extract table name
    if (line.includes('tableName:')) {
      const match = line.match(/tableName:\s*'(\w+)'/);
      if (match && currentModel) {
        models[currentModel].tableName = match[1];
        currentTable = match[1];
      }
    }

    // Extract column definitions
    if (inAttributes && braceDepth > attributesStartDepth) {
      // Match column definition
      const colMatch = line.match(/^(\w+):\s*\{/);
      if (colMatch) {
        const columnName = colMatch[1];
        let columnDef = '';
        let depth = braceDepth;
        let j = i;

        // Collect the full column definition
        while (j < lines.length && depth >= attributesStartDepth + 1) {
          columnDef += lines[j] + '\n';
          for (const char of lines[j]) {
            if (char === '{') depth++;
            if (char === '}') {
              depth--;
              if (depth < attributesStartDepth + 1) break;
            }
          }
          j++;
        }

        // Parse type
        const typeMatch = columnDef.match(/type:\s*DataTypes\.(\w+)(?:\(([^)]+)\))?/);
        let sequelizeType = typeMatch ? typeMatch[1] : 'STRING';
        let typeParams = typeMatch && typeMatch[2] ? typeMatch[2] : null;

        // Parse field name override
        const fieldMatch = columnDef.match(/field:\s*'(\w+)'/);
        const dbColumnName = fieldMatch ? fieldMatch[1] : camelToSnake(columnName);

        if (currentModel && models[currentModel]) {
          models[currentModel].columns[dbColumnName] = {
            modelName: columnName,
            sequelizeType,
            typeParams,
            definition: columnDef.trim()
          };
        }
      }
    }

    // End of model definition
    if (currentModel && braceDepth === 0 && line.includes('});')) {
      currentModel = null;
      currentTable = null;
      inAttributes = false;
    }
  }

  return models;
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
}

function getPostgresType(sequelizeType, typeParams) {
  const baseType = typeMap[sequelizeType] || 'VARCHAR';

  if (sequelizeType === 'STRING' && typeParams) {
    return `VARCHAR(${typeParams})`;
  }
  if (sequelizeType === 'DECIMAL' && typeParams) {
    return `DECIMAL(${typeParams})`;
  }
  if (sequelizeType === 'ENUM') {
    return 'VARCHAR(100)';
  }

  return baseType;
}

async function analyzeMissingColumns() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected!\n');

  console.log('Parsing model definitions...');
  const models = parseModelColumns();
  console.log(`Parsed ${Object.keys(models).length} models\n`);

  const missingColumns = {};
  let totalMissing = 0;
  let tablesAnalyzed = 0;

  for (const [modelName, modelData] of Object.entries(models)) {
    const tableName = modelData.tableName;

    // Skip if not in target models
    if (!targetModels.includes(tableName)) {
      continue;
    }

    console.log(`Analyzing ${tableName}...`);
    tablesAnalyzed++;

    const dbColumns = await getTableColumns(tableName);

    if (!dbColumns) {
      console.log(`  ⚠️  Table does not exist in database`);
      continue;
    }

    const dbColumnNames = new Set(dbColumns.map(c => c.name));
    const modelColumns = Object.keys(modelData.columns);

    const missing = [];

    for (const [dbColName, colInfo] of Object.entries(modelData.columns)) {
      // Skip timestamp columns (Sequelize auto-manages)
      if (['created_at', 'updated_at'].includes(dbColName)) {
        continue;
      }

      if (!dbColumnNames.has(dbColName)) {
        const postgresType = getPostgresType(colInfo.sequelizeType, colInfo.typeParams);
        missing.push({
          column: dbColName,
          type: postgresType,
          sequelizeType: colInfo.sequelizeType,
          definition: colInfo.definition
        });
        totalMissing++;
      }
    }

    if (missing.length > 0) {
      missingColumns[tableName] = missing;
      console.log(`  ❌ ${missing.length} missing columns`);
    } else {
      console.log(`  ✅ All columns present`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('ANALYSIS COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`Tables Analyzed: ${tablesAnalyzed}`);
  console.log(`Tables with Missing Columns: ${Object.keys(missingColumns).length}`);
  console.log(`Total Missing Columns: ${totalMissing}\n`);

  // Generate SQL migration
  if (totalMissing > 0) {
    console.log('Generating migration SQL...\n');
    let sql = `-- Comprehensive Missing Columns Fix
-- Generated: ${new Date().toISOString()}
-- Tables affected: ${Object.keys(missingColumns).length}
-- Missing columns: ${totalMissing}

BEGIN;

`;

    for (const [tableName, columns] of Object.entries(missingColumns)) {
      sql += `\n-- ${tableName.toUpperCase()} (${columns.length} missing columns)\n`;
      sql += `-- ${'-'.repeat(50)}\n`;

      for (const col of columns) {
        // Determine if column should be nullable
        const isNullable = !col.definition.includes('allowNull: false');
        const nullable = isNullable ? '' : ' NOT NULL';

        // Determine default value
        let defaultClause = '';
        const defaultMatch = col.definition.match(/defaultValue:\s*([^,\n}]+)/);
        if (defaultMatch) {
          let defaultVal = defaultMatch[1].trim();
          if (defaultVal === 'true' || defaultVal === 'false') {
            defaultClause = ` DEFAULT ${defaultVal}`;
          } else if (defaultVal.match(/^\d+$/)) {
            defaultClause = ` DEFAULT ${defaultVal}`;
          } else if (defaultVal === '[]') {
            defaultClause = ` DEFAULT '[]'::jsonb`;
          } else if (defaultVal === '{}') {
            defaultClause = ` DEFAULT '{}'::jsonb`;
          } else if (defaultVal.startsWith("'")) {
            defaultClause = ` DEFAULT ${defaultVal}`;
          }
        }

        sql += `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${col.column} ${col.type}${nullable}${defaultClause};\n`;
      }
    }

    sql += `\nCOMMIT;

-- Verification queries
-- Run these to verify all columns were added successfully
\n`;

    for (const tableName of Object.keys(missingColumns)) {
      sql += `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}' ORDER BY ordinal_position;\n`;
    }

    // Save SQL file
    const sqlFilePath = path.join(__dirname, 'comprehensive-missing-columns-fix.sql');
    fs.writeFileSync(sqlFilePath, sql);
    console.log(`✅ Migration SQL saved to: ${sqlFilePath}\n`);
  }

  // Print detailed report
  console.log('\nDETAILED MISSING COLUMNS REPORT');
  console.log('='.repeat(60));

  for (const [tableName, columns] of Object.entries(missingColumns)) {
    console.log(`\n${tableName}:`);
    for (const col of columns) {
      console.log(`  - ${col.column} (${col.type})`);
    }
  }

  await client.end();
  console.log('\n✅ Analysis complete!');
}

analyzeMissingColumns().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
