/**
 * 
 * @returns An array containing all cart items in the local storage.
 */
export function getCartItems() {
    var cart = JSON.parse(localStorage.getItem('cart'));
    if (!cart) {
        cart = [];
    }
    return cart;
}

// TODO: finish implementing Cart
