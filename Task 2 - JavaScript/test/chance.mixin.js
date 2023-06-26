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
  metObject: function ({ imageBaseUrl = 'https://images.example.com/' } = {}) {
    return {
      objectID: this.metObjectID(),
      primaryImageSmall: imageBaseUrl + this.imageFileName(),
      title: this.artworkTitle(),
      artistDisplayName: this.artistName(),
      objectDate: this.artworkDate()
    }
  },
  searchQuery: function () {
    return this.word({ syllables: this.integer({ min: 3, max: 5 }) })
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
  cartItem: function ({ objectID = null } = {}) {
    return {
      objectID: objectID ?? this.metObjectID(),
      printSize: this.printSize(),
      frameStyle: this.frameStyle(),
      frameWidth: this.frameWidth(),
      matColor: this.matColor(),
      matWidth: this.matWidth()
    }
  }
};
