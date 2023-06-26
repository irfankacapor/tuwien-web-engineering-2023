# Artmart API

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

## `GET /artworks{?q}`

Parameter | Description
----------|------------
`q`       | Search query. *Optional*.

Returns up to 100 artworks matching the search query.
If no query is provided, returns selected highlights from the collection.

The response is a list of artworks:

```json
[
  {
    "artworkId": 436085,
    "title": "Apple Blossoms",
    "artist": "Charles-François Daubigny",
    "date": "1873",
    "image": "https://images.metmuseum.org/CRDImages/ep/web-large/DT2145.jpg"
  },
  {
    "artworkId": 435882,
    "title": "Still Life with Apples and a Pot of Primroses",
    "artist": "Paul Cézanne",
    "date": "ca. 1890",
    "image": "https://images.metmuseum.org/CRDImages/ep/web-large/DT47.jpg"
  }
]
```

See below for a description of the fields.

## `GET /artworks/{id}`

Parameter | Description
----------|------------
`id`      | Artwork identifier

Returns the metadata for a single artwork or `404 Not Found`, if the artwork doesn't exist.

Response:

```json
{
  "artworkId": 436085,
  "title": "Apple Blossoms",
  "artist": "Charles-François Daubigny",
  "date": "1873",
  "image": "https://images.metmuseum.org/CRDImages/ep/web-large/DT2145.jpg"
}
```

Field       | Type   | Description
------------|--------|------------
`artworkId` | number | Artwork identifier
`title`     | string | Title, identifying phrase, or name given to the work
`artist`    | string | Artist of the work
`date`      | string | Year, span of years, or phrase that describes the (approximate) time when an artwork was created
`image`     | string | A URL pointing to an image of the artwork.

## `GET /cart`

The first time a client requests `GET /cart`, the server responds with an empty cart and a cookie named `sessionId`:

```http
HTTP/1.1 200 OK
Set-Cookie: sessionId=K6_CJVhN4WB6i_6WEiSFB; Path=/cart
Content-Type: application/json; charset=utf-8
Content-Length: 2

[]
```

The returned `sessionId` cookie should be included with all subsequent calls to any of the `/cart` endpoints.

Once a session is established, `GET /cart` will return the associated shopping cart:

```json
[
  {
    "cartItemId": 1,
    "price": 13645,
    "artworkId": 436085,
    "printSize": "M",
    "frameStyle": "classic",
    "frameWidth": 40,
    "matColor": "mint",
    "matWidth": 15
  },
  {
    "cartItemId": 2,
    "price": 3600,
    "artworkId": 436085,
    "printSize": "S",
    "frameStyle": "modern",
    "frameWidth": 20,
    "matWidth": 0
  }
]
```

For a description of the fields, see `GET /cart/{id}` below.

If the session ID is invalid, returns `403 Forbidden`.

## `POST /cart`

Add an item to the shopping cart.

```json
{
  "artworkId": 436085,
  "printSize": "M",
  "frameStyle": "classic",
  "frameWidth": 40,
  "matColor": "mint",
  "matWidth": 15
}
```

Field        | Type   | Description
-------------|--------|------------
`artworkId`  | number | Artwork identifier
`printSize`  | string | Size of the print. One of `S`, `M` or `L`.
`frameStyle` | string | One of the frame styles returned by `GET /frames`.
`frameWidth` | number | Frame width in millimeters, in the range [20, 50].
`matColor`   | string | One of the color names returned by `GET /mats`. *Optional, if `matWidth` is 0.*
`matWidth`   | number | Mat width in millimeters, in the range [0, 100].

If successful, the response will be `201 Created`.

If the session ID is invalid or missing, returns `403 Forbidden`.

If any of the required fields are missing or invalid, returns `400 Bad Request` and a dictionary of errors:

```json
{
  "message": "Validation failed",
  "errors": {
    "artworkId": "missing",
    "matWidth": "invalid"
  }
}
```

The possible error codes are `missing` and `invalid`, with the obvious meanings.

If the payload contains any additional fields, they are silently ignored.

## `DELETE /cart`

Clears the shopping cart associated with the session and returns `204 No Content`.

If the session ID is invalid or missing, returns `403 Forbidden`.

## `GET /cart/{id}`

Parameter | Description
----------|------------
`id`      | Cart item identifier

Returns a specific shopping cart item.

```json
{
  "cartItemId": 1,
  "price": 13645,
  "artworkId": 436085,
  "printSize": "M",
  "frameStyle": "classic",
  "frameWidth": 40,
  "matColor": "mint",
  "matWidth": 15,
}
```

Field        | Type   | Description
-------------|--------|------------
`cartItemId` | number | Cart item identifier
`price`      | number | Calculated price of the item, in euro cents.
`artworkId`  | number | Artwork identifier
`printSize`  | string | Size of the print. One of `S`, `M` or `L`.
`frameStyle` | string | One of the frame styles returned by `GET /frames`.
`frameWidth` | number | Frame width in millimeters, in the range [20,50].
`matColor`   | string | One of the color names returned by `GET /mats`. *Optional, if `matWidth` is 0.*
`matWidth`   | number | Mat width in millimeters, in the range [0, 100].

