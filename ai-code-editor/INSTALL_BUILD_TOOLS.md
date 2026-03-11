# Install Microsoft C++ Build Tools

## The Issue
Rust on Windows needs Microsoft C++ Build Tools to compile native desktop applications.

## Solution

### Option 1: Install Visual Studio Build Tools (Recommended - Smaller)

1. Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/

2. Run the installer

3. Select "Desktop development with C++"

4. Make sure these are checked:
   - MSVC v143 - VS 2022 C++ x64/x86 build tools
   - Windows 10/11 SDK

5. Click Install (about 6-7 GB)

### Option 2: Install Visual Studio Community (Full IDE)

1. Download: https://visualstudio.microsoft.com/downloads/

2. Run installer

3. Select "Desktop development with C++"

4. Install

## After Installation

1. **Restart your computer** (important!)

2. Open a new PowerShell terminal

3. Navigate to project:
   ```
   cd "e:\development\custom ai code editor\ai-code-editor"
   ```

4. Run the app:
   ```
   npm run tauri dev
   ```

## What This Builds

This creates a **NATIVE DESKTOP APPLICATION** (.exe file), NOT a web app:
- Uses native Windows APIs
- Runs as a standalone .exe
- No browser required
- Full desktop integration
- Can access file system, run processes, etc.

Tauri = Desktop App Framework (like Electron, but smaller and faster)
