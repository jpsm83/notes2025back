### Node.js, Express, and MongoDB Backend Engineer Interview Questions and Answers (Intermediate Level)

---

#### 1. What is the event loop in Node.js? How does it work?

The event loop is a mechanism that allows Node.js to perform non-blocking I/O operations. It processes events and callbacks from the event queue, allowing asynchronous execution without multiple threads.

---

#### 2. What are the differences between `process.nextTick()`, `setImmediate()`, and `setTimeout()`?

* `process.nextTick()`: Executes code after the current operation completes, before the event loop continues.
* `setImmediate()`: Executes code on the next iteration of the event loop.
* `setTimeout()`: Schedules code after a specified delay.

---

#### 3. What is the difference between synchronous and asynchronous code in Node.js?

* Synchronous code blocks execution until the operation completes.
* Asynchronous code uses callbacks, promises, or async/await to handle operations without blocking execution.

---

#### 4. What is a memory leak and how would you detect it in a Node app?

A memory leak in a Node.js application occurs when your app holds onto memory it no longer needs, typically due to forgotten references, global variables, or event listeners that aren't properly removed. Over time, this leads to growing memory usage and potential crashes. To detect memory leaks:

* Use Chrome DevTools or `node --inspect` to take heap snapshots.
* Use the `process.memoryUsage()` function to monitor memory usage over time.
* Utilize profiling tools like `clinic.js` or `heapdump` to analyze memory allocations and leaks.

---

#### 5. How does Node handle multithreading or concurrency?

Node uses a single-threaded event loop for asynchronous operations. For CPU-intensive tasks, it uses a thread pool via libuv.

---

#### 6. What is the purpose of `require` vs `import` in Node.js?

* `require`: CommonJS module syntax.
* `import`: ES Module syntax, used with `type: module` in package.json or .mjs files.

---

#### 7. What is middleware in Express? How is it used?

Middleware functions handle requests and responses. They can modify req/res, end the request-response cycle, or call the next middleware.

---

#### 8. How do you handle errors in Express applications?

Use a custom error-handling middleware with four arguments: `err, req, res, next`.

---

#### 9. What are the different HTTP methods and when would you use each?

* GET: Retrieve data
* POST: Create data
* PUT: Replace data
* PATCH: Update part of data
* DELETE: Remove data

---

#### 10. How do you implement route-level authorization in Express?

Use middleware to check roles or permissions before proceeding to the route handler.

---

#### 11. How do you organize a large Express app for scalability?

Use a modular structure with separate folders for routes, controllers, services, and middlewares.

---

#### 12. How do you handle file uploads in Express?

Use `multer` middleware to handle `multipart/form-data` for file uploads.

---

#### 13. How do you model relationships in MongoDB?

* One-to-One: Embed or reference
* One-to-Many: Embed array or reference
* Many-to-Many: Use referencing and linking collections

---

#### 14. When would you use `populate()` in Mongoose?

Use `populate()` to retrieve referenced documents in one query, simulating a JOIN.

---

#### 15. What are indexes in MongoDB, and how do you use them?

Indexes are special data structures in MongoDB that improve the speed and performance of queries by allowing the database engine to find documents faster, without scanning the entire collection.

You can create indexes using the Mongo shell with `db.collection.createIndex()` or define them in Mongoose schemas using the `index` option.

**Pros of Indexing:**

* **Faster read operations**: Indexes greatly speed up find queries and sorting.
* **Efficient range queries**: Improve performance of queries using `$gt`, `$lt`, etc.
* **Support for unique constraints**: Ensure fields like email or username are unique.
* **Compound indexes**: Optimize queries involving multiple fields.

**Cons of Indexing:**

* **Slower write operations**: Insert, update, and delete operations are slower since indexes must be updated.
* **Increased storage**: Indexes use additional disk space.
* **Complexity**: Poorly chosen indexes can degrade performance or go unused.

---

#### 16. What is the difference between embedded and referenced documents?

* Embedded: Store documents within a parent document.
* Referenced: Store object IDs and retrieve with `populate()`.

---

#### 17. How do you perform data validation in Mongoose schemas?

