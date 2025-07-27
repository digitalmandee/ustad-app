/**
 * Payment Method API Test Examples
 * 
 * This file contains examples of how to use the payment method API endpoints
 * from the frontend or for testing purposes.
 */

const BASE_URL = 'http://localhost:301'; // Update with your actual server URL
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with actual JWT token

// Example 1: Create a payment method
async function createPaymentMethod(paymentMethodId) {
  try {
    const response = await fetch(`${BASE_URL}/parent/payment-methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        paymentMethodId: paymentMethodId
      })
    });

    const data = await response.json();
    console.log('Create Payment Method Response:', data);
    return data;
  } catch (error) {
    console.error('Error creating payment method:', error);
  }
}

// Example 2: Get all payment methods
async function getPaymentMethods() {
  try {
    const response = await fetch(`${BASE_URL}/parent/payment-methods`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    const data = await response.json();
    console.log('Get Payment Methods Response:', data);
    return data;
  } catch (error) {
    console.error('Error getting payment methods:', error);
  }
}

// Example 3: Get a specific payment method
async function getPaymentMethod(paymentMethodId) {
  try {
    const response = await fetch(`${BASE_URL}/parent/payment-methods/${paymentMethodId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    const data = await response.json();
    console.log('Get Payment Method Response:', data);
    return data;
  } catch (error) {
    console.error('Error getting payment method:', error);
  }
}

// Example 4: Update a payment method (set as default)
async function updatePaymentMethod(paymentMethodId, isDefault = true) {
  try {
    const response = await fetch(`${BASE_URL}/parent/payment-methods/${paymentMethodId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        isDefault: isDefault
      })
    });

    const data = await response.json();
    console.log('Update Payment Method Response:', data);
    return data;
  } catch (error) {
    console.error('Error updating payment method:', error);
  }
}

// Example 5: Delete a payment method
async function deletePaymentMethod(paymentMethodId) {
  try {
    const response = await fetch(`${BASE_URL}/parent/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    const data = await response.json();
    console.log('Delete Payment Method Response:', data);
    return data;
  } catch (error) {
    console.error('Error deleting payment method:', error);
  }
}

// Example 6: Frontend integration with Stripe
function frontendIntegrationExample() {
  // This would be used in a React/Vue/Angular component
  
  // 1. Initialize Stripe
  const stripe = Stripe('pk_test_51NqxDjAPLQcrxtdxAzvoYXxH3oSaB6WzjKjy2IKkXcVqIqXaM7Il2mFY2Yt9o1UaU8BZTfU4bRIbIDoNxVaMSUV900F3STdJBD');
  
  // 2. Create card element
  const elements = stripe.elements();
  const cardElement = elements.create('card');
  cardElement.mount('#card-element');
  
  // 3. Handle form submission
  async function handleSubmit(event) {
    event.preventDefault();
    
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    // 4. Send to backend
    const result = await createPaymentMethod(paymentMethod.id);
    
    if (result.success) {
      console.log('Payment method added successfully!');
      // Handle success (e.g., show success message, redirect, etc.)
    } else {
      console.error('Failed to add payment method:', result.message);
      // Handle error
    }
  }
  
  return { handleSubmit };
}

// Example usage:
// createPaymentMethod('pm_1234567890abcdef');
// getPaymentMethods();
// getPaymentMethod('uuid-of-payment-method');
// updatePaymentMethod('uuid-of-payment-method', true);
// deletePaymentMethod('uuid-of-payment-method');

module.exports = {
  createPaymentMethod,
  getPaymentMethods,
  getPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  frontendIntegrationExample
}; 