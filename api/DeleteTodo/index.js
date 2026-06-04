"use strict";

const { CosmosClient } = require("@azure/cosmos");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * HTTP DELETE – removes a to-do item from Cosmos DB by id.
 *
 * Query parameter: id (string, required)
 * Response: 204 No Content on success
 *
 * @param {import('@azure/functions').Context} context
 * @param {import('@azure/functions').HttpRequest} req
 */
module.exports = async function deleteTodo(context, req) {
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

  const id = req.query && req.query.id ? req.query.id.trim() : "";

  if (!id) {
    context.res = {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: 'Query parameter "id" is required.' }),
    };
    return;
  }

  try {
    const client = new CosmosClient(connectionString);
    const container = client.database(databaseId).container(containerId);

    // The partition key equals the document id (partition key path: /id)
    await container.item(id, id).delete();

    context.res = {
      status: 204,
      headers: CORS_HEADERS,
      body: "",
    };
  } catch (err) {
    // Cosmos SDK throws a 404 if the item doesn't exist
    if (err.code === 404) {
      context.res = {
        status: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: `Todo with id "${id}" was not found.` }),
      };
      return;
    }

    context.log.error("DeleteTodo error:", err);
    context.res = {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to delete todo.",
        detail: err.message,
      }),
    };
  }
};
