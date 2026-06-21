/**
 * IP からおおよその所在地を取得する（ip-api.com・無料・キー不要・日本語対応）。
 *
 * 注意: 国レベルはほぼ正確だが市レベルは外れやすく、モバイル回線やVPNでは
 * 大きくズレる。あくまで「だいたいの目安」。無料枠は 45 リクエスト/分。
 */

export async function fetchIpLocation(ip: string): Promise<string | null> {
  if (!ip) return null;
  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city&lang=ja`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      country?: string;
      regionName?: string;
      city?: string;
    };
    if (data.status !== "success") return null;
    const parts = [data.country, data.regionName, data.city].filter(Boolean);
    return parts.length > 0 ? parts.join(" / ") : null;
  } catch {
    return null;
  }
}
