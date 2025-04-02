/**
 * Theme System commands
 */

export const themeCommands = {
  theme: {
    description: "Manage terminal themes",
    usage: "theme [list|set|info|create] [options]",
    action: (args, state) => {
      if (args.length === 0) {
        return "theme: missing operand\nTry 'theme list' to see available themes."
      }

      const subcommand = args[0].toLowerCase()
      const options = args.slice(1)

      switch (subcommand) {
        case "list":
          return listThemes()
        case "set":
          return setTheme(options, state)
        case "info":
          return themeInfo(options)
        case "create":
          return createTheme(options, state)
        default:
          return `theme: unknown subcommand: ${subcommand}\nTry 'theme list' for available themes.`
      }
    },
  },
}

// Define built-in themes
const BUILT_IN_THEMES = {
  default: {
    name: "Default",
    description: "The default terminal theme",
    author: "System",
    background: "#000000",
    foreground: "#f0f0f0",
    cursor: "#ffffff",
    selection: "rgba(255, 255, 255, 0.3)",
    black: "#000000",
    red: "#cc0000",
    green: "#4e9a06",
    yellow: "#c4a000",
    blue: "#3465a4",
    magenta: "#75507b",
    cyan: "#06989a",
    white: "#d3d7cf",
    brightBlack: "#555753",
    brightRed: "#ef2929",
    brightGreen: "#8ae234",
    brightYellow: "#fce94f",
    brightBlue: "#729fcf",
    brightMagenta: "#ad7fa8",
    brightCyan: "#34e2e2",
    brightWhite: "#eeeeec",
  },

  solarizedDark: {
    name: "Solarized Dark",
    description: "Solarized color scheme (dark variant)",
    author: "Ethan Schoonover",
    background: "#002b36",
    foreground: "#839496",
    cursor: "#93a1a1",
    selection: "rgba(147, 161, 161, 0.3)",
    black: "#073642",
    red: "#dc322f",
    green: "#859900",
    yellow: "#b58900",
    blue: "#268bd2",
    magenta: "#d33682",
    cyan: "#2aa198",
    white: "#eee8d5",
    brightBlack: "#002b36",
    brightRed: "#cb4b16",
    brightGreen: "#586e75",
    brightYellow: "#657b83",
    brightBlue: "#839496",
    brightMagenta: "#6c71c4",
    brightCyan: "#93a1a1",
    brightWhite: "#fdf6e3",
  },

  solarizedLight: {
    name: "Solarized Light",
    description: "Solarized color scheme (light variant)",
    author: "Ethan Schoonover",
    background: "#fdf6e3",
    foreground: "#657b83",
    cursor: "#586e75",
    selection: "rgba(88, 110, 117, 0.3)",
    black: "#073642",
    red: "#dc322f",
    green: "#859900",
    yellow: "#b58900",
    blue: "#268bd2",
    magenta: "#d33682",
    cyan: "#2aa198",
    white: "#eee8d5",
    brightBlack: "#002b36",
    brightRed: "#cb4b16",
    brightGreen: "#586e75",
    brightYellow: "#657b83",
    brightBlue: "#839496",
    brightMagenta: "#6c71c4",
    brightCyan: "#93a1a1",
    brightWhite: "#fdf6e3",
  },

  dracula: {
    name: "Dracula",
    description: "Dracula color scheme",
    author: "Zeno Rocha",
    background: "#282a36",
    foreground: "#f8f8f2",
    cursor: "#f8f8f2",
    selection: "rgba(248, 248, 242, 0.3)",
    black: "#21222c",
    red: "#ff5555",
    green: "#50fa7b",
    yellow: "#f1fa8c",
    blue: "#bd93f9",
    magenta: "#ff79c6",
    cyan: "#8be9fd",
    white: "#f8f8f2",
    brightBlack: "#6272a4",
    brightRed: "#ff6e6e",
    brightGreen: "#69ff94",
    brightYellow: "#ffffa5",
    brightBlue: "#d6acff",
    brightMagenta: "#ff92df",
    brightCyan: "#a4ffff",
    brightWhite: "#ffffff",
  },

  monokai: {
    name: "Monokai",
    description: "Monokai color scheme",
    author: "Wimer Hazenberg",
    background: "#272822",
    foreground: "#f8f8f2",
    cursor: "#f8f8f2",
    selection: "rgba(248, 248, 242, 0.3)",
    black: "#272822",
    red: "#f92672",
    green: "#a6e22e",
    yellow: "#f4bf75",
    blue: "#66d9ef",
    magenta: "#ae81ff",
    cyan: "#a1efe4",
    white: "#f8f8f2",
    brightBlack: "#75715e",
    brightRed: "#f92672",
    brightGreen: "#a6e22e",
    brightYellow: "#f4bf75",
    brightBlue: "#66d9ef",
    brightMagenta: "#ae81ff",
    brightCyan: "#a1efe4",
    brightWhite: "#f9f8f5",
  },

  nord: {
    name: "Nord",
    description: "Nord color scheme",
    author: "Arctic Ice Studio",
    background: "#2e3440",
    foreground: "#d8dee9",
    cursor: "#d8dee9",
    selection: "rgba(216, 222, 233, 0.3)",
    black: "#3b4252",
    red: "#bf616a",
    green: "#a3be8c",
    yellow: "#ebcb8b",
    blue: "#81a1c1",
    magenta: "#b48ead",
    cyan: "#88c0d0",
    white: "#e5e9f0",
    brightBlack: "#4c566a",
    brightRed: "#bf616a",
    brightGreen: "#a3be8c",
    brightYellow: "#ebcb8b",
    brightBlue: "#81a1c1",
    brightMagenta: "#b48ead",
    brightCyan: "#8fbcbb",
    brightWhite: "#eceff4",
  },

  gruvbox: {
    name: "Gruvbox",
    description: "Gruvbox color scheme",
    author: "Pavel Pertsev",
    background: "#282828",
    foreground: "#ebdbb2",
    cursor: "#ebdbb2",
    selection: "rgba(235, 219, 178, 0.3)",
    black: "#282828",
    red: "#cc241d",
    green: "#98971a",
    yellow: "#d79921",
    blue: "#458588",
    magenta: "#b16286",
    cyan: "#689d6a",
    white: "#a89984",
    brightBlack: "#928374",
    brightRed: "#fb4934",
    brightGreen: "#b8bb26",
    brightYellow: "#fabd2f",
    brightBlue: "#83a598",
    brightMagenta: "#d3869b",
    brightCyan: "#8ec07c",
    brightWhite: "#ebdbb2",
  },

  highContrast: {
    name: "High Contrast",
    description: "High contrast theme for accessibility",
    author: "System",
    background: "#000000",
    foreground: "#ffffff",
    cursor: "#ffffff",
    selection: "rgba(255, 255, 255, 0.5)",
    black: "#000000",
    red: "#ff0000",
    green: "#00ff00",
    yellow: "#ffff00",
    blue: "#0000ff",
    magenta: "#ff00ff",
    cyan: "#00ffff",
    white: "#ffffff",
    brightBlack: "#808080",
    brightRed: "#ff0000",
    brightGreen: "#00ff00",
    brightYellow: "#ffff00",
    brightBlue: "#0000ff",
    brightMagenta: "#ff00ff",
    brightCyan: "#00ffff",
    brightWhite: "#ffffff",
  },
}

