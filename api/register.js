"use strict";
const { MongoClient } = require("mongodb");
const crypto = require("crypto");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

let cachedClient = null;

async function getClient() {
  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }
  return cachedClient;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Request body must be valid JSON." }),
    };
  }

  const username =
    body && typeof body.username === "string" ? body.username.trim() : "";
  const password =
    body && typeof body.password === "string" ? body.password : "";

  // Validate username: 3-20 chars, alphanumeric only
  if (!username || !/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error:
          "Username must be 3–20 characters and contain only letters and numbers.",
      }),
    };
  }

  // Validate password: minimum 6 chars
  if (!password || password.length < 6) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Password must be at least 6 characters.",
      }),
    };
  }

  try {
    const client = await getClient();
    const db = client.db(process.env.MONGODB_DATABASE || "TodoDB");
    const users = db.collection("users");

    // Check if username already exists (case-insensitive)
    const existing = await users.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });
    if (existing) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Username is already taken." }),
      };
    }

    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    await users.insertOne({
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    return {
      statusCode: 201,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, username }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to register user.",
        detail: err.message,
      }),
    };
  }
};
