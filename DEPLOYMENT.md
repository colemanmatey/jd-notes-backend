# Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free tier available)
- MongoDB Atlas cluster set up

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the settings

### 3. Configure Environment Variables
In your Vercel project dashboard:
1. Go to Settings → Environment Variables
2. Add these variables:

```
MONGODB_URI = mongodb+srv://colemanmatey:%23theDuke95%24@babysteps.xbrc2ub.mongodb.net/jd-notes?retryWrites=true&w=majority&appName=BabySteps
NODE_ENV = production
FRONTEND_URL = https://your-frontend-domain.vercel.app
```

### 4. Deploy
- Vercel will automatically deploy when you push to main branch
- Or click "Deploy" in the Vercel dashboard

## Your API Endpoints After Deployment
```
https://your-project.vercel.app/api/health
https://your-project.vercel.app/api/notes
https://your-project.vercel.app/api/notes/:id
```

## Testing Deployment
After deployment, test these endpoints:
```bash
curl https://your-project.vercel.app/api/health
curl https://your-project.vercel.app/api/notes
```

## Important Notes
- Vercel functions have a 10-second timeout on free tier
- MongoDB connections are managed automatically for serverless
- CORS is configured for your frontend domain
- All routes now use `/api/` prefix for Vercel

## Troubleshooting
- Check Vercel function logs in dashboard
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Verify environment variables are set correctly
