/**
 * Window System commands
 */

export const windowCommands = {
  window: {
    description: "Manage terminal windows",
    usage: "window [create|list|switch|close] [options]",
    action: (args, state) => {
      if (args.length === 0) {
        return "window: missing operand\nTry 'help window' for more information."
      }

      const subcommand = args[0].toLowerCase()
      const options = args.slice(1)

      switch (subcommand) {
        case "create":
          return createWindow(options, state)
        case "list":
          return listWindows(state)
        case "switch":
          return switchWindow(options, state)
        case "close":
          return closeWindow(options, state)
        default:
          return `window: unknown subcommand: ${subcommand}\nTry 'help window' for more information.`
      }
    },
  },
}

// Create a new terminal window
function createWindow(options, state) {
  // Get window title
  const title = options.length > 0 ? options.join(" ") : `Terminal ${state.windows.length + 1}`

  // Create window container
  const windowContainer = document.createElement("div")
  windowContainer.className = "terminal-window"
  windowContainer.dataset.id = state.windows.length

  // Create window header
  const windowHeader = document.createElement("div")
  windowHeader.className = "window-header"

  // Create title
  const windowTitle = document.createElement("div")
  windowTitle.className = "window-title"
  windowTitle.textContent = title

  // Create controls
  const windowControls = document.createElement("div")
  windowControls.className = "window-controls"

  // Create minimize button
  const minimizeButton = document.createElement("button")
  minimizeButton.className = "window-control minimize"
  minimizeButton.innerHTML = "&#8722;" // Minus sign
  minimizeButton.addEventListener("click", () => {
    windowContainer.classList.toggle("minimized")
  })

  // Create maximize button
  const maximizeButton = document.createElement("button")
  maximizeButton.className = "window-control maximize"
  maximizeButton.innerHTML = "&#9744;" // Square
  maximizeButton.addEventListener("click", () => {
    windowContainer.classList.toggle("maximized")
  })

  // Create close button
  const closeButton = document.createElement("button")
  closeButton.className = "window-control close"
  closeButton.innerHTML = "&#10005;" // X
  closeButton.addEventListener("click", () => {
    closeWindowById(state.windows.length - 1, state)
  })

  // Assemble controls
  windowControls.appendChild(minimizeButton)
  windowControls.appendChild(maximizeButton)
  windowControls.appendChild(closeButton)

  // Assemble header
  windowHeader.appendChild(windowTitle)
  windowHeader.appendChild(windowControls)

  // Create window content
  const windowContent = document.createElement("div")
  windowContent.className = "window-content"

  // Create terminal output
  const terminalOutput = document.createElement("div")
  terminalOutput.className = "terminal-output"

  // Create terminal input line
  const terminalInputLine = document.createElement("div")
  terminalInputLine.className = "terminal-input-line"

  // Create prompt
  const terminalPrompt = document.createElement("span")
  terminalPrompt.className = "terminal-prompt"
  terminalPrompt.innerHTML = `<span class="username">${state.currentUser}</span>@<span class="hostname">terminal</span>:<span class="path">${state.currentPath}</span><span class="symbol">$</span> `

  // Create input
  const terminalInput = document.createElement("input")
  terminalInput.type = "text"
  terminalInput.className = "terminal-input"
  terminalInput.spellcheck = false

  // Assemble input line
  terminalInputLine.appendChild(terminalPrompt)
  terminalInputLine.appendChild(terminalInput)

  // Assemble content
  windowContent.appendChild(terminalOutput)
  windowContent.appendChild(terminalInputLine)

  // Assemble window
  windowContainer.appendChild(windowHeader)
  windowContainer.appendChild(windowContent)

  // Add window to DOM
  document.body.appendChild(windowContainer)

  // Make window draggable
  makeWindowDraggable(windowContainer, windowHeader)

  // Make window resizable
  makeWindowResizable(windowContainer)

  // Add window to state
  state.windows.push({
    id: state.windows.length,
    title: title,
    element: windowContainer,
    output: terminalOutput,
    input: terminalInput,
    prompt: terminalPrompt,
    path: state.currentPath,
    user: state.currentUser,
    history: [],
    historyIndex: -1,
    currentInput: "",
  })

  // Focus the new window
  terminalInput.focus()

  return `Window "${title}" created with ID ${state.windows.length - 1}`
}

