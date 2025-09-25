// Stripe Checkout API for $1/month subscription
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, email } = req.body;

        // Create or retrieve customer
        let customer;
        if (email) {
            const existingCustomers = await stripe.customers.list({
                email: email,
                limit: 1
            });

            if (existingCustomers.data.length > 0) {
                customer = existingCustomers.data[0];
            } else {
                customer = await stripe.customers.create({
                    email: email,
                    metadata: {
                        userId: userId
                    }
                });
            }
        }

        // Create checkout session for $1/month subscription
        const session = await stripe.checkout.sessions.create({
            customer: customer ? customer.id : undefined,
            customer_email: !customer && email ? email : undefined,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Hook & Headlines Generator Pro',
                            description: 'Unlimited hook generations + premium features',
                        },
                        unit_amount: 100, // $1.00 in cents
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.origin || process.env.VERCEL_URL}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || process.env.VERCEL_URL}?canceled=true`,
            metadata: {
                userId: userId
            },
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
            subscription_data: {
                metadata: {
                    userId: userId
                },
                trial_period_days: 7 // Optional 7-day free trial
            }
        });

        res.status(200).json({ 
            sessionId: session.id,
            url: session.url 
        });

    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ 
            error: 'Failed to create checkout session',
            message: error.message 
        });
    }
}