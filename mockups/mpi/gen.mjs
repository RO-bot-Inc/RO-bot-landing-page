// Fal nano-banana-pro, 4:5 at 1K, one image per prompt. Same queue/poll pattern as the blog hero script.
import fs from "node:fs";
const [promptFile, out] = process.argv.slice(2);
const KEY = process.env.FAL_KEY; if (!KEY) throw new Error("FAL_KEY not set");
const H = { Authorization: `Key ${KEY}`, "Content-Type": "application/json" };
const scrub = (s) => String(s).split(KEY).join("***");
const input = { prompt: fs.readFileSync(promptFile, "utf8").trim(), aspect_ratio: process.env.AR || "4:5", resolution: "1K", num_images: 1, output_format: "jpeg" };
let res = await fetch("https://queue.fal.run/fal-ai/nano-banana-pro", { method: "POST", headers: H, body: JSON.stringify(input) });
if (!res.ok) throw new Error(scrub(`submit HTTP ${res.status} ${(await res.text()).slice(0, 300)}`));
const job = await res.json();
for (;;) { await new Promise(r => setTimeout(r, 4000)); const s = await (await fetch(job.status_url, { headers: H })).json(); if (s.status === "COMPLETED") break; if (s.status !== "IN_QUEUE" && s.status !== "IN_PROGRESS") throw new Error(scrub(JSON.stringify(s).slice(0, 300))); }
res = await fetch(job.response_url, { headers: H }); const { images = [] } = await res.json();
if (!images.length) throw new Error("no images"); fs.writeFileSync(out, Buffer.from(await (await fetch(images[0].url)).arrayBuffer())); console.log("saved", out);
