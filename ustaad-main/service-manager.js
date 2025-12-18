const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ServiceManager {
  constructor() {
    this.services = new Map();
    this.projectRoot = path.resolve(__dirname, '..');
  }

  // Load environment variables from service's develop.env file
  loadServiceEnv(servicePath, envFile = 'develop.env') {
    const envPath = path.join(servicePath, envFile);
    const env = { ...process.env };
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          // Handle both colon and equals separators
          let key, value;
          if (line.includes('=')) {
            const parts = line.split('=');
            key = parts[0].trim();
            value = parts.slice(1).join('=').trim();
          } else if (line.includes(':')) {
            const parts = line.split(':');
            key = parts[0].trim();
            value = parts.slice(1).join(':').trim();
          }
          
          if (key && value !== undefined) {
            env[key] = value;
          }
        }
      });
      
      console.log(`📄 Loaded environment from ${servicePath}/${envFile}`);
    } else {
      console.log(`⚠️  No ${envFile} found in ${servicePath}`);
    }
    
    return env;
  }

  getServiceEnvFile(servicePath) {
    // Prefer explicit override
    const override = process.env.SERVICE_ENV_FILE;
    if (override) return override;

    // If gateway NODE_ENV is already pointing to an env filename, keep it
    if (process.env.NODE_ENV && process.env.NODE_ENV.endsWith('.env')) {
      return process.env.NODE_ENV;
    }

    // Conventional production flag
    if (process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production') {
      // If the service has a production.env, use it; otherwise fall back
      const prodPath = path.join(servicePath, 'production.env');
      if (fs.existsSync(prodPath)) return 'production.env';
    }

    return 'develop.env';
  }

  // Start a service
  startService(serviceName, port, command = 'npm') {
    const servicePath = path.join(this.projectRoot, serviceName);
    
    // Check if service directory exists
    if (!fs.existsSync(servicePath)) {
      console.error(`❌ Service directory not found: ${servicePath}`);
      return false;
    }

    // Check if package.json exists
    const packageJsonPath = path.join(servicePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.error(`❌ package.json not found in ${servicePath}`);
      return false;
    }

    console.log(`🚀 Starting ${serviceName} on port ${port}...`);

    const envFile = this.getServiceEnvFile(servicePath);

    // Load environment variables from service env file
    const serviceEnv = this.loadServiceEnv(servicePath, envFile);
    
    // Override PORT with the specified port
    serviceEnv.PORT = port.toString();
    // In this repo, NODE_ENV is used as a dotenv *filename*
    serviceEnv.NODE_ENV = envFile;

    // Decide which npm script to run
    const distEntrypoint = path.join(servicePath, 'dist', 'src', 'index.js');
    const isProdLike =
      envFile.includes('production') ||
      process.env.NODE_ENV === 'production' ||
      process.env.ENVIRONMENT === 'production' ||
      process.env.SERVICES_MODE === 'production';

    let scriptToRun = isProdLike ? 'start' : 'dev';
    if (isProdLike && !fs.existsSync(distEntrypoint)) {
      console.log(
        `⚠️  ${serviceName}: dist build not found (${distEntrypoint}). Falling back to dev (slow).`
      );
      scriptToRun = 'dev';
    }

    const args = ['run', scriptToRun];

    const child = spawn(command, args, {
      cwd: servicePath,
      stdio: 'pipe',
      shell: true,
      env: serviceEnv
    });

    // Store service info
    this.services.set(serviceName, {
      process: child,
      port: port,
      path: servicePath,
      status: 'starting'
    });

    // Handle stdout
    child.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[${serviceName}] ${output}`);
      }
    });

    // Handle stderr
    child.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.error(`[${serviceName}] ERROR: ${output}`);
      }
    });

    // Handle process exit
    child.on('exit', (code, signal) => {
      const service = this.services.get(serviceName);
      if (service) {
        service.status = 'stopped';
        if (code !== 0) {
          console.error(`❌ ${serviceName} exited with code ${code} (signal: ${signal})`);
        } else {
          console.log(`✅ ${serviceName} stopped gracefully`);
        }
      }
    });

    // Handle process error
    child.on('error', (error) => {
      console.error(`❌ Error starting ${serviceName}:`, error.message);
      const service = this.services.get(serviceName);
      if (service) {
        service.status = 'error';
      }
    });

    // Wait a bit and check if process is still running
    setTimeout(() => {
      const service = this.services.get(serviceName);
      if (service && service.process.exitCode === null) {
        service.status = 'running';
        console.log(`✅ ${serviceName} is running on port ${port}`);
      }
    }, 2000);

    return true;
  }

  // Start all required services
  async startAllServices() {
    console.log('🔄 Starting all services...\n');

    const servicesToStart = [
      { name: 'ustaad-auth', port: 300 },
      { name: 'ustaad-parent', port: 301 },
      { name: 'ustaad-tutor', port: 303 },
      { name: 'ustaad-chat', port: 305 },
      { name: 'ustaad-admin', port: 306 },
    ];

    const startPromises = servicesToStart.map(service => {
      return new Promise((resolve) => {
        const started = this.startService(service.name, service.port);
        if (started) {
          // Wait for service to be ready
          setTimeout(() => {
            resolve(service.name);
          }, 3000);
        } else {
          resolve(null);
        }
      });
    });

    const results = await Promise.all(startPromises);
    const successfulServices = results.filter(result => result !== null);

    console.log(`\n📊 Service Status:`);
    successfulServices.forEach(serviceName => {
      const service = this.services.get(serviceName);
      if (service) {
        console.log(`  ✅ ${serviceName} (port ${service.port}) - ${service.status}`);
      }
    });

    if (successfulServices.length === servicesToStart.length) {
      console.log('\n🎉 All services started successfully!');
    } else {
      console.log('\n⚠️  Some services failed to start. Check the logs above.');
    }

    return successfulServices.length === servicesToStart.length;
  }

  // Stop a specific service
  stopService(serviceName) {
    const service = this.services.get(serviceName);
    if (service && service.process) {
      console.log(`🛑 Stopping ${serviceName}...`);
      service.process.kill('SIGTERM');
      this.services.delete(serviceName);
    }
  }

  // Stop all services
  stopAllServices() {
    console.log('🛑 Stopping all services...');
    for (const [serviceName, service] of this.services) {
      if (service.process) {
        service.process.kill('SIGTERM');
      }
    }
    this.services.clear();
    console.log('✅ All services stopped');
  }

  // Get service status
  getServiceStatus(serviceName) {
    const service = this.services.get(serviceName);
    if (service) {
      return {
        name: serviceName,
        port: service.port,
        status: service.status,
        running: service.process && service.process.exitCode === null
      };
    }
    return null;
  }

  // Get all services status
  getAllServicesStatus() {
    const status = {};
    for (const [serviceName, service] of this.services) {
      status[serviceName] = {
        port: service.port,
        status: service.status,
        running: service.process && service.process.exitCode === null
      };
    }
    return status;
  }

  // Graceful shutdown
  async gracefulShutdown() {
    console.log('\n🔄 Graceful shutdown initiated...');
    
    // Stop all services
    this.stopAllServices();
    
    // Wait a bit for processes to terminate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  }
}

module.exports = ServiceManager; 