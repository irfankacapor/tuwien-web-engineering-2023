# Web Engineering - Technical University of Vienna 2023

This repository encompasses the comprehensive collection of tasks completed during the Web Engineering course at the Technical University of Vienna. The course was divided into four distinct parts. 

In the initial part, students were tasked with finalizing HTML and CSS files based on a provided PDF file that outlined the desired visual appearance. 

The second part focused on extending functionality by incorporating JavaScript, building upon the foundation established in the first part. 

For the third part, students were required to implement the backend using Node.js, enhancing the overall interactivity and dynamic nature of the web application. 

Lastly, the fourth part involved recreating parts one and two utilizing Vue.js, a progressive JavaScript framework, further elevating the sophistication and responsiveness of the application.

#### To effectively utilize the files and gain insights into their functionality, distinct steps should be followed for each task:

__Task 1__: As the files are static, the simplest approach is to utilize a live server or manually examine the HTML files individually.

__Task 2__: Navigate to the folder `./Task 2 - JavaScript/test` and execute `npm install` to install dependencies. Subsequently, initiate the server by running `npm run server` to explore the functionality of the web application.

__Task 3__: Execute `npm install` within the `./Task 3 - Node` folder to install dependencies. Launch the server by running `npm start`. At this point, requests can be sent to interact with the server.

__Task 4__: Install dependencies by executing `npm install` within the `./Task 4 - Vue.js/test` folder. Start the application by running `npm run dev` to observe its functionality in action.

##### Detailed descriptions of tasks are given below

## Assignment 1: HTML & CSS

You are tasked with building the website for __Artmart__, a web shop for fine art prints.

In this first assignment, you will implement the responsive design of the Artmart website using HTML and CSS. You need to follow the __Artmart Design Guide__ (found in "Task 1 - HTML, CSS" folder).

You should build the website inside the `www` folder. It already contains some HTML and CSS fragments for you to use as starting points, as well as various graphical assets used throughout the site. Take a look at what's there and figure out what remains to be done.

## Assignment 2: JavaScript

In this second assignment, you are tasked with adding interactivity to the __Artmart__ website using JavaScript.

You should build the website inside the `www` folder. It already contains a complete sample solution for A1, so you don't have to re-implement all of the HTML and CSS for the static part of the website. It also contains JavaScript fragments to use as starting points for A2. Take a look at what's there and figure out what remains to be done.

#### What you need to do

- Familiarize yourself with the [Metropolitan Museum of Art Collection API][Met API], in particular the *Search* and *Object* endpoints. You will use this API throughout the rest of this course to access public domain images and metadata of artworks from the collection of the Metropolitan Museum of Art of New York City

- On the __Search__ page, the user should be able to search for artworks.
  - Use the query parameter `q` to store the current search term.
  - Use the [Met API] to search for and show artworks and their metadata.
  - If no search term is given, display a selection of highlights from the collection. The object IDs for the highlighted artworks can be found in `highlights.json`.
  - Consider only artworks that actually have images.
  - Return only the first 100 results per search.
  - Link the artwork image of each search result to the corresponding __Framing__ page.
  - During a search, instead of "Search our collection of more than 400,000 artworks", it should say `Searching for “<term>”…` where `<term>` is the search term. When the search is done, it should say `Found <number> artworks for “<term>”` where `<number>` is the number of results. Take care to properly pluralize "artworks", depending on the number of results, and to use the same exact punctuation as given here.