Use schema type options like `required`, `minlength`, `validate`, or custom validators.

---

#### 18. What are aggregation pipelines, and when would you use them?

**Aggregation** in MongoDB is a powerful framework used to transform, compute, and analyze data stored in a collection. Rather than retrieving raw documents and processing them in the application code, aggregation allows for complex operations to be performed directly in the database, improving performance and reducing data transfer.

An **aggregation pipeline** is a sequence of stages where each stage performs a specific operation on the input documents, passing the results to the next stage.

**Common stages include:**

* `$match`: Filters documents (similar to `find()` conditions).
* `$group`: Groups documents by a field and can perform accumulations like sum, average, etc.
* `$sort`: Orders the documents.
* `$project`: Reshapes each document, including or excluding fields.
* `$lookup`: Joins data from another collection (similar to SQL joins).

**Use cases for aggregation:**

* Generating reports or statistics (e.g., average sales per month).
* Data transformation (e.g., converting date formats, computing new fields).
* Joins and advanced querying between multiple collections.

**Why it's needed:**

* Efficiently handle data processing that would otherwise require multiple queries or complex logic in your application layer.
* Minimizes round trips between your application and the database.

---

#### 19. How do you handle pagination in MongoDB queries?

Use `skip()` and `limit()`, or use `_id` with a cursor-based approach for performance.

---

#### 20. What are the principles of RESTful API design?

Stateless communication, resource-based URIs, HTTP methods, standard status codes, and HATEOAS.

---

#### 21. How would you implement authentication and authorization in an API?

Use JWT or sessions for auth. Check tokens and roles in middleware for protected routes.

---

#### 22. What’s the difference between PUT, POST, and PATCH?

* PUT: Replace entire resource
* POST: Create a new resource
* PATCH: Update part of a resource

---

#### 23. How do you version a REST API?

Use URI versioning: `/api/v1/resource`. You can also use headers for more advanced control.

---

#### 24. How do you handle rate limiting in a Node.js API?

Use middleware like `express-rate-limit` to throttle requests based on IP or token.

---

#### 25. What are common security threats in Node apps?

Node applications are exposed to various security threats that developers must actively guard against:

* **Cross-Site Scripting (XSS)**: Attackers inject malicious scripts into web pages viewed by other users. Use input sanitization libraries like `xss-clean` and set Content Security Policies.
* **Cross-Site Request Forgery (CSRF)**: Unauthorized commands transmitted from a user trusted by the application. Prevent this with CSRF tokens using libraries like `csurf`.
* **NoSQL Injection**: Occurs when unvalidated input is used directly in database queries, allowing attackers to manipulate queries. Always validate and sanitize inputs.
* **Command Injection**: If your app uses child processes or shell commands, unvalidated input can be used to execute arbitrary commands. Avoid dynamic command execution and validate inputs strictly.
* **Insecure Cookies**: Without secure flags like `HttpOnly`, `Secure`, and `SameSite`, cookies can be accessed by client-side scripts or sent over insecure channels. Always configure cookies securely.
* **Information Leakage**: Verbose error messages or stack traces exposed to users can reveal application details. Always hide stack traces in production and use generic error responses.

**Best Practices:**

* Keep dependencies updated and scan for known vulnerabilities.
* Use Helmet middleware to set HTTP headers securely.
* Apply role-based access control (RBAC).
* Log security events and monitor application activity.

---

#### 26. How do you prevent NoSQL injection attacks in MongoDB?

Validate input strictly, avoid directly passing user input to query objects, and use Mongoose.

---

#### 27. What is CORS and how do you handle it in Express?

CORS allows cross-origin requests. Use the `cors` package and configure allowed origins.

---

#### 28. How would you securely store passwords in a MongoDB database?

Use `bcrypt` to hash passwords before storing them. Never store plain-text passwords.

---

#### 29. How do you optimize performance in an Express + MongoDB app?

* Use indexes
* Cache with Redis
* Minimize DB calls
* Use lean queries in Mongoose

---

#### 30. What testing frameworks do you use with Node.js?

Use Jest, Mocha, or Supertest to test routes, controllers, and integration flows.
