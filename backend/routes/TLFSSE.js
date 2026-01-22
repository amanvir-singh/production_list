const express = require("express");
const router = express.Router();
const bus = require("../events/bus");

const clients = new Map();
let nextClientId = 1;

function writeEvent(res, { event, data, id }) {
  if (id !== undefined) res.write(`id: ${id}\n`);
  if (event) res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcast(event, data) {
  const id = Date.now();
  for (const [clientId, res] of clients.entries()) {
    try {
      writeEvent(res, { event, data, id });
    } catch (e) {
      clients.delete(clientId);
    }
  }
}

// Subscribe to service events
bus.on("tlf_snapshot_raw", (snapshot) =>
  broadcast("tlf_snapshot_raw", snapshot)
);
bus.on("tlf_snapshot_agg", (aggSnapshot) =>
  broadcast("tlf_snapshot_agg", aggSnapshot)
);
bus.on("tlf_sync_error", (payload) => broadcast("tlf_sync_error", payload));

// Keep-alive ping
setInterval(() => {
  for (const [clientId, res] of clients.entries()) {
    try {
      res.write(`: ping\n\n`);
    } catch (e) {
      clients.delete(clientId);
    }
  }
}, 25000);

// SSE endpoint
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders?.();

  const clientId = nextClientId++;
  clients.set(clientId, res);

  // initial hello
  writeEvent(res, {
    event: "hello",
    data: { clientId, ts: new Date().toISOString() },
    id: Date.now(),
  });

  req.on("close", () => {
    clients.delete(clientId);
  });
});

module.exports = router;
