# Node-Modules-Lab-1

Node.js and Express fundamentals lab exercises.

## Repository Structure

```
NODE LAB 1.1/
└── lab-01/
    ├── index.js          # Core HTTP module demo
    ├── server.js         # Express server with route handling
    ├── package.json      # Dependencies and metadata
    └── package-lock.json # Dependency lockfile
```

## Getting Started

1. Navigate to the lab folder:
   ```bash
   cd lab-01
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the servers:
   - **Native HTTP server** (`index.js`):
     ```bash
     node index.js
     ```
   - **Express server** (`server.js`):
     ```bash
     node server.js
     ```

## Express Server Endpoints (`server.js` on port `3000`)
- `GET /`: Welcome greeting
- `GET /about`: Author details & section info
- `GET /time`: Current timestamp
- Any other route: `404 - Page Not Found`
