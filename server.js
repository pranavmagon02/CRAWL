const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, ".cinecrawl-data");
const DATA_FILE = path.join(DATA_DIR, "chat.json");

const DEFAULT_ROOMS = [
  { id: "marvel-mcu", name: "Marvel Universe", desc: "MCU releases, timelines and theories.", code: "MS", cat: "franchise", members: 1284, hot: true, access: "public", createdBy: "CineCrawl" },
  { id: "dc-fans", name: "DC Universe", desc: "Batman, Superman and multiverse debates.", code: "DC", cat: "franchise", members: 876, hot: false, access: "public", createdBy: "CineCrawl" },
  { id: "horror-hub", name: "Horror Hub", desc: "Slashers, dread, folklore and shocks.", code: "HR", cat: "genre", members: 543, hot: false, access: "public", createdBy: "CineCrawl" },
  { id: "bollywood", name: "Bollywood Lounge", desc: "Hindi cinema from classics to new hits.", code: "BW", cat: "regional", members: 721, hot: true, access: "public", createdBy: "CineCrawl" },
  { id: "sci-fi", name: "Sci-Fi Sector", desc: "Space, futures, technology and paradoxes.", code: "SF", cat: "genre", members: 612, hot: false, access: "public", createdBy: "CineCrawl" },
  { id: "directors-cut", name: "Director's Cut", desc: "Cinematography, editing and film craft.", code: "DC", cat: "cinephile", members: 187, hot: false, access: "public", createdBy: "CineCrawl" }
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

let data = loadData();
const clients = new Map();

function loadData() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      const initial = { rooms: [], messages: {}, members: {}, requests: {} };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("Could not load chat data:", error.message);
    return { rooms: [], messages: {}, members: {}, requests: {} };
  }
}

function saveData() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function allRooms() {
  const customIds = new Set(data.rooms.map(room => room.id));
  return [...data.rooms, ...DEFAULT_ROOMS.filter(room => !customIds.has(room.id))].map(room => ({
    ...room,
    access: room.access || "public",
    members: Math.max(Number(room.members || 0), roomMembers(room.id).length || 0),
    requests: (data.requests[room.id] || []).filter(req => req.status === "pending")
  }));
}

function findRoom(id) {
  return allRooms().find(room => room.id === id);
}

function roomMembers(roomId) {
  data.members[roomId] ||= [];
  return data.members[roomId];
}

function roomMessages(roomId) {
  data.messages[roomId] ||= seedMessages(roomId);
  return data.messages[roomId];
}

function seedMessages(roomId) {
  const room = findRoom(roomId);
  const now = Date.now();
  return [
    { id: "seed-1", user: "CineBot", avatar: diceAvatar("CineBot"), text: `Room started for ${room ? room.name : "this topic"}.`, time: now - 3600000, reactions: {} },
    { id: "seed-2", user: "FilmFanatic", avatar: diceAvatar("FilmFanatic"), text: "Drop your latest watchlist picks here.", time: now - 1800000, reactions: { agree: ["CineBot"] } }
  ];
}