// List available themes
function listThemes() {
  // Get custom themes
  const customThemes = loadCustomThemes()

  let output = "Available themes:\n\n"
  output += "Built-in themes:\n"

  // List built-in themes
  Object.keys(BUILT_IN_THEMES).forEach((themeId) => {
    const theme = BUILT_IN_THEMES[themeId]
    output += `  ${themeId} - ${theme.name} by ${theme.author}\n`
  })

  // List custom themes if any
  if (Object.keys(customThemes).length > 0) {
    output += "\nCustom themes:\n"

    Object.keys(customThemes).forEach((themeId) => {
      const theme = customThemes[themeId]
      output += `  ${themeId} - ${theme.name} by ${theme.author}\n`
    })
  }

  output += "\nUse 'theme set <theme_id>' to switch themes."
  output += "\nUse 'theme info <theme_id>' to see theme details."

  return output
}

// Set the active theme
function setTheme(options, state) {
  if (options.length === 0) {
    return "theme set: missing theme ID\nTry 'theme list' to see available themes."
  }

  const themeId = options[0]

  // Check if theme exists
  const builtInTheme = BUILT_IN_THEMES[themeId]
  const customThemes = loadCustomThemes()
  const customTheme = customThemes[themeId]

  if (!builtInTheme && !customTheme) {
    return `theme set: unknown theme: ${themeId}\nTry 'theme list' to see available themes.`
  }

  const theme = builtInTheme || customTheme

  // Apply the theme
  applyTheme(theme)

  // Save the theme preference
  try {
    localStorage.setItem("terminalTheme", themeId)
  } catch (e) {
    console.error("Error saving theme preference:", e)
  }

  return `Theme set to ${theme.name}.`
}

