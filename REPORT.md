# Cloud Computing Project Report

**Title:** CloudTasks – A Serverless To-Do Web Application on AWS  
**Student Name:** Ebaju Edward  
**Registration Number:** 24/U/23929/PS  
**Student Number:** 2400723929  
**Course:** Cloud Computing  
**Year:** 2026

---

## 1. Introduction

Cloud computing has transformed how software applications are built, deployed, and scaled. Instead of managing physical servers, developers can now leverage cloud platforms to host applications that are globally available, highly scalable, and cost-effective. This project demonstrates the practical application of cloud computing concepts by building and deploying a fully functional serverless web application called **CloudTasks** using Amazon Web Services (AWS).

CloudTasks is a To-Do List web application that allows users to create, view, and delete tasks through a browser-based interface. The application is built entirely on cloud services with no traditional servers required.

---

## 2. Project Objectives

- Design and deploy a cloud-native web application using AWS services
- Demonstrate the use of serverless computing through AWS Lambda
- Implement a REST API using Amazon API Gateway
- Host a static frontend on AWS S3 with public web access
- Integrate a cloud-hosted NoSQL database (MongoDB Atlas) for persistent data storage
- Apply cloud computing concepts including scalability, elasticity, and pay-as-you-go pricing

---

## 3. Cloud Architecture

The application follows a three-tier serverless architecture:

```
[User Browser]
      |
      | HTTP
      v
[AWS S3 - Static Website Hosting]
      |
      | REST API calls
      v
[Amazon API Gateway]
      |
      | Lambda Proxy Integration
      v
[AWS Lambda Functions]
      |
      | MongoDB Driver
      v
[MongoDB Atlas - Cloud Database]
```

### Architecture Diagram Description

| Layer          | Service                   | Role                                              |
| -------------- | ------------------------- | ------------------------------------------------- |
| Presentation   | AWS S3 Static Website     | Hosts HTML, CSS, and JavaScript files             |
| API Layer      | Amazon API Gateway        | Exposes HTTP endpoints and routes requests        |
| Business Logic | AWS Lambda (Node.js 22.x) | Serverless functions handling CRUD operations     |
| Data Layer     | MongoDB Atlas (Free Tier) | Cloud-hosted NoSQL database on AWS infrastructure |

---

## 4. Services Used

### 4.1 Amazon S3 (Simple Storage Service)

Amazon S3 is an object storage service that offers scalability, data availability, and security. In this project, S3 is used to host the static frontend files (HTML, CSS, JavaScript) with static website hosting enabled. The bucket `cloudtasks-frontend-2026` is configured with public read access and serves the application at:

`http://cloudtasks-frontend-2026.s3-website.eu-north-1.amazonaws.com`

**Key features used:**

- Static website hosting
- Public bucket policy for read access
- Object storage for web assets

### 4.2 AWS Lambda

AWS Lambda is a serverless compute service that runs code without provisioning or managing servers. Lambda automatically scales based on the number of requests. Three Lambda functions were created:

| Function                 | HTTP Method | Purpose                               |
| ------------------------ | ----------- | ------------------------------------- |
| `cloudtasks-get-todos`   | GET         | Retrieves all tasks from the database |
| `cloudtasks-create-todo` | POST        | Creates a new task in the database    |
| `cloudtasks-delete-todo` | DELETE      | Deletes a task from the database      |

Each function is written in Node.js 22.x and connects to MongoDB Atlas using the official MongoDB driver. The functions are triggered by HTTP events from API Gateway.

**Key features used:**

- Serverless execution (no server management)
- Node.js 22.x runtime
- Environment variables for secure configuration
- Pay-per-invocation pricing model

### 4.3 Amazon API Gateway

Amazon API Gateway is a fully managed service for creating, publishing, and maintaining REST APIs. It acts as the front door for the Lambda functions, routing HTTP requests to the appropriate function.

**API Endpoints:**

| Method | Endpoint            | Function               |
| ------ | ------------------- | ---------------------- |
| GET    | /Prod/todos         | cloudtasks-get-todos   |
| POST   | /Prod/todos         | cloudtasks-create-todo |
| DELETE | /Prod/todos?id={id} | cloudtasks-delete-todo |

**Base URL:** `https://zvzesiqv22.execute-api.eu-north-1.amazonaws.com/Prod`

**Key features used:**

- REST API with Lambda proxy integration
- CORS configuration for browser access
- Regional endpoint deployment
- Prod deployment stage

### 4.4 MongoDB Atlas

MongoDB Atlas is a fully managed cloud database service that runs on AWS infrastructure. A free tier M0 cluster was created in the Frankfurt (eu-central-1) region.

**Database configuration:**

- Database name: `TodoDB`
- Collection: `todos`
- Cluster: `cloudtasks-cluster`
- IP access: 0.0.0.0/0 (open for Lambda access)

Each task document stored in MongoDB has the following structure:

```json
{
  "id": "uuid-string",
  "title": "Task title",
  "completed": false,
  "createdAt": "2026-06-05T08:00:00.000Z"
}
```

---

## 5. Application Features

The CloudTasks application provides the following functionality:

- **View Tasks:** On page load, all existing tasks are fetched from the database and displayed
- **Add Task:** Users can type a task title and click "Add Task" to save it to the cloud database
- **Delete Task:** Each task has a delete button (✕) to remove it from the database
- **Real-time feedback:** Loading states, error messages, and empty state indicators
- **Responsive design:** Works on desktop and mobile browsers

