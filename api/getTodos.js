"use strict";
const { MongoClient } = require("mongodb");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
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
    const client = await getClient();
    const db = client.db(process.env.MONGODB_DATABASE || "TodoDB");
    const todos = await db
      .collection("todos")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify(todos),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to retrieve todos.",
        detail: err.message,
      }),
    };
  }
};
