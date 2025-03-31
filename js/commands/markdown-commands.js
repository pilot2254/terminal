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
      const normalizedPath = window.terminalHelpers.normalizePath(filePath, state.currentPath)
      const file = window.terminalHelpers.getPathObject(normalizedPath, state.fileSystem)

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

  // Replace paragraphs (lines that don't start with HTML tags)
  html = html.replace(/^(?!<[a-z])[^<].*$/gm, "<p>$&</p>")

  // Wrap in a div with markdown-content class
  html = `<div class="markdown-content">${html}</div>`

  return html
}