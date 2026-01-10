@@ -0,0 +1,19 @@
# Netlify Setup (Simple)

## Add your API token to Netlify:

1. Go to your Netlify site dashboard
2. **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Add:
   - **Key:** `HF_API_TOKEN`
   - **Value:** `xxxxx`
5. Save and redeploy

That's it! The token will be automatically injected during build.

## Local development:

Replace `'%%HF_API_TOKEN%%'` with your actual token in `static/js/llm-config.js`

Just don't commit it.
