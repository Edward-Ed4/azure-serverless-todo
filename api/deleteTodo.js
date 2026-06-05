"use strict";
const { MongoClient } = require("mongodb");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "DELETE,OPTIONS",
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
  const id =
    event.queryStringParameters && event.queryStringParameters.id
      ? event.queryStringParameters.id.trim()
      : "";
  if (!id) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Query parameter id is required." }),
    };
  }
  try {
    const client = await getClient();
    const db = client.db(process.env.MONGODB_DATABASE || "TodoDB");
    const result = await db.collection("todos").deleteOne({ id });
    if (result.deletedCount === 0) {
      return {
        statusCode: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: `Todo with id "${id}" was not found.` }),
      };
    }
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to delete todo.",
        detail: err.message,
      }),
    };
  }
};
