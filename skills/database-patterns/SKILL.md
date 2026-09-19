---
name: database-patterns
description: Use when designing schemas, modeling data, choosing or using an ORM, writing indexes and optimizing slow queries, planning migrations, or handling transactions and relations.
---

# Database Patterns

Comprehensive patterns for database design, optimization, and management.

## ORM Patterns

### Active Record Pattern

```typescript
// ✅ Model-based operations
const user = await User.findById(id);
user.name = 'New Name';
await user.save();
```

### Repository Pattern

```typescript
// ✅ Abstract data access
class UserRepository {
  async findById(id: string): Promise<User | null> {
    return db.users.findOne({ where: { id } });
  }
  
  async create(data: CreateUserData): Promise<User> {
    return db.users.create(data);
  }
}
```

## Query Optimization

### Indexing Strategy

```sql
-- ✅ Index frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- ✅ Composite indexes for multi-column queries
CREATE INDEX idx_posts_user_status ON posts(user_id, status);
```

### Query Patterns

```typescript
// ✅ Use select to limit fields
await db.users.findAll({
  attributes: ['id', 'name', 'email'],
  where: { status: 'active' }
});

// ✅ Eager loading to prevent N+1
await db.users.findAll({
  include: [{ model: Post, as: 'posts' }]
});
```

## Migration Patterns

### Safe Migrations

```typescript
// ✅ Additive changes first
export async function up(queryInterface) {
  await queryInterface.addColumn('users', 'phone', {
    type: DataTypes.STRING,
    allowNull: true  // Allow null initially
  });
}

// ✅ Populate data
export async function up(queryInterface) {
  await queryInterface.addColumn('users', 'phone', {
    type: DataTypes.STRING,
    allowNull: true
  });
  
  // Populate existing records
  await queryInterface.sequelize.query(
    `UPDATE users SET phone = '' WHERE phone IS NULL`
  );
  
  // Make required
  await queryInterface.changeColumn('users', 'phone', {
    type: DataTypes.STRING,
    allowNull: false
  });
}
```

### Rollback Strategy

```typescript
// ✅ Always provide rollback
export async function down(queryInterface) {
  await queryInterface.removeColumn('users', 'phone');
}
```

## Data Modeling

### Normalization

```sql
-- ✅ Normalized design
users (id, name, email)
posts (id, user_id, title, content)
comments (id, post_id, user_id, content)
```

### Denormalization for Performance

```sql
-- ✅ Denormalize for read performance
posts (id, user_id, user_name, title, content, comment_count)
```

## Transaction Patterns

```typescript
// ✅ Use transactions for atomic operations
await db.transaction(async (t) => {
  const user = await User.create(data, { transaction: t });
  await Profile.create({ userId: user.id }, { transaction: t });
});
```

## Related Commands

- `/migrate-db` - Plan and execute migrations

## Related Agents

- `database-migrator` - Database migration specialist
