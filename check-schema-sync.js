#!/usr/bin/env node

/**
 * Schema Synchronization Checker
 * Compares Sequelize model definitions with actual PostgreSQL database schema
 */

import pg from 'pg';
const { Client } = pg;

const dbConfig = {
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.prnvhbrepywugrnuctxw',
  password: 'HBgBnxw1Uo5XvKP1',
  ssl: { rejectUnauthorized: false }
};

async function checkProjectsTableSync() {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get database schema
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `);

    console.log('📊 PROJECTS TABLE - Database Schema vs Sequelize Model\n');
    console.log('='.repeat(80));

    // Expected fields from Sequelize model
    const modelFields = {
      id: { type: 'integer', nullable: 'NO' },
      project_name: { type: 'character varying', nullable: 'NO' },
      project_code: { type: 'character varying', nullable: 'YES' },
      description: { type: 'text', nullable: 'YES' },
      start_date: { type: 'date', nullable: 'YES' },
      end_date: { type: 'date', nullable: 'YES' },
      status: { type: 'character varying', nullable: 'YES' },
      budget: { type: 'numeric', nullable: 'YES' },
      spent: { type: 'numeric', nullable: 'YES' },
      funding_source: { type: 'character varying', nullable: 'YES' },
      donor: { type: 'character varying', nullable: 'YES' },
      programme_area: { type: 'character varying', nullable: 'YES' },
      project_manager: { type: 'character varying', nullable: 'YES' },
      manager_id: { type: 'integer', nullable: 'YES' },
      location: { type: 'character varying', nullable: 'YES' },
      beneficiaries_target: { type: 'integer', nullable: 'YES' },
      target_beneficiaries: { type: 'integer', nullable: 'YES' },
      beneficiaries: { type: 'integer', nullable: 'YES' },
      progress: { type: 'numeric', nullable: 'YES' },
      project_tier: { type: 'character varying', nullable: 'YES' },
      sector_theme: { type: 'character varying', nullable: 'YES' },
      problem_statement: { type: 'text', nullable: 'YES' },
      proposed_solution: { type: 'text', nullable: 'YES' },
      overall_goal: { type: 'text', nullable: 'YES' },
      strategic_alignment: { type: 'text', nullable: 'YES' },
      objectives: { type: 'text', nullable: 'YES' },
      key_activities: { type: 'text', nullable: 'YES' },
      results_framework: { type: 'text', nullable: 'YES' },
      beneficiary_breakdown: { type: 'jsonb', nullable: 'YES' },
      theory_of_change: { type: 'text', nullable: 'YES' },
      budget_breakdown: { type: 'jsonb', nullable: 'YES' },
      safeguarding: { type: 'character varying', nullable: 'YES' },
      proposal_id: { type: 'integer', nullable: 'YES' },
      created_by: { type: 'integer', nullable: 'YES' },
      created_at: { type: 'timestamp with time zone', nullable: 'YES' },
      updated_at: { type: 'timestamp with time zone', nullable: 'YES' },
      name: { type: 'character varying', nullable: 'YES' },
      phase: { type: 'character varying', nullable: 'YES' }
    };

    const dbFields = {};
    result.rows.forEach(row => {
      dbFields[row.column_name] = {
        type: row.data_type,
        nullable: row.is_nullable
      };
    });

    // Check for missing fields in DB
    console.log('\n🔍 Checking Model → Database Sync:\n');
    let modelToDbIssues = 0;
    for (const [fieldName, expected] of Object.entries(modelFields)) {
      const actual = dbFields[fieldName];
      if (!actual) {
        console.log(`❌ MISSING IN DB: ${fieldName}`);
        modelToDbIssues++;
      } else {
        const typeMatch = actual.type.includes(expected.type.split('(')[0]);
        if (!typeMatch) {
          console.log(`⚠️  TYPE MISMATCH: ${fieldName}`);
          console.log(`   Expected: ${expected.type}, Got: ${actual.type}`);
          modelToDbIssues++;
        }
      }
    }

    if (modelToDbIssues === 0) {
      console.log('✅ All model fields exist in database with correct types');
    }

    // Check for extra fields in DB
    console.log('\n🔍 Checking Database → Model Sync:\n');
    let dbToModelIssues = 0;
    for (const [fieldName, actual] of Object.entries(dbFields)) {
      if (!modelFields[fieldName]) {
        console.log(`⚠️  EXTRA IN DB (not in model): ${fieldName} (${actual.type})`);
        dbToModelIssues++;
      }
    }

    if (dbToModelIssues === 0) {
      console.log('✅ No extra fields in database');
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SUMMARY:\n');
    console.log(`Total fields in model: ${Object.keys(modelFields).length}`);
    console.log(`Total fields in database: ${Object.keys(dbFields).length}`);
    console.log(`Model → DB issues: ${modelToDbIssues}`);
    console.log(`DB → Model issues: ${dbToModelIssues}`);

    if (modelToDbIssues === 0 && dbToModelIssues === 0) {
      console.log('\n✅ ✅ ✅ PROJECTS TABLE IS 100% SYNCHRONIZED ✅ ✅ ✅\n');
    } else {
      console.log('\n⚠️  SYNCHRONIZATION ISSUES FOUND\n');
    }

    // Special check for project_name field
    console.log('='.repeat(80));
    console.log('\n🔎 CRITICAL FIELD CHECK: project_name\n');
    const projectNameField = dbFields['project_name'];
    if (projectNameField) {
      console.log(`✅ project_name exists in database`);
      console.log(`   Type: ${projectNameField.type}`);
      console.log(`   Nullable: ${projectNameField.nullable}`);
      console.log(`   Model mapping: projectName → project_name`);
    } else {
      console.log(`❌ project_name MISSING in database!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkProjectsTableSync();
