# ⚾ Baseball Defensive Lineup Manager

A single-page React application for little league baseball coaches to easily create and manage defensive lineups per inning.

## Features

- **Player Management**: Add and remove players from your roster
- **Drag & Drop Interface**: Easily assign players to defensive positions using intuitive drag-and-drop
- **Multiple Innings**: Create up to 9 innings with the ability to:
  - Add empty innings
  - Carry over positions from the previous inning
- **11 Defensive Positions**:
  - Battery: Pitcher, Catcher
  - Infield: First Base, Second Base, Shortstop, Third Base
  - Outfield: Left Field, Center Left Field, Center Field, Center Right Field, Right Field
- **Bench Management**: Unassigned players automatically appear on the bench
- **Complete Summary View**: See all innings and player positions at a glance
- **Visual Baseball Field**: Organized by battery, infield, and outfield sections

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **Material-UI (MUI)** - Component library
- **react-beautiful-dnd** - Drag and drop functionality

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Add Players**: Enter player names in the "Player Management" section and click "Add Player"
2. **Select an Inning**: Use the inning chips to select which inning you want to edit
3. **Assign Positions**: Drag players from the player pool or other positions onto the baseball field positions
4. **Manage Innings**: 
   - Click "Add Empty Inning" to create a new inning with no assignments
   - Click "Add with Carry-Over" to copy positions from the previous inning
5. **View Summary**: Switch to the "All Innings Summary" tab to see the complete lineup breakdown

## Future Enhancements

- User authentication via Auth0
- Save and load lineups
- Export lineups to PDF
- Player statistics and position history
- Multiple team management

## License

See LICENSE file for details.
