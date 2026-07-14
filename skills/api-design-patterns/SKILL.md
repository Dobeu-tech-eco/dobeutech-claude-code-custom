---
name: api-design-patterns
description: Use when designing or reviewing API contracts — REST resource modeling, GraphQL schemas, gRPC services, versioning schemes, auth flows, pagination, error response shapes, or API documentation.
---

# API Design Patterns

Comprehensive patterns for designing robust, scalable APIs across different protocols.

## RESTful API Patterns

### Resource-Based Design

```typescript
// ✅ Resource-based URLs
GET    /api/users                 # List users
GET    /api/users/:id             # Get user
POST   /api/users                 # Create user
PUT    /api/users/:id             # Replace user
PATCH  /api/users/:id             # Update user
DELETE /api/users/:id             # Delete user

// ✅ Nested resources
GET    /api/users/:id/posts       # User's posts
POST   /api/users/:id/posts       # Create post for user
```

### Query Parameters

```typescript
// ✅ Filtering, sorting, pagination
GET /api/users?status=active&sort=created_at&limit=20&offset=0
GET /api/users?fields=id,name,email  # Field selection
```

## GraphQL Patterns

### Schema Design

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Query {
  user(id: ID!): User
  users(filter: UserFilter): [User!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
}
```

### Resolver Patterns

```typescript
// ✅ DataLoader for N+1 query prevention
const userLoader = new DataLoader(async (ids) => {
  const users = await db.users.findByIds(ids);
  return ids.map(id => users.find(u => u.id === id));
});
```

## gRPC Patterns

### Service Definition

```protobuf
service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (stream User);
  rpc CreateUser(CreateUserRequest) returns (User);
}
```

## API Versioning

### URL Versioning

```typescript
// ✅ Version in URL path
/api/v1/users
/api/v2/users
```

### Header Versioning

```typescript
// ✅ Version in Accept header
Accept: application/vnd.api+json;version=2
```

## Authentication Patterns

### JWT Tokens

```typescript
// ✅ Stateless authentication
Authorization: Bearer <token>
```

### API Keys

```typescript
// ✅ Key-based authentication
X-API-Key: <api-key>
```

## Error Handling

### Standardized Error Responses

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

## Rate Limiting

```typescript
// ✅ Rate limit headers
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Related Commands

- `/api-design` - Generate API specifications

## Related Agents

- `api-designer` - API design specialist
