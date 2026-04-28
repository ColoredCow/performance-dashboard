import "dotenv/config";
import { URLS_TO_TEST } from "./config/urls.js";
import { startTest, waitForReport, extractMetrics } from "./services/gtmetrix.js";
import { insertToBigQueryBatch } from "./services/bigquery.js";
import { getLighthouseMetrics } from "./services/lighthouse.js";

(async () => {
  console.log(`Starting Full Batch Audit for ${URLS_TO_TEST.length} URLs...\n`);

  const targetEnv = process.env.TARGET_ENV || "live";
  const filteredUrls = URLS_TO_TEST.filter(u => u.env === targetEnv);

  for (const { label, url, env } of filteredUrls) {
    let row = {
      page_name: label,
      url: url,
      env: env,
      test_date: new Date().toISOString()
    };

    try {
      console.log(`\n [${label}] Step 1: Starting GTmetrix Test (Robust: Stop Onload + Aggressive Blocking)...`);
      let report;
      let lastErrorMessage = "";

      const attemptRun = async (attemptName, options) => {
        const tId = await startTest(url, options);
        const rep = await waitForReport(tId);
        if (rep.error) {
          throw new Error(rep.attributes?.error || "Unknown report error (Scores: 0)");
        }

        const metrics = extractMetrics(rep);
        const isErrorGrade = metrics.report_grade && metrics.report_grade.toLowerCase().includes("error");
        const hasNoScore = metrics.gtmetrix_score === 0 && metrics.performance_score === 0;
        if (isErrorGrade || hasNoScore) {
          throw new Error(metrics.report_grade || "Missing metrics data (Scores: 0)");
        }

        return rep;
      };

      try {
        report = await attemptRun("Attempt 1", {
          location: 4,
          lighthouse_throttle_cpu: 0,
          lighthouse_wait_until: 'onload',
          stop_onload: 1,
          block_urls: ['*google*', '*facebook*', '*hotjar*', '*clarity*', '*doubleclick*', '*analytics*', '*chat*']
        });
      } catch (err) {
        lastErrorMessage = err.message;
        console.error(`GTmetrix failure for ${label}: ${err.message}`);
        report = { error: true, attributes: { error: err.message } };
      }

      if (report.error) {
        const errMsg = report.attributes?.error || lastErrorMessage || "Unknown Error";
        console.error(`GTmetrix execution issue for ${label}: ${errMsg}. Skipping BigQuery upload for this page.`);
        console.log(`Waiting for 15s before next request...`);
        await new Promise(r => setTimeout(r, 15000));
        continue;
      }

      const metrics = extractMetrics(report);
      row = { ...row, ...metrics, page_name: label, env: env };

      console.log(`Step 2: Fetching Local Lighthouse metrics...`);
      const localMetrics = await getLighthouseMetrics(url);
      row.seo_score = localMetrics.seo_score;
      row.accessibility_score = localMetrics.accessibility_score;

      console.table([row]);

      await insertToBigQueryBatch(row);
      console.log(`SUCCESS: ${label} data is now in BigQuery.`);

    } catch (err) {
      console.error(`Fatal Error for ${label}: ${err.message}`);
    }

    console.log(`Waiting for 15s before next request...`);
    await new Promise(r => setTimeout(r, 15000));
  }

  console.log("\n Mission Accomplished: All URLs processed successfully!");
})();