- On the __Framing__ page, the user should be able to configure a frame for a selected artwork.
  - Use a query parameter `objectID` to identify the artwork that is being framed. If the object does not exist, the user should be redirected to the __Search__ page.
  - Use the [Met API] to show the artwork and its metadata.
  - Use the helper functions in `frame.js` to add a frame preview to the artwork and dynamically update it whenever the print size, frame width, frame style, mat width, or mat color change.
  - Use the query parameters `printSize`, `frameStyle`, `frameWidth`, `matColor`, and `matWidth` to optionally pre-set the framing controls, so that other pages can link to a specific configuration. The width values should be given in millimeters.
  - Connect the frame width and mat width text fields with their respective range sliders, so that changing the value of the slider changes the value in the text field, and vice versa.
  - Ensure that only valid values can be entered for frame and mat width. The frame width can range from 2–5&nbsp;cm and the mat width from 0–10&nbsp;cm, both with 1&nbsp;mm steps.
  - Use the helper functions in `frame.js` to calculate the price of a particular framing.
  - When the "Add to Cart" button is pressed, add the selected artwork with its framing configuration to the shopping cart (see below for details) and redirect the user to the __Cart__ page.

- On the __Cart__ page, the user should be able to manage their shopping cart.
  - Use the local storage key `cart` to store the shopping cart. You should represent the cart as a JSON array of objects containing an `objectID` and the framing parameters, but nothing more. In particular, the cart should not contain the artwork metadata or the calculated price of each item.
  - For each item in the cart, show a preview of the framed artwork using the [Met API] and the helper functions in `frame.js`. The preview image should link to the corresponding __Framing__ page.  
  - For each item in the cart, show the usual metadata (artist, title, date) and a textual description of the configuration. The description should be like "Medium print in a 3.3&nbsp;cm natural frame with a 1.7&nbsp;cm mint mat." or "Small print in a 5&nbsp;cm classic frame." (if the mat has width zero).
  - Show the price of each item, as well as the sum total.
  - Allow the user to remove items from the cart by clicking on the circled "x". Removing an item from the cart should not cause the page to reload. The price total should be recalculated though.
  - Display the most recently added item on top.
  - If there are no items in the cart, show the message "There are no items in your shopping cart." and nothing else (except for the usual page header).

- The __Checkout__ page should allow the user to finalize their order.
  - If there are no items in the shopping cart, the user should be redirected to the (empty) __Cart__ page.
  - Calculate and show the subtotal for all items in the cart.
  - Show the available shipping destinations by populating the country `<select>` element with options corresponding to the countries in `shipping.json`. The text content of each option should be the country's `displayName` and the value of each option should be the country's `isoCode`.
  - Calculate and show the shipping costs using the selected country's `price` and `freeShippingThreshold` from `shipping.json`. If the subtotal is above the free shipping threshold, the shipping costs are zero and you should display "Shipping Costs: Free", with "Free" in bold style. If the threshold has not been reached, display "(Free shipping from: € `<freeShippingThreshold>`)" below the actual shipping costs and in 0.65 em font size, but only if free shipping is actually possible for the selected country.
  - Calculate and show the total price including shipping costs.
  - The pay button doesn't have to do anything (yet).

- On each page, next to the "Cart" link in the navigation, show the number of items in the shopping cart (in parentheses), except if there are no items in the cart.

- On each page where you access the [Met API], cache responses from the *Object* endpoint using local storage.

[Met API]: https://metmuseum.github.io

## Assignment 3: Backend with Node.js

In this third assignment, you are tasked with implementing a backend API server for __Artmart__.

