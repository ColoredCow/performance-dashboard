import fs from "fs";
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery({
  projectId: process.env.PROJECT_ID,
  keyFilename: process.env.SERVICE_ACCOUNT_KEY,
});

export async function insertToBigQueryBatch(row) {
  const dataset = bigquery.dataset(process.env.DATASET_ID);
  const table = dataset.table(process.env.TABLE_ID);
  const filePath = `./tmp/result_${row.report_id}.json`;

  if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp");
  fs.writeFileSync(filePath, JSON.stringify(row) + "\n");

  const metadata = {
    sourceFormat: 'NEWLINE_DELIMITED_JSON',
    writeDisposition: 'WRITE_APPEND',
    schemaUpdateOptions: ['ALLOW_FIELD_ADDITION'],
    schema: {
      fields: [
        { name: 'report_id', type: 'STRING' },
        { name: 'page_name', type: 'STRING' },
        { name: 'url', type: 'STRING' },
        { name: 'gtmetrix_score', type: 'FLOAT' },
        { name: 'performance_score', type: 'FLOAT' },
        { name: 'structure_score', type: 'FLOAT' },
        { name: 'largest_contentful_paint', type: 'FLOAT' },
        { name: 'time_to_first_byte', type: 'FLOAT' },
        { name: 'cumulative_layout_shift', type: 'FLOAT' },
        { name: 'fully_loaded_time', type: 'FLOAT' },
        { name: 'page_size', type: 'INTEGER' },
        { name: 'seo_score', type: 'FLOAT' },
        { name: 'accessibility_score', type: 'FLOAT' },
        { name: 'report_grade', type: 'STRING' },
        { name: 'test_date', type: 'TIMESTAMP' },
        { name: 'report_url', type: 'STRING' },
        { name: 'env', type: 'STRING' }
      ]
    }
  };

  try {
    await table.load(filePath, metadata);
    console.log("Data loaded to BigQuery:", row.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error("BigQuery Load Error:", err.message);
    throw err;
  }
}

export async function runQuery(sql) {
  const options = {
    query: sql,
    location: 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (err) {
    console.error("BigQuery Query Error:", err.message);
    throw err;
  }
}
