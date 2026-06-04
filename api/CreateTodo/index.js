"use strict";

const { CosmosClient } = require("@azure/cosmos");
const crypto = require("crypto");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * HTTP POST – creates a new to-do item and persists it in Cosmos DB.
 *
 * Request body (JSON): { title: string }
 * Response (JSON, 201): the created item
 *
 * @param {import('@azure/functions').Context} context
 * @param {import('@azure/functions').HttpRequest} req
 */
module.exports = async function createTodo(context, req) {
  // Handle pre-flight OPTIONS request
  if (req.method === "OPTIONS") {
    context.res = { status: 204, headers: CORS_HEADERS, body: "" };
    return;
  }

  const connectionString = process.env.COSMOS_CONNECTION_STRING;
  const databaseId = process.env.COSMOS_DATABASE;
  const containerId = process.env.COSMOS_CONTAINER;

  if (!connectionString || !databaseId || !containerId) {
    context.res = {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error:
          "Server configuration error: missing Cosmos DB environment variables.",
      }),
    };
    return;
  }

  // Parse and validate request body
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    context.res = {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Request body must be valid JSON." }),
    };
    return;
  }

  const title = body && typeof body.title === "string" ? body.title.trim() : "";

  if (!title) {
    context.res = {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: 'The "title" field is required and must not be empty.',
      }),
    };
    return;
  }

  if (title.length > 500) {
    context.res = {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: 'The "title" field must not exceed 500 characters.',
      }),
    };
    return;
  }

  const newTodo = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  try {
    const client = new CosmosClient(connectionString);
    const container = client.database(databaseId).container(containerId);

    const { resource: createdTodo } = await container.items.upsert(newTodo);

    context.res = {
      status: 201,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify(createdTodo),
    };
  } catch (err) {
    context.log.error("CreateTodo error:", err);
    context.res = {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to create todo.",
        detail: err.message,
      }),
    };
  }
};
