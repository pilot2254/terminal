/**
 * File system commands
 */

export const fileSystemCommands = {
  ls: {
    description: "List directory contents",
    usage: "ls [directory]",
    action: (args, state) => {
      const path = args[0] || state.currentPath
      const normalizedPath = normalizePath(path, state.currentPath)
      const directory = getPathObject(normalizedPath, state.fileSystem)

      if (!directory) {
        return `ls: cannot access '${path}': No such file or directory`
      }

      if (directory.type !== "directory") {
        return `ls: cannot list '${path}': Not a directory`
      }

      const contents = Object.keys(directory.contents)
      if (contents.length === 0) {
        return "" // Empty directory
      }

      return contents.join("  ")
    },
  },

  cd: {
    description: "Change directory",
    usage: "cd [directory]",
    action: (args, state) => {
      // Handle special case: cd with no args goes to home directory
      if (args.length === 0) {
        state.previousPath = state.currentPath
        state.currentPath = `/home/${state.currentUser}`
        return ""
      }

      // Handle special case: cd -
      if (args[0] === "-") {
        const temp = state.currentPath
        state.currentPath = state.previousPath
        state.previousPath = temp
        return ""
      }

      const path = args[0]
      const normalizedPath = normalizePath(path, state.currentPath)
      const directory = getPathObject(normalizedPath, state.fileSystem)

      if (!directory) {
        return `cd: no such file or directory: ${path}`
      }

      if (directory.type !== "directory") {
        return `cd: not a directory: ${path}`
      }

      state.previousPath = state.currentPath
      state.currentPath = normalizedPath
      return ""
    },
  },

  pwd: {
    description: "Print working directory",
    usage: "pwd",
    action: (args, state) => {
      return state.currentPath
    },
  },

  mkdir: {
    description: "Make directories",
    usage: "mkdir <directory>",
    action: (args, state) => {
      if (args.length === 0) {
        return "mkdir: missing operand"
      }

      const path = args[0]
      const parentPath = getParentPath(path, state.currentPath)
      const dirName = getBaseName(path)

      if (!dirName) {
        return "mkdir: invalid directory name"
      }

      const parent = getPathObject(parentPath, state.fileSystem)

      if (!parent) {
        return `mkdir: cannot create directory '${path}': No such file or directory`
      }

      if (parent.type !== "directory") {
        return `mkdir: cannot create directory '${path}': Not a directory`
      }

      if (parent.contents[dirName]) {
        return `mkdir: cannot create directory '${path}': File exists`
      }

      parent.contents[dirName] = {
        type: "directory",
        contents: {},
      }

      return ""
    },
  },

  touch: {
    description: "Create empty file",
    usage: "touch <file>",
    action: (args, state) => {
      if (args.length === 0) {
        return "touch: missing operand"
      }

      const path = args[0]
      const parentPath = getParentPath(path, state.currentPath)
      const fileName = getBaseName(path)

      if (!fileName) {
        return "touch: invalid file name"
      }

      const parent = getPathObject(parentPath, state.fileSystem)

      if (!parent) {
        return `touch: cannot touch '${path}': No such file or directory`
      }

      if (parent.type !== "directory") {
        return `touch: cannot touch '${path}': Not a directory`
      }

      // If file already exists, just update it (in a real system, this would update timestamp)
      if (!parent.contents[fileName]) {
        parent.contents[fileName] = {
          type: "file",
          content: "",
        }
      }

      return ""
    },
  },

  cat: {
    description: "Concatenate and print files",
    usage: "cat <file>",
    action: (args, state) => {
      if (args.length === 0) {
        return "cat: missing operand"
      }

      const path = args[0]
      const normalizedPath = normalizePath(path, state.currentPath)
      const file = getPathObject(normalizedPath, state.fileSystem)

      if (!file) {
        return `cat: ${path}: No such file or directory`
      }

      if (file.type !== "file") {
        return `cat: ${path}: Is a directory`
      }

      return file.content
    },
  },

  rm: {
    description: "Remove files or directories",
    usage: "rm [-r] <file/directory>",
    action: (args, state) => {
      let recursive = false
      let targetPath = ""

      // Parse arguments
      if (args.length === 0) {
        return "rm: missing operand"
      } else if (args[0] === "-r" || args[0] === "-rf") {
        recursive = true
        if (args.length < 2) {
          return "rm: missing operand"
        }
        targetPath = args[1]
      } else {
        targetPath = args[0]
      }

      const parentPath = getParentPath(targetPath, state.currentPath)
      const targetName = getBaseName(targetPath)

      if (!targetName) {
        return "rm: invalid operand"
      }

      const parent = getPathObject(parentPath, state.fileSystem)

      if (!parent || !parent.contents[targetName]) {
        return `rm: cannot remove '${targetPath}': No such file or directory`
      }

      const target = parent.contents[targetName]

      if (target.type === "directory" && !recursive) {
        return `rm: cannot remove '${targetPath}': Is a directory`
      }

      // Check if trying to remove a non-empty directory without recursive flag
      if (target.type === "directory" && Object.keys(target.contents).length > 0 && !recursive) {
        return `rm: cannot remove '${targetPath}': Directory not empty`
      }

      // Delete the file or directory
      delete parent.contents[targetName]

      return ""
    },
  },

  echo: {
    description: "Display a line of text or write to file",
    usage: "echo <text> [> file]",
    action: (args, state) => {
      if (args.length === 0) {
        return ""
      }

      // Check if output is being redirected to a file
      const text = args.join(" ")
      const redirectMatch = text.match(/(.*?)(?:\s+>\s+(.+))?$/)

      if (redirectMatch && redirectMatch[2]) {
        // Extract the text and file path
        const content = redirectMatch[1]
        const filePath = redirectMatch[2]

        // Get the parent directory and file name
        const parentPath = getParentPath(filePath, state.currentPath)
        const fileName = getBaseName(filePath)

        if (!fileName) {
          return "echo: invalid file name"
        }

        const parent = getPathObject(parentPath, state.fileSystem)

        if (!parent) {
          return `echo: cannot write to '${filePath}': No such file or directory`
        }

        if (parent.type !== "directory") {
          return `echo: cannot write to '${filePath}': Not a directory`
        }

        // Create or overwrite the file
        parent.contents[fileName] = {
          type: "file",
          content: content,
        }

        return ""
      } else {
        // Just echo the text
        return text
      }
    },
  },

  cp: {
    description: "Copy files and directories",
    usage: "cp <source> <destination>",
    action: (args, state) => {
      if (args.length < 2) {
        return "cp: missing file operand"
      }

      const sourcePath = args[0]
      const destPath = args[1]

      // Get source file/directory
      const normalizedSourcePath = normalizePath(sourcePath, state.currentPath)
      const source = getPathObject(normalizedSourcePath, state.fileSystem)

      if (!source) {
        return `cp: cannot stat '${sourcePath}': No such file or directory`
      }

      // Get destination parent directory
      const destParentPath = getParentPath(destPath, state.currentPath)
      const destName = getBaseName(destPath)
      const destParent = getPathObject(destParentPath, state.fileSystem)

      if (!destParent) {
        return `cp: cannot create regular file '${destPath}': No such file or directory`
      }

      if (destParent.type !== "directory") {
        return `cp: cannot create regular file '${destPath}': Not a directory`
      }

      // Deep clone the source
      const clonedSource = JSON.parse(JSON.stringify(source))

      // Add to destination
      destParent.contents[destName] = clonedSource

      return ""
    },
  },

  mv: {
    description: "Move (rename) files",
    usage: "mv <source> <destination>",
    action: (args, state) => {
      if (args.length < 2) {
        return "mv: missing file operand"
      }

      const sourcePath = args[0]
      const destPath = args[1]

      // Get source parent and name
      const sourceParentPath = getParentPath(sourcePath, state.currentPath)
      const sourceName = getBaseName(sourcePath)
      const sourceParent = getPathObject(sourceParentPath, state.fileSystem)

      if (!sourceParent || !sourceParent.contents[sourceName]) {
        return `mv: cannot stat '${sourcePath}': No such file or directory`
      }

      // Get destination parent directory
      const destParentPath = getParentPath(destPath, state.currentPath)
      const destName = getBaseName(destPath)
      const destParent = getPathObject(destParentPath, state.fileSystem)

      if (!destParent) {
        return `mv: cannot move '${sourcePath}' to '${destPath}': No such file or directory`
      }

      if (destParent.type !== "directory") {
        return `mv: cannot move '${sourcePath}' to '${destPath}': Not a directory`
      }

      // Move the file/directory
      destParent.contents[destName] = sourceParent.contents[sourceName]
      delete sourceParent.contents[sourceName]

      return ""
    },
  },
}

// Helper functions for file system operations
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

function getParentPath(path, currentPath) {
  const normalizedPath = normalizePath(path, currentPath)
  const lastSlashIndex = normalizedPath.lastIndexOf("/")

  if (lastSlashIndex <= 0) {
    return "/"
  }

  return normalizedPath.substring(0, lastSlashIndex)
}

function getBaseName(path) {
  const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path
  const components = normalizedPath.split("/")
  return components[components.length - 1]
}