You will be using [Node.js](https://nodejs.org) and the [Express](https://expressjs.com) framework (version 4). The `server` folder already contains a partial solution which you should use as a starting point. As always, take a look at what's there and figure out what remains to be done.

#### What you need to do

- You need to fully implement the API specified in the table below and fulfill the additional requirements described further below.

  The Artmart API uses standard HTTP methods and response codes. It accepts and returns JSON-encoded data.

The API offers access to a number of resources over twelve endpoints:

Method | Endpoint       | Description
-------|----------------|------------
GET    | /artworks{?q}  | Search artworks
GET    | /artworks/{id} | Retrieve a single artwork's metadata
GET    | /cart          | List all items in the shopping cart
POST   | /cart          | Add an item to the shopping cart
DELETE | /cart          | Empty the shopping cart
GET    | /cart/{id}     | Retrieve a shopping cart item
DELETE | /cart/{id}     | Remove a shopping cart item
POST   | /cart/checkout | Place an order and initiate the payment process
GET    | /frames        | List available frame styles
GET    | /frames/{style}/{imageType} | Get a particular frame image
GET    | /mats          | List available mat colors
GET    | /shipping      | List available shipping destinations

Additionally, the server exposes a webhook used during the payment process:

Method | Endpoint       | Description
-------|----------------|------------
POST   | /cart/checkout/payment-update | Payment webhook for Bling


For the **``/artworks``** endpoint:

- You should implement an API gateway to the [Metropolitan Museum of Art Collection API][met_api]. In particular, `artworkId` should be identical with the Met API's `objectId`. The `image` should be `primaryImageSmall`.

- Your Met API gateway should cache responses from the Met API, so that subsequent requests to your server do not cause redundant Met API queries. This applies to the *Object* as well as the *Search* endpoints of the Met API.

- It is sufficient for the Met API cache to be entirely in-memory.

- It is *not* necessary to implement any kind of cache eviction or garbage collection strategy for the cache. But be careful to only cache necessary information.

- The "selected highlights" mentioned in the API docs can be found in `server/resources/highlights.json`.

For the **``/cart``** endpoint:

- You should use an appropriate in-memory data structure to associate session IDs with shopping carts. Do not use any kind of database or persistent offline storage. You can use the [nanoid] library to create unique session IDs.

- Again, it is *not* necessary to implement any kind of cache eviction or garbage collection strategy for the shopping cart sessions.

- Note that when you are adding an item to the shopping cart, the client does *not* include the price. You should calculate the price server-side. The template code contains a function to help you with that (see `server/utils/price.js`).

For the **``/cart/checkout``** endpoint:

- You need to interface with the [Bling payment service][bling]. Read the Bling documentation carefully. You need to implement the server side of the payment flow. For testing purposes, you can play the part of the client using [curl](https://curl.haxx.se) or [HTTPie](https://httpie.org).

- To implement the checkout process, you will need to keep track of orders and payment intents. Use appropriate in-memory data structures. Do not use any databases or persistent storage.

- In order to create a payment intent you will need to calculate the total price of all items in the shopping cart including shipping. You can calculate the shipping costs using the selected country's `price` and `freeShippingThreshold` from `shipping.json`. If the subtotal is above the free shipping threshold, the shipping costs are zero.

- Your Bling API key is `ak_s23a3m01234567` with `01234567` replaced by your 8 digit student ID.

- The Bling API key should be provided to your server via an environment variable named `BLING_API_KEY`. Do not hardcode it!

- To debug the webhook, we recommend that you use [ngrok](https://ngrok.com) to temporarily expose your local server to the public internet over a secure tunnel. Note that this is only necessary if you want to understand the webhook workflow better, the test scripts do not depend on the real Bling service and you do not need ngrok to run the tests.

- In real life, you would secure the payment webhook. Preferably, it would only be accessible by whitelisted IP addresses of the payment provider. At the very least, there would be some kind of cryptographic signature check. For this assignment, it is sufficient to ensure that any event you receive on the webhook corresponds to a valid order within your system.

- In order to correctly set the `webhook` parameter when creating a payment intent with Bling, you need to know your server's base URL. Running locally, this will be something like `http://localhost:3000`. If you're tunneling via ngrok, you have a public URL like `https://xyz.ngrok.io`. In either case, you should pass along the server's base URL via an environment variable named `ARTMART_BASE_URL`. Do not hardcode it!

- When a payment succeeds and your server receives a notification from Bling, you should create a receipt for the successful order. For an example, see `server/orders/order-0000.json`. Receipts should be sequentially numbered and put into the `server/orders` folder. The template code contains a function to help you with that (see `/server/utils/orders.js`).

- Note that if an order was successful, the shopping cart should be empty again.

For the **``/frames``**, **``/mats``**, and **``/shipping``** endpoints:

- The available frames, mat colors and shipping destinations can be found in the `server/resources` folder.

## Assignment 4: Frontend with Vue.js

In the fourth and final assignment, you are tasked with using the [Vue.js framework](https://vuejs.org/) (version 3) to re-implement the **Artmart** frontend from A2 and to connect it to the backend API from A3.

In contrast to the other assignments, you are already given a larger portion of partially implemented functionality. It is explicitly part of the assignment for you to **carefully read the existing code structures** to understand the existing functionality. To guide your implementation, we have occasionally added comments with TODO directives.

The application is organized in _Pages_, reflecting the page structure you know from previous assignments: `SearchPage.vue`, `FramingPage.vue`, `CartPage.vue` and `CheckoutPage.vue`. Each page references further components, some of which are already fully implemented, while others have to be implemented by you (specifically, `CartItem.vue` and `WidthSlider.vue`).

We have used [Vue Router](https://router.vuejs.org/) (version 4) to implement in-app routing. Check out `routes.js` to see the routes we provided. You do not need to change anything there.

We have used [Pinia](https://pinia.vuejs.org/) (version 2) to implement centralized state management. Carefully read through the code in `store.js` and understand how state, getters, mutations, and actions relate to each other, and how the store interacts with the backend API. The proper way to interact with the store from within components is by adding a computed `artmartStore: mapStores(useArtmartStore).artmartStore,` and then using it through `this.artmartStore`. Check out the [Pinia documentation](https://pinia.vuejs.org/) for more information. Note that you should not modify `store.js`, all necessary functionality is already provided.

#### What you need to do

We already implemented all the functionality of the Search page for you to explore (`SearchPage.vue`). What you need to do is to complete the implementation of the remaining pages and some of their required components.

##### Width Slider Component (`src/components/framing/WidthSlider.vue`)

- Implement a reusable, self-contained component that encapsulates the number input / range slider combination used by the _Frame Width_ and _Mat Width_ options of the Framing page.

- The component expects to receive the following properties on instantiation:

  | Name    | Type   | Description                                           |
  | ------- | ------ | ----------------------------------------------------- |
  | `min`   | Number | Lower bound, in millimeters (e.g. 20 for frame width) |
  | `max`   | Number | Upper bound, in millimeters (e.g. 100 for mat width)  |
  | `value` | Number | Initial value, in millimeters                         |
  | `label` | String | The label for the component (e.g. "Frame" or "Mat")   |

- Uphold the same constraints expressed in A2:

  - Ensure that only valid values can be entered. The width can range from `min` to `max`, with 1 millimeter steps.

  - Connect the number field with the range slider, so that changing the value of the slider changes the value in the number field, and vice versa.

- The component should provide the ability for a two-way binding of its value through `v-model`. For instance, the parent component should be able to set the values of the number field and range slider by establishing a binding to its (the parent's) reactive data fields (e.g. `config.frameWidth`), which should conversely be updated when the number field or range slider values change. This can be accomplished by emitting the appropriate event in the component. See the Vue documentation on [Form Input Bindings](https://vuejs.org/guide/essentials/forms.html#form-input-bindings) and [Using `v-model` on Components](https://vuejs.org/guide/components/v-model.html) for more information. Make sure to switch the documentation to the "Options API".

- Hint: _Within_ the component, use the `change` event on the number field and the `input` event on the range slider to be notified of changes in their respective values.

- Beware that the unit of the component value is _millimeters_, while the HTML form values (which reflect what the user sees) are in _centimeters_.

##### Framing Page (`src/pages/FramingPage.vue`)

- Insert the missing components of the frame configurator and ensure that everything is functional and bound properly (using `v-model`) to the respective `config` data model properties. In particular, you need to instantiate the following components:

  - `WidthSlider` (for frame width)

  - `FrameStylePicker`

  - `WidthSlider` (for mat width)

  - `MatColorPicker`

- Establish proper bindings for the price (and ensure that it is formatted properly).

- Implement the correct functionality when the "Add to Cart" button is clicked:

  - Update the shopping cart by properly communicating with the Pinia store (using `this.artmartStore` after having added it to the component).

  - Redirect to the Cart page using `this.$router`.

##### Cart Item Component (`src/components/CartItem.vue`)

- The component expects to receive a `cartItem` object (containing `artworkId`, `price`, `printSize`, `frameWidth`, `frameStyle`, `matWidth`, `matColor`) on instantiation.

- Load the artwork metadata during the appropriate [lifecycle hook](https://vuejs.org/guide/essentials/lifecycle.html) using a function from `ArtmartService.js`.

- Use the `FramedArtwork` and `MuseumLabel` components to display an image of the framed artwork and additional information about the item.

- The framed artwork preview should link back to the correct Framing page. Hint: Use the [`router-link`](https://router.vuejs.org/guide/) component and the provided `framingRoute` computed property.

- Display a description of the artwork (title, artist, date), a textual description of the frame configuration (identical to A2), the price of the item and a remove button. Hint: Use the [slot](https://vuejs.org/guide/components/slots.html#slots) provided by the `MuseumLabel` component to reuse functionality and styling.

- When the remove button is clicked, update the shopping cart by properly communicating with the Pinia store (using `this.artmartStore` after having added it to the component).

##### Cart Page (`src/pages/CartPage.vue`)

- If there are no items in the shopping cart, display the text "There are no items in your shopping cart."

- Use list rendering on the Cart Item component to display all shopping cart items. Properly communicate with the Pinia store (using `this.artmartStore`) to retrieve the current items. Ensure that if the store changes (e.g. when an item has been removed), the Cart page reflects this change.

- Display the properly formatted total price. (Hint: use the store)

- When clicking the "Checkout" button, redirect to the Checkout page. Hint: Use the `tag` property of [`router-link`](https://v3.router.vuejs.org/api/#router-link).

##### Checkout Page (`src/pages/CheckoutPage.vue`)

- If the shopping cart is empty, redirect to the Cart page using `this.$router`.

- Populate the shipping destination options using list rendering. You can get the available shipping destinations from the Pinia store (using `this.artmartStore`). As before, if the subtotal is above the free shipping threshold, the shipping costs are zero and you should display "Shipping Costs: Free", with "Free" in bold style. If the threshold has not been reached, display "(Free shipping from: € `<freeShippingThreshold>`)" below the actual shipping costs and in 0.65 em font size, but only if free shipping is actually possible for the selected country.

- Display the correctly formatted subtotal, shipping cost and total price, depending on the state of the shopping cart and the currently selected shipping destination.

- Bind the form inputs to your data model.

- Implement the client side of the [Bling payment flow](https://web-engineering.big.tuwien.ac.at/s23/bling/#overview):

  - Utilize the implementation of `BlingService.js` for the payment process.

  - When the form is submitted, use the `checkout` function from `ArtmartService.js` to begin the payment process and the `confirmPaymentIntent` function from `BlingService.js` to complete it. Be sure to handle both client and server errors gracefully.

  - During processing of the payment, display only the block marked `PROCESSING` in the template code. (Specifically, do not display the checkout form during this time.) Hint: You can use your browser's developer tools to artificially slow down network requests, which gives you time to see what happens during processing.

  - After a successful payment, display only the block marked `SUCCESS` in the template code. (Again, do not display the checkout form anymore.)

  - If there was an error, show the checkout form again (with all previously filled-in data) and above it display the block marked `ERROR` in the template code.

  - Make sure to eventually trigger the `loadCart` action from the Pinia store to ensure the shopping cart is still in sync with the backend.
