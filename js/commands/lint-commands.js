/**
 * Code linting commands
 */

export const lintCommands = {
  lint: {
    description: "Lint code files",
    usage: "lint <file>",
    action: (args, state) => {
      if (args.length === 0) {
        return "lint: missing file operand"
      }

      const filePath = args[0]
      const normalizedPath = window.terminalHelpers.normalizePath(filePath, state.currentPath)
      const file = window.terminalHelpers.getPathObject(normalizedPath, state.fileSystem)

      if (!file) {
        return `lint: ${filePath}: No such file or directory`
      }

      if (file.type !== "file") {
        return `lint: ${filePath}: Is a directory`
      }

      // Determine file type
      const fileExtension = getFileExtension(filePath)

      switch (fileExtension) {
        case "js":
          return lintJavaScript(file.content, filePath)
        case "html":
          return lintHTML(file.content, filePath)
        case "css":
          return lintCSS(file.content, filePath)
        case "json":
          return lintJSON(file.content, filePath)
        default:
          return `lint: ${filePath}: Unsupported file type`
      }
    },
  },
}

// Get file extension
function getFileExtension(filePath) {
  const parts = filePath.split(".")
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ""
}

// Fix the undeclared variable in lintJavaScript function
function lintJavaScript(code, filePath) {
  const issues = []

  // Check for missing semicolons
  const lines = code.split("\n")

  lines.forEach((line, index) => {
    // Skip comments and empty lines
    if (line.trim() === "" || line.trim().startsWith("//") || line.trim().startsWith("/*")) {
      return
    }

    // Check for missing semicolons
    if (
      !/;\s*$/.test(line) &&
      !/^\s*[{}[\]]\s*$/.test(line) && // Skip lines with just braces
      !/^\s*\/\//.test(line) && // Skip comment lines
      !/^\s*function/.test(line) && // Skip function declarations
      !/^\s*if|else|for|while/.test(line) && // Skip control structures
      !/^\s*import/.test(line) && // Skip import statements
      !/^\s*export/.test(line) // Skip export statements
    ) {
      issues.push({
        line: index + 1,
        column: line.length,
        message: "Missing semicolon",
        severity: "warning",
      })
    }

    // Check for console.log statements
    if (/console\.log/.test(line)) {
      issues.push({
        line: index + 1,
        column: line.indexOf("console.log"),
        message: "Unexpected console statement",
        severity: "warning",
      })
    }

    // Check for unused variables (very basic check)
    const varDeclaration = line.match(/(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/)

    if (varDeclaration) {
      const varName = varDeclaration[1]
      let used = false

      // Check if the variable is used in the rest of the code
      for (let i = index + 1; i < lines.length; i++) {
        if (new RegExp(`\\b${varName}\\b`).test(lines[i])) {
          used = true
          break
        }
      }

      if (!used) {
        issues.push({
          line: index + 1,
          column: line.indexOf(varName),
          message: `'${varName}' is defined but never used`,
          severity: "warning",
        })
      }
    }
  })

  // Check for syntax errors
  try {
    new Function(code)
  } catch (error) {
    // Extract line and column from error message
    const match = error.message.match(/line\s+(\d+)/i)
    const line = match ? Number.parseInt(match[1]) : 1

    issues.push({
      line: line,
      column: 1,
      message: `Syntax error: ${error.message}`,
      severity: "error",
    })
  }

  // Format the output
  if (issues.length === 0) {
    return `${filePath}: No issues found`
  }

  let output = `${filePath}: Found ${issues.length} issue(s)\n\n`

  issues.forEach((issue) => {
    output += `${filePath}:${issue.line}:${issue.column}: ${issue.severity}: ${issue.message}\n`
  })

  return output
}

// Lint HTML code
function lintHTML(code, filePath) {
  const issues = []

  // Check for basic HTML structure
  if (!/<html/i.test(code)) {
    issues.push({
      line: 1,
      column: 1,
      message: "Missing <html> tag",
      severity: "warning",
    })
  }

  if (!/<head/i.test(code)) {
    issues.push({
      line: 1,
      column: 1,
      message: "Missing <head> tag",
      severity: "warning",
    })
  }

  if (!/<body/i.test(code)) {
    issues.push({
      line: 1,
      column: 1,
      message: "Missing <body> tag",
      severity: "warning",
    })
  }

  // Check for unclosed tags
  const openTags = []
  const lines = code.split("\n")

  lines.forEach((line, index) => {
    // Find opening tags
    const openMatches = line.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g)

    if (openMatches) {
      openMatches.forEach((match) => {
        // Extract tag name
        const tagName = match.match(/<([a-zA-Z][a-zA-Z0-9]*)/)[1]

        // Skip self-closing tags
        if (!match.endsWith("/>") && !["meta", "link", "img", "br", "hr", "input"].includes(tagName.toLowerCase())) {
          openTags.push({
            tag: tagName,
            line: index + 1,
            column: line.indexOf(match) + 1,
          })
        }
      })
    }

    // Find closing tags
    const closeMatches = line.match(/<\/([a-zA-Z][a-zA-Z0-9]*)>/g)

    if (closeMatches) {
      closeMatches.forEach((match) => {
        // Extract tag name
        const tagName = match.match(/<\/([a-zA-Z][a-zA-Z0-9]*)>/)[1]

        // Check if it matches the last opened tag
        if (openTags.length > 0 && openTags[openTags.length - 1].tag.toLowerCase() === tagName.toLowerCase()) {
          openTags.pop()
        } else {
          issues.push({
            line: index + 1,
            column: line.indexOf(match) + 1,
            message: `Unexpected closing tag </${tagName}>`,
            severity: "error",
          })
        }
      })
    }
  })

  // Report unclosed tags
  openTags.forEach((openTag) => {
    issues.push({
      line: openTag.line,
      column: openTag.column,
      message: `Unclosed tag <${openTag.tag}>`,
      severity: "error",
    })
  })

  // Format the output
  if (issues.length === 0) {
    return `${filePath}: No issues found`
  }

  let output = `${filePath}: Found ${issues.length} issue(s)\n\n`

  issues.forEach((issue) => {
    output += `${filePath}:${issue.line}:${issue.column}: ${issue.severity}: ${issue.message}\n`
  })

  return output
}

// Lint CSS code
function lintCSS(code, filePath) {
  // Basic CSS linting (example)
  const issues = []

  // Check for missing semicolons
  const lines = code.split("\n")

  lines.forEach((line, index) => {
    if (line.trim() === "" || line.trim().startsWith("/*")) {
      return
    }

    if (!/;\s*$/.test(line) && !/^\s*\{/.test(line) && !/^\s*\}/.test(line)) {
      issues.push({
        line: index + 1,
        column: line.length,
        message: "Missing semicolon",
        severity: "warning",
      })
    }
  })

  // Format the output
  if (issues.length === 0) {
    return `${filePath}: No issues found`
  }

  let output = `${filePath}: Found ${issues.length} issue(s)\n\n`

  issues.forEach((issue) => {
    output += `${filePath}:${issue.line}:${issue.column}: ${issue.severity}: ${issue.message}\n`
  })

  return output
}

// Lint JSON code
function lintJSON(code, filePath) {
  try {
    JSON.parse(code)
    return `${filePath}: No issues found`
  } catch (error) {
    return `${filePath}: JSON syntax error: ${error.message}`
  }
}

// Make lint commands available globally
window.lintCommands = lintCommands

