# Ustaad Main Service (API Gateway)

A centralized API gateway that automatically manages and proxies requests to all Ustaad microservices.

## 🚀 Features

- **Auto-Service Management**: Automatically starts auth, parent, and tutor services
- **API Gateway**: Routes requests to appropriate microservices
- **Health Monitoring**: Real-time service status monitoring
- **Graceful Shutdown**: Properly stops all services on exit
- **Development Tools**: Interactive service management CLI
- **Request Logging**: Comprehensive request/response logging

## 📋 Prerequisites

- Node.js (v16 or higher)
- All Ustaad services must be in the same parent directory
- Required services: `ustaad-auth`, `ustaad-parent`, `ustaad-tutor`

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
cd ustaad-main
npm install
```

### 2. Start the Gateway (Auto-starts all services)
```bash
npm start
```

This will automatically start:
- **ustaad-auth** on port 3100
- **ustaad-parent** on port 3001  
- **ustaad-tutor** on port 3002
- **API Gateway** on port 5000

### 3. Development Mode
```bash
npm run dev
```

## 📱 API Endpoints

### Gateway Health & Status
```http
GET /health
```
Returns overall health status and individual service status.

```http
GET /services/status
```
Returns detailed status of all managed services.

### Service Management
```http
POST /services/start
```
Manually start all services.

```http
POST /services/stop
```
Manually stop all services.

### Proxied Endpoints
All requests are automatically proxied to the appropriate service:

- `/auth/*` → `ustaad-auth` (port 3100)
- `/tutor/*` → `ustaad-tutor` (port 3002)
- `/parent/*` → `ustaad-parent` (port 3001)
- `/chat/*` → `ustaad-chat` (port 302)

## 🔧 Development Tools

### Interactive Service Manager
```bash
npm run services
```

Provides an interactive CLI to:
- Start/stop all services
- Start/stop specific services
- View service status
- Perform health checks

### Manual Service Control
```bash
# Start all services
npm run start-services

# Stop all services
npm run stop-services
```

## 📊 Service Status

When you start the gateway, you'll see output like:

```
🚀 API Gateway running at http://localhost:5000
📊 Health check: http://localhost:5000/health
🔧 Service status: http://localhost:5000/services/status

🔄 Starting dependent services...

🚀 Starting ustaad-auth on port 3100...
🚀 Starting ustaad-parent on port 3001...
🚀 Starting ustaad-tutor on port 3002...

✅ ustaad-auth is running on port 3100
✅ ustaad-parent is running on port 3001
✅ ustaad-tutor is running on port 3002

📊 Service Status:
  ✅ ustaad-auth (port 3100) - running
  ✅ ustaad-parent (port 3001) - running
  ✅ ustaad-tutor (port 3002) - running

🎉 All services started successfully!

🎯 Gateway ready! All services should be available through:
   Auth: http://localhost:5000/auth
   Tutor: http://localhost:5000/tutor
   Parent: http://localhost:5000/parent
   Chat: http://localhost:5000/chat
```

## 🔍 Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "ustaad-auth": {
      "port": 3100,
      "status": "running",
      "running": true
    },
    "ustaad-parent": {
      "port": 3001,
      "status": "running", 
      "running": true
    },
    "ustaad-tutor": {
      "port": 3002,
      "status": "running",
      "running": true
    }
  }
}
```

## 🚨 Error Handling

The gateway includes comprehensive error handling:

- **Service Startup Failures**: Logs detailed error messages
- **Proxy Errors**: Returns appropriate HTTP status codes
- **Graceful Shutdown**: Properly terminates all child processes
- **Uncaught Exceptions**: Logs and exits cleanly

## 📝 Logging

All requests and responses are logged with timestamps. Logs are stored in the `logs/` directory and automatically cleaned up after 7 days.

### View Logs
```bash
npm run logs
```

## 🔐 Security

- CORS enabled for cross-origin requests
- Request validation and sanitization
- Error message sanitization in production
- Environment-based configuration

## 🚀 Production Deployment

### Environment Variables
```env
PORT=5000
NODE_ENV=production
LOG_LEVEL=info
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📞 Troubleshooting

### Service Won't Start
1. Check if the service directory exists
2. Verify `package.json` exists in the service directory
3. Check if the port is already in use
4. Review the service logs for specific errors

### Proxy Errors
1. Verify the target service is running
2. Check the service port configuration
3. Ensure the service is responding on the expected endpoint

### Health Check Fails
1. Check individual service status
2. Verify service ports are correct
3. Review service startup logs

## 🎯 Usage Examples

### Start Everything
```bash
cd ustaad-main
npm start
```

### Development with Auto-restart
```bash
npm run dev
```

### Interactive Service Management
```bash
npm run services
```

### Check Service Status
```bash
curl http://localhost:5000/health
```

### Test API Endpoints
```bash
# Test auth service
curl http://localhost:5000/auth/health

# Test tutor service  
curl http://localhost:5000/tutor/health

# Test parent service
curl http://localhost:5000/parent/health
```

---

**Note**: The gateway automatically manages the lifecycle of dependent services. When you stop the gateway (Ctrl+C), it will gracefully shut down all child services as well. 