CREATE TABLE IF NOT EXISTS Context_Multipliers (
    multiplier_id SERIAL PRIMARY KEY,
    geo_region_code VARCHAR(10) NOT NULL,
    entity_type VARCHAR(50), -- Nullable for general regional multipliers, specific for industry overrides
    metric_type VARCHAR(50) NOT NULL,
    scarcity_factor DECIMAL(10, 5) NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (geo_region_code, metric_type, version, entity_type) -- Updated constraint
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_context_multipliers_lookup ON Context_Multipliers (geo_region_code, metric_type, version, entity_type);

-- Table for Entities
CREATE TABLE IF NOT EXISTS Entities (
    entity_id VARCHAR(50) PRIMARY KEY,
    entity_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50), -- e.g., 'Cotton_Farm', 'Wheat_Farm', 'Brand'
    geo_region_code VARCHAR(10),
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    parent_entity_id VARCHAR(50) REFERENCES Entities(entity_id),
    did VARCHAR(255) UNIQUE NOT NULL
);

-- Table for Metric_Definitions
CREATE TABLE IF NOT EXISTS Metric_Definitions (
    metric_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    unit_of_measure VARCHAR(50) NOT NULL,
    conversion_to_bu_base DECIMAL(10, 5) NOT NULL
);

-- Table for Sensor_Readings_Raw
CREATE TABLE IF NOT EXISTS Sensor_Readings_Raw (
    reading_id SERIAL PRIMARY KEY,
    entity_id VARCHAR(50) NOT NULL REFERENCES Entities(entity_id),
    metric_type VARCHAR(50) NOT NULL REFERENCES Metric_Definitions(name),
    metric_value DECIMAL(18, 9) NOT NULL,
    device_signature VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Verified_Claims
CREATE TABLE IF NOT EXISTS Verified_Claims (
    claim_id SERIAL PRIMARY KEY,
    entity_id VARCHAR(50) NOT NULL REFERENCES Entities(entity_id),
    period_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    barley_unit_value DECIMAL(18, 9) NOT NULL,
    verification_level VARCHAR(20) NOT NULL,
    audit_hash VARCHAR(255) UNIQUE NOT NULL,
    processed_reading_ids INT[] NOT NULL DEFAULT ARRAY[]::INT[],
    multiplier_version_id INTEGER REFERENCES Context_Multipliers(multiplier_id), -- New column
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for User_Accounts
CREATE TABLE IF NOT EXISTS User_Accounts (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    entity_id VARCHAR(50) REFERENCES Entities(entity_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Regulation_Mappings (Feature 8.1)
CREATE TABLE IF NOT EXISTS Regulation_Mappings (
    mapping_id SERIAL PRIMARY KEY,
    kushim_metric_type VARCHAR(50) NOT NULL REFERENCES Metric_Definitions(name),
    regulation_name VARCHAR(100) NOT NULL,
    regulatory_kpi VARCHAR(100) NOT NULL,
    UNIQUE (kushim_metric_type, regulation_name, regulatory_kpi)
);

-- Table for Product_Identifiers (Feature 9.1)
CREATE TABLE IF NOT EXISTS Product_Identifiers (
    product_id SERIAL PRIMARY KEY,
    product_identifier_value VARCHAR(100) UNIQUE NOT NULL, -- e.g., specific GTIN/Serial combo
    identifier_type VARCHAR(20) NOT NULL, -- e.g., 'GTIN', 'SKU', 'SERIAL'
    entity_id VARCHAR(50) NOT NULL REFERENCES Entities(entity_id),
    claim_id INTEGER REFERENCES Verified_Claims(claim_id), -- Links specific batch data
    batch_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for DLT_Transactions (Feature 11.1)
-- Simulates the external distributed ledger storage
CREATE TABLE IF NOT EXISTS DLT_Transactions (
    transaction_id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES Verified_Claims(claim_id),
    dlt_tx_hash VARCHAR(66) NOT NULL, -- Simulated hex hash (0x...)
    block_number INTEGER, -- Simulated block number
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payload_hash VARCHAR(66) NOT NULL -- Hash of the data sent to DLT
);

-- Table for Governance_Proposals (Feature 12.1)
CREATE TABLE IF NOT EXISTS Governance_Proposals (
    proposal_id SERIAL PRIMARY KEY,
    proposer_entity_id VARCHAR(50) NOT NULL REFERENCES Entities(entity_id),
    target_geo_region_code VARCHAR(10) NOT NULL,
    target_metric_type VARCHAR(50) NOT NULL REFERENCES Metric_Definitions(name),
    target_entity_type VARCHAR(50), -- Optional
    proposed_scarcity_factor DECIMAL(10, 5) NOT NULL,
    justification TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Table for Governance_Votes (Feature 12.1)
CREATE TABLE IF NOT EXISTS Governance_Votes (
    vote_id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES Governance_Proposals(proposal_id),
    voter_entity_id VARCHAR(50) NOT NULL REFERENCES Entities(entity_id),
    vote_choice VARCHAR(10) NOT NULL, -- 'Yes', 'No'
    weight DECIMAL(10, 2) DEFAULT 1.0, -- Can be based on NRP/K-Score
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (proposal_id, voter_entity_id) -- One vote per entity per proposal
);