If the session ID is invalid or missing, returns `403 Forbidden`.

If no item with the given ID exists, returns `404 Not Found`.

## `DELETE /cart/{id}`

Parameter | Description
----------|------------
`id`      | Cart item identifier

Removes the given item from the cart and returns `204 No Content`.

If the session ID is invalid or missing, returns `403 Forbidden`.

If no item with the given ID exists, returns `404 Not Found`.

## `POST /cart/checkout`

Places an order and initiates the payment process with our payment provider, [Bling].

```json
{
  "email": "jane.doe@example.com",
  "shipping_address": {
    "name": "Jane Doe",
    "address": "Favoritenstraße 9-11",
    "city": "Vienna",
    "country": "AT",
    "postal_code": "1040",
    "phone": "+43 660 12 34 567"
  }
}
```

Field              | Type       | Description
-------------------|------------|------------
`email`            | string     | Customer email address
`shipping_address` | dictionary | Customer shipping address, with the usual fields: `name`, `address`, `city`, `country`, `postal_code` and `phone`. All are strings, `country` is a two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)) and `phone` is *optional*.

Returns the following information to the client, which can then proceed with the payment:

```json
{
  "payment_intent_id": "pi_kHKHIpr8q3iRjiDZ3jNLJ",
  "client_secret": "cs_QHYqgzlEMNu7ji_RmLOgt",
  "amount": 100,
  "currency": "eur"
}
```

Field               | Type   | Description
--------------------|--------|------------
`payment_intent_id` | string | Bling payment intent identifier.
`client_secret`     | string | The client secret of the payment intent.
`amount`            | number | Amount of money to be paid, in the smallest currency unit.
`currency`          | string | Three-letter ISO 4217 currency code, in lowercase.

If the session ID is invalid or missing, returns `403 Forbidden`.

If the shopping cart is empty, returns `400 Bad Request`.

If any of the required fields are missing, returns `400 Bad Request` (and nothing more).

## `POST /cart/checkout/payment-update`

Webhook used during the [Bling] payment process. Returns `400 Bad Request` for all but legitimate Bling events corresponding to orders in the system.

## `GET /frames`

Returns a list of the available frame styles.

```json
[
  {
    "style": "classic",
    "label": "Classic",
    "slice": 115,
    "cost": 110
  },
  {
    "style": "natural",
    "label": "Natural",
    "slice": 75,
    "cost": 85
  },
  ...
]
```

Field   | Type   | Description
--------|--------|------------
`style` | string | Frame style identifier
`label` | string | User-presentable name of the frame style
`slice` | number | Value for the [border-image-slice](https://developer.mozilla.org/en-US/docs/Web/CSS/border-image-slice) CSS property to use in conjunction with `/frames/{style}/borderImage`
`cost`  | number | Wood cost per millimeter of width, in euro cents.

## `GET /frames/{style}/{imageType}`

Parameter   | Description
------------|------------
`style`     | Frame style identifier as returned by `GET /frames`
`imageType` | Type of image to return. Either `borderImage` or `thumbImage`.

Returns a frame style's border image (used for rendering the preview frame) or thumbnail icon (used in the UI).
The type of binary image data returned is given by the `Content-Type` header, which will typically be either `image/png` or `image/jpeg`.

## `GET /mats`

Returns a list of the available mat color options.

```json
[
  {
    "color": "cream",
    "label": "Cream",
    "hex": "#d4ffea"
  },
  {
    "color": "carla",
    "label": "Carla",
    "hex": "#F5F8CF"
  },
  ...
]
```

Field   | Type   | Description
--------|--------|------------
`color` | string | Mat color identifier
`label` | string | User-presentable name of the mat color
`hex`   | string | Hexadecimal RGB color value

## `GET /shipping`

Returns a list of all available shipping destinations and the associated shipping costs.

```json
{
    "countries": [
        { 
            "displayName": "Austria", 
            "isoCode": "AT", 
            "price": 1500, 
            "freeShippingPossible": true, 
            "freeShippingThreshold": 10000 
        },
        { 
            "displayName": "Germany", 
            "isoCode": "DE", 
            "price": 1800, 
            "freeShippingPossible": true, 
            "freeShippingThreshold": 15000 
        },
    ...
  ]
}
```

Field                  | Type    | Description
-----------------------|---------|------------
`displayName`          | string  | The user-presentable name of the country.
`isoCode`              | string  | A two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2))
`price`                | number  | Shipping costs, in euro cents.
`freeShippingPossible` | boolean | Signals if free shipping is possible to this country.
`freeShippingThreshold`| number  | The threshold above which shipping is free.



[Bling]: https://web-engineering.big.tuwien.ac.at/s23/bling
