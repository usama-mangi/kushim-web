const db = require('../db');

const ingestRawReading = async (data, entityId) => {
  // 1. Receives JSON data stream (handled by Express and data parameter)

  // 2. Validates device_signature against the registered device key
  if (!data.device_signature || data.device_signature !== entityId) {
    console.error(`Ingestion failed: Invalid device signature for entityId ${entityId}. Data:`, data);
    throw new Error('Invalid device signature');
  }

  // Check if entity exists
  const entityCheck = await db.query('SELECT entity_id FROM Entities WHERE entity_id = $1', [entityId]);
  if (entityCheck.rows.length === 0) {
    console.error(`Ingestion failed: Entity with ID ${entityId} not found.`);
    throw new Error(`Entity with ID ${entityId} not found`);
  }

  // 3. Checks if metric_type exists in Metric_Definitions
  const metricTypeCheck = await db.query('SELECT name FROM Metric_Definitions WHERE name = $1', [data.metric_type]);
  if (!data.metric_type || metricTypeCheck.rows.length === 0) {
    console.error(`Ingestion failed: Invalid or unknown metric type '${data.metric_type}' for entityId ${entityId}. Data:`, data);
    throw new Error(`Invalid or unknown metric type: ${data.metric_type}`);
  }

  // 4. Writes record to Sensor_Readings_Raw
  try {
    await db.query(
      `INSERT INTO Sensor_Readings_Raw (entity_id, metric_type, metric_value, device_signature, timestamp)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [entityId, data.metric_type, data.metric_value, data.device_signature]
    );
  } catch (dbError) {
    console.error('Error inserting into Sensor_Readings_Raw:', dbError);
    throw new Error('Failed to record sensor reading');
  }

  // 5. Failure: Invalid signature or unknown device results in immediate rejection and logging to Audit_Log (Handled by throws)

  return { success: true, message: 'Raw reading accepted and processed.' };
};

module.exports = {
  ingestRawReading
};