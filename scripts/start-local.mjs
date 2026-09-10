import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webPort = Number(process.env.LOCAL_WEB_PORT || 3011);
const apiPort = Number(process.env.LOCAL_API_PORT || 8000);
const apiUrl = `http://127.0.0.1:${apiPort}`;
const children = [];

function isListening(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.setTimeout(1500, () => { socket.destroy(); resolve(false); });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

async function isApiReady() {
  try {
    const response = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(1500) });
    return response.ok && (await response.json()).status === "ok";
  } catch {
    return false;
  }
}

async function waitForApi() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await isApiReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`The API did not become ready at ${apiUrl}.`);
}

async function imageProcessingHealth() {
  const response = await fetch(`${apiUrl}/api/image-processing/health`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Image processing health returned HTTP ${response.status}.`);
  return response.json();
}

async function waitForRequiredImageProcessing() {
  const deadline = Date.now() + 120_000;
  let lastHealth = null;

  while (Date.now() < deadline) {
    try {
      lastHealth = await imageProcessingHealth();
      if (!lastHealth.enabled) return;
      if (lastHealth.background?.ready && lastHealth.upscale?.ready) return;
    } catch (error) {
      lastHealth = { error: error instanceof Error ? error.message : String(error) };
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const background = lastHealth?.background?.message || lastHealth?.error || "Background removal did not become ready.";
  const upscale = lastHealth?.upscale?.message || lastHealth?.error || "Upscaler did not become ready.";
  throw new Error([
    "Image processing is required because PIXELCUT_ENABLED=true, but the workers are not ready.",
    `Background removal: ${background}`,
    `Upscaler: ${upscale}`,
    "Allow network/browser access to Pixelcut or set PIXELCUT_ENABLED=false only when image processing is intentionally disabled.",
  ].join("\n"));
}

function start(command, args, label) {
  const child = spawn(command, args, { cwd: root, env: { ...process.env, NEXT_PUBLIC_API_URL: apiUrl }, stdio: "inherit", windowsHide: true });
  children.push(child);
  child.once("error", (error) => {
    console.error(`${label}: ${error.message}`);
    shutdown();
    process.exitCode = 1;
  });
  child.once("exit", (code) => {
    if (code && !shuttingDown) console.error(`${label} stopped with exit code ${code}.`);
  });
  return child;
}

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach((child) => child.kill());
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

try {
  if (!(await isApiReady())) {
    if (await isListening(apiPort)) throw new Error(`Port ${apiPort} is occupied but the API is unhealthy. Close the conflicting service and open Start App again.`);
    const python = process.platform === "win32" ? path.join(root, ".venv", "Scripts", "python.exe") : path.join(root, ".venv", "bin", "python");
    start(python, ["-m", "uvicorn", "services.api.app.main:app", "--host", "127.0.0.1", "--port", String(apiPort)], "API");
    await waitForApi();
  }
  console.log(`API ready at ${apiUrl}`);
  await waitForRequiredImageProcessing();
  console.log("Required image processing workers are ready.");

  if (!(await isListening(webPort))) {
    start(process.execPath, [path.join(root, "apps/web/node_modules/next/dist/bin/next"), "dev", path.join(root, "apps/web"), "--hostname", "127.0.0.1", "--port", String(webPort)], "Web app");
  }
  let webReady = false;
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline && !shuttingDown) {
    try {
      const response = await fetch(`http://127.0.0.1:${webPort}/new-order`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) { webReady = true; break; }
    } catch { /* Wait for Next to finish starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!webReady) throw new Error("The web app did not become ready. Check the startup log.");
  console.log(`Web app ready at http://127.0.0.1:${webPort}`);
} catch (error) {
  shutdown();
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