// Get theme information
function themeInfo(options) {
  if (options.length === 0) {
    return "theme info: missing theme ID\nTry 'theme list' to see available themes."
  }

  const themeId = options[0]

  // Check if theme exists
  const builtInTheme = BUILT_IN_THEMES[themeId]
  const customThemes = loadCustomThemes()
  const customTheme = customThemes[themeId]

  if (!builtInTheme && !customTheme) {
    return `theme info: unknown theme: ${themeId}\nTry 'theme list' to see available themes.`
  }

  const theme = builtInTheme || customTheme

  // Format theme information
  let output = `Theme: ${theme.name}\n`
  output += `Author: ${theme.author}\n`
  output += `Description: ${theme.description}\n\n`

  output += "Colors:\n"
  output += `  Background: ${theme.background}\n`
  output += `  Foreground: ${theme.foreground}\n`
  output += `  Cursor: ${theme.cursor}\n`
  output += `  Selection: ${theme.selection}\n\n`

  output += "ANSI Colors:\n"
  output += `  Black: ${theme.black}\n`
  output += `  Red: ${theme.red}\n`
  output += `  Green: ${theme.green}\n`
  output += `  Yellow: ${theme.yellow}\n`
  output += `  Blue: ${theme.blue}\n`
  output += `  Magenta: ${theme.magenta}\n`
  output += `  Cyan: ${theme.cyan}\n`
  output += `  White: ${theme.white}\n\n`

  output += "Bright Colors:\n"
  output += `  Bright Black: ${theme.brightBlack}\n`
  output += `  Bright Red: ${theme.brightRed}\n`
  output += `  Bright Green: ${theme.brightGreen}\n`
  output += `  Bright Yellow: ${theme.brightYellow}\n`
  output += `  Bright Blue: ${theme.brightBlue}\n`
  output += `  Bright Magenta: ${theme.brightMagenta}\n`
  output += `  Bright Cyan: ${theme.brightCyan}\n`
  output += `  Bright White: ${theme.brightWhite}\n`

  return output
}

// Create a custom theme
function createTheme(options, state) {
  if (options.length === 0) {
    return "theme create: missing theme ID\nUsage: theme create <theme_id>"
  }

  const themeId = options[0]

  // Check if theme ID is valid
  if (!/^[a-zA-Z0-9_-]+$/.test(themeId)) {
    return "theme create: invalid theme ID. Use only letters, numbers, underscores, and hyphens."
  }

  // Check if theme already exists
  if (BUILT_IN_THEMES[themeId]) {
    return `theme create: cannot override built-in theme: ${themeId}`
  }

  const customThemes = loadCustomThemes()

  if (customThemes[themeId]) {
    return `theme create: theme already exists: ${themeId}`
  }

  // Create a temporary file with theme template
  const tmpDir = window.terminalHelpers.getPathObject("/tmp", state.fileSystem)

  if (!tmpDir || tmpDir.type !== "directory") {
    return "theme create: cannot create temporary file"
  }

  // Create the theme template
  const themeTemplate = `{
  "name": "My Custom Theme",
  "description": "A custom terminal theme",
  "author": "${state.currentUser}",
  "background": "#000000",
  "foreground": "#f0f0f0",
  "cursor": "#ffffff",
  "selection": "rgba(255, 255, 255, 0.3)",
  "black": "#000000",
  "red": "#cc0000",
  "green": "#4e9a06",
  "yellow": "#c4a000",
  "blue": "#3465a4",
  "magenta": "#75507b",
  "cyan": "#06989a",
  "white": "#d3d7cf",
  "brightBlack": "#555753",
  "brightRed": "#ef2929",
  "brightGreen": "#8ae234",
  "brightYellow": "#fce94f",
  "brightBlue": "#729fcf",
  "brightMagenta": "#ad7fa8",
  "brightCyan": "#34e2e2",
  "brightWhite": "#eeeeec"
}`

  // Create the theme file
  tmpDir.contents[`${themeId}.json`] = {
    type: "file",
    content: themeTemplate,
  }

  // Open the file in the editor
  if (window.editorCommands && window.editorCommands.vim) {
    window.editorCommands.vim.action([`/tmp/${themeId}.json`], state)

    // Set up a callback to process the file when the editor is closed
    state.themeCreateCallback = () => {
      const themeFile = window.terminalHelpers.getPathObject(`/tmp/${themeId}.json`, state.fileSystem)

      if (themeFile && themeFile.type === "file") {
        try {
          // Parse the theme file
          const theme = JSON.parse(themeFile.content)

          // Validate the theme
          if (!theme.name || !theme.author) {
            if (window.terminalUtils && window.terminalUtils.addToOutput) {
              window.terminalUtils.addToOutput("Error: Theme must have a name and author.")
            }
            return
          }

          // Add the theme
          customThemes[themeId] = theme

          // Save the custom themes
          saveCustomThemes(customThemes)

          if (window.terminalUtils && window.terminalUtils.addToOutput) {
            window.terminalUtils.addToOutput(`Theme '${themeId}' created successfully.`)
            window.terminalUtils.addToOutput(`Use 'theme set ${themeId}' to apply it.`)
          }
        } catch (error) {
          if (window.terminalUtils && window.terminalUtils.addToOutput) {
            window.terminalUtils.addToOutput(`Error creating theme: ${error.message}`)
          }
        }
      }
    }
  }

  return `Creating theme '${themeId}'. Edit the JSON file and save it to create your theme.`
}

