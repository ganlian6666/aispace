var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/admin/export.js
async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!env.ADMIN_PASSWORD || key !== env.ADMIN_PASSWORD) {
    return new Response("Unauthorized", { status: 401 });
  }
  const type = url.searchParams.get("type") || "submissions";
  try {
    let query = "";
    if (type === "websites") {
      query = "SELECT id, name, description, invite_link, display_url FROM websites ORDER BY id ASC";
    } else {
      query = "SELECT id, name, description, invite_link as invite_link, url as display_url FROM submissions ORDER BY created_at DESC";
    }
    const { results } = await env.DB.prepare(query).all();
    if (!results || results.length === 0) {
      return new Response("No data found", { status: 200 });
    }
    return new Response(JSON.stringify(results, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}_export.json"`
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
__name(onRequestGet, "onRequestGet");

// api/admin/feedback.js
async function onRequestGet2(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = request.headers.get("X-Admin-Key");
  if (key !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM feedback ORDER BY created_at DESC"
    ).all();
    return new Response(JSON.stringify(results));
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
__name(onRequestGet2, "onRequestGet");
async function onRequestDelete(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = request.headers.get("X-Admin-Key");
  const id = url.searchParams.get("id");
  if (key !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!id) {
    return new Response(JSON.stringify({ error: "ID required" }), { status: 400 });
  }
  try {
    if (id.includes(",")) {
      const ids = id.split(",");
      const placeholders = ids.map(() => "?").join(",");
      await env.DB.prepare(`DELETE FROM feedback WHERE id IN (${placeholders})`).bind(...ids).run();
    } else {
      await env.DB.prepare("DELETE FROM feedback WHERE id = ?").bind(id).run();
    }
    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
__name(onRequestDelete, "onRequestDelete");

// api/admin/update_news.js
async function onRequest(context) {
  const { env } = context;
  const clientIP = context.request.headers.get("CF-Connecting-IP") || "unknown";
  const url = new URL(context.request.url);
  const key = url.searchParams.get("key");
  const isAuthorized = env.ADMIN_PASSWORD && key === env.ADMIN_PASSWORD;
  if (!isAuthorized) {
    const limitRecord = await env.DB.prepare("SELECT last_updated FROM rate_limits WHERE ip = ?").bind(clientIP).first();
    if (limitRecord) {
      const lastUpdated = new Date(limitRecord.last_updated);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now - lastUpdated;
      const diffMins = Math.floor(diffMs / 6e4);
      if (diffMins < 60) {
        return new Response(JSON.stringify({
          error: "Too Many Requests",
          message: `\u5DF2\u7ECF\u662F\u6700\u65B0\u4FE1\u606F\u5566\uFF0C\u8BF7\u4E0D\u8981\u9891\u7E41\u5237\u65B0\uFF0C\u8C22\u8C22\uFF01`,
          remaining_minutes: 60 - diffMins
        }), {
          status: 429,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  }
  try {
    const newsItems = [];
    try {
      const tcRes = await fetch("https://techcrunch.com/category/artificial-intelligence/feed/");
      const tcText = await tcRes.text();
      let tcItems = parseRSS(tcText, "TechCrunch");
      tcItems = filterNewsItems(tcItems);
      newsItems.push(...tcItems);
    } catch (e) {
      console.error("Failed to fetch TechCrunch:", e);
    }
    try {
      const krRes = await fetch("https://36kr.com/feed");
      const krText = await krRes.text();
      let krItems = parseRSS(krText, "36Kr");
      krItems = filterNewsItems(krItems);
      newsItems.push(...krItems);
    } catch (e) {
      console.error("Failed to fetch 36Kr:", e);
    }
    newsItems.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    const topNews = newsItems.slice(0, 15);
    const processedNews = [];
    for (const item of topNews) {
      if (item.url) {
        item.url = item.url.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").trim();
      }
      processedNews.push(item);
    }
    const stmtInsert = env.DB.prepare(`
      INSERT OR IGNORE INTO news (title, summary, source, url, published_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    let insertedCount = 0;
    for (const item of processedNews) {
      const res = await stmtInsert.bind(
        item.title,
        item.summary,
        item.source,
        item.url,
        item.published_at.toISOString()
      ).run();
      if (res.meta.changes > 0) insertedCount++;
    }
    await env.DB.prepare(`
        DELETE FROM news 
        WHERE id NOT IN (
            SELECT id FROM news ORDER BY published_at DESC LIMIT 45
        )
        `).run();
    const response = new Response(JSON.stringify({
      status: "success",
      fetched: newsItems.length,
      processed: processedNews.length,
      inserted: insertedCount
    }), {
      headers: { "Content-Type": "application/json" }
    });
    if (!isAuthorized) {
      await env.DB.prepare(`
                INSERT INTO rate_limits (ip, last_updated) VALUES (?, datetime('now'))
                ON CONFLICT(ip) DO UPDATE SET last_updated = datetime('now')
            `).bind(clientIP).run();
    }
    return response;
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequest, "onRequest");
function parseRSS(xml, source) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match2;
  while ((match2 = itemRegex.exec(xml)) !== null) {
    const itemContent = match2[1];
    let title = "No Title";
    const titleCdataMatch = itemContent.match(/<title>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/title>/);
    const titleSimpleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
    if (titleCdataMatch) {
      title = titleCdataMatch[1].trim();
    } else if (titleSimpleMatch) {
      title = decodeHTML(titleSimpleMatch[1].trim());
    }
    let link = "";
    const linkCdataMatch = itemContent.match(/<link>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/link>/);
    const linkSimpleMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
    if (linkCdataMatch) {
      link = linkCdataMatch[1].trim();
    } else if (linkSimpleMatch) {
      link = linkSimpleMatch[1].trim();
    }
    const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
    const pubDate = dateMatch ? new Date(dateMatch[1]) : /* @__PURE__ */ new Date();
    let summary = "";
    const descCdataMatch = itemContent.match(/<description>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/description>/);
    const descSimpleMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
    if (descCdataMatch) {
      summary = descCdataMatch[1];
    } else if (descSimpleMatch) {
      summary = descSimpleMatch[1];
    }
    summary = summary.replace(/<[^>]+>/g, "");
    summary = decodeHTML(summary);
    summary = summary.substring(0, 150) + (summary.length > 150 ? "..." : "");
    if (title && link) {
      items.push({
        title,
        url: link,
        published_at: pubDate,
        summary,
        source
      });
    }
  }
  return items;
}
__name(parseRSS, "parseRSS");
function decodeHTML(html) {
  const map = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " "
  };
  return html.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (m) => map[m]);
}
__name(decodeHTML, "decodeHTML");
function filterNewsItems(items) {
  const keywords = [
    "ai",
    "\u4EBA\u5DE5\u667A\u80FD",
    "\u6A21\u578B",
    "gpt",
    "\u5927\u8BED\u8A00",
    "\u795E\u7ECF\u7F51\u7EDC",
    "deepmind",
    "openai",
    "anthropic",
    "deepseek",
    "gemini",
    "codex",
    "claude",
    "\u5F3A\u5316\u5B66\u4E60",
    "sutton",
    "karpathy",
    "ilya",
    "llm",
    "transformer"
  ];
  return items.filter((item) => {
    const title = item.title.toLowerCase();
    return keywords.some((k) => title.includes(k));
  });
}
__name(filterNewsItems, "filterNewsItems");

// api/admin/websites.js
async function onRequest2(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  try {
    const authKey = request.headers.get("X-Admin-Key");
    const correctKey = env.ADMIN_PASSWORD;
    const ip = request.headers.get("CF-Connecting-IP") || "127.0.0.1";
    const { results: attempts } = await env.DB.prepare("SELECT count FROM login_attempts WHERE ip = ?").bind(ip).all();
    const failCount = attempts.length > 0 ? attempts[0].count : 0;
    if (!correctKey || authKey !== correctKey) {
      const newCount = failCount + 1;
      await env.DB.prepare(
        "INSERT OR REPLACE INTO login_attempts (ip, count, last_attempt) VALUES (?, ?, datetime('now'))"
      ).bind(ip, newCount).run();
      let delaySeconds = Math.pow(2, newCount - 1);
      if (delaySeconds > 60) delaySeconds = 60;
      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1e3));
      return new Response(JSON.stringify({ error: "Unauthorized", retry_after: delaySeconds }), { status: 401 });
    }
    if (failCount > 0) {
      await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
    }
    const type = url.searchParams.get("type") || "websites";
    if (request.method === "GET") {
      return await handleList(env, type);
    } else if (request.method === "POST") {
      return await handleAdd(request, env);
    } else if (request.method === "PUT") {
      return await handleUpdate(request, env, type);
    } else if (request.method === "DELETE") {
      return await handleDelete(url, env, type);
    }
    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
__name(onRequest2, "onRequest");
async function handleList(env, type) {
  let table = "websites";
  let orderBy = "id DESC";
  if (type === "submissions") {
    table = "submissions";
  } else if (type === "news") {
    table = "news";
    orderBy = "published_at DESC";
  }
  const { results } = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all();
  return new Response(JSON.stringify(results), { status: 200 });
}
__name(handleList, "handleList");
async function handleAdd(request, env) {
  const data = await request.json();
  if (Array.isArray(data)) {
    const overwrite = new URL(request.url).searchParams.get("overwrite") === "true";
    let successCount = 0;
    const stmtInsert = env.DB.prepare("INSERT INTO websites (name, description, invite_link, display_url) VALUES (?, ?, ?, ?)");
    const stmtInsertWithId = env.DB.prepare("INSERT INTO websites (id, name, description, invite_link, display_url) VALUES (?, ?, ?, ?, ?)");
    const stmtUpdate = env.DB.prepare("UPDATE websites SET name = ?, description = ?, invite_link = ?, display_url = ? WHERE id = ?");
    for (const item of data) {
      const id = item.id;
      const name2 = item.name;
      const desc = item.description || "";
      const invite = item.invite_link || item.url || "";
      const display = item.display_url || item.url || "";
      if (!name2 || !invite && !display) continue;
      try {
        if (id) {
          if (overwrite) {
            const res2 = await stmtUpdate.bind(name2, desc, invite, display, id).run();
            if (res2.meta.changes > 0) {
              successCount++;
            } else {
              await stmtInsertWithId.bind(id, name2, desc, invite, display).run();
              successCount++;
            }
          } else {
            await stmtInsertWithId.bind(id, name2, desc, invite, display).run();
            successCount++;
          }
        } else {
          await stmtInsert.bind(name2, desc, invite, display).run();
          successCount++;
        }
      } catch (e) {
        console.error(`Import error for ${name2}:`, e);
      }
    }
    return new Response(JSON.stringify({ success: true, count: successCount }), { status: 200 });
  }
  const { name, description, invite_link, display_url } = data;
  if (!name || !invite_link || !display_url) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }
  const res = await env.DB.prepare(
    "INSERT INTO websites (name, description, invite_link, display_url) VALUES (?, ?, ?, ?)"
  ).bind(name, description, invite_link, display_url).run();
  return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), { status: 201 });
}
__name(handleAdd, "handleAdd");
async function handleUpdate(request, env, type) {
  const data = await request.json();
  const { id, new_id, name, description, invite_link, display_url, url } = data;
  if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });
  const table = type === "submissions" ? "submissions" : "websites";
  if (new_id && new_id != id) {
    const { results } = await env.DB.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(new_id).all();
    if (results.length > 0) {
      return new Response(JSON.stringify({ error: `ID ${new_id} already exists` }), { status: 409 });
    }
  }
  const targetId = new_id || id;
  if (type === "websites") {
    await env.DB.prepare(
      "UPDATE websites SET id = ?, name = ?, description = ?, invite_link = ?, display_url = ? WHERE id = ?"
    ).bind(targetId, name, description, invite_link, display_url, id).run();
    if (new_id && new_id != id) {
      await env.DB.prepare("UPDATE likes SET card_id = ? WHERE card_id = ?").bind(new_id, id).run();
      await env.DB.prepare("UPDATE comments SET card_id = ? WHERE card_id = ?").bind(new_id, id).run();
    }
  } else if (type === "submissions") {
    const targetUrl = url || display_url;
    await env.DB.prepare(
      "UPDATE submissions SET id = ?, name = ?, description = ?, invite_link = ?, url = ? WHERE id = ?"
    ).bind(targetId, name, description, invite_link, targetUrl, id).run();
  } else if (type === "news") {
    const targetUrl = url || display_url;
    await env.DB.prepare(
      "UPDATE news SET id = ?, title = ?, summary = ?, url = ? WHERE id = ?"
    ).bind(targetId, name, description, targetUrl, id).run();
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
__name(handleUpdate, "handleUpdate");
async function handleDelete(url, env, type) {
  const idParam = url.searchParams.get("id");
  const idsParam = url.searchParams.get("ids");
  let ids = [];
  if (idsParam) {
    ids = idsParam.split(",").map((i) => i.trim()).filter((i) => i);
  } else if (idParam) {
    ids = [idParam];
  }
  if (ids.length === 0) {
    return new Response(JSON.stringify({ error: "Missing ID(s)" }), { status: 400 });
  }
  let table = "websites";
  if (type === "submissions") table = "submissions";
  if (type === "news") table = "news";
  const placeholders = ids.map(() => "?").join(",");
  const stmt = env.DB.prepare(`DELETE FROM ${table} WHERE id IN (${placeholders})`).bind(...ids);
  await stmt.run();
  if (type === "websites") {
    const likesStmt = env.DB.prepare(`DELETE FROM likes WHERE card_id IN (${placeholders})`).bind(...ids);
    const commentsStmt = env.DB.prepare(`DELETE FROM comments WHERE card_id IN (${placeholders})`).bind(...ids);
    await likesStmt.run();
    await commentsStmt.run();
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
__name(handleDelete, "handleDelete");

// api/comments.js
async function onRequestGet3(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const card_id = url.searchParams.get("card_id");
  if (!card_id) return new Response(JSON.stringify([]), { status: 200 });
  try {
    const { results } = await env.DB.prepare(
      "SELECT nickname, content, created_at FROM comments WHERE card_id = ? ORDER BY created_at DESC"
    ).bind(card_id).all();
    return new Response(JSON.stringify(results), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
__name(onRequestGet3, "onRequestGet");
async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  try {
    const { card_id, nickname, content } = await request.json();
    const { results } = await env.DB.prepare(
      "SELECT count(*) as count FROM comments WHERE ip = ? AND card_id = ? AND created_at > datetime('now', '-1 day')"
    ).bind(ip, card_id).all();
    if (results[0].count >= 3) {
      return new Response(JSON.stringify({ error: "Daily comment limit reached for this item" }), { status: 429 });
    }
    await env.DB.prepare(
      "INSERT INTO comments (card_id, nickname, content, ip) VALUES (?, ?, ?, ?)"
    ).bind(card_id, nickname || "Anonymous", content, ip).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
__name(onRequestPost, "onRequestPost");

// api/feedback.js
async function onRequestPost2(context) {
  const { request, env } = context;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  try {
    const body = await request.json();
    const { content, contact } = body;
    if (!content) {
      return new Response(JSON.stringify({ error: "Content is required" }), { status: 400 });
    }
    const { results } = await env.DB.prepare(
      "SELECT count(*) as count FROM feedback WHERE ip = ? AND created_at > datetime('now', '-1 day')"
    ).bind(ip).all();
    if (results[0].count >= 5) {
      return new Response(JSON.stringify({ error: "Daily feedback limit reached" }), { status: 429 });
    }
    await env.DB.prepare(
      "INSERT INTO feedback (content, contact, ip) VALUES (?, ?, ?)"
    ).bind(content, contact, ip).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
__name(onRequestPost2, "onRequestPost");

// api/likes.js
async function onRequestGet4(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(
      "SELECT card_id, COUNT(*) as count FROM likes GROUP BY card_id"
    ).all();
    const likesMap = {};
    results.forEach((r) => likesMap[r.card_id] = r.count);
    return new Response(JSON.stringify(likesMap), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
__name(onRequestGet4, "onRequestGet");
async function onRequestPost3(context) {
  const { request, env } = context;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  try {
    const { card_id } = await request.json();
    const { results } = await env.DB.prepare(
      "SELECT count(*) as count FROM likes WHERE ip = ? AND card_id = ? AND created_at > datetime('now', '-1 day')"
    ).bind(ip, card_id).all();
    if (results[0].count >= 3) {
      return new Response(JSON.stringify({ error: "Daily like limit reached for this item" }), { status: 429 });
    }
    await env.DB.prepare(
      "INSERT INTO likes (card_id, ip) VALUES (?, ?)"
    ).bind(card_id, ip).run();
    const { results: countResult } = await env.DB.prepare(
      "SELECT count(*) as count FROM likes WHERE card_id = ?"
    ).bind(card_id).all();
    return new Response(JSON.stringify({ success: true, count: countResult[0].count }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
__name(onRequestPost3, "onRequestPost");

// api/news.js
async function onRequestGet5(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 15;
  const offset = (page - 1) * limit;
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM news ORDER BY published_at DESC LIMIT ? OFFSET ?"
    ).bind(limit, offset).all();
    const news = results.map((item) => {
      const date = new Date(item.published_at);
      return {
        ...item,
        formatted_date: `${date.getMonth() + 1}\u6708${date.getDate()}\u65E5 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
      };
    });
    return new Response(JSON.stringify(news), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
__name(onRequestGet5, "onRequestGet");

// api/status.js
async function onRequestGet6(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare("SELECT id, display_url, last_checked FROM websites").all();
    if (!results || results.length === 0) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    const now = Date.now();
    const sitesToUpdate = results.filter((site) => {
      if (!site.last_checked) return true;
      const lastChecked = new Date(site.last_checked).getTime();
      return now - lastChecked > 360 * 60 * 1e3;
    });
    if (sitesToUpdate.length > 0) {
      await updateStatuses(env, sitesToUpdate);
    }
    const { results: finalResults } = await env.DB.prepare("SELECT id as card_id, display_url as url, status, latency, last_checked FROM websites").all();
    return new Response(JSON.stringify(finalResults), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
__name(onRequestGet6, "onRequestGet");
async function updateStatuses(env, sites) {
  const updates = await Promise.all(sites.map(async (site) => {
    const start = Date.now();
    let status = "offline";
    let latency = 0;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8e3);
      const res = await fetch(site.display_url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          // 伪装成普通浏览器
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        }
      });
      clearTimeout(timeoutId);
      if (res.ok || res.status === 403 || res.status === 401 || res.status === 503) {
        status = "online";
      }
      latency = Date.now() - start;
    } catch (e) {
      status = "offline";
      latency = 0;
    }
    return { ...site, status, latency };
  }));
  const stmt = env.DB.prepare(
    "UPDATE websites SET status = ?, latency = ?, last_checked = datetime('now') WHERE id = ?"
  );
  const batch = updates.map((u) => stmt.bind(u.status, u.latency, u.id));
  await env.DB.batch(batch);
  return updates.map((u) => ({
    card_id: u.id,
    url: u.display_url,
    status: u.status,
    latency: u.latency,
    last_checked: (/* @__PURE__ */ new Date()).toISOString()
  }));
}
__name(updateStatuses, "updateStatuses");

// api/submit.js
async function onRequestPost4(context) {
  const { request, env } = context;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  try {
    const body = await request.json();
    const { name, url, invite_link, description } = body;
    if (!name || !url) {
      return new Response(JSON.stringify({ error: "Name and URL are required" }), { status: 400 });
    }
    const { results: limitCheck } = await env.DB.prepare(
      "SELECT count(*) as count FROM submissions WHERE ip = ? AND created_at > datetime('now', '-1 day')"
    ).bind(ip).all();
    if (limitCheck[0].count >= 5) {
      return new Response(JSON.stringify({ error: "Daily submission limit reached" }), { status: 429 });
    }
    const domain = extractDomain(url);
    if (!domain) {
      return new Response(JSON.stringify({ error: "Invalid URL" }), { status: 400 });
    }
    const { results: existingWebsites } = await env.DB.prepare(
      "SELECT display_url FROM websites"
    ).all();
    const isDuplicateWebsite = existingWebsites.some((site) => extractDomain(site.display_url) === domain);
    const { results: existingSubmissions } = await env.DB.prepare(
      "SELECT url FROM submissions"
    ).all();
    const isDuplicateSubmission = existingSubmissions.some((sub) => extractDomain(sub.url) === domain);
    if (isDuplicateWebsite || isDuplicateSubmission) {
      return new Response(JSON.stringify({ error: "\u4E0D\u597D\uFF0C\u6709\u4EBA\u5FEB\u4F60\u4E00\u6B65\u63D0\u4EA4\u4E86\u8BE5\u7F51\u7AD9\uFF0C\u611F\u8C22\u652F\u6301\uFF01" }), { status: 409 });
    }
    await env.DB.prepare(
      "INSERT INTO submissions (name, url, invite_link, description, ip) VALUES (?, ?, ?, ?, ?)"
    ).bind(name, url, invite_link, description, ip).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
__name(onRequestPost4, "onRequestPost");
function extractDomain(urlStr) {
  try {
    let hostname = new URL(urlStr).hostname;
    if (hostname.startsWith("www.")) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch (e) {
    return null;
  }
}
__name(extractDomain, "extractDomain");

// utils/i18n.js
var translations = {
  // 中文
  zh: {
    // Shared
    brand_name: "\u81EA\u7531\u7A7A\u95F4",
    brand_subtitle: "\u81EA\u7531AI\u7A7A\u95F4\xB7\u5F00\u653E\u5206\u4EAB\u5E73\u53F0",
    nav_home: "API\u4E2D\u8F6C\u6C47\u805A",
    nav_news: "AI \u524D\u6CBF\u52A8\u6001",
    nav_vpn: "VPN",
    nav_guide: "\u914D\u7F6E\u6307\u5357",
    github_text: "GitHub",
    // Home (index.js)
    home_title: "API\u4E2D\u8F6C\u6C47\u805A \xB7 \u81EA\u7531\u7A7A\u95F4",
    hero_title: "\u4E0D\u5B9A\u671F\u5206\u4EAB\u4F18\u8D28API\u63A5\u53E3",
    hero_subtitle: "\u6BCF\u4E00\u6761 API \u90FD\u7ECF\u8FC7\u4EBA\u5DE5\u68C0\u6D4B\uFF0C\u57FA\u672C\u652F\u6301claude code\uFF0Ccodex\u548C\u56FD\u5185\u4F18\u8D28AI\u6A21\u578B\uFF0C\u8BF7\u653E\u5FC3\u4F7F\u7528\uFF01",
    submit_hint: "\u6B22\u8FCE\u5206\u4EAB\u7A33\u5B9A\u9AD8\u6548\u7684\u4E2D\u8F6C\u7AD9!",
    btn_submit: "\u63D0\u4EA4\u7F51\u7AD9",
    status_checking: "\u68C0\u6D4B\u4E2D",
    btn_invite_copy: "\u9080\u8BF7\u94FE\u63A5 \xB7 \u590D\u5236",
    btn_copied: "\u5DF2\u590D\u5236!",
    text_last_checked: "\u6700\u540E\u68C0\u6D4B",
    text_never_checked: "\u4ECE\u672A\u68C0\u6D4B",
    comment_placeholder: "\u8F93\u5165\u8BC4\u8BBA...",
    btn_send: "\u53D1\u9001",
    nickname_current: "\u5F53\u524D\u6635\u79F0",
    btn_modify: "[\u4FEE\u6539]",
    modal_submit_title: "\u63D0\u4EA4\u65B0\u7684\u4E2D\u8F6C\u7AD9",
    modal_submit_desc: "\u6B22\u8FCE\u5206\u4EAB\u4F60\u7684\u4E2D\u8F6C\u7AD9\uFF0C\u63D0\u4EA4\u540E\u9700\u8981\u5BA1\u6838\u9A8C\u8BC1\uFF0C\u901A\u8FC7\u7684\u4F1A\u5C06\u4F60\u7684\u9080\u8BF7\u94FE\u63A5\u6302\u5230\u4E3B\u9875\u4E0A\uFF01",
    label_name: "\u4E2D\u8F6C\u7AD9\u540D\u79F0 *",
    placeholder_name: "\u4F8B\u5982: OpenAI\u5B98\u65B9API",
    label_url: "\u7F51\u7AD9\u5730\u5740 *",
    placeholder_url: "\u4F8B\u5982: https://chatgpt.com/",
    label_invite: "\u9080\u8BF7\u94FE\u63A5",
    placeholder_invite: "\u4F8B\u5982: https://chatgpt.com/invite?code=abc",
    label_desc: "\u7B80\u5355\u63CF\u8FF0",
    placeholder_desc: "\u7B80\u5355\u4ECB\u7ECD\u4E00\u4E0B...",
    btn_feedback: "\u53CD\u9988\u5EFA\u8BAE",
    btn_cancel: "\u53D6\u6D88",
    btn_submit_confirm: "\u63D0\u4EA4",
    modal_feedback_title: "\u610F\u89C1\u53CD\u9988",
    modal_feedback_desc: "\u65E0\u8BBA\u662F Bug \u62A5\u544A\u8FD8\u662F\u529F\u80FD\u5EFA\u8BAE\uFF0C\u6211\u4EEC\u90FD\u975E\u5E38\u6B22\u8FCE\uFF01",
    label_feedback_content: "\u53CD\u9988\u5185\u5BB9 *",
    placeholder_feedback_content: "\u8BF7\u8BE6\u7EC6\u63CF\u8FF0\u60A8\u7684\u5EFA\u8BAE\u6216\u9047\u5230\u7684\u95EE\u9898...",
    label_contact: "\u8054\u7CFB\u65B9\u5F0F (\u9009\u586B)",
    placeholder_contact: "\u90AE\u7BB1\u6216\u5FAE\u4FE1\u53F7\uFF0C\u65B9\u4FBF\u6211\u4EEC\u8054\u7CFB\u60A8",
    btn_send_feedback: "\u53D1\u9001\u53CD\u9988",
    modal_nickname_title: "\u8BBE\u7F6E\u6635\u79F0",
    modal_nickname_desc: "\u8BF7\u8BBE\u7F6E\u4E00\u4E2A\u6635\u79F0\u4EE5\u4FBF\u53D1\u8868\u8BC4\u8BBA\u3002\u8BBE\u7F6E\u540E\u5C06\u81EA\u52A8\u4FDD\u5B58\u3002",
    label_nickname: "\u6635\u79F0 *",
    placeholder_nickname: "\u4F8B\u5982: \u533F\u540D\u7528\u6237",
    btn_anonymous: "\u533F\u540D\u8BBF\u95EE",
    btn_save: "\u4FDD\u5B58",
    alert_submit_success: "\u63D0\u4EA4\u6210\u529F\uFF01\u611F\u8C22\u60A8\u7684\u5206\u4EAB\u3002",
    alert_submit_fail: "\u63D0\u4EA4\u5931\u8D25",
    alert_network_error: "\u7F51\u7EDC\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
    alert_feedback_success: "\u611F\u8C22\u60A8\u7684\u53CD\u9988\uFF01\u6211\u4EEC\u4F1A\u8BA4\u771F\u67E5\u770B\u3002",
    alert_like_limit: "\u60A8\u4ECA\u5929\u70B9\u8D5E\u592A\u9891\u7E41\u4E86\uFF0C\u8BF7\u660E\u5929\u518D\u6765\uFF01",
    alert_comment_limit: "\u60A8\u4ECA\u5929\u8BC4\u8BBA\u592A\u591A\u4E86\uFF0C\u4F11\u606F\u4E00\u4E0B\u5427\uFF01",
    alert_nickname_required: "\u8BF7\u8F93\u5165\u6635\u79F0",
    loading: "\u52A0\u8F7D\u4E2D...",
    no_comments: "\u6682\u65E0\u8BC4\u8BBA\uFF0C\u5FEB\u6765\u62A2\u6C99\u53D1\uFF01",
    // News (news.js)
    news_page_title: "AI \u524D\u6CBF\u52A8\u6001 \xB7 \u81EA\u7531\u7A7A\u95F4",
    news_header: "AI \u524D\u6CBF\u52A8\u6001",
    news_subtitle: "\u6C47\u805A TechCrunch \u4E0E 36Kr \u7684\u6700\u65B0 AI \u8D44\u8BAF\uFF0C\u5B9E\u65F6\u7FFB\u8BD1\uFF0C\u5168\u7403\u540C\u6B65\u3002",
    btn_refresh_news: "\u5237\u65B0\u8D44\u8BAF",
    btn_refreshing: "\u6B63\u5728\u83B7\u53D6...",
    btn_read_more: "\u9605\u8BFB\u539F\u6587",
    btn_load_more: "\u67E5\u770B\u66F4\u65E9\u7684\u65B0\u95FB",
    text_no_news: "\u6682\u65E0\u65B0\u95FB\uFF0C\u8BF7\u70B9\u51FB\u5237\u65B0\u6309\u94AE\u83B7\u53D6\u6700\u65B0\u8D44\u8BAF\u3002",
    alert_update_success: "\u66F4\u65B0\u6210\u529F\uFF01\u83B7\u53D6\u4E86 {fetched} \u6761\uFF0C\u65B0\u589E {inserted} \u6761\u3002",
    alert_rate_limit: "\u5237\u65B0\u592A\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
    // VPN (vpn.js)
    vpn_page_title: "VPN\u63A8\u8350 \xB7 \u81EA\u7531\u7A7A\u95F4",
    vpn_hero_title: "VPN \u63A8\u8350 \xB7 \u7CBE\u9009\u670D\u52A1",
    vpn_hero_desc: "\u7ECF\u8FC7\u4E25\u683C\u6D4B\u8BD5\u548C\u7528\u6237\u53CD\u9988\u7B5B\u9009\u7684\u4F18\u8D28VPN\u670D\u52A1\uFF0C\u63D0\u4F9B\u7A33\u5B9A\u5FEB\u901F\u7684\u5168\u7403\u7F51\u7EDC\u8BBF\u95EE\u4F53\u9A8C\u3002",
    vpn_top_1: "TOP 1",
    vpn_top_2: "TOP 2",
    vpn_top_3: "TOP 3",
    tag_speed: "\u26A1 \u901F\u5EA6",
    tag_stable: "\u25CF \u7A33\u5B9A",
    price_suffix: "/\u6708\u8D77",
    btn_visit: "\u7ACB\u5373\u8BBF\u95EE",
    section_features: "\u6838\u5FC3\u7279\u6027",
    section_payment: "\u{1F4B3} \u652F\u4ED8\u65B9\u5F0F",
    // Guide (guide.js)
    guide_page_title: "\u914D\u7F6E\u6307\u5357 \xB7 \u81EA\u7531\u7A7A\u95F4",
    guide_hero_title: "API \u914D\u7F6E\u6307\u5357",
    guide_hero_desc: "\u5168\u9762\u7684 Claude Code \u548C Codex CLI \u914D\u7F6E\u6559\u7A0B\uFF0C\u5E2E\u52A9\u4F60\u5FEB\u901F\u63A5\u5165\u7B2C\u4E09\u65B9 API \u4E2D\u8F6C\u670D\u52A1\u3002",
    guide_win_title: "Windows \u7CFB\u7EDF\u914D\u7F6E\u6559\u7A0B",
    guide_win_desc: "\u672C\u6559\u7A0B\u5C06\u6307\u5BFC\u4F60\u5728 Windows \u7CFB\u7EDF\u4E0A\u914D\u7F6E Claude Code \u548C Codex CLI \u4F7F\u7528\u7B2C\u4E09\u65B9 API \u4E2D\u8F6C\u670D\u52A1\u3002",
    guide_mac_title: "macOS \u7CFB\u7EDF\u914D\u7F6E\u6559\u7A0B",
    guide_mac_desc: "\u672C\u6559\u7A0B\u5C06\u6307\u5BFC\u4F60\u5728 macOS \u7CFB\u7EDF\u4E0A\u914D\u7F6E Claude Code \u548C Codex CLI \u4F7F\u7528\u7B2C\u4E09\u65B9 API \u4E2D\u8F6C\u670D\u52A1\u3002",
    guide_linux_title: "Linux \u7CFB\u7EDF\u914D\u7F6E\u6559\u7A0B",
    guide_linux_desc: "\u672C\u6559\u7A0B\u5C06\u6307\u5BFC\u4F60\u5728 Linux \u7CFB\u7EDF\u4E0A\u914D\u7F6E Claude Code \u548C Codex CLI \u4F7F\u7528\u7B2C\u4E09\u65B9 API \u4E2D\u8F6C\u670D\u52A1\u3002",
    guide_common_title: "\u901A\u7528\u914D\u7F6E\u8BF4\u660E",
    guide_env_vars: "\u652F\u6301\u7684\u73AF\u5883\u53D8\u91CF",
    guide_table_tool: "\u5DE5\u5177",
    guide_table_env: "\u73AF\u5883\u53D8\u91CF",
    guide_table_desc: "\u8BF4\u660E",
    guide_tip_security: "\u5B89\u5168\u63D0\u9192",
    guide_security_1: "\u4E0D\u8981\u5C06 API \u5BC6\u94A5\u63D0\u4EA4\u5230\u516C\u5F00\u7684\u4EE3\u7801\u4ED3\u5E93",
    guide_security_2: "\u5B9A\u671F\u8F6E\u6362\u4F60\u7684 API \u5BC6\u94A5",
    guide_security_3: "\u4F7F\u7528\u73AF\u5883\u53D8\u91CF\u800C\u975E\u786C\u7F16\u7801\u5BC6\u94A5",
    guide_security_4: "\u5728\u5171\u4EAB\u8BBE\u5907\u4E0A\u4F7F\u7528\u5B8C\u6BD5\u540E\u6E05\u9664\u73AF\u5883\u53D8\u91CF",
    btn_copy: "\u590D\u5236",
    btn_copied_text: "\u5DF2\u590D\u5236",
    // Guide Content Headers & Steps
    guide_step_env: "\u4E00\u3001\u73AF\u5883\u51C6\u5907",
    guide_step_claude: "\u4E8C\u3001\u914D\u7F6E Claude Code \u4F7F\u7528\u7B2C\u4E09\u65B9 API",
    guide_step_codex: "\u4E09\u3001\u914D\u7F6E Codex CLI \u4F7F\u7528\u7B2C\u4E09\u65B9 API",
    guide_step_verify: "\u56DB\u3001\u9A8C\u8BC1\u914D\u7F6E",
    guide_step_troubleshoot: "\u56DB\u3001\u5E38\u89C1\u95EE\u9898\u6392\u67E5",
    // Detailed Steps (New)
    guide_step_1_node: "1. \u5B89\u88C5 Node.js",
    guide_step_1_homebrew: "1. \u5B89\u88C5 Homebrew\uFF08\u5982\u672A\u5B89\u88C5\uFF09",
    guide_step_2_node: "2. \u5B89\u88C5 Node.js",
    guide_step_2_cli: "2. \u5B89\u88C5 Claude Code CLI",
    guide_step_3_cli: "3. \u5B89\u88C5 Claude Code \u548C Codex CLI",
    guide_step_3_codex: "3. \u5B89\u88C5 Codex CLI",
    guide_desc_node_check: "\u9996\u5148\u786E\u4FDD\u4F60\u7684\u7CFB\u7EDF\u5DF2\u5B89\u88C5 Node.js (\u5EFA\u8BAE v18 \u6216\u66F4\u9AD8\u7248\u672C)\uFF1A",
    guide_desc_node_source: "\u4F7F\u7528 NodeSource \u4ED3\u5E93\u5B89\u88C5\u6700\u65B0\u7248 Node.js\uFF1A",
    guide_desc_mac_brew: "\u4F7F\u7528 Homebrew \u5B89\u88C5",
    guide_method_1_env: "\u65B9\u6CD5\u4E00\uFF1A\u4F7F\u7528\u73AF\u5883\u53D8\u91CF\u914D\u7F6E",
    guide_method_2_perm: "\u65B9\u6CD5\u4E8C\uFF1A\u6C38\u4E45\u914D\u7F6E\u73AF\u5883\u53D8\u91CF",
    guide_method_1_temp: "\u65B9\u6CD5\u4E00\uFF1A\u4E34\u65F6\u914D\u7F6E\uFF08\u5F53\u524D\u7EC8\u7AEF\u4F1A\u8BDD\u6709\u6548\uFF09",
    guide_method_2_perm_rec: "\u65B9\u6CD5\u4E8C\uFF1A\u6C38\u4E45\u914D\u7F6E\uFF08\u63A8\u8350\uFF09",
    guide_method_3_systemd: "\u65B9\u6CD5\u4E09\uFF1A\u4F7F\u7528 systemd \u7528\u6237\u73AF\u5883\u53D8\u91CF\uFF08\u9002\u7528\u4E8E\u684C\u9762\u73AF\u5883\uFF09",
    guide_text_open_ps: "\u6253\u5F00 PowerShell \u6216\u547D\u4EE4\u63D0\u793A\u7B26\uFF0C\u8BBE\u7F6E\u73AF\u5883\u53D8\u91CF\uFF1A",
    guide_text_edit_profile: "\u7F16\u8F91\u4F60\u7684 shell \u914D\u7F6E\u6587\u4EF6\uFF1A",
    guide_text_append: "\u5728\u6587\u4EF6\u672B\u5C3E\u6DFB\u52A0\u4EE5\u4E0B\u5185\u5BB9\uFF1A",
    guide_text_save_apply: "\u4FDD\u5B58\u540E\u6267\u884C\u4EE5\u4E0B\u547D\u4EE4\u4F7F\u914D\u7F6E\u751F\u6548\uFF1A",
    guide_tip_persist: "\u63D0\u793A\uFF1A\u5EFA\u8BAE\u5C06\u73AF\u5883\u53D8\u91CF\u6DFB\u52A0\u5230\u7CFB\u7EDF\u7684\u6C38\u4E45\u914D\u7F6E\u4E2D\uFF0C\u907F\u514D\u6BCF\u6B21\u91CD\u542F\u540E\u9700\u8981\u91CD\u65B0\u8BBE\u7F6E\u3002",
    // Windows Specific Steps
    guide_win_step_1: '\u53F3\u952E\u70B9\u51FB"\u6B64\u7535\u8111" \u2192 "\u5C5E\u6027" \u2192 "\u9AD8\u7EA7\u7CFB\u7EDF\u8BBE\u7F6E"',
    guide_win_step_2: '\u70B9\u51FB"\u73AF\u5883\u53D8\u91CF"\u6309\u94AE',
    guide_win_step_3: '\u5728"\u7528\u6237\u53D8\u91CF"\u4E2D\u70B9\u51FB"\u65B0\u5EFA"',
    guide_win_step_4: "\u6DFB\u52A0\u4EE5\u4E0B\u53D8\u91CF\uFF1A",
    guide_win_step_5: '\u70B9\u51FB"\u786E\u5B9A"\u4FDD\u5B58\uFF0C\u91CD\u542F\u7EC8\u7AEF\u751F\u6548',
    guide_var_name: "\u53D8\u91CF\u540D",
    guide_var_value: "\u53D8\u91CF\u503C",
    // Code Comments & Tips
    code_comment_check_node: "# \u68C0\u67E5 Node.js \u7248\u672C",
    code_comment_install_node_missing: "# \u5982\u672A\u5B89\u88C5\uFF0C\u8BF7\u4ECE\u5B98\u7F51\u4E0B\u8F7D: https://nodejs.org/",
    code_comment_npm_global: "# \u4F7F\u7528 npm \u5168\u5C40\u5B89\u88C5",
    code_comment_anthropic_base_long: "# \u8BBE\u7F6E API \u57FA\u7840\u5730\u5740\uFF08\u66FF\u6362\u4E3A\u4F60\u7684\u4E2D\u8F6C\u670D\u52A1\u5730\u5740\uFF09",
    code_comment_anthropic_key_long: "# \u8BBE\u7F6E API \u5BC6\u94A5\uFF08\u66FF\u6362\u4E3A\u4F60\u7684\u5BC6\u94A5\uFF09",
    code_comment_start_claude: "# \u542F\u52A8 Claude Code",
    code_comment_openai_base: "# \u8BBE\u7F6E OpenAI API \u57FA\u7840\u5730\u5740",
    code_comment_openai_key: "# \u8BBE\u7F6E API \u5BC6\u94A5",
    code_comment_start_codex: "# \u542F\u52A8 Codex",
    code_comment_test_claude: "# \u6D4B\u8BD5 Claude Code",
    code_comment_test_codex: "# \u6D4B\u8BD5 Codex",
    code_comment_install_claude: "# \u5B89\u88C5 Claude Code",
    code_comment_install_codex: "# \u5B89\u88C5 Codex",
    code_comment_set_api_base: "# \u8BBE\u7F6E API \u57FA\u7840\u5730\u5740",
    code_comment_set_api_key: "# \u8BBE\u7F6E API \u5BC6\u94A5",
    code_comment_claude_config: "# Claude Code API \u914D\u7F6E",
    code_comment_codex_config: "# Codex API \u914D\u7F6E",
    code_comment_reload_config: "# \u91CD\u65B0\u52A0\u8F7D\u914D\u7F6E",
    code_comment_check_env: "# \u68C0\u67E5\u73AF\u5883\u53D8\u91CF\u662F\u5426\u8BBE\u7F6E\u6210\u529F",
    code_comment_set_env_launch: "# \u8BBE\u7F6E\u73AF\u5883\u53D8\u91CF\u5E76\u542F\u52A8",
    code_comment_use_editor: "# \u4F7F\u7528\u4F60\u559C\u6B22\u7684\u7F16\u8F91\u5668",
    code_comment_or: "# \u6216",
    code_comment_api_config_header: "# ===== API \u914D\u7F6E =====",
    code_comment_create_env_file: "# \u521B\u5EFA\u6216\u7F16\u8F91\u73AF\u5883\u53D8\u91CF\u6587\u4EF6",
    code_comment_verify_env: "# \u9A8C\u8BC1\u73AF\u5883\u53D8\u91CF",
    guide_nvm_tip: "<strong>\u63D0\u793A\uFF1A</strong> \u5982\u679C\u9047\u5230\u6743\u9650\u95EE\u9898\uFF0C\u53EF\u4EE5\u8003\u8651\u4F7F\u7528 nvm (Node Version Manager) \u6765\u7BA1\u7406 Node.js\uFF0C\u8FD9\u6837\u53EF\u4EE5\u907F\u514D\u4F7F\u7528 sudo \u5B89\u88C5\u5168\u5C40\u5305\u3002",
    code_comment_check_network: "# \u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5",
    code_comment_check_dns: "# \u68C0\u67E5 DNS \u89E3\u6790",
    code_comment_use_proxy: "# \u5982\u679C\u4F7F\u7528\u4EE3\u7406",
    code_comment_verify_install: "# \u9A8C\u8BC1\u5B89\u88C5",
    guide_desc_api_base: "API \u57FA\u7840\u5730\u5740",
    guide_desc_api_key: "API \u5BC6\u94A5"
  },
  // English
  en: {
    // Shared
    brand_name: "AI Space",
    brand_subtitle: "Open AI Sharing Platform",
    nav_home: "API Hub",
    nav_news: "AI News",
    nav_vpn: "VPN",
    nav_guide: "Setup Guide",
    github_text: "GitHub",
    // Home (index.js)
    home_title: "API Hub \xB7 AI Space",
    hero_title: "Quality API Relay Sharing",
    hero_subtitle: "Verified APIs supporting Claude Code, Codex, and top AI models. Use with confidence!",
    submit_hint: "Share your stable API relay!",
    btn_submit: "Submit Site",
    status_checking: "Checking",
    btn_invite_copy: "Invite Link \xB7 Copy",
    btn_copied: "Copied!",
    text_last_checked: "Last Checked",
    text_never_checked: "Never Checked",
    comment_placeholder: "Type a comment...",
    btn_send: "Send",
    nickname_current: "Nickname",
    btn_modify: "[Edit]",
    modal_submit_title: "Submit New Relay",
    modal_submit_desc: "Share your API relay. Once verified, your invite link will be featured on the homepage!",
    label_name: "Relay Name *",
    placeholder_name: "e.g., OpenAI Official API",
    label_url: "Website URL *",
    placeholder_url: "e.g., https://chatgpt.com/",
    label_invite: "Invite Link",
    placeholder_invite: "e.g., https://chatgpt.com/invite?code=abc",
    label_desc: "Description",
    placeholder_desc: "Brief description...",
    btn_feedback: "Feedback",
    btn_cancel: "Cancel",
    btn_submit_confirm: "Submit",
    modal_feedback_title: "Feedback",
    modal_feedback_desc: "Bug reports or feature suggestions are welcome!",
    label_feedback_content: "Content *",
    placeholder_feedback_content: "Describe your suggestion or issue...",
    label_contact: "Contact (Optional)",
    placeholder_contact: "Email or WeChat for follow-up",
    btn_send_feedback: "Send Feedback",
    modal_nickname_title: "Set Nickname",
    modal_nickname_desc: "Set a nickname to post comments. It will be saved automatically.",
    label_nickname: "Nickname *",
    placeholder_nickname: "e.g., Anonymous",
    btn_anonymous: "Go Anonymous",
    btn_save: "Save",
    alert_submit_success: "Submitted successfully! Thanks for sharing.",
    alert_submit_fail: "Submission failed",
    alert_network_error: "Network error, please try again later",
    alert_feedback_success: "Thank you for your feedback!",
    alert_like_limit: "You've liked too many times today, come back tomorrow!",
    alert_comment_limit: "You've commented too much today, take a break!",
    alert_nickname_required: "Please enter a nickname",
    loading: "Loading...",
    no_comments: "No comments yet, be the first!",
    // News (news.js)
    news_page_title: "AI News \xB7 AI Space",
    news_header: "AI Frontier News",
    news_subtitle: "Latest AI news from TechCrunch & 36Kr, translated globally.",
    btn_refresh_news: "Refresh News",
    btn_refreshing: "Fetching...",
    btn_read_more: "Read More",
    btn_load_more: "Load More News",
    text_no_news: "No news available, click refresh to get the latest updates.",
    alert_update_success: "Update successful! Fetched {fetched}, Inserted {inserted}.",
    alert_rate_limit: "Too many requests, please try again later.",
    // VPN (vpn.js)
    vpn_page_title: "VPN Recommendations \xB7 AI Space",
    vpn_hero_title: "Recommended VPNs",
    vpn_hero_desc: "Strictly tested VPN services providing stable and fast global access.",
    vpn_top_1: "TOP 1",
    vpn_top_2: "TOP 2",
    vpn_top_3: "TOP 3",
    tag_speed: "\u26A1 Speed",
    tag_stable: "\u25CF Stable",
    price_suffix: "/mo",
    btn_visit: "Visit Now",
    section_features: "Core Features",
    section_payment: "\u{1F4B3} Payment Methods",
    // Guide (guide.js)
    guide_page_title: "Setup Guide \xB7 AI Space",
    guide_hero_title: "API Setup Guide",
    guide_hero_desc: "Comprehensive tutorials for Claude Code and Codex CLI configuration.",
    guide_win_title: "Windows Configuration",
    guide_win_desc: "Tutorial for configuring Claude Code and Codex CLI on Windows.",
    guide_mac_title: "macOS Configuration",
    guide_mac_desc: "Tutorial for configuring Claude Code and Codex CLI on macOS.",
    guide_linux_title: "Linux Configuration",
    guide_linux_desc: "Tutorial for configuring Claude Code and Codex CLI on Linux.",
    guide_common_title: "Common Configuration",
    guide_env_vars: "Supported Environment Variables",
    guide_table_tool: "Tool",
    guide_table_env: "Env Variable",
    guide_table_desc: "Description",
    guide_tip_security: "Security Notice",
    guide_security_1: "Do not commit API keys to public repos",
    guide_security_2: "Rotate your API keys regularly",
    guide_security_3: "Use environment variables instead of hardcoding",
    guide_security_4: "Clear env vars after using shared devices",
    btn_copy: "Copy",
    btn_copied_text: "Copied",
    // Guide Content Headers & Steps
    guide_step_env: "I. Environment Prep",
    guide_step_claude: "II. Configure Claude Code",
    guide_step_codex: "III. Configure Codex CLI",
    guide_step_verify: "IV. Verify Configuration",
    guide_step_troubleshoot: "IV. Troubleshooting",
    // Detailed Steps (New)
    guide_step_1_node: "1. Install Node.js",
    guide_step_1_homebrew: "1. Install Homebrew (if missing)",
    guide_step_2_node: "2. Install Node.js",
    guide_step_2_cli: "2. Install Claude Code CLI",
    guide_step_3_cli: "3. Install Claude Code & Codex CLI",
    guide_step_3_codex: "3. Install Codex CLI",
    guide_desc_node_check: "Ensure Node.js is installed (v18+ recommended):",
    guide_desc_node_source: "Install latest Node.js via NodeSource:",
    guide_desc_mac_brew: "Install via Homebrew",
    guide_method_1_env: "Method 1: Use Environment Variables",
    guide_method_2_perm: "Method 2: Permanent Configuration",
    guide_method_1_temp: "Method 1: Temporary (Session only)",
    guide_method_2_perm_rec: "Method 2: Permanent (Recommended)",
    guide_method_3_systemd: "Method 3: Systemd User Service (Desktop)",
    guide_text_open_ps: "Open PowerShell or Command Prompt:",
    guide_text_edit_profile: "Edit your shell profile:",
    guide_text_append: "Append the following:",
    guide_text_save_apply: "Save and reload configuration:",
    guide_tip_persist: "Tip: Add to permanent config to avoid resetting on reboot.",
    // Windows Specific Steps
    guide_win_step_1: "Right-click 'This PC' \u2192 'Properties' \u2192 'Advanced system settings'",
    guide_win_step_2: "Click 'Environment Variables'",
    guide_win_step_3: "Click 'New' under 'User variables'",
    guide_win_step_4: "Add the following variables:",
    guide_win_step_5: "Click 'OK' to save, restart terminal to take effect",
    guide_var_name: "Variable Name",
    guide_var_value: "Variable Value",
    // Code Comments & Tips
    code_comment_check_node: "# Check Node.js version",
    code_comment_install_node_missing: "# If missing, download from: https://nodejs.org/",
    code_comment_npm_global: "# Install globally via npm",
    code_comment_anthropic_base_long: "# Set API Base URL (your proxy address)",
    code_comment_anthropic_key_long: "# Set API Key (your key)",
    code_comment_start_claude: "# Start Claude Code",
    code_comment_openai_base: "# Set OpenAI API Base URL",
    code_comment_openai_key: "# Set API Key",
    code_comment_start_codex: "# Start Codex",
    code_comment_test_claude: "# Test Claude Code",
    code_comment_test_codex: "# Test Codex",
    code_comment_install_claude: "# Install Claude Code",
    code_comment_install_codex: "# Install Codex",
    code_comment_set_api_base: "# Set API Base URL",
    code_comment_set_api_key: "# Set API Key",
    code_comment_claude_config: "# Claude Code API Config",
    code_comment_codex_config: "# Codex API Config",
    code_comment_reload_config: "# Reload configuration",
    code_comment_check_env: "# Check if env vars are set",
    code_comment_set_env_launch: "# Set env vars and start",
    code_comment_use_editor: "# Use your preferred editor",
    code_comment_or: "# OR",
    code_comment_api_config_header: "# ===== API Config =====",
    code_comment_create_env_file: "# Create/Edit env file",
    code_comment_verify_env: "# Verify environment variables",
    guide_nvm_tip: "<strong>Tip:</strong> If you face permission issues, consider using nvm (Node Version Manager) to avoid using sudo for global packages.",
    code_comment_check_network: "# Check network connection",
    code_comment_check_dns: "# Check DNS resolution",
    code_comment_use_proxy: "# If using a proxy",
    code_comment_verify_install: "# Verify installation",
    guide_desc_api_base: "API Base URL",
    guide_desc_api_key: "API Key"
  }
};
function getLocale(acceptLanguage, cookieHeader) {
  if (cookieHeader) {
    if (cookieHeader.includes("locale=zh")) return "zh";
    if (cookieHeader.includes("locale=en")) return "en";
  }
  if (!acceptLanguage) return "en";
  if (acceptLanguage.toLowerCase().includes("zh")) {
    return "zh";
  }
  return "en";
}
__name(getLocale, "getLocale");
function t(locale, key, vars = {}) {
  const dict = translations[locale] || translations["en"];
  let text = dict[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(new RegExp(`{${k}}`, "g"), v);
  }
  return text;
}
__name(t, "t");

// guide.js
async function onRequestGet7(context) {
  const { request } = context;
  const cookie = request.headers.get("Cookie");
  const locale = getLocale(request.headers.get("Accept-Language"), cookie);
  const T = /* @__PURE__ */ __name((key, vars) => t(locale, key, vars), "T");
  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${T("guide_page_title")}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
    rel="stylesheet" />
  <link rel="stylesheet" href="/guide.css">
  <style>
    .lang-btn {
        background: rgba(255,255,255,0.1);
        border: 1px solid var(--card-border);
        color: var(--text-main);
        padding: 4px 12px;
        border-radius: 16px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        margin-left: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .lang-btn:hover {
        background: rgba(255,255,255,0.2);
        border-color: var(--accent-glow);
    }
  </style>
</head>

<body>
  <div class="app-shell">
    <header>
      <div class="brand">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path fill="url(#grad1)" d="M12 8l24 32H12z" opacity="0.9"></path>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff9a4d"></stop>
              <stop offset="100%" stop-color="#f552ff"></stop>
            </linearGradient>
          </defs>
        </svg>
        <div>
          <strong>${T("brand_name")}</strong>
          <p style="margin: 0; font-size: 12px; color: var(--text-muted);">
            ${T("brand_subtitle")}
          </p>
        </div>
      </div>
      <nav>
        <a href="/">${T("nav_home")}</a>
        <a href="/news">${T("nav_news")}</a>
        <a href="/vpn">${T("nav_vpn")}</a>
        <a href="/guide" class="active">${T("nav_guide")}</a>
      </nav>
      <div style="display:flex; align-items:center; margin-left: auto;">
        <div class="github-link" style="margin-left: 0;">
            <a href="https://github.com/ganlian6666/aispace" target="_blank" rel="noopener noreferrer" style="color:var(--text-muted); text-decoration:none; display:flex; align-items:center; gap:6px;">
            <svg viewBox="0 0 24 24" aria-hidden="true" style="width:20px; height:20px; fill:currentColor;">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span style="font-size:14px;">${T("github_text")}</span>
            </a>
        </div>
        <button class="lang-btn" onclick="switchLanguage()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            ${locale === "zh" ? "English" : "\u4E2D\u6587"}
        </button>
      </div>
    </header>

    <section class="hero">
      <div>
        <h1>${T("guide_hero_title")}</h1>
        <p>${T("guide_hero_desc")}</p>
      </div>
    </section>

    <div class="content-wrapper">
      <!-- Sistema Tabs -->
      <div class="os-tabs">
        <button class="os-tab active" data-os="windows">
          <svg viewBox="0 0 24 24"><path d="M3 12V6.75l6-1.32v6.48L3 12zm7-7.65l8-1.75v9.4H10V4.35zm8 18.25l-8-1.35v-6.5h8v7.85zm-15-1.4V15l6-.09v6.43l-6-1.14z" /></svg>
          Windows
        </button>
        <button class="os-tab" data-os="mac">
          <svg viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
          macOS
        </button>
        <button class="os-tab" data-os="linux">
          <svg viewBox="0 0 24 24"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0 .054-.01.12-.013.18-.012.126-.039.243-.078.352-.053.162-.124.334-.206.458a.711.711 0 01-.256.282.41.41 0 01-.184.063h-.013c-.166 0-.31-.066-.453-.179-.142-.121-.252-.273-.324-.449-.071-.181-.11-.386-.123-.597-.007-.063-.008-.122-.01-.186.006-.099.026-.197.049-.297.017-.085.041-.169.072-.252a.863.863 0 01.213-.328.552.552 0 01.124-.088.498.498 0 01-.001 0zm-2.197.16h.039a.56.56 0 01.135.031.649.649 0 01.185.098.737.737 0 01.199.248c.089.164.15.347.18.535.009.067.015.16.014.229-.007.226-.07.436-.175.608a.76.76 0 01-.166.206.631.631 0 01-.178.109.5.5 0 01-.146.032h-.032c-.153 0-.287-.047-.405-.134a.863.863 0 01-.276-.344c-.074-.162-.113-.343-.124-.531l-.001-.098c0-.039.002-.073.008-.107a1.202 1.202 0 01.104-.435.66.66 0 01.235-.295.464.464 0 01.275-.094h-.001zm4.59 4.778a.253.253 0 01.022.019c.298.329.525.618.694.858.169.24.298.429.379.597.14.354.14.588-.022.701a.27.27 0 01-.131.052c-.082 0-.186-.049-.319-.178-.166-.162-.36-.417-.585-.715a17.16 17.16 0 01-.639-.901c-.076-.123-.128-.236-.134-.32-.006-.071.014-.137.062-.178a.138.138 0 01.086-.027c.054 0 .123.023.207.075.083.051.178.124.285.217zm-2.886.179c.194 0 .325.099.327.28.007.181-.107.34-.324.482-.114.078-.254.137-.415.172a1.453 1.453 0 01-.305.028c-.093 0-.18-.011-.262-.032a.833.833 0 01-.195-.079.393.393 0 01-.13-.109.25.25 0 01-.045-.15.259.259 0 01.018-.097.218.218 0 01.052-.073c.026-.022.051-.044.085-.055a.484.484 0 01.127-.024c.047 0 .089.011.127.025.04.014.073.035.102.055a.413.413 0 00.113.054c.038.01.081.017.128.017h.002a.556.556 0 00.22-.039c.08-.03.141-.074.166-.142.03-.074.019-.17-.034-.272a1.008 1.008 0 00-.2-.284.92.92 0 00-.27-.183.53.53 0 00-.234-.061.388.388 0 00-.152.035.405.405 0 00-.138.107l-.03.041a.246.246 0 01-.206.103.235.235 0 01-.17-.072.238.238 0 01-.067-.185.358.358 0 01.049-.163c.03-.056.066-.106.11-.149.091-.089.198-.156.317-.198a1.055 1.055 0 01.367-.063zm-.847 1.985l-.001.002v-.002zm6.215.216a.267.267 0 01.099.019c.063.024.131.066.19.128.059.063.108.145.136.255.028.109.028.253-.02.411-.104.341-.378.593-.64.826-.26.232-.512.439-.67.673-.17.268-.211.51-.167.766.044.244.159.478.302.714.142.236.31.468.43.752.12.283.178.644.047 1.037l-.001.002.002.005c.082.249.079.53-.028.785-.106.256-.306.491-.597.666-.59.351-1.457.447-2.383.142a.393.393 0 01-.132-.072.396.396 0 01-.092-.118.406.406 0 01-.037-.15.402.402 0 01.018-.156.414.414 0 01.185-.234.4.4 0 01.145-.054.38.38 0 01.15.005c.747.246 1.406.206 1.83-.064.213-.132.362-.319.43-.527.069-.209.051-.45-.071-.699l-.004-.007c-.098-.209-.224-.413-.346-.614-.123-.201-.248-.406-.328-.651-.079-.245-.105-.544-.012-.903.092-.36.307-.679.545-.95.238-.272.494-.502.659-.75l.002-.002a.328.328 0 01.033-.039c.074-.079.181-.129.303-.132z" /></svg>
          Linux
        </button>
      </div>

      <!-- Windows \u6559\u7A0B -->
      <div class="os-content active" id="windows">
        <div class="guide-section">
          <h2>${T("guide_win_title")}</h2>
          <p>${T("guide_win_desc")}</p>

          <h3>${T("guide_step_env")}</h3>
          <h4>${T("guide_step_1_node")}</h4>
          <p>${T("guide_desc_node_check")}</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_check_node")}
node --version

${T("code_comment_install_node_missing")}</code>
          </div>

          <h4>${T("guide_step_2_cli")}</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_npm_global")}
npm install -g @anthropic-ai/claude-code</code>
          </div>

          <h4>${T("guide_step_3_codex")}</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_npm_global")}
npm install -g @openai/codex</code>
          </div>

          <h3>${T("guide_step_claude")}</h3>

          <h4>${T("guide_method_1_env")}</h4>
          <p>${T("guide_text_open_ps")}</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_anthropic_base_long")}
set ANTHROPIC_BASE_URL=https://your-api-proxy.com

${T("code_comment_anthropic_key_long")}
set ANTHROPIC_API_KEY=sk-your-api-key-here

${T("code_comment_start_claude")}
claude</code>
          </div>

          <h4>${T("guide_method_2_perm")}</h4>
          <ol class="step-list">
            <li>${T("guide_win_step_1")}</li>
            <li>${T("guide_win_step_2")}</li>
            <li>${T("guide_win_step_3")}</li>
            <li>${T("guide_win_step_4")}
              <div class="code-block">
                <code>${T("guide_var_name")}: ANTHROPIC_BASE_URL
${T("guide_var_value")}: https://your-api-proxy.com

${T("guide_var_name")}: ANTHROPIC_API_KEY
${T("guide_var_value")}: sk-your-api-key-here</code>
              </div>
            </li>
            <li>${T("guide_win_step_5")}</li>
          </ol>

          <h3>${T("guide_step_codex")}</h3>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_openai_base")}
set OPENAI_BASE_URL=https://your-api-proxy.com/v1

${T("code_comment_openai_key")}
set OPENAI_API_KEY=sk-your-api-key-here

${T("code_comment_start_codex")}
codex</code>
          </div>

          <div class="tip-box">
            <strong>${T("guide_tip_persist")}</strong>
          </div>

          <h3>${T("guide_step_verify")}</h3>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_test_claude")}
claude --version
claude "Hello, this is a test"

${T("code_comment_test_codex")}
codex --version
codex "Write a hello world in Python"</code>
          </div>
        </div>
      </div>

      <!-- macOS \u6559\u7A0B -->
      <div class="os-content" id="mac">
        <div class="guide-section">
          <h2>${T("guide_mac_title")}</h2>
          <p>${T("guide_mac_desc")}</p>

          <h3>${T("guide_step_env")}</h3>
          <h4>${T("guide_step_1_homebrew")}</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"</code>
          </div>

          <h4>${T("guide_step_2_node")}</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code># ${T("guide_desc_mac_brew")}
brew install node

# \u9A8C\u8BC1\u5B89\u88C5
node --version
npm --version</code>
          </div>

          <h4>${T("guide_step_3_cli")}</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_install_claude")}
npm install -g @anthropic-ai/claude-code

${T("code_comment_install_codex")}
npm install -g @openai/codex</code>
          </div>

          <h3>${T("guide_step_claude")}</h3>

          <h4>${T("guide_method_1_temp")}</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_set_api_base")}
export ANTHROPIC_BASE_URL="https://your-api-proxy.com"

${T("code_comment_set_api_key")}
export ANTHROPIC_API_KEY="sk-your-api-key-here"

${T("code_comment_start_claude")}
claude</code>
          </div>

          <h4>${T("guide_method_2_perm_rec")}</h4>
          <p>${T("guide_text_edit_profile")}</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code># \u5982\u679C\u4F7F\u7528 zsh\uFF08macOS \u9ED8\u8BA4\uFF09
nano ~/.zshrc

# \u5982\u679C\u4F7F\u7528 bash
nano ~/.bash_profile</code>
          </div>
          <p>${T("guide_text_append")}</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_claude_config")}
export ANTHROPIC_BASE_URL="https://your-api-proxy.com"
export ANTHROPIC_API_KEY="sk-your-api-key-here"

${T("code_comment_codex_config")}
export OPENAI_BASE_URL="https://your-api-proxy.com/v1"
export OPENAI_API_KEY="sk-your-api-key-here"</code>
          </div>
          <p>${T("guide_text_save_apply")}</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_reload_config")}
source ~/.zshrc  # \u6216 source ~/.bash_profile</code>
          </div>

          <h3>${T("guide_step_verify")}</h3>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_check_env")}
echo $ANTHROPIC_BASE_URL
echo $ANTHROPIC_API_KEY

${T("code_comment_test_claude")}
claude "Hello, this is a test"

${T("code_comment_test_codex")}
codex "Write a hello world in Python"</code>
          </div>

          <div class="tip-box warning">
            <strong>\u6CE8\u610F\uFF1A</strong> ${T("guide_security_1")}
          </div>
        </div>
      </div>

      <!-- Linux \u6559\u7A0B -->
      <div class="os-content" id="linux">
        <div class="guide-section">
          <h2>${T("guide_linux_title")}</h2>
          <p>${T("guide_linux_desc")}</p>

          <h3>${T("guide_step_env")}</h3>
          <h4>${T("guide_step_1_node")}</h4>
          <p>${T("guide_desc_node_source")}</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code># Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL/Fedora
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Arch Linux
sudo pacman -S nodejs npm

${T("code_comment_verify_install")}
node --version
npm --version</code>
          </div>

          <h4>${T("guide_step_3_cli")}</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_install_claude")}
sudo npm install -g @anthropic-ai/claude-code

${T("code_comment_install_codex")}
sudo npm install -g @openai/codex</code>
          </div>

          <h3>${T("guide_step_claude")}</h3>

          <h4>${T("guide_method_1_temp")}</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_set_env_launch")}
export ANTHROPIC_BASE_URL="https://your-api-proxy.com"
export ANTHROPIC_API_KEY="sk-your-api-key-here"
claude</code>
          </div>

          <h4>${T("guide_method_2_perm")}</h4>
          <p>${T("guide_text_edit_profile")}</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_use_editor")}
vim ~/.bashrc
${T("code_comment_or")}
nano ~/.bashrc</code>
          </div>
          <p>${T("guide_text_append")}</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_api_config_header")}
${T("code_comment_claude_config")}
export ANTHROPIC_BASE_URL="https://your-api-proxy.com"
export ANTHROPIC_API_KEY="sk-your-api-key-here"

${T("code_comment_codex_config")}
export OPENAI_BASE_URL="https://your-api-proxy.com/v1"
export OPENAI_API_KEY="sk-your-api-key-here"</code>
          </div>
          <p>${T("guide_text_save_apply")}</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>source ~/.bashrc</code>
          </div>

          <h4>${T("guide_method_3_systemd")}</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_create_env_file")}
mkdir -p ~/.config/environment.d
nano ~/.config/environment.d/api.conf</code>
          </div>
          <p>${T("guide_text_append")}</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>ANTHROPIC_BASE_URL=https://your-api-proxy.com
ANTHROPIC_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://your-api-proxy.com/v1
OPENAI_API_KEY=sk-your-api-key-here</code>
          </div>

          <h3>${T("guide_step_verify")}</h3>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_verify_env")}
env | grep -E "(ANTHROPIC|OPENAI)"

${T("code_comment_test_claude")}
claude --version
claude "Hello, this is a test"

${T("code_comment_test_codex")}
codex --version
codex "Write a hello world in Python"</code>
          </div>

          <div class="tip-box">
            ${T("guide_nvm_tip")}
          </div>

          <h3>${T("guide_step_troubleshoot")}</h3>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T("btn_copy")}</button>
            <code>${T("code_comment_check_network")}
curl -I https://your-api-proxy.com/v1

${T("code_comment_check_dns")}
nslookup your-api-proxy.com

${T("code_comment_use_proxy")}
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890</code>
          </div>
        </div>
      </div>

      <!-- \u901A\u7528\u8BF4\u660E -->
      <div class="guide-section">
        <h2>${T("guide_common_title")}</h2>

        <h3>${T("guide_env_vars")}</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: rgba(255,255,255,0.05);">
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--card-border);">${T("guide_table_tool")}</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--card-border);">${T("guide_table_env")}</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--card-border);">${T("guide_table_desc")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid var(--card-border);">Claude Code</td>
              <td
                style="padding: 12px; border-bottom: 1px solid var(--card-border); font-family: monospace; color: var(--accent-glow);">
                ANTHROPIC_BASE_URL</td>
              <td style="padding: 12px; border-bottom: 1px solid var(--card-border);">${T("guide_desc_api_base")}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid var(--card-border);">Claude Code</td>
              <td
                style="padding: 12px; border-bottom: 1px solid var(--card-border); font-family: monospace; color: var(--accent-glow);">
                ANTHROPIC_API_KEY</td>
              <td style="padding: 12px; border-bottom: 1px solid var(--card-border);">${T("guide_desc_api_key")}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid var(--card-border);">Codex</td>
              <td
                style="padding: 12px; border-bottom: 1px solid var(--card-border); font-family: monospace; color: var(--accent-glow);">
                OPENAI_BASE_URL</td>
              <td style="padding: 12px; border-bottom: 1px solid var(--card-border);">${T("guide_desc_api_base")}</td>
            </tr>
            <tr>
              <td style="padding: 12px;">Codex</td>
              <td style="padding: 12px; font-family: monospace; color: var(--accent-glow);">OPENAI_API_KEY</td>
              <td style="padding: 12px;">${T("guide_desc_api_key")}</td>
            </tr>
          </tbody>
        </table>

        <div class="tip-box warning">
          <strong>${T("guide_tip_security")}\uFF1A</strong>
          <ul>
            <li>${T("guide_security_1")}</li>
            <li>${T("guide_security_2")}</li>
            <li>${T("guide_security_3")}</li>
            <li>${T("guide_security_4")}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Language Switcher Logic
    function switchLanguage() {
        const currentLocale = '${locale}';
        const targetLocale = currentLocale === 'zh' ? 'en' : 'zh';
        document.cookie = \`locale=\${targetLocale}; path=/; max-age=31536000\`;
        window.location.reload();
    }

    // \u7CFB\u7EDF\u6807\u7B7E\u5207\u6362
    document.querySelectorAll('.os-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // \u79FB\u9664\u6240\u6709 active \u72B6\u6001
        document.querySelectorAll('.os-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.os-content').forEach(c => c.classList.remove('active'));

        // \u6DFB\u52A0\u5F53\u524D active \u72B6\u6001
        tab.classList.add('active');
        const os = tab.dataset.os;
        document.getElementById(os).classList.add('active');
      });
    });

    // \u590D\u5236\u4EE3\u7801\u529F\u80FD
    function copyCode(button) {
      const codeBlock = button.parentElement;
      const code = codeBlock.querySelector('code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        button.textContent = "${T("btn_copied_text")}";
        setTimeout(() => {
          button.textContent = "${T("btn_copy")}";
        }, 2000);
      });
    }
  <\/script>
</body>
</html>`;
  return new Response(html, {
    headers: { "content-type": "text/html;charset=UTF-8" }
  });
}
__name(onRequestGet7, "onRequestGet");

// news.js
async function onRequestGet8(context) {
  const { env, request } = context;
  const cookie = request.headers.get("Cookie");
  const locale = getLocale(request.headers.get("Accept-Language"), cookie);
  const T = /* @__PURE__ */ __name((key, vars) => t(locale, key, vars), "T");
  let news = [];
  try {
    const { results } = await env.DB.prepare("SELECT * FROM news ORDER BY published_at DESC LIMIT 15").all();
    news = results || [];
  } catch (e) {
    console.error("DB Error:", e);
  }
  const formatDate = /* @__PURE__ */ __name((isoString) => {
    const date = new Date(isoString);
    return `${date.getMonth() + 1}\u6708${date.getDate()}\u65E5 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }, "formatDate");
  news.forEach((item) => {
    item.formatted_date = formatDate(item.published_at);
  });
  const renderCard = /* @__PURE__ */ __name((item) => `
      <article class="news-card">
        <div class="news-source source-${item.source.toLowerCase()}">${item.source}</div>
        <div class="news-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${item.formatted_date}
        </div>
        <h3 class="news-title">
            <a href="${item.url}" target="_blank">${item.title}</a>
        </h3>
        <p class="news-summary">${item.summary}</p>
        <div class="news-footer">
            <a href="${item.url}" target="_blank" class="read-more">
                ${T("btn_read_more")} 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </a>
        </div>
      </article>
  `, "renderCard");
  const newsCardsHtml = news.map(renderCard).join("");
  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${T("news_page_title")}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="/news.css">
  <style>
    .lang-btn {
        background: rgba(255,255,255,0.1);
        border: 1px solid var(--card-border);
        color: var(--text-main);
        padding: 4px 12px;
        border-radius: 16px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        margin-left: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .lang-btn:hover {
        background: rgba(255,255,255,0.2);
        border-color: var(--accent-glow);
    }
  </style>
</head>
<body>
  <div class="app-shell">
    <header>
      <div class="brand">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path fill="url(#grad1)" d="M12 8l24 32H12z" opacity="0.9"></path>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff9a4d"></stop>
              <stop offset="100%" stop-color="#f552ff"></stop>
            </linearGradient>
          </defs>
        </svg>
        <div>
          <strong>${T("brand_name")}</strong>
          <p style="margin: 0; font-size: 12px; color: var(--text-muted);">${T("brand_subtitle")}</p>
        </div>
      </div>
      <nav>
        <a href="/">${T("nav_home")}</a>
        <a href="/news" class="active">${T("nav_news")}</a>
        <a href="/vpn">${T("nav_vpn")}</a>
        <a href="/guide">${T("nav_guide")}</a>
      </nav>
      <div style="display:flex; align-items:center; margin-left: auto;">
        <div class="github-link" style="margin-left: 0;">
            <a href="https://github.com/ganlian6666/aispace" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>${T("github_text")}</span>
            </a>
        </div>
        <button class="lang-btn" onclick="switchLanguage()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            ${locale === "zh" ? "English" : "\u4E2D\u6587"}
        </button>
      </div>
    </header>

    <div class="news-container">
        <div class="news-header">
            <div>
                <h1>${T("news_header")}</h1>
                <p>${T("news_subtitle")}</p>
            </div>
            <button class="refresh-btn" onclick="triggerUpdate(this)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 4v6h-6M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                ${T("btn_refresh_news")}
            </button>
        </div>

        <div id="news-list">
            ${news.length > 0 ? newsCardsHtml : `<div style="text-align:center; padding:40px; color:var(--text-muted)">${T("text_no_news")}</div>`}
        </div>

        <div style="text-align:center; margin-top:30px;">
           <button id="btn-load-more" onclick="loadMore()" class="refresh-btn" style="width:auto; padding:10px 30px; ${news.length < 15 ? "display:none;" : ""}">${T("btn_load_more")}</button>
        </div>
    </div>
  </div>

  <script>
    let currentPage = 1;

    // Language Switcher Logic
    function switchLanguage() {
        const currentLocale = '${locale}';
        const targetLocale = currentLocale === 'zh' ? 'en' : 'zh';
        document.cookie = \`locale=\${targetLocale}; path=/; max-age=31536000\`;
        window.location.reload();
    }

    async function triggerUpdate(btn) {
        if (btn.classList.contains('loading')) return;
        
        btn.classList.add('loading');
        const originalText = btn.innerHTML;
        btn.innerHTML = "${T("btn_refreshing")}";
        
        try {
            const res = await fetch('/api/admin/update_news');
            const data = await res.json();
            
            if (res.ok) {
                let msg = "${T("alert_update_success")}";
                msg = msg.replace('{fetched}', data.fetched).replace('{inserted}', data.inserted);
                alert(msg);
                window.location.reload();
            } else if (res.status === 429) {
                alert(data.message || "${T("alert_rate_limit")}");
            } else {
                alert('Update Failed: ' + (data.error || 'Unknown Error'));
            }
        } catch (e) {
            alert("${T("alert_network_error")}");
        } finally {
            btn.classList.remove('loading');
            btn.innerHTML = originalText;
        }
    }

    async function loadMore() {
        currentPage++;
        const btn = document.getElementById('btn-load-more');
        btn.innerText = "${T("loading")}";
        btn.disabled = true;

        try {
            const res = await fetch(\`/api/news?page=\${currentPage}\`);
            if (!res.ok) throw new Error('Load failed');
            const newItems = await res.json();

            if (newItems.length > 0) {
                const list = document.getElementById('news-list');
                const html = newItems.map(item => \`
      <article class="news-card">
        <div class="news-source source-\${item.source.toLowerCase()}">\${item.source}</div>
        <div class="news-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            \${item.formatted_date}
        </div>
        <h3 class="news-title">
            <a href="\${item.url}" target="_blank">\${item.title}</a>
        </h3>
        <p class="news-summary">\${item.summary}</p>
        <div class="news-footer">
            <a href="\${item.url}" target="_blank" class="read-more">
                ${T("btn_read_more")} 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </a>
        </div>
      </article>\`).join('');
                list.insertAdjacentHTML('beforeend', html);
            }

            // Hide button if we reached end or page 3 (max 45 items = 3 pages of 15)
            if (newItems.length < 15 || currentPage >= 3) {
                btn.style.display = 'none';
            } else {
                btn.innerText = "${T("btn_load_more")}";
                btn.disabled = false;
            }

        } catch (e) {
            alert('Load Failed');
            btn.innerText = "${T("btn_load_more")}";
            btn.disabled = false;
        }
    }
  <\/script>
</body>
</html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=UTF-8"
    }
  });
}
__name(onRequestGet8, "onRequestGet");

// vpn.js
async function onRequestGet9(context) {
  const { request } = context;
  const cookie = request.headers.get("Cookie");
  const locale = getLocale(request.headers.get("Accept-Language"), cookie);
  const T = /* @__PURE__ */ __name((key, vars) => t(locale, key, vars), "T");
  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${T("vpn_page_title")}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" href="/vpn.css">
  <style>
    .lang-btn {
        background: rgba(255,255,255,0.1);
        border: 1px solid var(--card-border);
        color: var(--text-main);
        padding: 4px 12px;
        border-radius: 16px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        margin-left: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .lang-btn:hover {
        background: rgba(255,255,255,0.2);
        border-color: var(--accent-glow);
    }
  </style>
</head>
<body>
  <div class="app-shell">
    <header>
      <div class="brand">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="url(#grad1)"
            d="M12 8l24 32H12z"
            opacity="0.9"
          ></path>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff9a4d"></stop>
              <stop offset="100%" stop-color="#f552ff"></stop>
            </linearGradient>
          </defs>
        </svg>
        <div>
          <strong>${T("brand_name")}</strong>
          <p style="margin: 0; font-size: 12px; color: var(--text-muted);">
            ${T("brand_subtitle")}
          </p>
        </div>
      </div>
      <nav>
        <a href="/">${T("nav_home")}</a>
        <a href="/news">${T("nav_news")}</a>
        <a href="/vpn" class="active">${T("nav_vpn")}</a>
        <a href="/guide">${T("nav_guide")}</a>
      </nav>
      <div style="display:flex; align-items:center; margin-left: auto;">
        <div class="github-link" style="margin-left: 0;">
            <a href="https://github.com/ganlian6666/aispace" target="_blank" rel="noopener noreferrer" style="color:var(--text-muted); text-decoration:none; display:flex; align-items:center; gap:6px;">
            <svg viewBox="0 0 24 24" aria-hidden="true" style="width:20px; height:20px; fill:currentColor;">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span style="font-size:14px;">${T("github_text")}</span>
            </a>
        </div>
        <button class="lang-btn" onclick="switchLanguage()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            ${locale === "zh" ? "English" : "\u4E2D\u6587"}
        </button>
      </div>
    </header>

    <section class="hero">
      <div>
        <h1>${T("vpn_hero_title")}</h1>
        <p>${T("vpn_hero_desc")}</p>
      </div>
    </section>

    <div class="vpn-grid">
      <!-- VPN Card 1 -->
      <article class="vpn-card">
        <div class="top-badge">${T("vpn_top_1")}</div>
        <div class="vpn-header">
          <h2 class="vpn-name">\u98DE\u9E1F\u4E91</h2>
          <div class="vpn-meta">
            <div class="rating">
              <svg viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>4.8</span>
            </div>
            <span class="badge speed">${T("tag_speed")}</span>
            <span class="badge stable">${T("tag_stable")}</span>
          </div>
          <div class="vpn-price">
            1RMB<small>${T("price_suffix")}</small>
          </div>
          <p class="vpn-desc">\u6781\u81F4\u6027\u4EF7\u6BD4\uFF0C\u652F\u6301\u652F\u4ED8\u5B9D\uFF0C\u7A33\u5B9A\u5FEB\u901F\u7684VPN\u670D\u52A1\u3002</p>
        </div>
        <div class="vpn-body">
          <div class="feature-tags">
            <span class="feature-tag">\u6781\u81F4\u6027\u4EF7\u6BD4</span>
            <span class="feature-tag">\u7A33\u5B9A\u5408\u4E2D\u56FD\u7528\u6237</span>
          </div>
          <div class="core-features">
            <h4>${T("section_features")}</h4>
            <ul class="feature-list">
              <li>\u5730\u533A\uFF1A\u53F0\u6E7E\u65E5\u672C\u65B0\u52A0\u5761\u9999\u6E2F\u7F8E\u56FD</li>
              <li>\u8BF7\u77E5\u6089\u65E0\u9000\u6B3E\u670D\u52A1</li>
              <li>\u4E0D\u9650\u7F51\u901F\uFF0C\u4E0D\u9650\u8BBE\u5907\u6570\u91CF</li>
              <li>\u652F\u6301\u6700\u65B0Hysteria2\u534F\u8BAE</li>
              <li>\u9700\u8981\u81EA\u5DF1\u914D\u7F6E\uFF0C\u8BB0\u5F97\u8BFB\u4E00\u4E0B\u4F7F\u7528\u6587\u6863</li>
              <li>\u53EF\u8BBF\u95EEChatGPT\uFF0CGoogle\u548CNetflix</li>
            </ul>
          </div>
          <div class="payment-methods">
            <h5>${T("section_payment")}</h5>
            <div class="method-tags">
              <span class="method-tag">\u652F\u4ED8\u5B9D</span>
              <span class="method-tag">\u4FE1\u7528\u5361</span>
              <span class="method-tag">\u5FAE\u4FE1</span>
            </div>
          </div>
          <div class="quality-tags">
            <span class="quality-tag">\u63A8\u8350</span>
            <span class="quality-tag">\u652F\u4ED8\u5B9D</span>
            <span class="quality-tag">\u4E2D\u56FD\u4F18\u5316</span>
          </div>
        </div>
        <div class="vpn-footer">
          <a href="https://feiniaoyun11.life/#/register?code=2J2dfAIx" target="_blank" class="visit-btn">
            ${T("btn_visit")}
            <svg viewBox="0 0 24 24">
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z"/>
            </svg>
          </a>
        </div>
      </article>

      <!-- VPN Card 2 -->
      <article class="vpn-card">
        <div class="top-badge silver">${T("vpn_top_2")}</div>
        <div class="vpn-header">
          <h2 class="vpn-name">\u6D41\u91CF\u5149</h2>
          <div class="vpn-meta">
            <div class="rating">
              <svg viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>4.7</span>
            </div>
            <span class="badge speed">${T("tag_speed")}</span>
            <span class="badge stable">${T("tag_stable")}</span>
          </div>
          <div class="vpn-price">
            9.90RMB<small>${T("price_suffix")}</small>
          </div>
          <p class="vpn-desc">\u6CE8\u91CD\u9690\u79C1\u4FDD\u62A4\u7684\u9AD8\u7AEFVPN\u670D\u52A1\uFF0C\u5728\u4E2D\u56FD\u8868\u73B0\u7A33\u5B9A\u3002</p>
        </div>
        <div class="vpn-body">
          <div class="feature-tags">
            <span class="feature-tag">\u6781\u81F4\u9690\u79C1\u4FDD\u62A4</span>
            <span class="feature-tag">\u6D41\u5A92\u4F53\u89E3\u9501</span>
          </div>
          <div class="core-features">
            <h4>${T("section_features")}</h4>
            <ul class="feature-list">
              <li>\u4E0D\u9650\u5236\u8BBE\u5907\u6570,\u4E0D\u9650\u901F</li>
              <li>\u6700\u9AD8\u500D\u7387: \xD71\uFF08\u76F4\u8FDE\u8282\u70B90\u500D\u7387\uFF09</li>
              <li>\u9AD8\u4F18\u5148\u7EA7BGP\u4E13\u7EBF, \u6E2F\u65E5\u65B0\u53F0\u4E13\u7EBF\u4E92\u8054</li>
              <li>\u63D0\u4F9B\u4F18\u79C0\u7684\u6D41\u5A92\u4F53\u89E3\u9501\u4E0E ChatGPT \u89E3\u9501</li>
              <li>\u56FD\u5BB6/\u5730\u533A: \u9999\u6E2F, \u53F0\u6E7E, \u65E5\u672C, \u7F8E\u56FD, \u65B0\u52A0\u5761, \u97E9\u56FD</li>
              <li>\u51B7\u95E8\u56FD\u5BB6/\u5730\u533AIP: \u7F8E\u56FD, \u52A0\u62FF\u5927, \u5357\u6781\u6D32</li>
              <li>\u901A\u77E5\u9891\u9053\u7FA4\u4E0E\u5DE5\u5355\u552E\u540E\u4FDD\u969C</li>
              <li>\u7279\u6B8A\u5546\u54C1, \u65E0\u4EFB\u4F55\u9000\u6B3E\u653F\u7B56, \u8C28\u614E\u4E0B\u5355</li>
            </ul>
          </div>
          <div class="payment-methods">
            <h5>${T("section_payment")}</h5>
            <div class="method-tags">
              <span class="method-tag">\u4FE1\u7528\u5361</span>
              <span class="method-tag">\u652F\u4ED8\u5B9D</span>
              <span class="method-tag">\u5FAE\u4FE1</span>
            </div>
          </div>
          <div class="quality-tags">
            <span class="quality-tag">\u9AD8\u7AEF\u79C1\u5BC6</span>
            <span class="quality-tag">\u7A33\u5B9A</span>
          </div>
        </div>
        <div class="vpn-footer">
          <a href="https://llg01.com/#/register?code=vuLu4sOe" target="_blank" class="visit-btn">
            ${T("btn_visit")}
            <svg viewBox="0 0 24 24">
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z"/>
            </svg>
          </a>
        </div>
      </article>

      <!-- VPN Card 3 -->
      <article class="vpn-card">
        <div class="top-badge">${T("vpn_top_3")}</div>
        <div class="vpn-header">
          <h2 class="vpn-name">\u6A31\u82B1\u732B</h2>
          <div class="vpn-meta">
            <div class="rating">
              <svg viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>4.9</span>
            </div>
            <span class="badge speed">${T("tag_speed")}</span>
            <span class="badge stable">${T("tag_stable")}</span>
          </div>
          <div class="vpn-price">
            3.8RMB<small>${T("price_suffix")}</small>
          </div>
          <p class="vpn-desc">\u5168\u7403\u77E5\u540D\u7684\u9876\u7EA7VPN\u670D\u52A1\uFF0C\u901F\u5EA6\u5FEB\uFF0C\u7A33\u5B9A\u6027\u5F3A\u3002</p>
        </div>
        <div class="vpn-body">
          <div class="feature-tags">
            <span class="feature-tag">\u4E1A\u754C\u6807\u6746</span>
            <span class="feature-tag">\u8D85\u5FEB\u901F\u5EA6</span>
          </div>
          <div class="core-features">
            <h4>${T("section_features")}</h4>
            <ul class="feature-list">
              <li>\u7075\u6D3B\u5957\u9910\uFF1A\u652F\u6301\u6708\u4ED8\u3001\u5B63\u4ED8\u3001\u534A\u5E74\u4ED8\u3001\u5E74\u4ED8\u7B49\u591A\u79CD\u5468\u671F</li>
              <li>\u5BA2\u670D\u4FDD\u969C\uFF1ATelegram\u5728\u7EBF\u5BA2\u670D\u548C\u5DE5\u5355\u7CFB\u7EDF\u652F\u6301</li>
              <li>\u591A\u7AEF\u652F\u6301\uFF1A\u591A\u5BA2\u6237\u7AEF\u5BFC\u5165\u548C\u4E8C\u7EF4\u7801\u8BA2\u9605\u529F\u80FD</li>
              <li>\u9080\u8BF7\u8FD4\u5229\uFF1A\u5B8C\u5584\u7684\u9080\u8BF7\u8FD4\u5229\u548C\u4F63\u91D1\u7BA1\u7406\u7CFB\u7EDF</li>
              <li>\u6CE8\u610F\u4E8B\u9879\uFF1A\u4E0D\u652F\u6301\u65B0\u7586\u5730\u533A\uFF0C\u8D2D\u4E70\u540E\u65E0\u6CD5\u9000\u6B3E\uFF0C\u6D41\u91CF\u4E0D\u53EF\u53E0\u52A0</li>
            </ul>
          </div>
          <div class="payment-methods">
            <h5>${T("section_payment")}</h5>
            <div class="method-tags">
              <span class="method-tag">\u4FE1\u7528\u5361</span>
              <span class="method-tag">\u652F\u4ED8\u5B9D</span>
              <span class="method-tag">\u5FAE\u4FE1</span>
            </div>
          </div>
          <div class="quality-tags">
            <span class="quality-tag">\u9876\u7EA7</span>
            <span class="quality-tag">\u9AD8\u901F</span>
            <span class="quality-tag">\u63A8\u8350</span>
          </div>
        </div>
        <div class="vpn-footer">
          <a href="https://sakura-cat3.com/register?code=3X1mwrVL" target="_blank" class="visit-btn">
            ${T("btn_visit")}
            <svg viewBox="0 0 24 24">
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z"/>
            </svg>
          </a>
        </div>
      </article>
    </div>
  </div>
  
  <script>
    // Language Switcher Logic
    function switchLanguage() {
        const currentLocale = '${locale}';
        const targetLocale = currentLocale === 'zh' ? 'en' : 'zh';
        document.cookie = \`locale=\${targetLocale}; path=/; max-age=31536000\`;
        window.location.reload();
    }
  <\/script>
</body>
</html>`;
  return new Response(html, {
    headers: { "content-type": "text/html;charset=UTF-8" }
  });
}
__name(onRequestGet9, "onRequestGet");

// Ganlian.js
async function onRequest3(context) {
  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u7F51\u7AD9\u7BA1\u7406\u540E\u53F0</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/admin.css">
</head>
</head>
<body>

  <div class="container">
    <!-- Login -->
    <div id="login-panel">
      <h2>\u7BA1\u7406\u5458\u767B\u5F55</h2>
      <input type="password" id="password" placeholder="\u8BF7\u8F93\u5165\u7BA1\u7406\u5BC6\u7801" onkeypress="if(event.key==='Enter') login()">
      <button onclick="login()">\u8FDB\u5165\u540E\u53F0</button>
    </div>

    <!-- Admin -->
    <div id="admin-panel">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h1>\u7F51\u7AD9\u7BA1\u7406</h1>
        <button onclick="logout()" class="btn-outline btn-sm">\u9000\u51FA\u767B\u5F55</button>
      </div>

      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('websites')" id="tab-websites">\u4E3B\u9875\u7F51\u7AD9</button>
        <button class="tab-btn" onclick="switchTab('submissions')" id="tab-submissions">\u7528\u6237\u63D0\u4EA4</button>
        <button class="tab-btn" onclick="switchTab('news')" id="tab-news">\u65B0\u95FB</button>
        <button class="tab-btn" onclick="switchTab('feedback')" id="tab-feedback">\u7528\u6237\u53CD\u9988</button>
      </div>

      <div class="toolbar">
        <div style="display:flex; gap:10px; align-items:center;">
          <!-- Bulk Actions -->
          <div id="bulk-actions" class="bulk-actions" style="display:none;">
            <span style="font-size:14px; color:var(--primary);">\u5DF2\u9009 <span id="selected-count">0</span> \u9879</span>
            <div style="height:20px; width:1px; background:var(--border);"></div>
            <button onclick="bulkDelete()" class="btn-danger btn-sm">\u6279\u91CF\u5220\u9664</button>
            <button id="btn-bulk-add" onclick="openAddToMainModal()" class="btn-success btn-sm" style="display:none;">\u6279\u91CF\u6DFB\u52A0\u5230\u4E3B\u9875</button>
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <!-- \u5BFC\u51FA\u4E0B\u62C9\u83DC\u5355 -->
          <div style="position:relative; display:inline-block;">
            <button onclick="toggleExportMenu()" class="btn-outline">\u5BFC\u51FA \u25BC</button>
            <div id="export-menu" style="display:none; position:absolute; right:0; top:100%; background:var(--panel); border:1px solid var(--border); border-radius:6px; min-width:120px; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,0.5);">
              <div onclick="exportData('submissions')" style="padding:10px; cursor:pointer; border-bottom:1px solid var(--border);">\u7528\u6237\u63D0\u4EA4</div>
              <div onclick="exportData('websites')" style="padding:10px; cursor:pointer;">\u4E3B\u9875\u7F51\u7AD9</div>
            </div>
          </div>

          <!-- \u5BFC\u5165\u6309\u94AE -->
          <input type="file" id="import-file" accept=".json" style="display:none" onchange="handleFileSelect(this)">
          <button onclick="triggerImport()" class="btn-outline">\u5BFC\u5165</button>

          <button onclick="openModal()" id="btn-add">+ \u6DFB\u52A0\u65B0\u7F51\u7AD9</button>
        </div>
      </div>

      <table>
        <thead>
          <tr id="table-header">
            <!-- JS Rendered -->
          </tr>
        </thead>
        <tbody id="site-list">
          <!-- JS Rendered -->
        </tbody>
      </table>
    </div>
  </div>

  <!-- Edit/Add Modal -->
  <div class="modal-backdrop" id="editModal">
    <div class="modal">
      <h2 id="modalTitle">\u6DFB\u52A0\u7F51\u7AD9</h2>
      <input type="hidden" id="original-id">
      
      <div class="form-group">
        <label>ID (\u7559\u7A7A\u81EA\u52A8\u751F\u6210)</label>
        <input type="number" id="edit-id" placeholder="\u4F8B\u5982: 100">
        <div class="hint">\u4FEE\u6539 ID \u53EF\u80FD\u4F1A\u5F71\u54CD\u6392\u5E8F\uFF0C\u8BF7\u8C28\u614E\u64CD\u4F5C\u3002</div>
      </div>

      <div class="form-group">
        <label>\u7F51\u7AD9\u540D\u79F0</label>
        <input type="text" id="edit-name" placeholder="\u4F8B\u5982: Google">
      </div>
      <div class="form-group">
        <label>\u7B80\u5355\u63CF\u8FF0</label>
        <textarea id="edit-desc" rows="3" placeholder="\u63CF\u8FF0\u4E00\u4E0B..."></textarea>
      </div>
      <div class="form-group">
        <label>\u663E\u793A\u94FE\u63A5 (\u7528\u4E8E\u5C55\u793A\u548C\u68C0\u6D4B)</label>
        <input type="text" id="edit-display" placeholder="https://google.com">
      </div>
      <div class="form-group">
        <label>\u9080\u8BF7/\u8DF3\u8F6C\u94FE\u63A5</label>
        <input type="text" id="edit-invite" placeholder="https://google.com?aff=123">
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
        <button onclick="closeModal('editModal')" class="btn-outline">\u53D6\u6D88</button>
        <button onclick="saveSite()">\u4FDD\u5B58</button>
      </div>
    </div>
  </div>

  <!-- Import/Add To Main Confirm Modal -->
  <div class="modal-backdrop" id="importModal">
    <div class="modal">
      <h2 id="importTitle">\u786E\u8BA4\u64CD\u4F5C</h2>
      <p id="importMessage"></p>
      
      <div style="margin:20px 0; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px;">
        <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
          <input type="checkbox" id="import-overwrite" style="width:auto; margin:0;">
          <span>\u8986\u76D6\u73B0\u6709\u6570\u636E (\u6839\u636E ID \u5339\u914D)</span>
        </label>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button onclick="closeModal('importModal')" class="btn-outline">\u53D6\u6D88</button>
        <button id="btn-confirm-import" onclick="confirmImport()">\u786E\u5B9A</button>
      </div>
    </div>
  </div>

  <script>
    let sites = [];
    let currentTab = 'websites'; // websites | submissions | news
    let selectedIds = new Set();
    const API_URL = '/api/admin/websites';
    let selectedImportFile = null;
    let pendingAddToMainData = null;

    // Auth Logic
    let currentKey = '';

    function login() {
      const pwd = document.getElementById('password').value;
      if (!pwd) return alert('\u8BF7\u8F93\u5165\u5BC6\u7801');
      currentKey = pwd;
      loadSites();
    }

    function logout() {
      currentKey = '';
      location.reload();
    }

    function getKey() { return currentKey; }

    // Tab Logic
    function switchTab(tab) {
      currentTab = tab;
      selectedIds.clear();
      updateSelectionUI();
      
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + tab).classList.add('active');
      
      // Toggle buttons
      const btnAdd = document.getElementById('btn-add');
      if (btnAdd) btnAdd.style.display = tab === 'news' ? 'none' : 'inline-block';
      
      const bulkAdd = document.getElementById('btn-bulk-add');
      if (bulkAdd) bulkAdd.style.display = tab === 'submissions' ? 'inline-block' : 'none';

      loadSites();
    }

    // Data Logic
    async function loadSites() {
      const key = getKey();
      if (!key) return;

      let url = \`\${API_URL}?type=\${currentTab}\`;
      if (currentTab === 'feedback') {
          url = '/api/admin/feedback';
      }

      try {
        const res = await fetch(url, {
          headers: { 'X-Admin-Key': key }
        });

        if (res.status === 401) {
          alert('\u5BC6\u7801\u9519\u8BEF');
          return;
        }

        sites = await res.json();
        renderTable();
        
        document.getElementById('login-panel').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
      } catch (e) {
        alert('\u52A0\u8F7D\u5931\u8D25: ' + e.message);
      }
    }

    function renderTable() {
      const thead = document.getElementById('table-header');
      const tbody = document.getElementById('site-list');
      
      const allSelected = sites.length > 0 && sites.every(s => selectedIds.has(s.id));

      // Render Header - Modified for News Index
      let headerHtml = \`<th class="checkbox-col"><input type="checkbox" onchange="toggleSelectAll(this)" \${allSelected ? 'checked' : ''}></th>\`;
      
      if (currentTab === 'news') {
           headerHtml += \`<th style="width:60px">\u5E8F\u53F7</th>
                          <th>\u6807\u9898</th>
                          <th>\u6765\u6E90</th>
                          <th>\u53D1\u5E03\u65F6\u95F4</th>
                          <th style="width:140px">\u64CD\u4F5C</th>\`;
      } else if (currentTab === 'feedback') {
           headerHtml += \`<th style="width:60px">ID</th>
                          <th>\u5185\u5BB9</th>
                          <th>\u8054\u7CFB\u65B9\u5F0F</th>
                          <th>IP / \u65F6\u95F4</th>
                          <th style="width:80px">\u64CD\u4F5C</th>\`;
      } else {
           headerHtml += \`<th style="width:60px">ID</th>
                          <th>\u540D\u79F0</th>\`;
           if (currentTab === 'websites') {
             headerHtml += \`<th>\u663E\u793A\u94FE\u63A5</th>
                            <th>\u72B6\u6001</th>
                            <th style="width:140px">\u64CD\u4F5C</th>\`;
           } else {
             headerHtml += \`<th>\u63D0\u4EA4\u94FE\u63A5</th>
                            <th>IP / \u65F6\u95F4</th>
                            <th style="width:200px">\u64CD\u4F5C</th>\`;
           }
      }
      thead.innerHTML = headerHtml;

      // Render Body - Modified for News Index
      tbody.innerHTML = sites.map((site, index) => {
        const isSelected = selectedIds.has(site.id);
        let rowHtml = \`
          <tr class="\${isSelected ? 'selected' : ''}">
            <td class="checkbox-col">
              <input type="checkbox" value="\${site.id}" \${isSelected ? 'checked' : ''} onchange="toggleSelect(this, \${site.id})">
            </td>\`;

        if (currentTab === 'news') {
             const dateStr = new Date(site.published_at).toLocaleString();
             // SHOW INDEX (+1) instead of ID
             rowHtml += \`
            <td>\${index + 1}</td>
            <td>
              <div style="font-weight:600"><a href="\${site.url}" target="_blank" style="color:#e2e8f0;text-decoration:none">\${site.title}</a></div>
            </td>
            <td>\${site.source}</td>
            <td style="font-size:12px;color:#94a3b8">\${dateStr}</td>
            <td>
              <button class="btn-sm btn-danger" onclick="deleteSite(\${site.id})">\u5220\u9664</button>
            </td>\`;
        } else if (currentTab === 'feedback') {
            rowHtml += \`
            <td>\${site.id}</td>
            <td>
              <div style="font-weight:600; white-space:pre-wrap; max-width:400px;">\${site.content}</div>
            </td>
            <td>\${site.contact || '-'}</td>
            <td>
              <div style="font-size:12px">\${site.ip || 'Unknown'}</div>
              <div style="font-size:12px; color:#94a3b8">\${new Date(site.created_at).toLocaleString()}</div>
            </td>
            <td>
              <button class="btn-sm btn-danger" onclick="deleteSite(\${site.id})">\u5220\u9664</button>
            </td>\`;
        } else {
            // SHOW ID for other tabs
            rowHtml += \`<td>\${site.id}</td>
            <td>
              <div style="font-weight:600">\${site.name}</div>
              <div style="font-size:12px; color:#94a3b8; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${site.description || ''}</div>
            </td>\`;

            if (currentTab === 'websites') {
              rowHtml += \`
                <td><a href="\${site.display_url}" target="_blank" style="color:#3b82f6">\${site.display_url}</a></td>
                <td>
                  <span style="color: \${site.status === 'online' ? '#4ade80' : '#ef4444'}">
                    \${site.status === 'online' ? '\u5728\u7EBF' : '\u79BB\u7EBF'}
                  </span>
                </td>
                <td>
                  <button class="btn-sm" onclick="editSite(\${site.id})">\u7F16\u8F91</button>
                  <button class="btn-sm btn-danger" onclick="deleteSite(\${site.id})">\u5220\u9664</button>
                </td>\`;
            } else {
              // Submissions
              rowHtml += \`
                <td><a href="\${site.url}" target="_blank" style="color:#3b82f6">\${site.url}</a></td>
                <td>
                  <div style="font-size:12px">\${site.ip || 'Unknown'}</div>
                  <div style="font-size:12px; color:#94a3b8">\${new Date(site.created_at).toLocaleString()}</div>
                </td>
                <td>
                  <button class="btn-sm btn-success" onclick="addToMain(\${site.id})">\u52A0\u5165\u4E3B\u9875</button>
                  <button class="btn-sm" onclick="editSite(\${site.id})">\u7F16\u8F91</button>
                  <button class="btn-sm btn-danger" onclick="deleteSite(\${site.id})">\u5220\u9664</button>
                </td>\`;
            }
        }
        rowHtml += \`</tr>\`;
        return rowHtml;
      }).join('');
      
      updateSelectionUI();
    }

    // Selection Logic
    function toggleSelectAll(checkbox) {
      if (checkbox.checked) {
        sites.forEach(s => selectedIds.add(s.id));
      } else {
        selectedIds.clear();
      }
      renderTable(); // Re-render to update checkboxes
    }

    function toggleSelect(checkbox, id) {
      if (checkbox.checked) {
        selectedIds.add(id);
      } else {
        selectedIds.delete(id);
      }
      updateSelectionUI();
    }

    function updateSelectionUI() {
      const count = selectedIds.size;
      const bulkDiv = document.getElementById('bulk-actions');
      document.getElementById('selected-count').textContent = count;
      bulkDiv.style.display = count > 0 ? 'flex' : 'none';
    }

    // Bulk Actions
    async function bulkDelete() {
      if (!confirm(\`\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 \${selectedIds.size} \u9879\u5417\uFF1F\`)) return;
      
      const ids = Array.from(selectedIds).join(',');
      
      let url = \`\${API_URL}?type=\${currentTab}&ids=\${ids}\`;
      if (currentTab === 'feedback') {
          url = \`/api/admin/feedback?id=\${ids}\`;
      }

      try {
        const res = await fetch(url, {
          method: 'DELETE',
          headers: { 'X-Admin-Key': getKey() }
        });
        
        if (res.ok) {
          selectedIds.clear();
          loadSites();
        } else {
          alert('\u5220\u9664\u5931\u8D25');
        }
      } catch (e) {
        alert('\u7F51\u7EDC\u9519\u8BEF');
      }
    }

    // Add To Main Logic
    function addToMain(id) {
      const site = sites.find(s => s.id === id);
      if (!site) return;
      
      pendingAddToMainData = [site];
      document.getElementById('importTitle').textContent = '\u6DFB\u52A0\u5230\u4E3B\u9875';
      document.getElementById('importMessage').textContent = \`\u786E\u5B9A\u5C06 "\${site.name}" \u6DFB\u52A0\u5230\u4E3B\u9875\u7F51\u7AD9\u5217\u8868\u5417\uFF1F\`;
      document.getElementById('importModal').style.display = 'flex';
      
      // Bind confirm action
      document.getElementById('btn-confirm-import').onclick = executeAddToMain;
    }

    function openAddToMainModal() {
      const items = sites.filter(s => selectedIds.has(s.id));
      if (items.length === 0) return;

      pendingAddToMainData = items;
      document.getElementById('importTitle').textContent = '\u6279\u91CF\u6DFB\u52A0\u5230\u4E3B\u9875';
      document.getElementById('importMessage').textContent = \`\u786E\u5B9A\u5C06\u9009\u4E2D\u7684 \${items.length} \u4E2A\u7F51\u7AD9\u6DFB\u52A0\u5230\u4E3B\u9875\u5217\u8868\u5417\uFF1F\`;
      document.getElementById('importModal').style.display = 'flex';
      
      document.getElementById('btn-confirm-import').onclick = executeAddToMain;
    }

    async function executeAddToMain() {
      if (!pendingAddToMainData) return;
      
      const overwrite = document.getElementById('import-overwrite').checked;
      const btn = document.getElementById('btn-confirm-import');
      btn.textContent = '\u5904\u7406\u4E2D...';
      btn.disabled = true;

      try {
        // Transform submission data to website data structure if needed
        // Submissions: id, name, url, invite_link, description
        // Websites: name, description, invite_link, display_url
        // We keep the ID if we want to preserve it, but usually we might want to let it auto-increment if it conflicts?
        // User asked for "overwrite" option, implying ID matching.
        
        const payload = pendingAddToMainData.map(s => ({
          id: s.id, // Keep ID to allow overwrite matching
          name: s.name,
          description: s.description,
          invite_link: s.invite_link || s.url,
          display_url: s.url
        }));

        const res = await fetch(\`\${API_URL}?overwrite=\${overwrite}\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': getKey()
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const result = await res.json();
          alert(\`\u6210\u529F\u6DFB\u52A0/\u66F4\u65B0 \${result.count} \u4E2A\u7F51\u7AD9\uFF01\`);
          closeModal('importModal');
          // Optional: Delete from submissions? User didn't specify, but usually we don't auto-delete unless requested.
          // Let's just refresh.
          if (currentTab === 'websites') loadSites();
          else {
              // If we are in submissions tab, maybe we want to stay here.
              // Deselect processed items
              selectedIds.clear();
              updateSelectionUI();
          }
        } else {
          const err = await res.json();
          alert('\u64CD\u4F5C\u5931\u8D25: ' + err.error);
        }
      } catch (e) {
        alert('\u7F51\u7EDC\u9519\u8BEF');
      } finally {
        btn.textContent = '\u786E\u5B9A';
        btn.disabled = false;
        pendingAddToMainData = null;
      }
    }

    // Export/Import Logic
    function toggleExportMenu() {
        const menu = document.getElementById('export-menu');
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
    
    window.onclick = function(event) {
        if (!event.target.matches('button') && !event.target.matches('.btn-outline')) {
            const menu = document.getElementById('export-menu');
            if (menu && menu.style.display === 'block') {
                menu.style.display = 'none';
            }
        }
    }

    function exportData(type) {
        const key = getKey();
        if (!key) return alert('\u8BF7\u5148\u767B\u5F55');
        window.location.href = \`/api/admin/export?type=\${type}&key=\${key}\`;
    }

    function triggerImport() {
        document.getElementById('import-file').click();
    }

    function handleFileSelect(input) {
        if (input.files && input.files[0]) {
            selectedImportFile = input.files[0];
            document.getElementById('importTitle').textContent = '\u786E\u8BA4\u5BFC\u5165';
            document.getElementById('importMessage').textContent = \`\u60A8\u9009\u62E9\u4E86\u6587\u4EF6: \${selectedImportFile.name}\`;
            document.getElementById('importModal').style.display = 'flex';
            document.getElementById('btn-confirm-import').onclick = confirmImport;
        }
    }

    async function confirmImport() {
        if (!selectedImportFile) return;
        
        const overwrite = document.getElementById('import-overwrite').checked;
        const btn = document.getElementById('btn-confirm-import');
        btn.textContent = '\u5BFC\u5165\u4E2D...';
        btn.disabled = true;

        try {
            const text = await selectedImportFile.text();
            try { JSON.parse(text); } catch (e) { alert('\u65E0\u6548\u7684 JSON'); return; }

            const res = await fetch(\`\${API_URL}?overwrite=\${overwrite}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Key': getKey() },
                body: text
            });

            if (res.ok) {
                const result = await res.json();
                alert(\`\u5BFC\u5165\u6210\u529F\uFF01\u5904\u7406\u4E86 \${result.count} \u6761\u6570\u636E\u3002\`);
                closeModal('importModal');
                loadSites();
            } else {
                const err = await res.json();
                alert('\u5BFC\u5165\u5931\u8D25: ' + err.error);
            }
        } catch (e) {
            alert('\u7F51\u7EDC\u9519\u8BEF');
        } finally {
            btn.textContent = '\u786E\u5B9A';
            btn.disabled = false;
            document.getElementById('import-file').value = '';
            selectedImportFile = null;
        }
    }

    // Edit Logic
    function openModal() {
      document.getElementById('editModal').style.display = 'flex';
      document.getElementById('original-id').value = '';
      document.getElementById('edit-id').value = '';
      document.getElementById('edit-name').value = '';
      document.getElementById('edit-desc').value = '';
      document.getElementById('edit-display').value = '';
      document.getElementById('edit-invite').value = '';
      document.getElementById('modalTitle').textContent = '\u6DFB\u52A0\u7F51\u7AD9';
    }

    function closeModal(modalId = 'editModal') {
      document.getElementById(modalId).style.display = 'none';
    }

    function editSite(id) {
      const site = sites.find(s => s.id === id);
      if (!site) return;

      document.getElementById('original-id').value = site.id;
      document.getElementById('edit-id').value = site.id;
      document.getElementById('edit-name').value = site.name;
      document.getElementById('edit-desc').value = site.description || '';
      
      if (currentTab === 'websites') {
        document.getElementById('edit-display').value = site.display_url;
        document.getElementById('edit-invite').value = site.invite_link;
      } else {
        // Submissions usually have just 'url'
        document.getElementById('edit-display').value = site.url;
        document.getElementById('edit-invite').value = site.invite_link || site.url;
      }
      
      document.getElementById('modalTitle').textContent = '\u7F16\u8F91\u7F51\u7AD9';
      document.getElementById('editModal').style.display = 'flex';
    }

    async function saveSite() {
      const originalId = document.getElementById('original-id').value;
      const newId = document.getElementById('edit-id').value;
      
      const data = {
        id: originalId, // Old ID (if exists)
        new_id: newId,  // New ID
        name: document.getElementById('edit-name').value,
        description: document.getElementById('edit-desc').value,
        display_url: document.getElementById('edit-display').value,
        invite_link: document.getElementById('edit-invite').value
      };
      
      // For submissions, we map display_url back to url
      if (currentTab === 'submissions') {
          data.url = data.display_url;
      }

      if (!data.name || !data.display_url) {
        return alert('\u8BF7\u586B\u5199\u5B8C\u6574\u4FE1\u606F');
      }

      const method = originalId ? 'PUT' : 'POST';
      // If creating new, we don't send 'id' or 'new_id' in the way PUT expects, but POST handles it.
      // Actually my POST implementation checks for 'id' in the body to force specific ID.
      if (!originalId && newId) {
          data.id = newId; // For POST, 'id' is the target ID
      }

      try {
        const res = await fetch(\`\${API_URL}?type=\${currentTab}\`, {
          method: method,
          headers: { 
            'Content-Type': 'application/json',
            'X-Admin-Key': getKey()
          },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          closeModal('editModal');
          loadSites();
        } else {
          const err = await res.json();
          alert('\u4FDD\u5B58\u5931\u8D25: ' + err.error);
        }
      } catch (e) {
        alert('\u7F51\u7EDC\u9519\u8BEF');
      }
    }

    async function deleteSite(id) {
      if (!confirm('\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u7F51\u7AD9\u5417\uFF1F')) return;

      let url = \`\${API_URL}?type=\${currentTab}&id=\${id}\`;
      if (currentTab === 'feedback') {
          url = \`/api/admin/feedback?id=\${id}\`;
      }

      try {
        const res = await fetch(url, {
          method: 'DELETE',
          headers: { 'X-Admin-Key': getKey() }
        });

        if (res.ok) {
          loadSites();
        } else {
          alert('\u5220\u9664\u5931\u8D25');
        }
      } catch (e) {
        alert('\u7F51\u7EDC\u9519\u8BEF');
      }
    }

    if (getKey()) {
      loadSites();
    } else {
      // Auto focus password input
      const pwd = document.getElementById('password');
      if (pwd) pwd.focus();
    }
  <\/script>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}
__name(onRequest3, "onRequest");

// index.js
async function onRequestGet10(context) {
  const { env, request } = context;
  const cookie = request.headers.get("Cookie");
  const locale = getLocale(request.headers.get("Accept-Language"), cookie);
  const T = /* @__PURE__ */ __name((key, vars) => t(locale, key, vars), "T");
  let sites = [];
  let likesMap = {};
  let commentsMap = {};
  try {
    const { results: siteResults } = await env.DB.prepare("SELECT * FROM websites").all();
    sites = siteResults || [];
    const { results: likeResults } = await env.DB.prepare("SELECT card_id, count(*) as count FROM likes GROUP BY card_id").all();
    likeResults.forEach((r) => {
      likesMap[r.card_id] = r.count;
    });
    const { results: commentResults } = await env.DB.prepare("SELECT card_id, count(*) as count FROM comments GROUP BY card_id").all();
    commentResults.forEach((r) => {
      commentsMap[r.card_id] = r.count;
    });
    sites.forEach((site) => {
      if (site.last_checked) {
        const date = new Date(site.last_checked);
        site.formatted_date = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
      } else {
        site.formatted_date = T("text_never_checked");
      }
    });
  } catch (e) {
    console.error("DB Error:", e);
  }
  sites.sort((a, b) => {
    const statusA = a.status === "online" ? 1 : 0;
    const statusB = b.status === "online" ? 1 : 0;
    if (statusA !== statusB) return statusB - statusA;
    const likeA = likesMap[a.id] || 0;
    const likeB = likesMap[b.id] || 0;
    if (likeB !== likeA) return likeB - likeA;
    return a.id - b.id;
  });
  const cardsHtml = sites.map((site) => `
      <article class="card" data-card-id="${site.id}">
        <div class="card-head">
          <h3>${site.name}</h3>
          <div class="status"><div>${T("status_checking")}</div></div>
        </div>
        <p>${site.description}</p>
        <div class="link-block">
          <a href="${site.invite_link}" target="_blank">${site.display_url}</a>
          <button type="button" onclick="copyLink(this)">${T("btn_invite_copy")}</button>
        </div>
        <div class="card-footer">
          <div class="card-actions">
            <button class="action-btn like-btn" onclick="toggleLike(${site.id})">
              <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span class="like-count">${likesMap[site.id] || 0}</span>
            </button>
            <button class="action-btn" onclick="checkNicknameAndToggleComments(${site.id})">
              <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              <span class="comment-count">${commentsMap[site.id] || 0}</span>
            </button>
          </div>
          <div>${T("text_last_checked")} ${site.formatted_date}</div>
        </div>
        <div class="comments-section" id="comments-${site.id}">
          <div class="comment-list"></div>
          <div class="comment-form">
            <div class="nickname-display" style="display:none; align-items:center; gap:8px; margin-bottom:8px; font-size:13px; color:var(--text-muted);">
                <span>${T("nickname_current")}: <b class="current-nickname"></b></span>
                <button onclick="openNicknameModal()" style="background:none; border:none; color:var(--accent-glow); cursor:pointer; padding:0; font-size:12px;">${T("btn_modify")}</button>
            </div>
            <div style="display:flex; gap:8px;">
                <input type="text" class="comment-input" placeholder="${T("comment_placeholder")}" onkeypress="if(event.key==='Enter') postComment(${site.id})">
                <button class="comment-submit" onclick="postComment(${site.id})">${T("btn_send")}</button>
            </div>
          </div>
        </div>
      </article>
  `).join("");
  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${T("home_title")}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css">
  <style>
    .lang-btn {
        background: rgba(255,255,255,0.1);
        border: 1px solid var(--card-border);
        color: var(--text-main);
        padding: 4px 12px;
        border-radius: 16px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        margin-left: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .lang-btn:hover {
        background: rgba(255,255,255,0.2);
        border-color: var(--accent-glow);
    }
  </style>
</head>
<body>
  <div class="app-shell">
    <header>
      <div class="brand">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path fill="url(#grad1)" d="M12 8l24 32H12z" opacity="0.9"></path>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff9a4d"></stop>
              <stop offset="100%" stop-color="#f552ff"></stop>
            </linearGradient>
          </defs>
        </svg>
        <div>
          <strong>${T("brand_name")}</strong>
          <p style="margin: 0; font-size: 12px; color: var(--text-muted);">${T("brand_subtitle")}</p>
        </div>
      </div>
      <nav>
        <a href="/" class="active">${T("nav_home")}</a>
        <a href="/news">${T("nav_news")}</a>
        <a href="/vpn">${T("nav_vpn")}</a>
        <a href="/guide">${T("nav_guide")}</a>
      </nav>
      <div style="display:flex; align-items:center; margin-left: auto;">
        <div class="github-link" style="margin-left: 0;">
            <a href="https://github.com/ganlian6666/aispace" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>${T("github_text")}</span>
            </a>
        </div>
        <button class="lang-btn" onclick="switchLanguage()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            ${locale === "zh" ? "English" : "\u4E2D\u6587"}
        </button>
      </div>
    </header>

    <section class="hero">
      <div>
        <h1>${T("hero_title")}</h1>
        <p>${T("hero_subtitle")}</p>
      </div>
      <div class="submit-wrapper" style="display:flex; align-items:center;">
        <span class="submit-hint">${T("submit_hint")}</span>
        <button class="btn-primary" onclick="openModal('submitModal')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          ${T("btn_submit")}
        </button>
      </div>
    </section>

    <div class="card-grid">
      ${cardsHtml}
    </div>
  </div>

  <!-- Submission Modal -->
  <div class="modal-backdrop" id="submitModal">
    <div class="modal">
      <h2>${T("modal_submit_title")}</h2>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
        ${T("modal_submit_desc")}
      </p>
      <form id="submitForm" onsubmit="submitWebsite(event)">
        <div class="form-group">
          <label>${T("label_name")}</label>
          <input type="text" name="name" class="form-control" placeholder="${T("placeholder_name")}" required>
        </div>
        <div class="form-group">
          <label>${T("label_url")}</label>
          <input type="url" name="url" class="form-control" placeholder="${T("placeholder_url")}" required>
        </div>
        <div class="form-group">
          <label>${T("label_invite")}</label>
          <input type="url" name="invite_link" class="form-control" placeholder="${T("placeholder_invite")}">
        </div>
        <div class="form-group">
          <label>${T("label_desc")}</label>
          <textarea name="description" class="form-control" rows="3" placeholder="${T("placeholder_desc")}"></textarea>
        </div>
        <div class="modal-footer" style="justify-content: space-between;">
          <button type="button" class="btn-secondary" style="border-style: dashed;" onclick="openFeedbackModal()">${T("btn_feedback")}</button>
          <div style="display: flex; gap: 12px;">
             <button type="button" class="btn-secondary" onclick="closeModal('submitModal')">${T("btn_cancel")}</button>
             <button type="submit" class="btn-primary">${T("btn_submit_confirm")}</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- Feedback Modal -->
  <div class="modal-backdrop" id="feedbackModal">
    <div class="modal">
      <h2>${T("modal_feedback_title")}</h2>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
        ${T("modal_feedback_desc")}
      </p>
      <form id="feedbackForm" onsubmit="submitFeedback(event)">
        <div class="form-group">
          <label>${T("label_feedback_content")}</label>
          <textarea name="content" class="form-control" rows="4" placeholder="${T("placeholder_feedback_content")}" required></textarea>
        </div>
        <div class="form-group">
          <label>${T("label_contact")}</label>
          <input type="text" name="contact" class="form-control" placeholder="${T("placeholder_contact")}">
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" onclick="closeModal('feedbackModal')">${T("btn_cancel")}</button>
          <button type="submit" class="btn-primary">${T("btn_send_feedback")}</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Nickname Modal -->
  <div class="modal-backdrop" id="nicknameModal">
    <div class="modal">
      <h2>${T("modal_nickname_title")}</h2>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
        ${T("modal_nickname_desc")}
      </p>
      <div class="form-group">
        <label>${T("label_nickname")}</label>
        <input type="text" id="nicknameInput" class="form-control" placeholder="${T("placeholder_nickname")}" maxlength="20" onkeypress="if(event.key==='Enter') saveNickname()">
      </div>
      <div class="modal-footer" style="justify-content: space-between;">
        <button type="button" class="btn-secondary" style="border-style: dashed;" onclick="setAnonymous()">${T("btn_anonymous")}</button>
        <div style="display: flex; gap: 12px;">
            <button type="button" class="btn-secondary" onclick="closeModal('nicknameModal')">${T("btn_cancel")}</button>
            <button type="button" class="btn-primary" onclick="saveNickname()">${T("btn_save")}</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let pendingCommentCardId = null;

    // Language Switcher Logic
    function switchLanguage() {
        // Toggle logic: current ${locale} -> target ${locale === "zh" ? "en" : "zh"}
        const currentLocale = '${locale}';
        const targetLocale = currentLocale === 'zh' ? 'en' : 'zh';
        
        // Set cookie for 1 year
        document.cookie = \`locale=\${targetLocale}; path=/; max-age=31536000\`;
        
        // Reload to apply
        window.location.reload();
    }

    // \u590D\u5236\u94FE\u63A5\u529F\u80FD
    function copyLink(button) {
      const linkBlock = button.parentElement;
      const link = linkBlock.querySelector('a').href;
      navigator.clipboard.writeText(link).then(() => {
        const originalText = button.textContent;
        button.textContent = "${T("btn_copied")}";
        button.style.background = 'rgba(69, 224, 255, 0.3)';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
        }, 1500);
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        button.textContent = "${T("btn_copied")}";
        setTimeout(() => { button.textContent = "${T("btn_invite_copy")}"; }, 1500);
      });
    }

    // Modal Logic
    function openModal(id) {
      document.getElementById(id).classList.add('active');
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove('active');
    }

    // Nickname Logic
    function checkNicknameAndToggleComments(cardId) {
      const nickname = localStorage.getItem('user_nickname');
      if (!nickname) {
        pendingCommentCardId = cardId;
        openModal('nicknameModal');
      } else {
        toggleComments(cardId);
      }
    }

    function openNicknameModal() {
        pendingCommentCardId = null; // Just changing nickname
        const nickname = localStorage.getItem('user_nickname') || '';
        document.getElementById('nicknameInput').value = nickname;
        openModal('nicknameModal');
    }

    function setAnonymous() {
      localStorage.setItem('user_nickname', 'anonymous');
      closeModal('nicknameModal');
      
      // Update UI
      document.querySelectorAll('.current-nickname').forEach(el => el.textContent = 'anonymous');

      if (pendingCommentCardId) {
        toggleComments(pendingCommentCardId);
        pendingCommentCardId = null;
      }
    }

    function saveNickname() {
      const input = document.getElementById('nicknameInput');
      const name = input.value.trim();
      if (!name) {
        alert("${T("alert_nickname_required")}");
        return;
      }
      localStorage.setItem('user_nickname', name);
      closeModal('nicknameModal');
      
      // Update UI
      document.querySelectorAll('.current-nickname').forEach(el => el.textContent = name);

      if (pendingCommentCardId) {
        toggleComments(pendingCommentCardId);
        pendingCommentCardId = null;
      }
    }

    // Submission Logic
    async function submitWebsite(event) {
      event.preventDefault();
      const form = event.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = "${T("loading")}";
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          alert("${T("alert_submit_success")}");
          closeModal('submitModal');
          form.reset();
        } else {
          const err = await res.json();
          alert("${T("alert_submit_fail")}: " + (err.error || "${T("alert_network_error")}"));
        }
      } catch (e) {
        alert("${T("alert_network_error")}");
      } finally {
        btn.disabled = false;
        btn.textContent = "${T("btn_submit_confirm")}";
      }
    }

    // Feedback Logic
    function openFeedbackModal() {
      // Close submit modal if open, optional but cleaner
      closeModal('submitModal');
      openModal('feedbackModal');
    }

    async function submitFeedback(event) {
      event.preventDefault();
      const form = event.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const btn = form.querySelector('button[type="submit"]');
      
      btn.disabled = true;
      btn.textContent = "${T("loading")}";

      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (res.ok) {
          alert("${T("alert_feedback_success")}");
          closeModal('feedbackModal');
          form.reset();
        } else {
          const err = await res.json();
          alert("${T("alert_submit_fail")}: " + (err.error || 'Unknown Error'));
        }
      } catch (e) {
        alert("${T("alert_network_error")}");
      } finally {
        btn.disabled = false;
        btn.textContent = "${T("btn_send_feedback")}";
      }
    }

    // Likes Logic
    async function toggleLike(cardId) {
      const btn = document.querySelector(\`.card[data-card-id="\${cardId}"] .like-btn\`);
      const countSpan = btn.querySelector('.like-count');
      try {
        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_id: cardId })
        });
        if (res.ok) {
          const data = await res.json();
          countSpan.textContent = data.count;
          btn.classList.add('liked');
        } else {
          const err = await res.json();
          if (res.status === 429) {
            alert("${T("alert_like_limit")}");
          } else {
            console.error(err);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Comments Logic
    async function toggleComments(cardId) {
      const section = document.getElementById(\`comments-\${cardId}\`);
      const isActive = section.classList.contains('active');
      
      // Update nickname display
      const nickname = localStorage.getItem('user_nickname');
      if (nickname) {
        section.querySelector('.nickname-display').style.display = 'flex';
        section.querySelector('.current-nickname').textContent = nickname;
      }

      if (!isActive) {
        section.classList.add('active');
        loadComments(cardId);
      } else {
        section.classList.remove('active');
      }
    }

    async function loadComments(cardId) {
      const list = document.querySelector(\`#comments-\${cardId} .comment-list\`);
      list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-muted)">${T("loading")}</div>';
      try {
        const res = await fetch(\`/api/comments?card_id=\${cardId}\`);
        const comments = await res.json();
        list.innerHTML = '';
        if (comments.length === 0) {
          list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-muted)">${T("no_comments")}</div>';
          return;
        }
        comments.forEach(c => {
          const div = document.createElement('div');
          div.className = 'comment-item';
          div.innerHTML = \`
            <div class="comment-header">
              <span>\${c.nickname || 'Anonymous'}</span>
              <span>\${new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <div>\${c.content}</div>
          \`;
          list.appendChild(div);
        });
      } catch (e) {
        list.innerHTML = '<div style="padding:8px;text-align:center;color:red">Load failed</div>';
      }
    }

    async function postComment(cardId) {
      const section = document.getElementById(\`comments-\${cardId}\`);
      const input = section.querySelector('.comment-input');
      const content = input.value.trim();
      const nickname = localStorage.getItem('user_nickname');

      if (!content) return;
      if (!nickname) {
          checkNicknameAndToggleComments(cardId);
          return;
      }

      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_id: cardId, content, nickname })
        });
        if (res.ok) {
          input.value = '';
          loadComments(cardId);
          // \u7ACB\u5373\u66F4\u65B0\u8BC4\u8BBA\u6570\u663E\u793A
          const countSpan = document.querySelector(\`.card[data-card-id="\${cardId}"] .comment-count\`);
          if (countSpan) {
            const current = parseInt(countSpan.textContent) || 0;
            countSpan.textContent = current + 1;
          }
        } else {
          const err = await res.json();
          if (res.status === 429) {
            alert("${T("alert_comment_limit")}");
          } else {
            alert('Error: ' + err.error);
          }
        }
      } catch (e) {
        alert("${T("alert_network_error")}");
      }
    }

    // Status Check Logic
    async function loadStatus() {
      try {
        const res = await fetch('/api/status');
        const statuses = await res.json();
        statuses.forEach(site => {
          const card = document.querySelector(\`.card[data-card-id="\${site.card_id}"]\`);
          if (!card) return;
          const statusSpan = card.querySelector('.status');
          if (site.status === 'online') {
            statusSpan.innerHTML = \`<div>\u5728\u7EBF</div><div class="latency">\${site.latency}ms</div>\`;
            statusSpan.style.color = '#4ade80';
            statusSpan.style.background = 'rgba(74, 222, 128, 0.15)';
            statusSpan.style.borderColor = 'rgba(74, 222, 128, 0.5)';
          } else {
            statusSpan.innerHTML = \`<div>\u7EF4\u62A4\u4E2D</div>\`;
            statusSpan.style.color = '#f87171';
            statusSpan.style.background = 'rgba(248, 113, 113, 0.15)';
            statusSpan.style.borderColor = 'rgba(248, 113, 113, 0.5)';
          }
        });
      } catch (e) {
        console.error('Failed to load status', e);
      }
    }

    // Init
    loadStatus();
  <\/script>
</body>
</html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=UTF-8"
    }
  });
}
__name(onRequestGet10, "onRequestGet");

// ../.wrangler/tmp/pages-tSEuen/functionsRoutes-0.7156938953294911.mjs
var routes = [
  {
    routePath: "/api/admin/export",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin/feedback",
    mountPath: "/api/admin",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/admin/feedback",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/admin/update_news",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/admin/websites",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/comments",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/comments",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/feedback",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/likes",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/likes",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/news",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/status",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/submit",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/guide",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/news",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/vpn",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/Ganlian",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet10]
  }
];

// C:/Users/GL/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// C:/Users/GL/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
