/**
 * 
 * @returns An array containing all cart items in the local storage.
 */
export const getCartItems = () => {
    var cart = JSON.parse(localStorage.getItem('cart'));
    if (!cart) {
        cart = [];
    }
    console.log(cart)
    return cart;
}

export const removeItem = (cartItem) => {
    const cartItems = getCartItems();
    console.log(cartItems)

    const priceOfItemToBeRemoved = document.getElementById(`p${parseFloat(cartItem.objectID) + cartItem.frameWidth + cartItem.matWidth}`).innerText.substring(2);

    document.getElementById(`${parseFloat(cartItem.objectID) + cartItem.frameWidth + cartItem.matWidth}`).remove();

    const index = cartItems.findIndex(item => item.objectID === cartItem.objectID && item.frameWidth === cartItem.frameWidth && item.matWidth === cartItem.matWidth && item.frameStyle === cartItem.frameStyle && item.printSize === cartItem.printSize)
    cartItems.splice(index, 1);
    updateCartItemCount(cartItems);
    updateTotalPrice(priceOfItemToBeRemoved);
    putCartItems(cartItems);
}

export const putCartItems = (items) => {
    localStorage.setItem("cart", JSON.stringify(items));
}

export const updateCartItemCount = (items) => {
    const itemCount = items.length;
    const link = document.querySelector("#cart-link");
    if (itemCount === 0) {
      link.textContent = "Cart";
      const cart = document.getElementById("cart");
      const message = document.createElement("h1");
      message.innerText = "There are no items in your shopping cart.";
      cart.appendChild(message);
      document.querySelector("#cart-checkout").style.visibility = "hidden";
      document.querySelector("#cart-total").style.visibility = "hidden";
    } else {
      link.textContent = "Cart (" + itemCount + ")";
    }
}

export const updateTotalPrice = (price) => {
    const totalPrice = document.getElementById("price-total");
    const formerPrice = parseFloat(totalPrice.innerText.substring(2)).toFixed(2);
    const newPrice = formerPrice - parseFloat(price).toFixed(2);
    totalPrice.innerText = "€ " + newPrice.toFixed(2);
}

