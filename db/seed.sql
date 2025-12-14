INSERT INTO Entities (entity_id, entity_name, entity_type, geo_region_code, latitude, longitude, parent_entity_id, did)
VALUES ('entity-999', 'Global Brand Inc.', 'Brand', 'US-NY', 40.7128, -74.0060, NULL, 'did:kushim:entity-999')
ON CONFLICT (entity_id) DO UPDATE SET entity_type = EXCLUDED.entity_type;

INSERT INTO Entities (entity_id, entity_name, entity_type, geo_region_code, latitude, longitude, parent_entity_id, did)
VALUES ('entity-123', 'Alpha Farm', 'Cotton_Farm', 'US-CA', 34.0522, -118.2437, 'entity-999', 'did:kushim:entity-123')
ON CONFLICT (entity_id) DO UPDATE SET entity_type = EXCLUDED.entity_type;

INSERT INTO Entities (entity_id, entity_name, entity_type, geo_region_code, latitude, longitude, parent_entity_id, did)
VALUES ('entity-456', 'Beta Ranch', 'Wheat_Farm', 'US-TX', 30.2672, -97.7431, 'entity-999', 'did:kushim:entity-456')
ON CONFLICT (entity_id) DO UPDATE SET entity_type = EXCLUDED.entity_type;

INSERT INTO Metric_Definitions (name, unit_of_measure, conversion_to_bu_base)
VALUES ('temperature', 'Celsius', 0.1)
ON CONFLICT (name) DO NOTHING;

INSERT INTO Metric_Definitions (name, unit_of_measure, conversion_to_bu_base)
VALUES ('humidity', 'Percentage', 0.05)
ON CONFLICT (name) DO NOTHING;

INSERT INTO Metric_Definitions (name, unit_of_measure, conversion_to_bu_base)
VALUES ('water_level', 'Meters', 10.0)
ON CONFLICT (name) DO NOTHING;

-- General Multiplier (entity_type IS NULL)
INSERT INTO Context_Multipliers (geo_region_code, metric_type, scarcity_factor, version, entity_type)
VALUES ('US-CA', 'water_level', 1.5, 1, NULL)
ON CONFLICT (geo_region_code, metric_type, version, entity_type) DO NOTHING;

-- Cotton specific multiplier (Higher water impact)
INSERT INTO Context_Multipliers (geo_region_code, metric_type, scarcity_factor, version, entity_type)
VALUES ('US-CA', 'water_level', 2.5, 1, 'Cotton_Farm')
ON CONFLICT (geo_region_code, metric_type, version, entity_type) DO NOTHING;

-- Wheat specific multiplier (Lower water impact)
INSERT INTO Context_Multipliers (geo_region_code, metric_type, scarcity_factor, version, entity_type)
VALUES ('US-CA', 'water_level', 1.2, 1, 'Wheat_Farm')
ON CONFLICT (geo_region_code, metric_type, version, entity_type) DO NOTHING;

INSERT INTO Context_Multipliers (geo_region_code, metric_type, scarcity_factor, version, entity_type)
VALUES ('US-TX', 'temperature', 0.8, 1, NULL)
ON CONFLICT (geo_region_code, metric_type, version, entity_type) DO NOTHING;

-- Add a second version for water_level in US-CA (General)
INSERT INTO Context_Multipliers (geo_region_code, metric_type, scarcity_factor, version, entity_type)
VALUES ('US-CA', 'water_level', 1.8, 2, NULL)
ON CONFLICT (geo_region_code, metric_type, version, entity_type) DO NOTHING;

-- Seed data for Regulation_Mappings (Feature 8.1)
INSERT INTO Regulation_Mappings (kushim_metric_type, regulation_name, regulatory_kpi)
VALUES ('water_level', 'ESRS E1', 'Water and marine resources')
ON CONFLICT (kushim_metric_type, regulation_name, regulatory_kpi) DO NOTHING;

INSERT INTO Regulation_Mappings (kushim_metric_type, regulation_name, regulatory_kpi)
VALUES ('temperature', 'CSDDD', 'Operational Temperature Monitoring')
ON CONFLICT (kushim_metric_type, regulation_name, regulatory_kpi) DO NOTHING;

-- Seed data for Product_Identifiers (Feature 9.1)
-- Requires a valid claim_id, so we assume claim_id 1 exists (created by previous seeds/tests) or we insert one if needed.
-- For safety in this seed file, we can insert without a claim_id or link to a known one if we are sure.
-- However, strict FK constraints might fail if claim 1 doesn't exist.
-- Let's link to the entity directly, and optionally a claim if we can ensure it.
-- For this seed, we'll leave claim_id NULL to be safe, or we'd need to fetch a valid ID.
-- Requirement says "linking ... to ... specific Verified_Claims".
-- Let's try to insert a claim first if we can, but seed.sql is static.
-- We'll insert a product linked to 'entity-123' and leave claim_id NULL for the static seed, 
-- relying on dynamic tests to populate fully linked data.
INSERT INTO Product_Identifiers (product_identifier_value, identifier_type, entity_id, batch_number)
VALUES ('SN-99887766', 'SERIAL', 'entity-123', 'BATCH-001')
ON CONFLICT (product_identifier_value) DO NOTHING;