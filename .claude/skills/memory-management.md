---
name: memory-management
description: Patterns for managing persistent memory in Claude Code using mem0 and other memory systems for context retention across sessions
---

# Memory Management Patterns

Patterns for managing persistent memory and context retention in Claude Code.

## mem0 Integration

### Memory Storage

```typescript
// ✅ Store important context
await mem0.store({
  key: 'user_preferences',
  value: {
    language: 'TypeScript',
    framework: 'React',
    style: 'functional'
  }
});
```

### Memory Retrieval

```typescript
// ✅ Retrieve context
const preferences = await mem0.get('user_preferences');
```

## Context Patterns

### Session Context

```typescript
// ✅ Maintain session context
const sessionContext = {
  project: 'my-app',
  currentFeature: 'authentication',
  lastAction: 'created login component'
};
```

### Project Context

```typescript
// ✅ Store project-wide context
const projectContext = {
  techStack: ['React', 'TypeScript', 'Node.js'],
  patterns: ['component-based', 'functional'],
  conventions: ['PascalCase for components']
};
```

## Memory Strategies

### Important Information

Store:
- User preferences
- Project conventions
- API patterns
- Architecture decisions
- ID mappings

Don't Store:
- Temporary status
- Ephemeral data
- One-time actions
- Log entries

### Memory Format

```typescript
// ✅ Descriptive memory entries
{
  "slack": [
    "The main team channel has ID C1234567 and is called #general"
  ],
  "github": [
    "The main repository is owned by 'teamlead' with ID 98765"
  ]
}
```

## Related MCP Servers

- `mem0` - Memory management server

## Related Agents

- Any agent that needs context retention

## Best Practices

1. Store stable, reusable information
2. Use descriptive memory entries
3. Update memory when context changes
4. Clean up outdated memories
5. Use memory for cross-session continuity
