# Google Maps Setup Guide

## Prerequisites
1. A Google Cloud Console account
2. A Google Cloud project with Maps JavaScript API enabled

## Getting Your API Keys

### 1. Go to Google Cloud Console
- Visit [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select an existing one

### 2. Enable Maps APIs
Enable these APIs in your project:
- Maps JavaScript API
- Places API (if you need places functionality)
- Geocoding API (if you need address conversion)

### 3. Create API Keys
Create separate API keys for each platform:

#### For Android:
1. Go to "Credentials" → "Create Credentials" → "API Key"
2. Name it "Android Maps API Key"
3. Restrict it to Android apps with your app's package name

#### For iOS:
1. Go to "Credentials" → "Create Credentials" → "API Key"  
2. Name it "iOS Maps API Key"
3. Restrict it to iOS apps with your app's bundle identifier

#### For Web:
1. Go to "Credentials" → "Create Credentials" → "API Key"
2. Name it "Web Maps API Key"
3. Restrict it to HTTP referrers (your domain)

## Configuration

### 1. Update app.json
Replace the placeholder API keys in `app.json`:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_ACTUAL_IOS_API_KEY"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ACTUAL_ANDROID_API_KEY"
        }
      }
    }
  }
}
```

### 2. Environment Variables (Optional)
Create a `.env` file in your project root:

```
ANDROID_GOOGLE_MAPS_API_KEY=your_android_api_key_here
IOS_GOOGLE_MAPS_API_KEY=your_ios_api_key_here
WEB_GOOGLE_MAPS_API_KEY=your_web_api_key_here
```

Then update `app.json` to use environment variables:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "${IOS_GOOGLE_MAPS_API_KEY}"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "${ANDROID_GOOGLE_MAPS_API_KEY}"
        }
      }
    }
  }
}
```

## Security Best Practices

1. **Restrict API Keys**: Always restrict your API keys to specific platforms and domains
2. **Set Usage Limits**: Set daily quotas to prevent unexpected charges
3. **Monitor Usage**: Regularly check your Google Cloud Console for usage
4. **Environment Variables**: Use environment variables for production builds

## Testing

After configuration:
1. Run `expo start` to test on web
2. Run `expo start --android` to test on Android
3. Run `expo start --ios` to test on iOS

The map should now display with Google Maps tiles and your markers should appear correctly.

## Troubleshooting

- **"Google Maps API key not found"**: Check that your API key is correctly set in `app.json`
- **"Maps not loading"**: Ensure the Maps JavaScript API is enabled in Google Cloud Console
- **"Billing required"**: Google Maps requires a billing account to be set up in Google Cloud Console 