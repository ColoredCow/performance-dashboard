const GT_API_KEY = process.env.GT_API_KEY;

export async function startTest(url) {
  const body = { data: { type: "test", attributes: { url } } };
  const resp = await fetch("https://gtmetrix.com/api/2.0/tests", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(GT_API_KEY + ":").toString("base64"),
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`GTMetrix API failed: ${data.errors?.[0]?.title}`);
  return data.data.id;
}

export async function waitForReport(testId) {
  for (let i = 0; i < 30; i++) {
    const resp = await fetch(`https://gtmetrix.com/api/2.0/tests/${testId}`, {
      headers: { Authorization: "Basic " + Buffer.from(GT_API_KEY + ":").toString("base64") },
    });
    const data = await resp.json();
    const attrs = data?.data?.attributes || {};
    if (data?.data?.type === "report") return data.data;
    if (attrs.state === "error") return { error: true, attributes: attrs };
    console.log(`Waiting (${i + 1})... state: ${attrs.state}`);
    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error("Test timed out");
}

export function extractMetrics(report) {
  const a = report.attributes;
  return {
    report_id: String(report.id),
    page_name: "",
    url: String(a.url),
    gtmetrix_score: a.gtmetrix_score !== null ? Number(a.gtmetrix_score) : 0,
    performance_score: a.performance_score !== null ? Number(a.performance_score) : 0,
    structure_score: a.structure_score !== null ? Number(a.structure_score) : 0,
    largest_contentful_paint: a.largest_contentful_paint !== null ? Number(a.largest_contentful_paint) : 0,
    time_to_first_byte: a.time_to_first_byte !== null ? Number(a.time_to_first_byte) : 0,
    cumulative_layout_shift: a.cumulative_layout_shift !== null ? Number(a.cumulative_layout_shift) : 0,
    fully_loaded_time: a.fully_loaded_time !== null ? Number(a.fully_loaded_time) : 0,
    page_size: a.page_bytes !== null ? Number(a.page_bytes) : 0,
    report_grade: String(a.gtmetrix_grade || "N/A"),
    test_date: new Date().toISOString(),
    report_url: String(report.links?.report_url || "")
  };
}
