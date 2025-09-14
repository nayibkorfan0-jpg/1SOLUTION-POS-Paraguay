# Application Icon Requirements for 1SOLUTION

## Required Icon Files

For proper Windows distribution, the following icon files need to be created and placed in the `assets/` directory:

### Windows Icons
1. **icon.ico** - Main Windows icon (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
   - Used for: Application executable, taskbar, system tray
   - Format: ICO format with multiple resolutions embedded

2. **icon.png** - Base PNG icon (512x512)
   - Used for: Electron development and other platforms
   - Format: PNG with transparent background

### Recommended Icon Design
- **Theme**: Car wash / automotive service
- **Colors**: Professional blue/white or blue/grey scheme
- **Elements**: 
  - Car silhouette or car wash spray
  - 1SOLUTION text or "1S" monogram
  - Clean, modern design suitable for business use
- **Style**: Simple, recognizable at small sizes (16x16)

## Icon Creation Tools

You can create these icons using:
- **Professional**: Adobe Illustrator + Photoshop
- **Free Online**: Canva, GIMP, Paint.NET
- **Icon Converters**: 
  - PNG to ICO: ConvertICO.org, ICOConvert.com
  - Multi-resolution ICO: IcoFX, IcoMoon

## Icon Placement

Once created, place the files as follows:
```
assets/
├── icon.ico          # Windows executable icon
├── icon.png          # Base PNG icon (512x512)
├── icon.icns         # macOS icon (future use)
└── icon-requirements.md  # This file
```

## Electron Builder Configuration

The icons are already configured in `electron-builder.config.js`:
```javascript
win: {
  icon: "assets/icon.ico"
},
nsis: {
  installerIcon: "assets/icon.ico",
  uninstallerIcon: "assets/icon.ico",
  installerHeaderIcon: "assets/icon.ico"
}
```

## Testing Icons

After adding the icon files:
1. Run the build process: `npm run build:production`
2. Package the application: `npx electron-builder --win`
3. Check the generated executable in `release/` directory
4. Verify the icon appears correctly in Windows Explorer and taskbar

## Fallback Icons

If custom icons are not available immediately, the build process will:
1. Use Electron's default icon during development
2. Display a warning during packaging
3. Still generate a functional executable

The application will work perfectly without custom icons, but professional icons are recommended for distribution.

## Icon Specifications for Windows

### ICO File Requirements:
- **256x256** - Windows 10/11 high-DPI displays
- **128x128** - Large icons in Explorer
- **64x64** - Medium icons
- **48x48** - Standard desktop icons
- **32x32** - Small icons, taskbar
- **16x16** - Small icons, menus, tabs

### File Size:
- Target: Under 500KB total
- Each resolution: Optimized PNG compression
- Transparency: Supported and recommended