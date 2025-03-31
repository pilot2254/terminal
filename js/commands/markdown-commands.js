/**
 * Markdown commands
 */

export const markdownCommands = {
  markdown: {
    description: "Render markdown files",
    usage: "markdown <file>",
    action: (args, state) => {
      if (args.length === 0) {
        return "markdown: missing file operand"
      }

      const filePath = args[0]
      const normalizedPath = normalizePath(filePath, state.currentPath)
      const file = getPathObject(normalizedPath, state.fileSystem)

      if (!file) {
        return `markdown: ${filePath}: No such file or directory`
      }

      if (file.type !== "file") {
        return `markdown: ${filePath}: Is a directory`
      }

      // Render markdown
      const html = renderMarkdown(file.content)

      // Add to output using raw HTML
      if (window.terminalUtils && window.terminalUtils.addRawHtmlToOutput) {
        window.terminalUtils.addRawHtmlToOutput(html)
        return ""
      } else {
        return "Error: Cannot render markdown"
      }
    },
  },

  md: {
    description: "Alias for markdown",
    usage: "md <file>",
    action: (args, state) => {
      return markdownCommands.markdown.action(args, state)
    },
  },
}

// Simple markdown renderer
function renderMarkdown(markdown) {
  // Replace headings
  let html = markdown
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^#### (.*$)/gm, "<h4>$1</h4>")
    .replace(/^##### (.*$)/gm, "<h5>$1</h5>")
    .replace(/^###### (.*$)/gm, "<h6>$1</h6>")

  // Replace bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

  // Replace italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")

  // Replace code blocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")

  // Replace inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")

  // Replace links
  html = html.replace(/\[(.*?)\]$$(.*?)$$/g, '<a href="$2">$1</a>')

  // Replace unordered lists
  html = html.replace(/^\s*[-*+]\s+(.*$)/gm, "<li>$1</li>")
  html = html.replace(/<\/li>\n<li>/g, "</li><li>")
  html = html.replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>")

  // Replace ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*$)/gm, "<li>$1</li>")
  html = html.replace(/<\/li>\n<li>/g, "</li><li>")
  html = html.replace(/(<li>.*<\/li>)/g, "<ol>$1</ol>")

  // Replace blockquotes
  html = html.replace(/^\s*>\s+(.*$)/gm, "<blockquote>$1</blockquote>")

  // Replace paragraphs
  html = html.replace(/^([^<].*[^>])$/gm, "<p>$1</p>")

  // Wrap in a div with markdown-content class
  html = `<div class="markdown-content">${html}</div>`

  return html
}

// Helper functions
function normalizePath(path, currentPath) {
  // Handle absolute paths
  if (path.startsWith("/")) {
    // Path is already absolute
  } else if (path.startsWith("~/")) {
    // Replace ~ with /home/username
    path = `/home/${window.state?.currentUser || "currentuser"}${path.substring(1)}`
  } else {
    // Relative path - combine with current path
    path = `${currentPath}/${path}`
  }

  // Split path into components
  const components = path.split("/").filter((c) => c !== "")
  const result = []

  // Process each component
  for (const component of components) {
    if (component === ".") {
      // Current directory - do nothing
    } else if (component === "..") {
      // Parent directory - pop the last component
      if (result.length > 0) {
        result.pop()
      }
    } else {
      // Regular component - add to result
      result.push(component)
    }
  }

  // Combine components back into a path
  return `/${result.join("/")}`
}

function getPathObject(path, fileSystem) {
  if (path === "/") {
    return fileSystem["/"]
  }

  const components = path.split("/").filter((c) => c !== "")
  let current = fileSystem["/"]

  for (const component of components) {
    if (!current || current.type !== "directory" || !current.contents[component]) {
      return null
    }
    current = current.contents[component]
  }

  return current
}

