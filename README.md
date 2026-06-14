# Vault 3D (3D Model Manager)

Vault 3D is a desktop application built with Tauri, React, and TypeScript designed to help you organize, view, and manage your local 3D model library seamlessly.

## Features

- **Library Management:** Select a base directory and the app will recursively scan, sync, and manage all your local 3D models.
- **Local SQLite Database:** Fast and reliable data storage that keeps track of your models, tags, and metadata.
- **Built-in 3D Viewer:** View your 3D models directly in the app using the integrated Google `<model-viewer>`. Adjust exposure and camera angles.
- **Thumbnail Generation:** Capture custom thumbnails directly from the 3D viewport. Includes a batch mode to auto-generate missing thumbnails for multiple models at once.
- **Tagging & Filtering:** Organize your collection with custom tags. Easily search by name or filter models by specific tags.
- **Parts Linking (Vault Feature):** Link related components and parts to a parent model to keep complex, multi-part projects organized.
- **Batch Operations:** Select multiple models to apply shared tags, remove tags, or generate thumbnails in bulk.

## Tech Stack

- **Framework:** [Tauri](https://tauri.app/) (v2)
- **Frontend:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Database:** SQLite via `@tauri-apps/plugin-sql`
- **3D Rendering:** `@google/model-viewer`

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Rust](https://www.rust-lang.org/) for building the Tauri backend
- [VS Code](https://code.visualstudio.com/) with [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) and [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) extensions (Recommended)

### Installation

1. Install JavaScript dependencies:
   ```bash
   npm install
   ```

2. Run the application in development mode:
   ```bash
   npm run tauri dev
   ```

3. Build the application for release:
   ```bash
   npm run tauri build
   ```