---

## 6. Implementation

### 6.1 Frontend

The frontend is a single-page application built with plain HTML5, CSS3, and vanilla JavaScript. No frontend framework was used, keeping the application lightweight. The JavaScript fetches data from the API Gateway endpoints using the browser's Fetch API.

### 6.2 Backend (Lambda Functions)

Each Lambda function follows this pattern:

1. Parse the incoming HTTP request from API Gateway
2. Connect to MongoDB Atlas using a cached client connection
3. Perform the database operation (query, insert, or delete)
4. Return a properly formatted HTTP response with CORS headers

Connection caching is used to reuse the MongoDB client across warm Lambda invocations, reducing latency.

### 6.3 Security

- MongoDB credentials are stored as Lambda environment variables, not in source code
- CORS headers restrict API access to browser requests
- S3 bucket policy allows only read access to objects
- MongoDB Atlas IP access list was configured to allow connections

### 6.4 Source Code

The full source code is available on GitHub:  
**https://github.com/Edward-Ed4/azure-serverless-todo**

---

## 7. Deployment Process

1. Created an AWS account with the Free tier (6 months, $200 credit)
2. Created an S3 bucket with static website hosting enabled
3. Created three AWS Lambda functions with Node.js 22.x runtime
4. Uploaded function code as ZIP files containing the handler and MongoDB driver
5. Configured environment variables (MONGODB_URI, MONGODB_DATABASE) on each Lambda
6. Created an Amazon API Gateway REST API with /todos resource
7. Added GET, POST, and DELETE methods with Lambda proxy integration
8. Enabled CORS on the API Gateway
9. Deployed the API to a "Prod" stage
10. Created a MongoDB Atlas free cluster and configured network access
11. Uploaded frontend files to S3 and configured bucket policy

---

## 8. Cloud Computing Concepts Demonstrated

| Concept                  | How it is demonstrated                                                      |
| ------------------------ | --------------------------------------------------------------------------- |
| **Serverless Computing** | AWS Lambda runs code without any server provisioning                        |
| **Scalability**          | Lambda and API Gateway automatically scale to handle any number of requests |
| **Elasticity**           | Resources scale up during high traffic and down to zero when idle           |
| **Pay-as-you-go**        | Lambda charges only for actual function invocations                         |
| **Managed Services**     | No operating system, patching, or infrastructure management required        |
| **Cloud Storage**        | S3 stores and serves static files globally                                  |
| **Cloud Database**       | MongoDB Atlas provides managed NoSQL database in the cloud                  |
| **REST API**             | API Gateway exposes a standard HTTP REST interface                          |
| **High Availability**    | AWS services are distributed across availability zones                      |

---

## 9. Challenges Encountered

During the project, several challenges were encountered:

1. **Azure region restrictions:** The Azure for Students subscription had region restrictions that prevented deployment of Azure Static Web Apps and Azure Functions in available regions. This was resolved by migrating to AWS, which had better region availability.

2. **Lambda handler configuration:** Initially the Lambda handler was set to the default `index.handler` instead of the correct `getTodos.handler`, `createTodo.handler`, and `deleteTodo.handler`. This caused runtime errors that were resolved by updating the runtime settings.

3. **API Gateway CORS:** Cross-Origin Resource Sharing (CORS) needed to be explicitly configured on the API Gateway to allow browser requests from the S3-hosted frontend.

4. **Lambda Proxy Integration:** The API Gateway required Lambda proxy integration to be enabled for each method to correctly pass HTTP requests to and from the Lambda functions.

---

## 10. Live Application

The application is live and accessible at:

**Frontend URL (CloudFront - HTTPS):** https://d18dq5screwix.cloudfront.net  
**S3 URL (direct):** http://cloudtasks-frontend-2026.s3-website.eu-north-1.amazonaws.com  
**API Base URL:** https://zvzesiqv22.execute-api.eu-north-1.amazonaws.com/Prod  
**GitHub Repository:** https://github.com/Edward-Ed4/azure-serverless-todo

---

## 11. Conclusion

This project successfully demonstrates the deployment of a cloud-native serverless web application using AWS services. The CloudTasks application leverages AWS Lambda for serverless compute, Amazon API Gateway for REST API management, AWS S3 for static website hosting, and MongoDB Atlas for cloud database storage.

The project illustrates key cloud computing concepts including serverless architecture, managed services, scalability, and the pay-as-you-go pricing model. The application is fully functional, publicly accessible, and requires zero server management — demonstrating the power and simplicity of modern cloud platforms.

---

## 12. References

- Amazon Web Services Documentation: https://docs.aws.amazon.com
- AWS Lambda Developer Guide: https://docs.aws.amazon.com/lambda/latest/dg/
- Amazon API Gateway Documentation: https://docs.aws.amazon.com/apigateway/
- Amazon S3 Documentation: https://docs.aws.amazon.com/s3/
- MongoDB Atlas Documentation: https://www.mongodb.com/docs/atlas/
- Node.js Documentation: https://nodejs.org/docs/

---

_Submitted by: Ebaju Edward | Reg No: 24/U/23929/PS | Student No: 2400723929_
