module.exports = {
  nn: function (fn, n1, n2, opts = {}) {
    return this.unique(fn, this.integer({ min: n1, max: n2 }), opts)
  },
  metObjectID: function () {
    return this.integer({ min: 1, max: 1000000 })
  },
  imageFileName: function () {
    return this.string({ length: 6, casing: 'upper', alpha: true, numeric: true }) + '.jpg'
  },
  artworkTitle: function () {
    return this.sentence({ words: this.integer({ min: 1, max: 10 }), punctuation: false })
  },
  artistName: function () {
    return this.name({ middle: this.bool() })
  },
  artworkDate: function () {
    return this.year({ min: 1400, max: 2020 }).toString()
  },
  metObject: function ({ objectID = null, imageBaseUrl = 'https://images.example.com/' } = {}) {
    return {
      objectID: objectID ?? this.metObjectID(),
      primaryImageSmall: imageBaseUrl + this.imageFileName(),
      title: this.artworkTitle(),
      artistDisplayName: this.artistName(),
      objectDate: this.artworkDate()
    }
  },
  searchQuery: function () {
    return this.animal().toLowerCase();
  },
  printSize: function () {
    return this.pickone(['S', 'M', 'L']);
  },
  matColor: function () {
    return this.pickone(['tea', 'cerise', 'cerulean', 'oxford', 'raisin']);
  },
  frameStyle: function () {
    return this.pickone(['classic', 'natural', 'shabby', 'elegant']);
  },
  frameWidth: function () {
    return this.integer({ min: 20, max: 50 });
  },
  matWidth: function () {
    return this.integer({ min: 0, max: 10 });
  },
  artworkId: function () {
    return this.metObjectID();
  },
  cartItemWithoutId: function ({ artworkId = null } = {}) {
    let item = {
      artworkId: artworkId ?? this.artworkId(),
      printSize: this.printSize(),
      frameStyle: this.frameStyle(),
      frameWidth: this.frameWidth(),
      matWidth: this.matWidth()
    };
    if (item.matWidth > 0) {
      item.matColor = this.matColor();
    }
    return item;
  },
  nanoid: function () {
    return this.string({ pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', length: 21 });
  },
  shippingAddress: function () {
    let address = {
      name: this.name(),
      address: this.address(),
      city: this.city(),
      country: this.pickone(['AT', 'DE', 'CH', 'GB', 'NL']),
      postal_code: this.postcode()
    };
    if (this.bool()) {
      address.phone = this.phone();
    }
    return address;
  },
  blingPaymentIntentId: function () {
    return 'pi_' + this.nanoid();
  },
  blingClientSecret: function () {
    return 'cs_' + this.nanoid();
  },
  blingEventId: function () {
    return 'ev_' + this.nanoid();
  },
  creditCard: function () {
    return {
      cardholder: this.name(),
      cardnumber: this.cc(),
      exp_month: parseInt(this.exp_month()),
      exp_year: parseInt(this.exp_year()),
      cvc: this.integer({ min: 1, max: 999 })
    }
  }
};