// List all terminal windows
function listWindows(state) {
  if (state.windows.length === 0) {
    return "No windows open."
  }

  let output = "ID\tTitle\n"

  state.windows.forEach((window) => {
    output += `${window.id}\t${window.title}\n`
  })

  return output
}

// Switch to a different window
function switchWindow(options, state) {
  if (options.length === 0) {
    return "window switch: missing window ID"
  }

  const id = Number.parseInt(options[0])

  if (isNaN(id)) {
    return `window switch: invalid window ID: ${options[0]}`
  }

  const window = state.windows.find((w) => w.id === id)

  if (!window) {
    return `window switch: no window with ID ${id}`
  }

  // Focus the window
  window.element.focus()
  window.input.focus()

  return `Switched to window "${window.title}" (ID: ${id})`
}

// Close a window
function closeWindow(options, state) {
  if (options.length === 0) {
    return "window close: missing window ID"
  }

  const id = Number.parseInt(options[0])

  if (isNaN(id)) {
    return `window close: invalid window ID: ${options[0]}`
  }

  return closeWindowById(id, state)
}

// Close a window by ID
function closeWindowById(id, state) {
  const windowIndex = state.windows.findIndex((w) => w.id === id)

  if (windowIndex === -1) {
    return `No window with ID ${id}`
  }

  const window = state.windows[windowIndex]

  // Remove window from DOM
  window.element.remove()

  // Remove window from state
  state.windows.splice(windowIndex, 1)

  return `Window "${window.title}" (ID: ${id}) closed`
}

// Make a window draggable
function makeWindowDraggable(windowElement, handleElement) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0

  handleElement.onmousedown = dragMouseDown

  function dragMouseDown(e) {
    e.preventDefault()

    // Get the mouse cursor position at startup
    pos3 = e.clientX
    pos4 = e.clientY

    document.onmouseup = closeDragElement
    document.onmousemove = elementDrag

    // Bring window to front
    const windows = document.querySelectorAll(".terminal-window")
    windows.forEach((w) => (w.style.zIndex = "1"))
    windowElement.style.zIndex = "2"
  }

  function elementDrag(e) {
    e.preventDefault()

    // Calculate the new cursor position
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY

    // Set the element's new position
    windowElement.style.top = windowElement.offsetTop - pos2 + "px"
    windowElement.style.left = windowElement.offsetLeft - pos1 + "px"
  }

  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null
    document.onmousemove = null
  }
}

// Make a window resizable
function makeWindowResizable(windowElement) {
  const resizeHandle = document.createElement("div")
  resizeHandle.className = "resize-handle"
  windowElement.appendChild(resizeHandle)

  let startX, startY, startWidth, startHeight

  resizeHandle.addEventListener("mousedown", initResize, false)

  function initResize(e) {
    e.preventDefault()

    startX = e.clientX
    startY = e.clientY
    startWidth = Number.parseInt(document.defaultView.getComputedStyle(windowElement).width, 10)
    startHeight = Number.parseInt(document.defaultView.getComputedStyle(windowElement).height, 10)

    document.addEventListener("mousemove", resizeWindow, false)
    document.addEventListener("mouseup", stopResize, false)
  }

  function resizeWindow(e) {
    windowElement.style.width = startWidth + e.clientX - startX + "px"
    windowElement.style.height = startHeight + e.clientY - startY + "px"
  }

  function stopResize() {
    document.removeEventListener("mousemove", resizeWindow, false)
    document.removeEventListener("mouseup", stopResize, false)
  }
}

// Make window commands available globally
window.windowCommands = windowCommands

