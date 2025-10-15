// app.config.js
export default {
  expo: {
    name: "US Pizza",
    slug: "uspizza",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/uspizza-icon.png",
    scheme: "uspizzanewapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: "AIzaSyD7M4NLYkYK4ovYJeMNY3tqeuB_Xvrj030"
      },
      bundleIdentifier: "com.ipskl168.uspizza"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/uspizza-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      config: {
        googleMaps: {
          apiKey: "AIzaSyD7M4NLYkYK4ovYJeMNY3tqeuB_Xvrj030"
        }
      },
      package: "com.ipskl168.uspizza"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
      build: {
        publicPath: "/app/",
        serviceWorker: false
      }
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "c80d5480-b3da-4d52-adf2-73fd088836e6"
      }
    },
    owner: "ipskl168",
    splash: {
      backgroundColor: "#FFF4E1"
    }
  }
};
