-- ============================================================================
-- ADD BENEFICIARY TYPE AND DIVISION FIELDS
-- ============================================================================
-- Purpose: Add beneficiary_type for filtering/reporting and split division
--          into ds_division (Divisional Secretariat) and gn_division (Grama Niladhari)
-- ============================================================================

-- 1. Add beneficiary_type column
ALTER TABLE beneficiaries
ADD COLUMN IF NOT EXISTS beneficiary_type VARCHAR(100);

-- 2. Add ds_division column (Divisional Secretariat Division)
ALTER TABLE beneficiaries
ADD COLUMN IF NOT EXISTS ds_division VARCHAR(100);

-- 3. Add gn_division column (Grama Niladhari Division)
ALTER TABLE beneficiaries
ADD COLUMN IF NOT EXISTS gn_division VARCHAR(100);

-- 4. Copy existing division data to ds_division for backward compatibility
UPDATE beneficiaries
SET ds_division = division
WHERE ds_division IS NULL AND division IS NOT NULL;

-- 5. Add index for beneficiary_type for filtering/reporting
CREATE INDEX IF NOT EXISTS beneficiaries_beneficiary_type_idx ON beneficiaries(beneficiary_type);

-- 6. Add index for ds_division
CREATE INDEX IF NOT EXISTS beneficiaries_ds_division_idx ON beneficiaries(ds_division);

-- 7. Add index for gn_division
CREATE INDEX IF NOT EXISTS beneficiaries_gn_division_idx ON beneficiaries(gn_division);

-- 8. Add composite index for district and ds_division
CREATE INDEX IF NOT EXISTS beneficiaries_district_ds_division_idx ON beneficiaries(district, ds_division);

-- 9. Add comments
COMMENT ON COLUMN beneficiaries.beneficiary_type IS 'Type of beneficiary for reporting/filtering: Widow, Disabled, Poor Family, Most Needy, Zakat Eligible Family, Orphan Family, Elderly, Single Parent, Chronic Illness, Other';
COMMENT ON COLUMN beneficiaries.ds_division IS 'Divisional Secretariat (DS) Division where beneficiary resides';
COMMENT ON COLUMN beneficiaries.gn_division IS 'Grama Niladhari (GN) Division where beneficiary resides';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Beneficiary type and division fields added successfully!';
  RAISE NOTICE '  - beneficiary_type column added';
  RAISE NOTICE '  - ds_division column added';
  RAISE NOTICE '  - gn_division column added';
  RAISE NOTICE '  - Indexes created for optimal performance';
  RAISE NOTICE '  - Existing division data copied to ds_division';
END $$;
