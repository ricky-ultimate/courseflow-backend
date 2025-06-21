# 🚀 CourseFlow Backend Deployment Guide

## Free Deployment Options for Students

### 🛤️ Option 1: Railway (Recommended)

Railway offers $5/month free credit which is perfect for student projects.

#### Step 1: Setup Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Connect your GitHub repository

#### Step 2: Deploy Database
1. Click "New Project" → "Provision PostgreSQL"
2. Copy the `DATABASE_URL` from the Variables tab

#### Step 3: Deploy Application
1. Click "New Project" → "Deploy from GitHub repo"
2. Select your courseflow-backend repository
3. Railway will auto-detect it's a Node.js app

#### Step 4: Set Environment Variables
Add these variables in Railway dashboard:
```
DATABASE_URL=postgresql://... (from step 2)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
API_PREFIX=api
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
CORS_ORIGIN=*
ENABLE_SWAGGER=true
```

#### Step 5: Run Database Migration
In Railway's terminal or locally:
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 🎨 Option 2: Render

#### Step 1: Setup Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your repository

#### Step 2: Create PostgreSQL Database
1. New → PostgreSQL
2. Choose free tier
3. Copy the External Database URL

#### Step 3: Create Web Service
1. New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Environment**: Node

#### Step 4: Environment Variables
Same as Railway above, but add in Render dashboard.

### 🔧 Option 3: Vercel + PlanetScale

#### Database: PlanetScale (Free MySQL)
1. Sign up at [planetscale.com](https://planetscale.com)
2. Create database
3. Get connection string
4. Update `schema.prisma` to use MySQL:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

#### Hosting: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts
4. Set environment variables: `vercel env add`

## 🏥 Health Checks

Your app includes comprehensive health checks (all publicly accessible, no authentication required):

- **Basic**: `GET /api/v1/health/simple` - Quick status check
- **Full**: `GET /api/v1/health` - Complete system health with database and memory
- **Database**: `GET /api/v1/health/database` - Database connectivity and table counts
- **Kubernetes Ready**: `GET /api/v1/health/readiness` - Readiness probe for K8s
- **Kubernetes Live**: `GET /api/v1/health/liveness` - Liveness probe for K8s

These endpoints are marked with `@Public()` decorator to bypass authentication guards.

## 📚 API Documentation

Once deployed, your Swagger docs will be available at:
- `https://your-app.railway.app/api/v1/docs` (Railway)
- `https://your-app.onrender.com/api/v1/docs` (Render)

## 🔐 Security Checklist

- ✅ Strong JWT secret (use a password generator)
- ✅ Environment variables set
- ✅ CORS configured
- ✅ Rate limiting enabled
- ✅ Input validation active
- ✅ Health checks working

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Ensure database is running
   - Run migrations: `npx prisma migrate deploy`

2. **App Won't Start**
   - Check logs in platform dashboard
   - Verify all environment variables are set
   - Ensure PORT is set correctly

3. **404 on API Endpoints**
   - Check if API prefix is configured
   - Verify routes in Swagger docs

### Logs:
- **Railway**: Dashboard → Deployments → View Logs
- **Render**: Dashboard → Service → Logs
- **Vercel**: Dashboard → Functions → View Logs

## 🎓 Student Tips

1. **Use GitHub Student Pack**: Get free credits for various platforms
2. **Monitor Usage**: Keep an eye on free tier limits
3. **Optimize**: Use health checks to prevent sleeping (Render)
4. **Backup**: Export your database regularly
5. **Documentation**: Keep your API docs updated

## 🚀 Going Live Checklist

- [ ] Database deployed and migrated
- [ ] Environment variables configured
- [ ] Health checks responding
- [ ] API documentation accessible
- [ ] CORS configured for your frontend
- [ ] JWT authentication working
- [ ] Rate limiting active
- [ ] Error handling tested

Your CourseFlow API is now ready for production! 🎉
