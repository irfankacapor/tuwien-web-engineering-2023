const BLING_BASE_URL = 'https://web-engineering.big.tuwien.ac.at/s23/bling'

/**
 * Confirm a payment intent with Bling to execute a payment transaction.
 * 
 * @param {string} paymentIntentId The identifier of the payment intent.
 * @param {string} clientSecret The client secret of the payment intent.
 * @param {Object} card Customer credit card information.
 * @returns {boolean} Whether the payment succeeded or not.
 */
export async function confirmPaymentIntent(paymentIntentId, clientSecret, card) {
    const url = `${BLING_BASE_URL}/payment_intents/${paymentIntentId}/confirm`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ client_secret: clientSecret, ...card })
    });
    return res.ok;
}
