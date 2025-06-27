const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// app.use(express.json());

// Proxy /auth/* → http://localhost:3001/*
app.use(
  "/auth",
  createProxyMiddleware({
    target: "http://localhost:3100",
    changeOrigin: true,
    pathRewrite: { "^/auth": "/api/v1/auth" }, // strips "/auth" before sending
    logLevel: "debug",
    onError(err, req, res) {
      console.error("Proxy error:", err.message);
      res.status(500).send("Proxy error");
      ``;
    },
  })
);

// Proxy /tutor/* → http://localhost:3002/*
app.use(
  "/tutor",
  createProxyMiddleware({
    target: "http://localhost:300",
    changeOrigin: true,
    pathRewrite: { "^/tutor": "/api/v1/tutor" },
  })
);


// Proxy /tutor/* → http://localhost:3002/*
app.use(
  "/parent",
  createProxyMiddleware({
    target: "http://localhost:301",
    changeOrigin: true,
    pathRewrite: { "^/parent": "/api/v1/parent" },
  })
);

app.get("/", (req, res) => {
  res.send("API Gateway is running 🚀");
});

app.listen(PORT, () => {
  console.log(`API Gateway running at http://localhost:${PORT}`);
});
