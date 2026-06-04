"use strict";

const { CosmosClient } = require("@azure/cosmos");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * HTTP GET – returns all to-do items ordered by creation time (newest first).
 *
 * @param {import('@azure/functions').Context} context
 * @param {import('@azure/functions').HttpRequest} req
 */
module.exports = async function getTodos(context, req) {
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

  try {
    const client = new CosmosClient(connectionString);
    const container = client.database(databaseId).container(containerId);

    const querySpec = {
      query: "SELECT * FROM c ORDER BY c._ts DESC",
    };

    const { resources: todos } = await container.items
      .query(querySpec)
      .fetchAll();

    context.res = {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify(todos),
    };
  } catch (err) {
    context.log.error("GetTodos error:", err);
    context.res = {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to retrieve todos.",
        detail: err.message,
      }),
    };
  }
};
