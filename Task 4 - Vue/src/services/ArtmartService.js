const ARTMART_BASE_URL = 'https://web-engineering.big.tuwien.ac.at/s23/a4';

export async function getArtworks(query = '') {
    const q = query.trim() == '' ? '' : '?q=' + query.trim();
    const res = await fetch(ARTMART_BASE_URL + '/artworks' + q);
    if (!res.ok) {
        return []
    }
    return res.json();
}

export async function getArtwork(artworkId) {
    const res = await fetch(ARTMART_BASE_URL + '/artworks/' + artworkId);
    if (!res.ok) {
        return null;
    }
    return res.json();
}

export async function getCart() {
    const res = await fetch(ARTMART_BASE_URL + '/cart', { credentials: 'include' });
    if (!res.ok) {
        if (res.status == 403) {
            // NOTE: this does not actually work if the cookie was set from a different domain
            document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        return []
    }
    return res.json();
}

export async function addToCart(product) {
    const res = await fetch(ARTMART_BASE_URL + '/cart', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(product)
    });
    return res.ok;
}

export async function deleteCartItem(cartItemId) {
    const res = await fetch(ARTMART_BASE_URL + '/cart/' + cartItemId, {
        method: 'DELETE',
        credentials: 'include'
    });
    return res.ok
}

export async function checkout(customer) {
    const res = await fetch(ARTMART_BASE_URL + '/cart/checkout', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(customer)
    })
    if (!res.ok) {
        return null;
    }
    return res.json();
}

export async function getFrames() {
    const res = await fetch(ARTMART_BASE_URL + '/frames');
    if (!res.ok) {
        return []
    }
    const frames = await res.json();
    for (const frame of frames) {
        frame.thumbImage = `${ARTMART_BASE_URL}/frames/${frame.style}/thumbImage`
        frame.borderImage = `${ARTMART_BASE_URL}/frames/${frame.style}/borderImage`
    }
    return frames;
}

export async function getMats() {
    const res = await fetch(ARTMART_BASE_URL + '/mats');
    if (!res.ok) {
        return []
    }
    return res.json();
}

export async function getShipping() {
    const res = await fetch(ARTMART_BASE_URL + '/shipping');
    if (!res.ok) {
        return {}
    }
    return res.json();
}
