# Deployment Guide

This document outlines various deployment options for the Shithead Card Game.

## Quick Deploy Options

### 1. Vercel (Recommended for Frontend)

**Pros:**
- Zero configuration deployment
- Excellent performance with CDN
- Great developer experience
- Automatic HTTPS and custom domains
- Perfect for React apps

**Deploy:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel dashboard for automatic deployments.

### 2. Netlify

**Pros:**
- Simple drag-and-drop deployment
- Great for static sites
- Built-in form handling and functions
- Good free tier

**Deploy:**
```bash
# Build the project
npm run build

# Deploy to Netlify (drag dist folder to netlify.com)
# Or use Netlify CLI:
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### 3. Railway (For Full-Stack)

**Pros:**
- Great Heroku alternative
- Supports both frontend and backend
- PostgreSQL databases included
- Simple deployment process

**Deploy:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway deploy
```

## Configuration Files

### Environment Variables

Create `.env.production` for production builds:

```env
VITE_API_URL=https://your-api-domain.com
VITE_WS_URL=wss://your-websocket-domain.com
```

### Build Configuration

The project includes configuration for:

- **vercel.json** - Vercel deployment config
- **netlify.toml** - Netlify deployment config  
- **Dockerfile** - Container deployment
- **package.json** - Build scripts and dependencies

## Performance Optimization

### Build Optimization

```bash
# Production build with optimizations
npm run build

# Analyze bundle size
npx vite-bundle-analyzer dist
```

### Caching Strategy

- **Static assets:** 1 year cache (handled by Vite)
- **HTML files:** No cache (for updates)
- **API responses:** Short cache (5-15 minutes)

## Monitoring & Analytics

### Recommended Services

1. **Vercel Analytics** (if using Vercel)
2. **Google Analytics** for user tracking
3. **Sentry** for error monitoring
4. **LogRocket** for session replay

### Health Checks

Add health check endpoint:

```javascript
// src/server/health.js
export const healthCheck = (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  })
}
```

## Security Considerations

### Production Security

- Enable HTTPS (automatic on Vercel/Netlify)
- Set proper CORS headers
- Validate all user inputs
- Rate limit API endpoints
- Use environment variables for secrets

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

## Scaling Strategy

### Phase 1: Static Deployment
- Frontend on Vercel/Netlify
- Single-player mode only
- No backend required

### Phase 2: Simple Backend  
- Add Node.js server for multiplayer
- Deploy on Railway/Render
- Use WebSockets for real-time play

### Phase 3: Full Scale
- Separate API and client deployments
- Database for game persistence
- Redis for session management
- Load balancing for high traffic

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules dist
   npm install
   npm run build
   ```

2. **Environment Variables Not Loading**
   - Check `.env` file naming (`.env.production` for production)
   - Variables must start with `VITE_` for client-side access

3. **404 on Client-Side Routes**
   - Ensure SPA redirect rules are configured
   - Check `vercel.json` or `netlify.toml` redirect settings

### Performance Issues

- Use browser dev tools to identify bottlenecks
- Consider code splitting for large components
- Optimize images and assets
- Enable gzip compression (usually automatic)

## Cost Estimation

### Free Tiers
- **Vercel:** 100GB bandwidth, unlimited static sites
- **Netlify:** 100GB bandwidth, 300 build minutes
- **Railway:** $5/month after free trial

### Production Costs (estimated monthly)
- **Small scale (< 10k users):** $0-20
- **Medium scale (< 100k users):** $20-100  
- **Large scale (> 100k users):** $100-500+

Choose deployment strategy based on your expected traffic and budget.