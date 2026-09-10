module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed. Use GET." }); return; }

  const apiKey = process.env.DGS_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "Server misconfigured: DGS_API_KEY not set." }); return; }

  const date = req.query && req.query.date;
  const upstreamUrl = new URL("https://api-open.data.gov.sg/v2/real-time/api/psi");
  if (date) upstreamUrl.searchParams.set("date", String(date));

  try {
    const upstream = await fetch(upstreamUrl.toString(), { headers: { "x-api-key": apiKey } });
    const bodyText = await upstream.text();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.setHeader("Content-Type", "application/json");
    res.status(upstream.status).send(bodyText);
  } catch (err) {
    res.status(502).json({ error: "Could not reach data.gov.sg", detail: String(err && err.message ? err.message : err) });
  }
};