function diceAvatar(seed) {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed || "Guest")}`;
}

function publicRoom(room) {
  return {
    id: room.id,
    name: room.name,
    desc: room.desc,
    code: room.code || "CC",
    cat: room.cat || "general",
    members: Math.max(Number(room.members || 0), roomMembers(room.id).length),
    hot: Boolean(room.hot),
    access: room.access || "public",
    createdBy: room.createdBy || "CineCrawl",
    requests: (data.requests[room.id] || []).filter(req => req.status === "pending")
  };
}

function accessFor(room, username) {
  const user = cleanUser(username);
  const members = roomMembers(room.id);
  const requests = data.requests[room.id] || [];
  const isOwner = room.createdBy === user || room.createdBy === "CineCrawl";
  const isMember = members.includes(user);
  const pending = requests.some(req => req.user === user && req.status === "pending");
  const canChat = room.access !== "request" || isOwner || isMember;
  return { canChat, isOwner, isMember, pending };
}

function cleanUser(user) {
  return String(user || "Guest").trim().slice(0, 40) || "Guest";
}

function cleanSlug(slug) {
  return String(slug || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function sendEvent(roomId, payload) {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  for (const [clientId, client] of clients) {
    if (client.roomId === roomId || payload.type === "rooms") {
      client.res.write(message);
    }
  }
}

function handleEvents(req, res, url) {
  const roomId = url.searchParams.get("room") || "";
  const clientId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
    Connection: "keep-alive"
  });
  res.write(`data: ${JSON.stringify({ type: "connected", roomId })}\n\n`);
  clients.set(clientId, { roomId, res });
  req.on("close", () => clients.delete(clientId));
}

async function api(req, res, url) {
  const parts = url.pathname.split("/").filter(Boolean);

  if (url.pathname === "/api/status") {
    return json(res, 200, { ok: true, mode: "realtime", time: Date.now() });
  }

  if (url.pathname === "/api/events") {
    return handleEvents(req, res, url);
  }

  if (url.pathname === "/api/rooms" && req.method === "GET") {
    return json(res, 200, { rooms: allRooms().map(publicRoom) });
  }

  if (url.pathname === "/api/rooms" && req.method === "POST") {
    const body = await readBody(req);
    const slug = cleanSlug(body.slug);
    if (!body.name || String(body.name).trim().length < 3) return json(res, 400, { error: "Room name must be at least 3 characters." });
    if (!body.desc || String(body.desc).trim().length < 12) return json(res, 400, { error: "Description must be at least 12 characters." });
    if (slug.length < 3) return json(res, 400, { error: "Room link must be at least 3 characters." });
    if (findRoom(slug)) return json(res, 409, { error: "That room link is already taken." });

    const createdBy = cleanUser(body.createdBy);
    const room = {
      id: slug,
      name: String(body.name).trim().slice(0, 60),
      desc: String(body.desc).trim().slice(0, 220),
      code: String(body.code || "CC").trim().slice(0, 4).toUpperCase(),
      cat: String(body.cat || "general").trim().slice(0, 40),
      access: body.access === "request" ? "request" : "public",
      members: 1,
      createdBy,
      hot: false
    };
    data.rooms.unshift(room);
    data.members[room.id] = [createdBy];
    saveData();
    sendEvent(room.id, { type: "rooms" });
    return json(res, 201, { room: publicRoom(room) });
  }

  if (parts[0] === "api" && parts[1] === "rooms" && parts[2]) {
    const roomId = parts[2];
    const room = findRoom(roomId);
    if (!room) return json(res, 404, { error: "Room not found." });

    if (parts.length === 3 && req.method === "DELETE") {
      const username = cleanUser(url.searchParams.get("user"));
      if (room.createdBy !== username) return json(res, 403, { error: "Only the creator can delete this room." });
      data.rooms = data.rooms.filter(item => item.id !== roomId);
      delete data.messages[roomId];
      delete data.members[roomId];
      delete data.requests[roomId];
      saveData();
      sendEvent(roomId, { type: "rooms" });
      return json(res, 200, { ok: true });
    }

    if (parts[3] === "messages" && req.method === "GET") {
      const username = cleanUser(url.searchParams.get("user"));
      const access = accessFor(room, username);
      return json(res, 200, {
        room: publicRoom(room),
        access,
        requests: access.isOwner ? (data.requests[roomId] || []).filter(req => req.status === "pending") : [],
        messages: access.canChat ? roomMessages(roomId) : []
      });
    }

    if (parts[3] === "messages" && req.method === "POST") {
      const body = await readBody(req);
      const username = cleanUser(body.user);
      const access = accessFor(room, username);
      if (!access.canChat) return json(res, 403, { error: "Request access before chatting." });
      const text = String(body.text || "").trim();
      if (!text) return json(res, 400, { error: "Message cannot be empty." });
      const members = roomMembers(roomId);
      if (!members.includes(username)) members.push(username);
      const msg = {
        id: `m-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        user: username,
        avatar: body.avatar || diceAvatar(username),
        text: text.slice(0, 1200),
        time: Date.now(),
        reactions: {}
      };
      roomMessages(roomId).push(msg);
      saveData();
      sendEvent(roomId, { type: "messages", roomId });
      return json(res, 201, { message: msg });
    }

    if (parts[3] === "reactions" && req.method === "POST") {
      const body = await readBody(req);
      const username = cleanUser(body.user);
      const access = accessFor(room, username);
      if (!access.canChat) return json(res, 403, { error: "Request access before reacting." });
      const message = roomMessages(roomId).find(item => item.id === body.messageId);
      if (!message) return json(res, 404, { error: "Message not found." });
      const reaction = String(body.reaction || "agree").slice(0, 24);
      message.reactions ||= {};
      message.reactions[reaction] ||= [];
      const index = message.reactions[reaction].indexOf(username);
      if (index >= 0) message.reactions[reaction].splice(index, 1);
      else message.reactions[reaction].push(username);
      if (message.reactions[reaction].length === 0) delete message.reactions[reaction];
      saveData();
      sendEvent(roomId, { type: "messages", roomId });
      return json(res, 200, { ok: true });
    }

    if (parts[3] === "join-request" && req.method === "POST") {
      const body = await readBody(req);
      const username = cleanUser(body.user);
      if (room.access !== "request") {
        const members = roomMembers(roomId);
        if (!members.includes(username)) members.push(username);
        saveData();
        return json(res, 200, { status: "joined" });
      }
      data.requests[roomId] ||= [];
      const existing = data.requests[roomId].find(req => req.user === username && req.status === "pending");
      if (!existing) {
        data.requests[roomId].push({ user: username, avatar: body.avatar || diceAvatar(username), time: Date.now(), status: "pending" });
      }
      saveData();
      sendEvent(roomId, { type: "requests", roomId });
      return json(res, 200, { status: "pending" });
    }

    if (parts[3] === "members" && req.method === "POST") {
      const body = await readBody(req);
      const owner = cleanUser(body.owner);
      const user = cleanUser(body.user);
      const action = body.action === "reject" ? "reject" : "approve";
      if (room.createdBy !== owner) return json(res, 403, { error: "Only the creator can manage requests." });
      data.requests[roomId] ||= [];
      const request = data.requests[roomId].find(req => req.user === user && req.status === "pending");
      if (request) request.status = action === "approve" ? "approved" : "rejected";
      if (action === "approve") {
        const members = roomMembers(roomId);
        if (!members.includes(user)) members.push(user);
      }
      saveData();
      sendEvent(roomId, { type: "messages", roomId });
      sendEvent(roomId, { type: "rooms" });
      return json(res, 200, { ok: true });
    }
  }

  return json(res, 404, { error: "API route not found." });
}

function serveStatic(req, res, url) {
  let filePath = decodeURIComponent(url.pathname);
  if (filePath === "/") filePath = "/index.html";
  const fullPath = path.normalize(path.join(ROOT, filePath));
  if (!fullPath.startsWith(ROOT) || fullPath.includes(`${path.sep}.cinecrawl-data${path.sep}`)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(fullPath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(fullPath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await api(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    json(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`CineCrawl running on http://127.0.0.1:${PORT}`);
  console.log("Invite friends on the same network with your computer IP, for example http://YOUR-IP:8080/chatrooms.html?room=room-link");
});
