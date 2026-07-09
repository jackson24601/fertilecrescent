# Fertile Crescent

A browser-based game set in the ancient lands between the Tigris and Euphrates.

## Getting Started

Open `index.html` in a browser, or serve the project locally:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Project Structure

- `index.html` — Landing page with desert scene and "Begin Game" button
- `game.html` — Main game screen with the playable board
- `intro.html` — Intro screen (placeholder)
- `css/styles.css` — Shared styles
- `js/scene.js` — Animated canvas desert scene for the landing page
- `js/landing.js` — Landing page interactions
- `js/game.js` — Game board renderer (sand, rivers, trees, mountains, huts, villagers)
- `js/resources.js` — Player resource state and bottom resource bar (Stone, Wood, Food, Labor)
