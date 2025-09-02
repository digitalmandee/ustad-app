const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const ServiceManager = require("./service-manager");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize service manager
const serviceManager = new ServiceManager();

app.use(cors());


app.use(
  "/auth",
  createProxyMiddleware({
    target: "http://localhost:300",
    changeOrigin: true,
    pathRewrite: { "^/auth": "/api/v1/auth" },
    onError(err, req, res) {
      console.error("Proxy error for /auth:", err.message);
      res.status(502).json({
        error: "Service temporarily unavailable",
        message: "Auth service is not responding",
      });
    },
  })
);



// Proxy /tutor/* → http://localhost:302/*
app.use(
  "/tutor",
  createProxyMiddleware({
    target: "http://localhost:303",
    changeOrigin: true,
    pathRewrite: { "^/tutor": "/api/v1/tutor" },
    onError(err, req, res) {
      console.error("Proxy error for /tutor:", err.message);
      res.status(502).json({
        error: "Service temporarily unavailable",
        message: "Tutor service is not responding",
      });
    },
  })
);

// Proxy /parent/* → http://localhost:301/*
app.use(
  "/parent",
  createProxyMiddleware({
    target: "http://localhost:301",
    changeOrigin: true,
    pathRewrite: { "^/parent": "/api/v1/parent" },
    onError(err, req, res) {
      console.error("Proxy error for /parent:", err.message);
      res.status(502).json({
        error: "Service temporarily unavailable",
        message: "Parent service is not responding",
      });
    },
  })
);

// Proxy /chat/* → http://localhost:303/*
app.use(
  "/chat",
  createProxyMiddleware({
    target: "http://localhost:305",
    changeOrigin: true,
    pathRewrite: { "^/chat": "/api/v1/chat" },
    onError(err, req, res) {
      console.error("Proxy error for /chat:", err.message);
      res.status(502).json({
        error: "Service temporarily unavailable",
        message: "Chat service is not responding",
      });
    },
  })
);
app.use(
  "/admin",
  createProxyMiddleware({
    target: "http://localhost:306",
    changeOrigin: true,
    pathRewrite: { "^/admin": "/api/v1/admin" },
    onError(err, req, res) {
      console.error("Proxy error for /admin:", err.message);
      res.status(502).json({
        error: "Service temporarily unavailable",
        message: "Admin service is not responding",
      });
    },
  })
);

app.get("/", (req, res) => {
  // const servicesStatus = serviceManager.getAllServicesStatus();
  res.json({
    message: "API Gateway is running 🚀",
    // services: servicesStatus,
    endpoints: {
      health: "/health",
      services: "/services/status",
      auth: "/auth/*",
      tutor: "/tutor/*",
      parent: "/parent/*",
      chat: "/chat/*",
    },
  });
});


// Simple proxy for parent documents
app.get('/documents/parent/*', async (req, res) => {
  const documentPath = req.params[0];
  try {
    const response = await fetch(`http://localhost:301/${documentPath}`);
    const buffer = await response.buffer();
    res.set('Content-Type', response.headers.get('content-type'));
    res.send(buffer);
  } catch (error) {
    res.status(404).json({ error: 'Document not found' });
  }
});

// Simple proxy for tutor documents  
app.get('/documents/tutor/*', async (req, res) => {
  const documentPath = req.params[0];
  try {
    const response = await fetch(`http://localhost:303/${documentPath}`);

    console.log(response);
    const buffer = await response.buffer();
    res.set('Content-Type', response.headers.get('content-type'));
    res.send(buffer);
  } catch (error) {
    res.status(404).json({ error: 'Document not found' });
  }
});

app.use(express.json());




// app.listen(PORT, () => {
//   console.info(`
//     \x1b[32m################################################
//     🛡️  Server listening on port: ${PORT} 🛡️
//     ################################################\x1b[0m
//   `);
// });

// Health check endpoint that also shows service status
app.get("/health", (req, res) => {
  const servicesStatus = serviceManager.getAllServicesStatus();
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: servicesStatus
  });
});

// Service management endpoints
app.get("/services/status", (req, res) => {
  const servicesStatus = serviceManager.getAllServicesStatus();
  res.json({
    success: true,
    data: servicesStatus
  });
});

app.post("/services/start", async (req, res) => {
  try {
    const success = await serviceManager.startAllServices();
    res.json({
      success: success,
      message: success ? "All services started successfully" : "Some services failed to start"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to start services",
      error: error.message
    });
  }
});

app.post("/services/stop", (req, res) => {
  try {
    serviceManager.stopAllServices();
    res.json({
      success: true,
      message: "All services stopped"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to stop services",
      error: error.message
    });
  }
});

// Start the server
const server = app.listen(PORT, async () => {
  console.log(`🚀 API Gateway running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Service status: http://localhost:${PORT}/services/status`);

  // Start all services automatically
  console.log('\n🔄 Starting dependent services...');
  await serviceManager.startAllServices();

  console.log(`\n🎯 Gateway ready! All services should be available through:`);
  console.log(`   Auth: http://localhost:${PORT}/auth`);
  console.log(`   Tutor: http://localhost:${PORT}/tutor`);
  console.log(`   Parent: http://localhost:${PORT}/parent`);
  console.log(`   Chat: http://localhost:${PORT}/chat`);
  console.log(`   Admin: http://localhost:${PORT}/admin`);
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await serviceManager.gracefulShutdown();
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await serviceManager.gracefulShutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  serviceManager.stopAllServices();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  serviceManager.stopAllServices();
  process.exit(1);
});
