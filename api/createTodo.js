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

  try {
    let body;
    try {
      body =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Request body must be valid JSON." }),
      };
    }

    const title =
      body && typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "The title field is required and must not be empty.",
        }),
      };
    }

    const newTodo = {
      id: crypto.randomUUID(),
      title,
      category: body.category || "Other",
      priority: body.priority || "Medium",
      dueDate: body.dueDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const client = await getClient();
    const db = client.db(process.env.MONGODB_DATABASE || "TodoDB");
    await db.collection("todos").insertOne(newTodo);

    return {
      statusCode: 201,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify(newTodo),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to create todo.",
        detail: err.message,
      }),
    };
  }
};
