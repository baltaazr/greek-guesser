import express from "express";
import cors from "cors";
import path from "path";

import treeRoute from "./tree";

const app = express();

// Init Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    if (req.headers["x-forwarded-proto"] !== "https")
      return res.redirect("https://" + req.headers.host + req.url);
    else return next();
  } else return next();
});

// Define Routes
app.use("/api/tree", treeRoute);

const port = process.env.PORT || 4000;

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  const publicPath = path.join(__dirname, "..", "build");

  app.use(express.static(publicPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});
