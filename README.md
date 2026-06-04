# CloudTasks – Azure Serverless To-Do Application

A fully serverless task management app built on Azure. Add, view, and delete tasks through a clean web interface backed by Azure Functions and Cosmos DB, with zero servers to manage.

---

## Architecture

| Service                       | Role                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------- |
| **Azure Static Web Apps**     | Hosts the frontend (HTML/CSS/JS) and acts as a reverse proxy to the Functions API |
| **Azure Functions (Node.js)** | Serverless HTTP API — three functions handle CRUD operations for tasks            |
| **Azure Cosmos DB (NoSQL)**   | Globally distributed, schema-free database that stores task documents             |

---

## Prerequisites

- [Azure account](https://azure.microsoft.com/free/) (free tier is sufficient)
- [Node.js 18+](https://nodejs.org/)
- [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local)
- [Visual Studio Code](https://code.visualstudio.com/) with the [Azure Static Web Apps extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestaticwebapps) (recommended)

---

## Setup & Deployment

### 1. Clone or download the project

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd azure-todo-app
```

### 2. Create a Cosmos DB account (free tier)

1. Sign in to the [Azure Portal](https://portal.azure.com).
2. Search for **Azure Cosmos DB** and click **Create**.
3. Select **Azure Cosmos DB for NoSQL**.
4. Fill in:
   - **Resource Group**: create new or use existing
   - **Account Name**: any globally unique name (e.g. `cloudtasks-db`)
   - **Capacity mode**: Serverless (or select the free tier offer)
5. Click **Review + Create** → **Create** and wait for deployment.

### 3. Create the database and container

1. Open your new Cosmos DB account and click **Data Explorer**.
2. Click **New Container**.
3. Set:
   - **Database id**: `TodoDB` (select _Create new_)
   - **Container id**: `todos`
   - **Partition key**: `/id`
4. Click **OK**.

### 4. Copy the connection string to local settings

1. In the Cosmos DB account, go to **Settings → Keys**.
2. Copy the **PRIMARY CONNECTION STRING**.
3. Open `api/local.settings.json` and replace `YOUR_COSMOS_CONNECTION_STRING` with the copied value.

> **Note:** `local.settings.json` is excluded from source control by `.gitignore` to keep secrets out of your repository.

### 5. Deploy to Azure Static Web Apps via GitHub

1. Push this project to a GitHub repository.
2. In the Azure Portal, create a new **Static Web App**:
   - **Source**: GitHub → select your repo and the `main` branch
   - **Build preset**: Custom
   - **App location**: `frontend`
   - **Api location**: `api`
   - **Output location**: _(leave blank)_
3. Azure will commit a GitHub Actions workflow file to your repo automatically (or use the one already in `.github/workflows/`).
4. The first deployment will run within a few minutes.

### 6. Add the Cosmos DB connection string to Azure

1. In the Azure Portal, open your Static Web App.
2. Go to **Settings → Environment variables**.
3. Add the following variables:

| Name                       | Value                                    |
| -------------------------- | ---------------------------------------- |
| `COSMOS_CONNECTION_STRING` | Your Cosmos DB primary connection string |
| `COSMOS_DATABASE`          | `TodoDB`                                 |
| `COSMOS_CONTAINER`         | `todos`                                  |

4. Save and trigger a new deployment (or push a commit) for the settings to take effect.

---

## Local Development

### Install API dependencies

```bash
cd api
npm install
```

### Start the API locally

```bash
# Inside the api/ directory
func start
```

The Functions runtime will start on `http://localhost:7071`. The three endpoints will be available at:

- `GET  http://localhost:7071/api/GetTodos`
- `POST http://localhost:7071/api/CreateTodo`
- `DELETE http://localhost:7071/api/DeleteTodo?id=<id>`

### Serve the frontend locally

Open `frontend/index.html` directly in a browser, **or** use the [Azure Static Web Apps CLI](https://azure.github.io/static-web-apps-cli/) for a full local emulation (including the `/api` proxy):

```bash
npm install -g @azure/static-web-apps-cli
swa start frontend --api-location api
```

This starts the emulator on `http://localhost:4280`, proxying `/api/*` requests to the local Functions runtime.

---

## Project Structure

```
azure-todo-app/
├── frontend/                  # Static web app (no build step required)
│   ├── index.html             # App shell
│   ├── style.css              # Styles (CSS variables, responsive)
│   └── app.js                 # Vanilla JS — API calls & DOM rendering
├── api/                       # Azure Functions app
│   ├── host.json              # Functions host configuration
│   ├── local.settings.json    # Local env vars (not committed)
│   ├── package.json           # Node.js dependencies
│   ├── GetTodos/              # GET /api/GetTodos
│   │   ├── function.json
│   │   └── index.js
│   ├── CreateTodo/            # POST /api/CreateTodo
│   │   ├── function.json
│   │   └── index.js
│   └── DeleteTodo/            # DELETE /api/DeleteTodo?id=<id>
│       ├── function.json
│       └── index.js
├── .github/
│   └── workflows/
│       └── azure-static-web-apps.yml   # CI/CD pipeline
├── staticwebapp.config.json   # Routing & security headers
└── README.md
```

---

## API Reference

### GET /api/GetTodos

Returns all tasks ordered by creation time (newest first).

**Response 200**

```json
[
  {
    "id": "uuid",
    "title": "Buy groceries",
    "completed": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### POST /api/CreateTodo

Creates a new task.

**Request body**

```json
{ "title": "Buy groceries" }
```

**Response 201** – the created document  
**Response 400** – missing or empty `title`

---

### DELETE /api/DeleteTodo?id={id}

Deletes the task with the given id.

**Response 204** – deleted successfully  
**Response 400** – missing `id` parameter  
**Response 404** – task not found

---

## License

MIT
