export default {
  expo: {
    name: "US Pizza",
    slug: "uspizza",
    version: "3.3.0",
    orientation: "portrait",
    icon: "./assets/images/uspizza-newicon.png",
    scheme: "uspizzanewapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: false,
      buildNumber: "9.0.0",
      config: {
        googleMapsApiKey: "AIzaSyD7M4NLYkYK4ovYJeMNY3tqeuB_Xvrj030"
      },
      bundleIdentifier: "com.uspizza.newapp2",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "We use your location to show nearby outlets.",
        NSCameraUsageDescription:
          "US Pizza needs access to your camera to take photos for your profile picture. For example, you can take a photo of yourself to personalize your account profile.",
        NSPhotoLibraryUsageDescription:
          "US Pizza needs access to your photo library to select photos for your profile picture. For example, you can choose an existing photo from your gallery to use as your profile image.",
        ITSAppUsesNonExemptEncryption: false
      },
    },

    android: {
      versionCode: 13,
      adaptiveIcon: {
        foregroundImage: "./assets/images/uspizza-newicon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      config: {
        googleMaps: {
          apiKey: "AIzaSyD7M4NLYkYK4ovYJeMNY3tqeuB_Xvrj030"
        }
      },
      package: "com.ipskl168.uspizza",
      googleServicesFile: "./google-services.json"
    },

    web: {
      bundler: "metro",
      output: "static",
      build: {
        publicPath: "/app/",
        serviceWorker: false
      }
    },

    plugins: [
      [
        "expo-router",
        {
          origin: "https://order.uspizza.my"
        }
      ],
      "expo-font",
      "expo-maps",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/uspizza-newicon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-web-browser",
      "./plugins/withPodfileModifications.js",
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "15.1"
          }
        }
      ]
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
      image: "./assets/images/uspizza-newicon.png",
      resizeMode: "contain",
      backgroundColor: "#FFF4E1"
    }
  }
};