// Apply a theme to the terminal
function applyTheme(theme) {
  // Create a style element if it doesn't exist
  let styleElement = document.getElementById("terminal-theme-style")

  if (!styleElement) {
    styleElement = document.createElement("style")
    styleElement.id = "terminal-theme-style"
    document.head.appendChild(styleElement)
  }

  // Create the CSS
  const css = `
    #terminal {
      background-color: ${theme.background};
      color: ${theme.foreground};
    }
    
    #terminal-input {
      color: ${theme.foreground};
    }
    
    .terminal-prompt .username {
      color: ${theme.green};
    }
    
    .terminal-prompt .hostname {
      color: ${theme.green};
    }
    
    .terminal-prompt .path {
      color: ${theme.blue};
    }
    
    .terminal-prompt .symbol {
      color: ${theme.foreground};
    }
    
    .command {
      color: ${theme.foreground};
    }
    
    .error {
      color: ${theme.red};
    }
    
    .vim-editor {
      background-color: ${theme.background};
      color: ${theme.foreground};
    }
    
    .vim-editor-content {
      background-color: ${theme.background};
      color: ${theme.foreground};
    }
    
    .vim-status-bar {
      background-color: ${theme.brightBlack};
      color: ${theme.brightWhite};
    }
    
    .vim-mode {
      background-color: ${theme.green};
      color: ${theme.black};
    }
    
    .markdown-content h1, .markdown-content h2, .markdown-content h3,
    .markdown-content h4, .markdown-content h5, .markdown-content h6 {
      color: ${theme.brightYellow};
    }
    
    .markdown-content a {
      color: ${theme.blue};
    }
    
    .markdown-content code {
      background-color: ${theme.brightBlack};
      color: ${theme.brightWhite};
    }
    
    .markdown-content pre {
      background-color: ${theme.brightBlack};
    }
    
    .markdown-content blockquote {
      border-left-color: ${theme.blue};
      color: ${theme.brightBlack};
    }
    
    /* Terminal window styling */
    .terminal-window {
      background-color: ${theme.background};
      border-color: ${theme.brightBlack};
    }
    
    .window-header {
      background-color: ${theme.brightBlack};
      color: ${theme.brightWhite};
    }
    
    .window-control.close {
      background-color: ${theme.red};
    }
    
    .window-control.minimize {
      background-color: ${theme.yellow};
    }
    
    .window-control.maximize {
      background-color: ${theme.green};
    }
    
    /* Tmux styling */
    .tmux-status-bar {
      background-color: ${theme.brightBlack};
      color: ${theme.brightWhite};
    }
    
    .tmux-window {
      background-color: ${theme.background};
    }
    
    .tmux-window.active .tmux-window-name {
      background-color: ${theme.blue};
      color: ${theme.brightWhite};
    }
    
    .tmux-window-name {
      background-color: ${theme.brightBlack};
      color: ${theme.brightWhite};
    }
    
    .tmux-divider {
      background-color: ${theme.brightBlack};
    }
  `

  // Apply the CSS
  styleElement.textContent = css
}

// Load custom themes from localStorage
function loadCustomThemes() {
  try {
    const customThemes = localStorage.getItem("terminalCustomThemes")
    return customThemes ? JSON.parse(customThemes) : {}
  } catch (e) {
    console.error("Error loading custom themes:", e)
    return {}
  }
}

// Save custom themes to localStorage
function saveCustomThemes(customThemes) {
  try {
    localStorage.setItem("terminalCustomThemes", JSON.stringify(customThemes))
  } catch (e) {
    console.error("Error saving custom themes:", e)
  }
}

// Export the initializeThemeSystem function
export function initializeThemeSystem() {
  // Load saved theme preference
  try {
    const savedTheme = localStorage.getItem("terminalTheme")

    if (savedTheme) {
      // Check if theme exists
      const builtInTheme = BUILT_IN_THEMES[savedTheme]
      const customThemes = loadCustomThemes()
      const customTheme = customThemes[savedTheme]

      if (builtInTheme || customTheme) {
        applyTheme(builtInTheme || customTheme)
      } else {
        // Fall back to default theme
        applyTheme(BUILT_IN_THEMES.default)
      }
    } else {
      // Apply default theme
      applyTheme(BUILT_IN_THEMES.default)
    }
  } catch (e) {
    console.error("Error initializing theme system:", e)
    // Apply default theme
    applyTheme(BUILT_IN_THEMES.default)
  }
}

// Make theme commands available globally
window.themeCommands = {
  initializeThemeSystem,
}

