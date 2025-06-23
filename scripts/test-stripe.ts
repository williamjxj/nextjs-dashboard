import Stripe from 'stripe';

async function testStripeConnection() {
  console.log('🧪 Testing Stripe Configuration...');
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  console.log('Secret Key:', secretKey?.slice(0, 20) + '...');
  console.log('Publishable Key:', publishableKey?.slice(0, 20) + '...');
  
  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY not found');
    return;
  }
  
  if (!publishableKey) {
    console.error('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found');
    return;
  }
  
  try {
    const stripe = new Stripe(secretKey);
    
    // Test creating a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00
      currency: 'usd',
      metadata: {
        test: 'true'
      }
    });
    
    console.log('✅ Stripe connection successful!');
    console.log('✅ Payment Intent created:', paymentIntent.id);
    console.log('✅ Client Secret:', paymentIntent.client_secret?.slice(0, 20) + '...');
    
    // Clean up - cancel the test payment intent
    await stripe.paymentIntents.cancel(paymentIntent.id);
    console.log('✅ Test payment intent cancelled');
    
  } catch (error) {
    console.error('❌ Stripe connection failed:', error);
  }
}

testStripeConnection();
