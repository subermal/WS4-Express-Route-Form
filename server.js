const path = require("path"); // Load Node.js path module for safe file paths
const express = require("express"); // Load Express framework
const axios = require("axios"); // Load Axios HTTP client

const app = express(); // Create Express application instance
const PORT = process.env.PORT || 3000; // Use environment port or 3000 locally

app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form bodies
app.use(express.json()); // Parse JSON request bodies

app.use(
  express.static(path.join(__dirname, "public"))
); // Serve static files from public folder

app.get("/", (req, res) => { // Handle GET request to root path
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  ); // Send index.html file as response
});

app.listen(PORT, () => // Start HTTP server
  console.log("Server on http://localhost:" + PORT) // Log server URL to console
);

const router = require("express").Router(); // Create Express router instance

router.get(
  "/time",
  (req, res) => res.json({ now: new Date().toISOString() })
); // Respond with current ISO time as JSON

router.get("/hello/:name", (req, res) => { // Match URL with name parameter
  res.send("Hello " + req.params.name); // Send plain text greeting
});

app.use("/api", router); // Mount router under /api path

app.post("/search", (req, res) => { // Handle POST submissions to /search
    const term = (req.body.q || "").trim(); // Read search field q and trim spaces
    const src = (req.body.src || "demo").toLowerCase(); // Read source option and normalise to lower case
    console.log("Search:", { term, src }); // Log values to server console
    res.redirect(
      "/#q=" + encodeURIComponent(term) +
      "&src=" + encodeURIComponent(src)
    ); // Redirect to root with hash storing q and src
  }); // End of form handler


  // Add this route *inside* your `router` variable from Part 2
router.get("/api/search", async (req, res) => { // Define GET endpoint /api/search
    const q = (req.query.q || "phone").trim(); // Read q parameter or default to "phone"
    const src = (req.query.src || "demo").toLowerCase(); // Read src parameter or default to "demo"
    try { // Start error handling block
      if (src === "github") { // If source is GitHub
        const { data } = await axios.get( // Call GitHub search API
          "https://api.github.com/search/repositories",
          {
            params: { q }, // Send query term
            headers: { "Accept": "application/vnd.github+json" }, // Use GitHub JSON media type
            timeout: 6000 // Abort if no response in 6 seconds
          }
        );
        const items = (data.items || []) // Use items array or empty list
          .slice(0, 5) // Take first five results
          .map(r => ({ // Map to simplified objects
            name: r.full_name, // Repository full name
            stars: r.stargazers_count, // Star count
            url: r.html_url, // Web URL
            description: r.description || "" // Description or empty string
          }));
        return res.json({ // Send JSON response
          source: "github",
          total: data.total_count,
          top5: items
        });
      }
      // This is the 'else' block, which runs if src is 'demo' or anything else
      const { data } = await axios.get( // Default to DemoJSON search
        "https://dummyjson.com/products/search",
        {
          params: { q, limit: 5 }, // Query and limit
          timeout: 6000 // Six second timeout
        }
      );
      const items = (data.products || []) // Use products array or empty list
        .map(p => ({ // Simplify each product
          title: p.title, // Product title
          price: p.price, // Price value
          brand: p.brand, // Brand name
          rating: p.rating, // Rating score
          thumbnail: p.thumbnail // Thumbnail image URL
        }));
      return res.json({ // Send DemoJSON results
        source: "demo",
        total: data.total,
        top5: items
      });
    } catch (e) { // Handle error from either API
      const status = e.response?.status || 502; // Pick response status or 502
      const msg = e.response?.data?.message || e.message || "Upstream error"; // Choose best error message
      return res
        .status(status)
        .json({ error: msg, tip: "Try the Demo source if GitHub is rate limited." }); // Respond with JSON error and tip
    }
  }); // End of /api/search handler
  