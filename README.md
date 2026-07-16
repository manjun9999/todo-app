# 📝 Todo App

A simple, self-contained todo list that runs entirely in the browser — no build step, no dependencies, no server. Tasks are saved locally so they persist across page reloads.

## Features

- ✅ **Add / complete / delete** tasks
- ✏️ **Edit in place** — double-click a task or click the pencil (Enter to save, Escape to cancel)
- 🔀 **Drag to reorder** — grab the ⠿ handle and drop a task where you want it
- 🗂️ **Filter tabs** — view **All**, **Active**, or **Done**, each with a live count badge
- 🌙 **Dark mode** — toggle light/dark, or follow your operating system's preference automatically
- 💾 **Persistent** — tasks and theme choice are stored in the browser's `localStorage`
- 🧹 **Clear completed** — remove all finished tasks at once

## Getting started

No installation required. Just clone and open the app:

```bash
git clone https://github.com/manjun9999/todo-app.git
cd todo-app
```

Then open `index.html` in any modern web browser (double-click it, or drag it into a browser window).

> **Note:** keep the three files together — `index.html` links `styles.css` and `app.js` by relative path.

## Project structure

```
todo-app/
├── index.html    # Markup — links the stylesheet and script
├── styles.css    # All styling, including light/dark theme variables
├── app.js        # All application logic
└── README.md
```

## How it works

- **State** lives in a `tasks` array (`{ id, text, done }`), persisted to `localStorage` under the `todo.tasks` key.
- **Rendering** is handled by a single `render()` function that redraws the list from state on every change.
- **Theme** preference is stored under `todo.theme`; when unset, the app respects the OS `prefers-color-scheme` setting.
- **Reordering** rearranges the `tasks` array via the native HTML5 drag-and-drop API and re-saves.

## Tech stack

Plain **HTML5**, **CSS3** (custom properties, flexbox), and **vanilla JavaScript (ES6+)**. No frameworks, no libraries, no build tooling.

## Browser support

Works in any current version of Chrome, Edge, Firefox, and Safari.
