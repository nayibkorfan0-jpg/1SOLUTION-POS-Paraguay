/**
 * Electron Builder Configuration for 1SOLUTION
 * Builds Windows executable and installer for car wash POS system
 */
module.exports = {
  appId: "com.onesolution.carwash-pos",
  productName: "1SOLUTION",
  copyright: "Copyright © 2024 1SOLUTION",
  
  // Directories
  directories: {
    output: "release",
    buildResources: "build"
  },
  
  // Files to include in the app
  files: [
    "dist/**/*",
    "electron/**/*",
    "assets/**/*",
    "database.sqlite", // Include the database file if exists
    "node_modules/**/*",
    "!node_modules/electron/**/*",
    "!node_modules/.cache/**/*",
    "!**/*.map",
    "!src/**/*",
    "!client/**/*",
    "!server/**/*",
    "shared/**/*", // Include shared schemas for SQLite
    "!migrations/**/*",
    "!*.config.*",
    "!.env*",
    "!.git*",
    "!README.md"
  ],
  
  // Extra resources (files available at runtime)
  extraResources: [
    {
      from: "assets/",
      to: "assets/"
    }
  ],
  
  // Main entry point
  main: "electron/main.js",
  
  // Windows-specific configuration
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64", "ia32"]
      },
      {
        target: "portable",
        arch: ["x64", "ia32"]
      }
    ],
    icon: "assets/icon.ico",
    requestedExecutionLevel: "asInvoker",
    publisherName: "1SOLUTION",
    artifactName: "${productName}-Setup-${version}-${arch}.${ext}"
  },
  
  // NSIS installer configuration
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    installerIcon: "assets/icon.ico",
    uninstallerIcon: "assets/icon.ico",
    installerHeaderIcon: "assets/icon.ico",
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "1SOLUTION",
    // include: "build/installer.nsh", // Optional custom installer script
    license: "LICENSE.txt", // License file exists
    language: "3082", // Spanish
    displayLanguageSelector: false,
    menuCategory: "Business",
    runAfterFinish: true,
    artifactName: "${productName}-Setup-${version}-${arch}.${ext}"
  },
  
  // Portable executable configuration
  portable: {
    artifactName: "${productName}-Portable-${version}-${arch}.${ext}"
  },
  
  // Mac configuration (for potential future use)
  mac: {
    target: "dmg",
    icon: "assets/icon.icns",
    category: "public.app-category.business"
  },
  
  // Linux configuration (for potential future use)
  linux: {
    target: [
      {
        target: "AppImage",
        arch: ["x64"]
      }
    ],
    icon: "assets/icon.png",
    category: "Office"
  },
  
  // Compression
  compression: "maximum",
  
  // Build options - CRITICAL FIX for native modules
  npmRebuild: true,
  nodeGypRebuild: true,
  
  // CRITICAL: Unpack native modules from asar for better-sqlite3
  asarUnpack: [
    "node_modules/better-sqlite3/**/*"
  ],
  
  // Metadata
  metadata: {
    description: "Sistema POS integral para lavaderos de vehículos con cumplimiento fiscal paraguayo",
    author: {
      name: "1SOLUTION",
      email: "info@1solution.com.py"
    },
    homepage: "https://1solution.com.py",
    keywords: [
      "pos",
      "car wash",
      "lavadero",
      "punto de venta",
      "paraguay",
      "fiscal"
    ]
  },
  
  // Publish configuration (for auto-updates if needed in future)
  publish: null,
  
  // Additional configuration removed - missing files
  // afterSign: "electron/notarize.js", // For code signing if needed
  // beforeBuild: "electron/before-build.js", // Pre-build tasks
  
  // Extend info for Windows
  extraMetadata: {
    version: "1.0.0",
    description: "Sistema POS para Lavaderos - 1SOLUTION",
    main: "electron/main.js"
  }
};