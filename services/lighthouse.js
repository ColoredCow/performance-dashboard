import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

export async function getLighthouseMetrics(url) {
  let chrome;
  try {
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'seo', 'accessibility'],
      port: chrome.port
    };

    const config = {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'desktop',
        throttlingMethod: 'provided',
        screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
      }
    };

    const runnerResult = await lighthouse(url, options, config);
    const lhr = runnerResult.lhr;

    return {
      seo_score: Number((lhr.categories.seo?.score || 0) * 100),
      accessibility_score: Number((lhr.categories.accessibility?.score || 0) * 100),
      performance_score: Number((lhr.categories.performance?.score || 0) * 100),
      largest_contentful_paint: Number(lhr.audits['largest-contentful-paint']?.numericValue || 0),
      time_to_first_byte: Number(lhr.audits['server-response-time']?.numericValue || 0),
      cumulative_layout_shift: Number(lhr.audits['cumulative-layout-shift']?.numericValue || 0),
      fully_loaded_time: Number(lhr.audits['interactive']?.numericValue || 0)
    };
  } catch (err) {
    console.error(`Lighthouse error for ${url}:`, err.message);
    return {
      seo_score: 0,
      accessibility_score: 0,
      performance_score: 0,
      largest_contentful_paint: 0,
      time_to_first_byte: 0,
      cumulative_layout_shift: 0,
      fully_loaded_time: 0
    };
  } finally {
    if (chrome) await chrome.kill();
  }
}
