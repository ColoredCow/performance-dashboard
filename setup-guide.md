# Performance Dashboard Setup Guide

> **A reusable template for setting up automated page health monitoring with GTmetrix, Lighthouse, BigQuery, and Looker Studio.**

Clone this repository and follow the steps below to get a full performance monitoring pipeline running for your project.

---

## Table of Contents

1. [BigQuery Project Setup](#1-bigquery-project-setup)
2. [Page Health Performance Dashboard](#2-page-health-performance-dashboard)
3. [Visualize Performance Trends in Looker Studio](#3-visualize-performance-trends-in-looker-studio)

---

## 1. BigQuery Project Setup

### 1.1 Create a Google Cloud Project

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., `My Project Performance`)
3. Note down your **Project ID** and **Project Name**

### 1.2 Enable BigQuery API

1. In Cloud Console, search for **"BigQuery API"**
2. Click **"Enable"** to activate it

### 1.3 Create a Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **"Create Service Account"**
3. Fill in:
   - **Service Account Name** (e.g., `performance-dashboard`)
   - **Service Account ID** (auto-filled)
4. Click **"Create and Continue"**
5. Set the role to **BigQuery Admin**
6. Note the service account **name**, **ID**, and **email**

### 1.4 Create and Download the Key

1. Click on the created service account
2. Go to the **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Select **JSON** format and click **"Create"**
5. **Save this file securely** — you will need it in subsequent steps

---

### 1.5 Set Up BigQuery Dataset and Table

#### Create Dataset

1. Open the [BigQuery Console](https://console.cloud.google.com/bigquery)
2. Click **"Create Dataset"**
3. Set a **Dataset ID** (e.g., `performance_data`)
4. Keep all other defaults and click **"Create dataset"**

#### Create Tables

Select the dataset you just created, then click **"Create Table"** for the table below.

**GTmetrix / Page Health table** — paste the following JSON under **Schema**:

```json
[
  { "name": "report_id", "type": "STRING", "mode": "NULLABLE" },
  { "name": "page_name", "type": "STRING", "mode": "NULLABLE" },
  { "name": "url", "type": "STRING", "mode": "NULLABLE" },
  { "name": "gtmetrix_score", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "performance_score", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "structure_score", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "largest_contentful_paint", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "time_to_first_byte", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "cumulative_layout_shift", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "fully_loaded_time", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "page_size", "type": "INTEGER", "mode": "NULLABLE" },
  { "name": "seo_score", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "accessibility_score", "type": "FLOAT", "mode": "NULLABLE" },
  { "name": "report_grade", "type": "STRING", "mode": "NULLABLE" },
  { "name": "test_date", "type": "TIMESTAMP", "mode": "NULLABLE" },
  { "name": "report_url", "type": "STRING", "mode": "NULLABLE" },
  { "name": "env", "type": "STRING", "mode": "NULLABLE" }
]
```

Click **"Create table"**.

---

## 2. Page Health Performance Dashboard

This section sets up the GTmetrix + Lighthouse pipeline that runs automatically via GitHub Actions.

### Step 1: Clone this Repository

```bash
git clone https://github.com/ColoredCow/performance-dashboard.git
cd performance-dashboard
```

### Step 2: Create a BigQuery Project

Follow the steps in [Section 1](#1-bigquery-project-setup) above.

### Step 3: Create the BigQuery Writer Key File

Create a file named `bigquery-writer-key.json` at the root of the project and paste the contents of the JSON key downloaded in [Step 1.4](#14-create-and-download-the-key):

```json
{
  "type": "service_account",
  "project_id": "YOUR_PROJECT_ID",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "YOUR_SERVICE_ACCOUNT_EMAIL",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "YOUR_CLIENT_CERT_URL",
  "universe_domain": "googleapis.com"
}
```

> This file is already listed in `.gitignore` — it will never be committed.

### Step 4: Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
GT_API_KEY=your_gtmetrix_api_key        # From your GTmetrix account → API settings
PROJECT_ID=your-google-cloud-project-id
DATASET_ID=your-bigquery-dataset-id
TABLE_ID=your-bigquery-table-id
SERVICE_ACCOUNT_KEY=./bigquery-writer-key.json
```

### Step 5: Update Target URLs

Open [`config/urls.js`](config/urls.js) and replace the placeholder entries with the pages you want to monitor:

```js
export const URLS_TO_TEST = [
  { label: "Home page",   url: "https://your-site.com/",     env: "live" },
  { label: "About page",  url: "https://your-site.com/about/", env: "live" },
  // Add as many entries as needed. Use env: "uat" for staging URLs.
];
```

### Step 6: Install Dependencies

```bash
npm install
```

### Step 7: Run the Script Locally

```bash
node index.js
```

**What happens:**

- GTmetrix tests run for all URLs matching `TARGET_ENV` (defaults to `live`)
- Local Lighthouse collects SEO and accessibility scores
- All metrics are inserted into your BigQuery table

### Step 8: Prepare for Visualization

Ensure you have run the script at least once so that data is available in BigQuery. You can then move to [Section 3](#3-visualize-performance-trends-in-looker-studio) to set up your Looker Studio dashboard.

### Step 9: Enable Automated Testing via GitHub Actions

1. Push the repository to GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions** and add these secrets:

| Secret name           | Value                                          |
|-----------------------|------------------------------------------------|
| `GT_API_KEY`          | Your GTmetrix API key                          |
| `PROJECT_ID`          | Your Google Cloud project ID                   |
| `DATASET_ID`          | Your BigQuery dataset ID                       |
| `TABLE_ID`            | Your BigQuery table ID                         |
| `SERVICE_ACCOUNT_KEY` | Full contents of your `bigquery-writer-key.json` |

3. The workflow in `.github/workflows/run-performance-tests.yaml` will run on the configured schedule automatically.

**End-to-end flow:**

```
GitHub Actions (scheduled) → GTmetrix + Lighthouse → BigQuery → Looker Studio
```

---

## 3. Visualize Performance Trends in Looker Studio

Once your automated tests are running and populating BigQuery, you can build a professional dashboard in Looker Studio to monitor trends over time.

### 3.1 Connect BigQuery to Looker Studio

1. Open [Looker Studio](https://lookerstudio.google.com/).
2. Create a **New Report**.
3. Add a data source → Select **BigQuery**.
4. Select your **Project**, **Dataset**, and **Table** created in Section 1.
5. Click **Add**.

### 3.2 Create Performance Charts

To create a dashboard showing GTmetrix Score, Page Size, Load Time, and Accessibility trends:

#### A. Set up the Dimension
- **Chart Type**: Time Series Chart.
- **Dimension**: `test_date` (Set type to **Date** or **Date & Time**).

#### B. Create Calculated Fields (Recommended)
In the Data pane, click **Add Field** to create user-friendly metrics:
- **Page Size (MB)**: `page_size / 1048576`
- **Fully Loaded Time (sec)**: `fully_loaded_time / 1000`

#### C. Configure Metrics
Drag the following into the **Metric** section of your charts:
- `gtmetrix_score`
- `fully_loaded_time` (or your calculated seconds field)
- `page_size` (or your calculated MB field)
- `accessibility_score`

#### D. Add Filtering
To isolate a specific page (e.g., "Product Details Page") and environment (e.g., "uat"):
1. Add a **Filter** to the chart or the page.
2. Set `page_name` Equal to `Product Details Page`.
3. Set `env` Equal to `uat`.

### 3.3 Add Target Reference Lines
To track your performance against goals (e.g., a GTmetrix score of 80+):
1. Select a chart and go to the **Style** tab.
2. Click **Add a reference line**.
3. Set the **Type** to `Constant Value`.
4. Enter your target (e.g., `80` for score, `3` for seconds).
5. Set the line style to **Dashed** and color to **Red**.
6. Add a **Label** (e.g., "GTM (80)").

---

