// test-api.js - Script to test API connections
import axios from 'axios';
const baseURL = 'http://localhost:5000/api';

// Create axios instance with token
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Login to get token
async function login() {
  try {
    const response = await axios.post(`${baseURL}/auth/login`, {
      email: 'super@example.com',
      password: 'password',
    });
    
    if (response.data && response.data.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      console.log('Login successful!');
      return true;
    } else {
      console.error('Login failed: No token received');
      return false;
    }
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return false;
  }
}

// Test fetching vehicles
async function testVehicles() {
  try {
    console.log('\n--- Testing Vehicle API ---');
    const response = await api.get('/vehicles');
    console.log(`Found ${response.data.length} vehicles`);
    
    if (response.data.length > 0) {
      // Show detailed output for first vehicle
      console.log('\nSample vehicle data:');
      console.log(JSON.stringify(response.data[0], null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('Error fetching vehicles:', error.response?.data || error.message);
    return false;
  }
}

// Test fetching drivers
async function testDrivers() {
  try {
    console.log('\n--- Testing Driver API ---');
    const response = await api.get('/drivers');
    console.log(`Found ${response.data.length} drivers`);
    
    if (response.data.length > 0) {
      // Show detailed output for first driver
      console.log('\nSample driver data:');
      console.log(JSON.stringify(response.data[0], null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('Error fetching drivers:', error.response?.data || error.message);
    return false;
  }
}

// Test fetching available vehicles
async function testAvailableVehicles() {
  try {
    console.log('\n--- Testing Available Vehicles API ---');
    const response = await api.get('/vehicles', {
      params: { status: 'AVAILABLE' }
    });
    console.log(`Found ${response.data.length} available vehicles`);
    
    if (response.data.length > 0) {
      // Show detailed output for first available vehicle
      console.log('\nSample available vehicle data:');
      console.log(JSON.stringify(response.data[0], null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('Error fetching available vehicles:', error.response?.data || error.message);
    return false;
  }
}

// Test fetching available drivers
async function testAvailableDrivers() {
  try {
    console.log('\n--- Testing Available Drivers API ---');
    const response = await api.get('/drivers', {
      params: { status: 'AVAILABLE' }
    });
    console.log(`Found ${response.data.length} available drivers`);
    
    if (response.data.length > 0) {
      // Show detailed output for first available driver
      console.log('\nSample available driver data:');
      console.log(JSON.stringify(response.data[0], null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('Error fetching available drivers:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Starting API tests...');
  
  // First login to get token
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('Test failed: Could not login');
    return;
  }
  
  // Run the tests
  await testVehicles();
  await testDrivers();
  await testAvailableVehicles();
  await testAvailableDrivers();
  
  console.log('\nAll tests completed!');
}

runTests().catch(console.error);
