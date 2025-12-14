# KUSHIM: The Resilience Economy Protocol

KUSHIM is an innovative protocol designed to track, verify, and value the true ecological and social resilience embedded within global supply chains. By moving beyond traditional financial metrics, KUSHIM aims to become the foundational data layer for a "Resilience Economy," aligning economic incentives with long-term planetary and civilizational well-being.

This project implements a Node.js-based API backend for KUSHIM, managing data ingestion, claim verification, and exposing various endpoints for supply chain transparency, regulatory compliance, financial risk assessment, and decentralized governance.

## Project Vision

KUSHIM addresses the critical need for supply chain transparency, driven by global mandates like the EU's Corporate Sustainability Due Diligence Directive (CSDDD) and Digital Product Passport (DPP). It provides a mechanism for:

- **Secure & Controlled Data Sharing**: Mapping multi-tier supply chains and sharing verifiable scores without exposing sensitive source data.
- **Regulatory Compliance**: Directly linking KUSHIM metrics to external regulatory requirements.
- **Digital Product Passports**: Serving as the foundational data source for product lifecycle tracking.
- **Financial Risk Integration**: Providing inputs for actuarial and credit models to quantify resilience.
- **Protocol Hardening**: Transitioning to a distributed ledger architecture for immutable and ungameable records.
- **Decentralized Governance**: Enabling community and stakeholder participation in protocol evolution.

## Features Implemented Across Sprints

### 💡 Supply Chain & Decentralized Identity (DID)

- **Hierarchical Entity Mapping**: `Entities` table supports parent-child relationships (`parent_entity_id`).
- **Decentralized Identifier (DID) Integration**: Each entity has a unique `did` for privacy and interoperability.
- **Verifiable Credential (VC) Generation**: An API endpoint (`/api/v1/vc/nrp`) issues cryptographically signed NRP scores as VCs.

### 🔍 Regulation Mapping & Audit Trail Enhancement

- **Regulation Mapping Table**: `Regulation_Mappings` table links KUSHIM `metric_types` to mandated regulatory KPIs (e.g., CSDDD, ESRS).
- **Full Audit Report Generator**: An API endpoint (`/api/v1/compliance/report`) generates structured compliance reports from `Verified_Claims` data.
- **Context Multiplier Versioning**: `Context_Multipliers` table enforces immutable versioning, with `Verified_Claims` linking to specific multiplier versions.

### 🔗 Digital Product Passport (DPP) Integration

- **Product Identifier Table**: `Product_Identifiers` table links standard identifiers (GTIN, SKU, Serial) to entities and specific `Verified_Claims`.
- **Lifecycle Data Endpoint**: An API endpoint (`/api/v1/dpp/product/:id`) compiles relevant KUSHIM data into a standardized JSON format for DPP.
- **Reputation Scoring**: The NRP API (`/api/v1/nrp_score`) flags entities with "Bronze_SelfReport" verification levels that are older than 12 months with a `Risk_Flag: 'Low_Trust'`.

### 📈 Financial Risk Integration (The Insurance Wedge)

- **Resilience-Adjusted Pricing API**: An API endpoint (`/api/v1/risk_model`) translates NRP scores into a `Risk Mitigation Factor` for actuarial models, providing an `Adjusted P_loss`.
- **Industry-Specific Context Models**: The context engine (in `jobs/claimsProcessor.js`) now uses `entity_type` to apply specialized, high-resolution multipliers (e.g., different water scarcity factors for Cotton vs. Wheat farming).
- **Creditworthiness Score (K-Score)**: The NRP API (`/api/v1/nrp_score`) now publishes a composite KUSHIM Creditworthiness Score (0-100) alongside Verified Claims.

### ⛓️ Protocol Hardening & Decentralized Ledger

- **Distributed Ledger Integration (DLT)**: `Verified_Claims` are mirrored to a simulated DLT (`DLT_Transactions` table) for immutability and auditability.
- **K-Score Tokenization (Conceptual)**: A Solidity smart contract (`contracts/BUToken.sol`) defines the logic for a non-transferable "Barley Unit" (BU) token representing verified resilience.
- **Zero-Knowledge Proof (ZKP) Service**: An API endpoint (`/api/v1/zkp/prove`) allows entities to prove a claim (e.g., "NRP > X") without revealing the underlying value.

### 🎯 Governance and Exit Strategy Finalization

- **Protocol Governance Layer**: `Governance_Proposals` and `Governance_Votes` tables enable community/stakeholder voting on changes to `Context_Multipliers` via API endpoints.
- **The Open Source Release**: Project components are prepared for public release, evidenced by `LICENSE` (MIT) and `CONTRIBUTING.md` files.
- **Public Benefit Integration**: KUSHIM's commitment as a Public Benefit Corporation (PBC) is articulated in `LEGAL.md`, reflecting its mission-driven fiduciary duty.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- PostgreSQL database

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/usama-mangi/kushim-web.git
    cd kushim-web
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Database Setup:**
    - Ensure PostgreSQL is running.
    - Create a database (e.g., `kushim_db`).
    - Set your database connection details in environment variables or directly in `db/index.js` (not recommended for production).
      ```bash
      export DB_USER=kushim_user
      export DB_HOST=localhost
      export DB_NAME=kushim_db
      export DB_PASSWORD=kushim_password
      export DB_PORT=5432
      ```
    - Apply the schema and seed initial data:
      ```bash
      # Note: The provided schema.sql and seed.sql are designed for initial setup.
      # For a fresh start, you might need to drop the database first.
      # You can use a tool like 'psql' to run the SQL files:
      # psql -U $DB_USER -d $DB_NAME -f db/schema.sql
      # psql -U $DB_USER -d $DB_NAME -f db/seed.sql
      ```

### Running the Application

To start the API server:

```bash
npm start
```

The API will be available at `http://localhost:3000` (or your specified `PORT`).

## API Endpoints

A brief overview of key API endpoints:

- **Authentication**:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
- **NRP & Claims**:
  - `POST /api/v1/raw_reading` (Protected)
  - `GET /api/v1/nrp_score` (Protected, supports `entity_id` query param)
  - `GET /api/v1/claims` (Protected)
- **Verifiable Credentials**:
  - `GET /api/v1/vc/nrp` (Protected)
- **Compliance & Reporting**:
  - `GET /api/v1/compliance/report` (Protected, requires `startDate`, `endDate`)
- **Digital Product Passport (DPP)**:
  - `GET /api/v1/dpp/product/:id` (Public)
- **Risk Modeling**:
  - `POST /api/v1/risk_model` (Public, requires `entity_id`, `p_loss`)
- **Zero-Knowledge Proofs**:
  - `POST /api/v1/zkp/prove` (Public, requires `entity_id`, `threshold`)
- **Governance**:
  - `POST /api/v1/governance/proposals` (Protected)
  - `POST /api/v1/governance/proposals/:id/vote` (Protected)
  - `GET /api/v1/governance/proposals/:id` (Protected)

## Smart Contracts

The conceptual smart contract logic for the BU Token can be found in `contracts/BUToken.sol`.

## Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for guidelines.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Legal Status

KUSHIM is committed to operating as a Public Benefit Corporation (PBC). For details on our mission and accountability, refer to `LEGAL.md`.

---

**KUSHIM: Building the Infrastructure for a Resilient Future.**
