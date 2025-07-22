#!/usr/bin/env node

const ServiceManager = require('./service-manager');
const readline = require('readline');

class DevManager {
  constructor() {
    this.serviceManager = new ServiceManager();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async showMenu() {
    console.log('\n🔧 Ustaad Development Manager');
    console.log('=============================');
    console.log('1. Start all services');
    console.log('2. Stop all services');
    console.log('3. Show service status');
    console.log('4. Start specific service');
    console.log('5. Stop specific service');
    console.log('6. Health check');
    console.log('7. Exit');
    console.log('=============================');

    const choice = await this.question('Select an option (1-7): ');
    
    switch (choice.trim()) {
      case '1':
        await this.startAllServices();
        break;
      case '2':
        await this.stopAllServices();
        break;
      case '3':
        this.showServiceStatus();
        break;
      case '4':
        await this.startSpecificService();
        break;
      case '5':
        await this.stopSpecificService();
        break;
      case '6':
        await this.healthCheck();
        break;
      case '7':
        console.log('👋 Goodbye!');
        this.rl.close();
        process.exit(0);
        break;
      default:
        console.log('❌ Invalid option. Please try again.');
    }

    // Show menu again
    setTimeout(() => this.showMenu(), 1000);
  }

  async startAllServices() {
    console.log('\n🔄 Starting all services...');
    const success = await this.serviceManager.startAllServices();
    if (success) {
      console.log('✅ All services started successfully!');
    } else {
      console.log('⚠️  Some services failed to start. Check the logs above.');
    }
  }

  async stopAllServices() {
    console.log('\n🛑 Stopping all services...');
    this.serviceManager.stopAllServices();
    console.log('✅ All services stopped.');
  }

  showServiceStatus() {
    console.log('\n📊 Service Status:');
    const status = this.serviceManager.getAllServicesStatus();
    
    if (Object.keys(status).length === 0) {
      console.log('No services are currently running.');
      return;
    }

    for (const [serviceName, serviceInfo] of Object.entries(status)) {
      const statusIcon = serviceInfo.running ? '🟢' : '🔴';
      console.log(`${statusIcon} ${serviceName} (port ${serviceInfo.port}) - ${serviceInfo.status}`);
    }
  }

  async startSpecificService() {
    console.log('\nAvailable services:');
    console.log('1. ustaad-auth (port 300)');
    console.log('2. ustaad-parent (port 301)');
    console.log('3. ustaad-tutor (port 302)');
    
    const choice = await this.question('Select service to start (1-3): ');
    
    const services = [
      { name: 'ustaad-auth', port: 300 },
      { name: 'ustaad-parent', port: 301 },
      { name: 'ustaad-tutor', port: 302 }
    ];
    
    const serviceIndex = parseInt(choice) - 1;
    if (serviceIndex >= 0 && serviceIndex < services.length) {
      const service = services[serviceIndex];
      const success = this.serviceManager.startService(service.name, service.port, 'npm', ['run', 'dev']);
      if (success) {
        console.log(`✅ Started ${service.name}`);
      } else {
        console.log(`❌ Failed to start ${service.name}`);
      }
    } else {
      console.log('❌ Invalid service selection.');
    }
  }

  async stopSpecificService() {
    const status = this.serviceManager.getAllServicesStatus();
    const runningServices = Object.keys(status).filter(name => status[name].running);
    
    if (runningServices.length === 0) {
      console.log('No services are currently running.');
      return;
    }

    console.log('\nRunning services:');
    runningServices.forEach((serviceName, index) => {
      console.log(`${index + 1}. ${serviceName}`);
    });
    
    const choice = await this.question('Select service to stop: ');
    const serviceIndex = parseInt(choice) - 1;
    
    if (serviceIndex >= 0 && serviceIndex < runningServices.length) {
      const serviceName = runningServices[serviceIndex];
      this.serviceManager.stopService(serviceName);
      console.log(`✅ Stopped ${serviceName}`);
    } else {
      console.log('❌ Invalid service selection.');
    }
  }

  async healthCheck() {
    console.log('\n🏥 Performing health check...');
    
    const status = this.serviceManager.getAllServicesStatus();
    let allHealthy = true;
    
    for (const [serviceName, serviceInfo] of Object.entries(status)) {
      const healthIcon = serviceInfo.running ? '🟢' : '🔴';
      console.log(`${healthIcon} ${serviceName}: ${serviceInfo.status}`);
      
      if (!serviceInfo.running) {
        allHealthy = false;
      }
    }
    
    if (allHealthy && Object.keys(status).length > 0) {
      console.log('\n✅ All services are healthy!');
    } else {
      console.log('\n⚠️  Some services are not running.');
    }
  }

  question(query) {
    return new Promise(resolve => this.rl.question(query, resolve));
  }
}

// Start the development manager
if (require.main === module) {
  const devManager = new DevManager();
  devManager.showMenu();
}

module.exports = DevManager; 