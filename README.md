# Olympus Frontend

As the Greek gods lived on Mount Olympus, so shall your games. Olympus Frontend is a modern PC game launcher that brings all your games together in one beautiful, centralized hub.

## Features

- **Unified Library** - View all your games in one place, regardless of where they're installed.
- **Automatic Game Detection** - Olympus automatically scans and detects your games from supported game clients and stores.
- **Custom Games** - Add any game manually that isn't automatically detected.
- **Favorites & Hiding** - Mark games as favorites or hide ones you don't want to see.
- **Recently Played** - Quick access to your most recently played games.
- **Theme Support** - Choose between dark and light themes.
- **Custom Game Covers** - You can import your favorite game covers, animated or static.
- **Auto-Updates** - The app automatically checks for and installs updates.

**Most important of all:**

- **No account or logins required** - Olympus works only with your already installed games, there is no need to login into your steam/epic/ea/ubisoft account. Your data is in your hands only.

## Supported Platforms

Olympus Frontend currently supports games from Steam and Epic Games Store, with more platforms coming soon!

## Planned Features
The following features are planned to launch in the future:

- Emulation support.
- More game store support.
- Optional splash arts.
- Automatically close game clients, after you close a game.
- Fullscreen console-like experience.

### Customization
- Custom Themes.
- Custom Filters (Tabs).

### External Integrations
- SteamGridDB Integration.
- HowLongToBeat Integration.

## Getting Started

### Prerequisites

- Windows 10 or later
- Node.js 18+ (for development)

### Installation

Download the latest installer from the [Releases](https://github.com/miguel-apereira/Olympus-Frontend/releases) page.

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev
```

### Building

```bash
# Build the app
npm run build
```

The built installer will be in the `release` folder.

## Tech Stack

- Electron
- React
- TypeScript
- Tailwind CSS
- Vite

## License

BSD 3-Clause License