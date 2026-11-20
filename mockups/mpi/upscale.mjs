// Fal ESRGAN 2x upscale of a local JPEG. Usage: FAL_KEY=... node upscale.mjs in.jpg out.png
import fs from "node:fs";
const [inp, out] = process.argv.slice(2);
const KEY = process.env.FAL_KEY; if (!KEY) throw new Error("FAL_KEY not set");
const H = { Authorization: `Key ${KEY}`, "Content-Type": "application/json" };
const scrub = (s) => String(s).split(KEY).join("***");
const image_url = "data:image/jpeg;base64," + fs.readFileSync(inp).toString("base64");
let res = await fetch("https://queue.fal.run/fal-ai/esrgan", { method: "POST", headers: H, body: JSON.stringify({ image_url, scale: 2, model: "RealESRGAN_x4plus" }) });
if (!res.ok) throw new Error(scrub(`submit HTTP ${res.status} ${(await res.text()).slice(0, 300)}`));
const job = await res.json();
for (;;) { await new Promise(r => setTimeout(r, 3000)); const s = await (await fetch(job.status_url, { headers: H })).json(); if (s.status === "COMPLETED") break; if (s.status !== "IN_QUEUE" && s.status !== "IN_PROGRESS") throw new Error(scrub(JSON.stringify(s).slice(0, 300))); }
const r = await (await fetch(job.response_url, { headers: H })).json();
const url = r.image?.url || r.images?.[0]?.url; if (!url) throw new Error(scrub(JSON.stringify(r).slice(0, 300)));
fs.writeFileSync(out, Buffer.from(await (await fetch(url)).arrayBuffer())); console.log("saved", out);
