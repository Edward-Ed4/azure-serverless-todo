# CloudTasks – AWS Serverless To-Do Application

A lightweight to-do app built on fully serverless AWS infrastructure with MongoDB Atlas as the database backend.

---

## Architecture

| Layer                | Service                | Role                                        |
| -------------------- | ---------------------- | ------------------------------------------- |
| Frontend hosting     | **AWS S3**             | Serves the static HTML/CSS/JS files         |
| Serverless functions | **AWS Lambda**         | Handles GET, POST, and DELETE todo logic    |
| REST API             | **Amazon API Gateway** | Routes HTTP requests to Lambda functions    |
| Database             | **MongoDB Atlas**      | Cloud-hosted NoSQL store for todo documents |

The three Lambda functions (`getTodos`, `createTodo`, `deleteTodo`) share a single `api/` directory and are deployed together via AWS SAM. Each function maintains a cached MongoDB client across warm invocations to minimise connection overhead.

---

## Prerequisites

- [AWS account](https://aws.amazon.com/free/) with IAM permissions to deploy Lambda, API Gateway, and S3
- [Node.js 22+](https://nodejs.org/)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas) (free tier works fine)

---

## Setup

### 1. Create a MongoDB Atlas free cluster

Sign in to [MongoDB Atlas](https://cloud.mongodb.com), create a free M0 cluster, and allow network access from `0.0.0.0/0` (or restrict to your Lambda NAT Gateway IPs for production).

### 2. Create the database and collection

In Atlas, create a database named `TodoDB` with a collection named `todos`.

### 3. Get your MongoDB connection string

From the Atlas cluster overview, click **Connect → Drivers** and copy the connection string. It looks like:

```
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Store this as the `MONGODB_URI` GitHub secret (or pass it directly when running SAM locally).

### 4. Deploy the API with SAM

```bash
# Install API dependencies
cd api && npm install && cd ..

# Build and deploy (guided first run)
sam build
sam deploy --guided
```

When prompted, provide your MongoDB connection string as the `MongoDBUri` parameter. SAM will output the `ApiUrl` when the deployment completes.

### 5. Create an S3 bucket for the frontend

```bash
aws s3 mb s3://your-bucket-name --region us-east-1
aws s3 website s3://your-bucket-name --index-document index.html
```

Set the bucket policy to allow public read access, then enable static website hosting in the AWS Console.

### 6. Set the API URL in the frontend

Open `frontend/app.js` and update the `API_BASE_URL` line:

```javascript
const API_BASE_URL =
  window.API_BASE_URL ||
  "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/Prod";
```

### 7. Upload frontend files to S3

```bash
aws s3 sync frontend/ s3://your-bucket-name --delete
```

Your app is now live at `http://your-bucket-name.s3-website-us-east-1.amazonaws.com`.

---

## CI/CD with GitHub Actions

The workflow at `.github/workflows/deploy.yml` automatically deploys on every push to `main`.

Add these secrets to your GitHub repository (**Settings → Secrets and variables → Actions**):

| Secret                  | Description                            |
| ----------------------- | -------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | IAM access key with deploy permissions |
| `AWS_SECRET_ACCESS_KEY` | Corresponding IAM secret key           |
| `MONGODB_URI`           | MongoDB Atlas connection string        |
| `S3_BUCKET_NAME`        | S3 bucket name for frontend            |

---

## API Reference

Base URL: `https://{api-id}.execute-api.{region}.amazonaws.com/Prod`

### GET /todos

Returns all todos sorted by creation date descending.

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

### POST /todos

Creates a new todo item.

**Request body**

```json
{ "title": "Buy groceries" }
```

**Response 201**

```json
{
  "id": "uuid",
  "title": "Buy groceries",
  "completed": false,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Response 400** — missing or empty `title`

### DELETE /todos?id={id}

Deletes a todo by its `id`.

**Response 204** — deleted successfully  
**Response 404** — todo not found  
**Response 400** — `id` query parameter missing

---

## Project Structure

```
azure-todo-app/
├── frontend/
│   ├── index.html          # App shell and markup
│   ├── style.css           # Styles
│   └── app.js              # Fetch calls to API Gateway
├── api/
│   ├── package.json        # mongodb driver dependency
│   ├── getTodos.js         # Lambda: GET /todos
│   ├── createTodo.js       # Lambda: POST /todos
│   └── deleteTodo.js       # Lambda: DELETE /todos
├── template.yaml           # AWS SAM infrastructure template
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions CI/CD
├── .gitignore
└── README.md
```
