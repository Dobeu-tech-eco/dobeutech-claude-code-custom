---
description: Plan and execute database migrations safely
---

# Database Migration Command

Plan and execute safe database migrations with rollback support.

## Process

1. **Analyze Current Schema**
   - Review existing database structure
   - Identify tables, indexes, constraints
   - Document current state

2. **Design Migration**
   - Create migration script
   - Ensure backward compatibility
   - Plan rollback strategy
   - Consider data migration needs

3. **Test Migration**
   - Run on development database
   - Verify data integrity
   - Test rollback procedure
   - Check performance impact

4. **Execute Migration**
   - Backup database
   - Run migration script
   - Verify schema changes
   - Update application code if needed

5. **Post-Migration**
   - Verify data integrity
   - Update documentation
   - Monitor for issues
   - Clean up old migrations if safe

## Output

- Migration script (SQL or ORM migration)
- Rollback script
- Data migration scripts if needed
- Documentation of changes

## Related Agents

- `database-migrator` - Database migration specialist

## Related Skills

- `database-patterns` - Database patterns and best practices
