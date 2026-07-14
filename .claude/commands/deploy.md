---
description: Plan and execute deployments with zero-downtime strategies
---

# Deployment Command

Plan and execute safe, zero-downtime deployments.

## Process

1. **Pre-Deployment Checklist**
   - Review changes
   - Check migrations
   - Verify environment variables
   - Confirm rollback plan

2. **Select Deployment Strategy**
   - Blue-green for instant rollback
   - Canary for gradual rollout
   - Rolling for gradual updates

3. **Coordinate Migrations**
   - Run migrations before deployment
   - Ensure backward compatibility
   - Plan cleanup migrations

4. **Execute Deployment**
   - Deploy to staging first
   - Run health checks
   - Monitor metrics
   - Deploy to production

5. **Post-Deployment**
   - Verify functionality
   - Monitor for issues
   - Update deployment log

## Output

- Deployment plan
- Migration coordination
- Health check configuration
- Rollback procedures

## Related Agents

- `deployment-manager` - Deployment automation specialist

## Related Skills

- `deployment-strategies` - Deployment strategies
