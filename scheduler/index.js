export default {
    // 定时任务触发
    async scheduled(event, env, ctx) {
        ctx.waitUntil(triggerUpdate(env));
    },

    // HTTP 请求触发 (访问网址时)
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        if (url.searchParams.get("force") === "true") {
            ctx.waitUntil(triggerUpdate(env));
            return new Response("✅ Manual update triggered! Check logs for details.", {
                headers: { "content-type": "text/plain;charset=UTF-8" }
            });
        }

        return new Response("✅ News Scheduler is running.\n(This worker runs automatically every 6 hours)\n\nTip: Add ?force=true to URL to trigger manually.", {
            headers: { "content-type": "text/plain;charset=UTF-8" }
        });
    }
};

async function triggerUpdate(env) {
    console.log("⏰ Triggering news update...");

    const updateUrl = "https://aigit.pages.dev/api/admin/update_news";
    const urlWithKey = `${updateUrl}?key=${env.ADMIN_PASSWORD}`;

    try {
        const resp = await fetch(urlWithKey);
        const status = resp.status;
        const text = await resp.text();
        console.log(`✅ Update request sent. Status: ${status}, Response: ${text}`);
    } catch (err) {
        console.error(`❌ Update request failed: ${err.message}`);
    }
}
