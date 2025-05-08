# GitHub Trending Repositories API

A Node.js application that fetches and manages trending GitHub repositories, providing both a REST API and a CLI interface.

## Features

- Fetches trending repositories from GitHub API
- Stores repository data in PostgreSQL database
- Automatic synchronization every 60 minutes
- REST API endpoints for repository management
- Command-line interface (CLI) for easy interaction
- TypeScript support with full type safety
- Prisma ORM for database operations

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- GitHub API token

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd node.js-test-task
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/github_trending"
GITHUB_API_URL="https://api.github.com"
GITHUB_TOKEN="your-github-token"
PORT=3000
```

4. Set up the database:
```bash
npx prisma migrate dev
```

## Usage

### Starting the Server

```bash
npm run dev
```

The server will start on port 3000 (or the port specified in your .env file).

### CLI Commands

The project includes a CLI tool for interacting with the API. Here are the available commands:

```bash
# List repositories with pagination
npm run cli list
npm run cli list -- --page 2 --limit 10

# Get repository by ID or name
npm run cli get 123456
npm run cli get owner/repo

# Start sync with GitHub
npm run cli sync

# Force sync with GitHub
npm run cli force-sync
```

### API Endpoints

#### Repository Endpoints

- `GET /api/repos` - Get all repositories
  - Query parameters:
    - `page` (default: 1) - Page number
    - `limit` (default: 30) - Items per page

- `GET /api/repos/:idOrName` - Get repository by ID or name
  - Parameters:
    - `idOrName` - Repository ID or name in format "owner/repo"

#### Sync Endpoints

- `POST /api/sync/start` - Start synchronization with GitHub
- `POST /api/sync/force` - Force immediate synchronization with GitHub

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm run cli` - Run CLI commands
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

### Project Structure

```
src/
├── controllers/     # Request handlers
├── routes/         # API routes
├── services/       # Business logic
├── cli.ts          # CLI implementation
└── index.ts        # Application entry point
```

## Database Schema

The project uses Prisma with the following schema:

```prisma
model Repository {
  id          Int      @id
  name        String
  full_name   String
  stars       Int
  description String?
  url         String
  language    String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request