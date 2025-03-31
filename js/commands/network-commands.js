/**
 * Network commands
 */

export const networkCommands = {
  ping: {
    description: "Send ICMP ECHO_REQUEST to network hosts",
    usage: "ping <host>",
    action: (args, state) => {
      if (args.length === 0) {
        return "ping: missing host operand"
      }

      const host = args[0]

      // Check if host exists in our simulated network
      if (!state.networkState.hosts[host]) {
        return `ping: unknown host ${host}`
      }

      // Simulate ping response
      const { ip, latency } = state.networkState.hosts[host]

      return `PING ${host} (${ip}) 56(84) bytes of data.
64 bytes from ${ip}: icmp_seq=1 ttl=64 time=${latency}.1 ms
64 bytes from ${ip}: icmp_seq=2 ttl=64 time=${latency + Math.random() * 2}.3 ms
64 bytes from ${ip}: icmp_seq=3 ttl=64 time=${latency + Math.random() * 3}.7 ms
64 bytes from ${ip}: icmp_seq=4 ttl=64 time=${latency + Math.random() * 1}.9 ms

--- ${host} ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3ms
rtt min/avg/max/mdev = ${latency - 0.5}/${latency + 1.2}/${latency + 3.7}/${latency - 0.2} ms`
    },
  },

  wget: {
    description: "Non-interactive network downloader",
    usage: "wget <url>",
    action: async (args, state) => {
      if (args.length === 0) {
        return "wget: missing URL"
      }

      const url = args[0]

      // Check if URL is valid
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "wget: Invalid URL: You must specify http:// or https://"
      }

      try {
        // For security, we'll only simulate fetching
        // In a real implementation, you could use fetch() to actually get content

        // Extract filename from URL
        const urlParts = url.split("/")
        const fileName = urlParts[urlParts.length - 1] || "index.html"

        // Create a simulated file in the current directory
        const currentDir = window.terminalHelpers.getPathObject(state.currentPath, state.fileSystem)

        if (!currentDir || currentDir.type !== "directory") {
          return "wget: cannot save to current directory"
        }

        // Simulate download
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Create file with simulated content
        currentDir.contents[fileName] = {
          type: "file",
          content: `<!-- Downloaded from ${url} -->\n<html>\n<head>\n  <title>Downloaded Content</title>\n</head>\n<body>\n  <h1>Content from ${url}</h1>\n  <p>This is simulated content.</p>\n</body>\n</html>`,
        }

        // Save file system
        if (window.terminalUtils && window.terminalUtils.saveFileSystem) {
          window.terminalUtils.saveFileSystem(state.fileSystem)
        }

        return `--2023-04-01 12:34:56--  ${url}
Resolving ${url.split("/")[2]}... 192.168.1.1
Connecting to ${url.split("/")[2]}... connected.
HTTP request sent, awaiting response... 200 OK
Length: 1234 (1.2K) [text/html]
Saving to: '${fileName}'

${fileName}                100%[===================>]   1.2K  --.-KB/s    in 0.1s    

2023-04-01 12:34:57 (12.3 KB/s) - '${fileName}' saved [1234/1234]`
      } catch (error) {
        return `wget: error: ${error.message}`
      }
    },
  },

  curl: {
    description: "Transfer data from or to a server",
    usage: "curl <url>",
    action: async (args, state) => {
      if (args.length === 0) {
        return "curl: try 'curl --help' for more information"
      }

      const url = args[0]

      // Check if URL is valid
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return 'curl: (1) Protocol "' + url.split(":")[0] + '" not supported or disabled in libcurl'
      }

      try {
        // For security, we'll only simulate fetching
        // In a real implementation, you could use fetch() to actually get content

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Return simulated content
        return `<!DOCTYPE html>
<html>
<head>
    <title>Example Domain</title>
    <meta charset="utf-8" />
    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
    <div>
        <h1>Example Domain</h1>
        <p>This domain is for use in illustrative examples in documents.</p>
        <p>You may use this domain in literature without prior coordination or asking for permission.</p>
    </div>
</body>
</html>`
      } catch (error) {
        return `curl: (6) Could not resolve host: ${url.split("/")[2]}`
      }
    },
  },

  host: {
    description: "DNS lookup utility",
    usage: "host <domain>",
    action: (args, state) => {
      if (args.length === 0) {
        return "host: missing domain name"
      }

      const domain = args[0]

      // Check if domain exists in our simulated network
      if (!state.networkState.hosts[domain]) {
        return `Host ${domain} not found: 3(NXDOMAIN)`
      }

      // Return simulated DNS info
      const { ip } = state.networkState.hosts[domain]
      return `${domain} has address ${ip}`
    },
  },
}

// Helper function to get a file system object at a path
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