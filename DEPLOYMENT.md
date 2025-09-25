# 🚀 Deployment Guide - Hook & Headlines Generator

This guide will help you deploy your Hook & Headlines Generator to production quickly and securely.

## 📋 Pre-Deployment Checklist

- [ ] OpenAI API key obtained from [OpenAI Platform](https://platform.openai.com/api-keys)
- [ ] Domain name registered (optional but recommended)
- [ ] Deployment platform account created
- [ ] Environment variables prepared

## 🎯 Quick Deploy Options

### Option 1: Vercel (Recommended)
**Best for: Serverless deployment with automatic scaling**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy Frontend**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `OPENAI_API_KEY`, `ALLOWED_ORIGINS`

4. **Update API Endpoint**
   - In `js/main.js`, change the fetch URL to your Vercel domain

### Option 2: Netlify
**Best for: Static site with serverless functions**

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Create netlify.toml**
   ```toml
   [build]
     functions = "api"
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Option 3: Railway
**Best for: Full-stack deployment with databases**

1. **Connect GitHub Repository**
   - Go to [Railway.app](https://railway.app)
   - Connect your GitHub repository

2. **Add Environment Variables**
   - In Railway dashboard, add your environment variables

3. **Deploy**
   - Railway auto-deploys on git push

## 🔧 Detailed Setup Instructions

### 1. Backend API Deployment

#### For Vercel Functions
```javascript
// api/generate-hooks.js (already created)
module.exports = async (req, res) => {
    // Your existing API code
};
```

#### For Netlify Functions
```javascript
// netlify/functions/generate-hooks.js
exports.handler = async (event, context) => {
    const req = {
        method: event.httpMethod,
        body: JSON.parse(event.body || '{}'),
        headers: event.headers
    };
    
    const res = {
        setHeader: () => {},
        status: (code) => ({ json: (data) => ({
            statusCode: code,
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        })})
    };
    
    // Import and call your handler
    const { handler } = require('../../api/generate-hooks');
    return handler(req, res);
};
```

### 2. Environment Variables Setup

#### Required Variables
```bash
# AI Service
OPENAI_API_KEY=sk-your-openai-key-here

# Security (update with your actual domain)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Alternative AI APIs
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_KEY=your-google-ai-key
```

#### Platform-Specific Setup

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each variable with Production scope

**Netlify:**
1. Go to Site Settings → Environment Variables
2. Add each variable

**Railway:**
1. Go to your project → Variables tab
2. Add each variable

### 3. Frontend Configuration

#### Update API Endpoints
```javascript
// In js/main.js, replace the fetch URL:

// For Vercel:
const response = await fetch('/api/generate-hooks', {

// For Netlify:
const response = await fetch('/.netlify/functions/generate-hooks', {

// For custom domain:
const response = await fetch('https://api.yourdomain.com/generate-hooks', {
```

#### Custom Domain Setup (Optional)
1. **Vercel:** Project Settings → Domains → Add Domain
2. **Netlify:** Site Settings → Domain Management → Add Custom Domain
3. **Railway:** Project Settings → Domain → Custom Domain

## 🔒 Security Configuration

### 1. CORS Setup
Update your API to only allow requests from your domain:

```javascript
// In api/generate-hooks.js
const ALLOWED_ORIGINS = [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
    // Remove localhost in production
];
```

### 2. Rate Limiting (Recommended)
Add rate limiting to prevent abuse:

```javascript
// Example rate limiting middleware
const rateLimitStore = new Map();

function rateLimit(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10; // 10 requests per minute
    
    if (!rateLimitStore.has(ip)) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
    }
    
    const limit = rateLimitStore.get(ip);
    
    if (now > limit.resetTime) {
        limit.count = 1;
        limit.resetTime = now + windowMs;
        return next();
    }
    
    if (limit.count >= maxRequests) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    limit.count++;
    next();
}
```

## 📊 Monitoring & Analytics

### 1. Add Google Analytics
```html
<!-- Add to index.html head section -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA-XXXXXXXXX');
</script>
```

### 2. Error Monitoring
```javascript
// Add to your API handler
const logError = (error, context) => {
    console.error('API Error:', {
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    });
    
    // Send to error tracking service (Sentry, LogRocket, etc.)
    if (process.env.SENTRY_DSN) {
        // Sentry.captureException(error, { extra: context });
    }
};
```

## 🚀 Performance Optimization

### 1. Enable Compression
```javascript
// For Express.js backend
const compression = require('compression');
app.use(compression());
```

### 2. Add Caching Headers
```javascript
// In your API handler
res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
```

### 3. Optimize Images (if adding any)
- Use WebP format with JPEG fallbacks
- Implement lazy loading
- Add proper alt texts for SEO

## 🧪 Testing Your Deployment

### 1. Functional Testing
```bash
# Test API endpoint
curl -X POST https://yourdomain.com/api/generate-hooks \
  -H "Content-Type: application/json" \
  -d '{"method":"brief","content-type":"blog-post","platform":"linkedin","goal":"engagement","topic":"AI productivity"}'
```

### 2. Performance Testing
- Use [PageSpeed Insights](https://pagespeed.web.dev/)
- Test on [GTmetrix](https://gtmetrix.com/)
- Check mobile performance

### 3. Security Testing
- Test CORS configuration
- Verify rate limiting
- Check for XSS vulnerabilities

## 🔄 Maintenance & Updates

### 1. Regular Updates
- Monitor API usage and costs
- Update dependencies monthly
- Review security headers

### 2. Backup Strategy
- Export environment variables
- Backup any user data (if added)
- Document configuration changes

### 3. Monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor API response times
- Track error rates and user feedback

## 🆘 Troubleshooting

### Common Issues

**CORS Errors:**
```javascript
// Ensure CORS headers are set correctly
res.setHeader('Access-Control-Allow-Origin', origin);
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

**API Key Issues:**
```javascript
// Verify environment variable is set
if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
}
```

**Rate Limiting:**
- Implement exponential backoff in frontend
- Add user feedback for rate limits
- Consider paid API plans for higher limits

### Getting Help
1. Check deployment platform documentation
2. Review server logs for errors
3. Test API endpoints individually
4. Verify environment variables are set correctly

## 📈 Scaling Considerations

### For High Traffic:
1. **CDN Setup:** Use Cloudflare or similar
2. **Database:** Add PostgreSQL for user data
3. **Caching:** Implement Redis for API responses
4. **Load Balancing:** Multiple server instances

### Cost Management:
1. **API Optimization:** Cache common responses
2. **Usage Limits:** Implement per-user limits
3. **Monitoring:** Set up billing alerts
4. **Alternative Models:** Consider cheaper AI alternatives for some use cases

---

**🎉 Congratulations! Your Hook & Headlines Generator is now live and ready to help content creators worldwide!**