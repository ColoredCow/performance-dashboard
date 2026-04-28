/**
 * Add the pages you want to monitor here.
 * Each entry needs:
 *   label - friendly name shown in the dashboard
 *   url   - full URL to test
 *   env   - "live" or "uat" (controls which schedule triggers the test)
 */
export const URLS_TO_TEST = [
  { label: "Home page",           url: "https://your-site.com/",          env: "live" },
  { label: "Product list page",   url: "https://your-site.com/products/", env: "live" },
  { label: "Product detail page", url: "https://your-site.com/product/sample/", env: "live" },
  { label: "Home page",           url: "https://uat.your-site.com/",          env: "uat" },
  { label: "Product list page",   url: "https://uat.your-site.com/products/", env: "uat" },
];
