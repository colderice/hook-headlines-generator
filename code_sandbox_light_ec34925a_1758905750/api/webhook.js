// Stripe Webhook Handler for Subscription Events
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleCheckoutCompleted(session);
            break;

        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            await handlePaymentSucceeded(invoice);
            break;

        case 'invoice.payment_failed':
            const failedInvoice = event.data.object;
            await handlePaymentFailed(failedInvoice);
            break;

        case 'customer.subscription.deleted':
            const deletedSubscription = event.data.object;
            await handleSubscriptionCanceled(deletedSubscription);
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
}

async function handleCheckoutCompleted(session) {
    const userId = session.metadata.userId;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    console.log('Checkout completed for user:', userId);

    // Here you would update your database
    // For now, we'll log the successful subscription
    console.log('User subscribed:', {
        userId,
        customerId,
        subscriptionId,
        timestamp: new Date().toISOString()
    });

    // In a real app, you'd update your user database here
    // updateUserSubscription(userId, { 
    //     isSubscribed: true, 
    //     stripeCustomerId: customerId,
    //     stripeSubscriptionId: subscriptionId 
    // });
}

async function handlePaymentSucceeded(invoice) {
    console.log('Payment succeeded for subscription:', invoice.subscription);
    
    // Ensure user's subscription is active
    // This handles monthly renewals
}

async function handlePaymentFailed(invoice) {
    console.log('Payment failed for subscription:', invoice.subscription);
    
    // Handle failed payments - maybe send email notification
    // or temporarily suspend access after multiple failures
}

async function handleSubscriptionCanceled(subscription) {
    const userId = subscription.metadata.userId;
    console.log('Subscription canceled for user:', userId);
    
    // Update user's subscription status to inactive
    // updateUserSubscription(userId, { isSubscribed: false });
}