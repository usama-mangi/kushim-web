# Performance Optimization Migration

## Database Indexes Added

This update adds strategic indexes to improve query performance:

### User Table
- `customerId` - Foreign key lookups
- `role` - Role-based filtering

### Control Table
- `category` - Category filtering
- `integrationType` - Integration type filtering

### Evidence Table
- `integrationId` - Integration-based queries
- `(customerId, controlId)` - Composite index
- `(customerId, collectedAt)` - Time-based queries

### ComplianceCheck Table
- `(customerId, status)` - Alert queries
- `(customerId, checkedAt)` - Time-based queries
- `(customerId, controlId, checkedAt)` - Control history

### Integration Table
- `(customerId, type)` - Customer integration lookups
- `(customerId, status)` - Status filtering

## Applying the Migration

When the database is available, run:

```bash
cd apps/backend
npm run migrate
```

This will create and apply the migration automatically.

## Testing

After applying the migration:

1. Verify indexes were created:
```sql
\d users
\d controls
\d evidence
\d compliance_checks
\d integrations
```

2. Test query performance with EXPLAIN ANALYZE:
```sql
EXPLAIN ANALYZE SELECT * FROM compliance_checks 
WHERE customer_id = 'xxx' AND status = 'FAIL';
```

You should see "Index Scan" instead of "Seq Scan" for indexed columns.
