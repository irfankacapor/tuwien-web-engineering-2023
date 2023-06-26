calcShipping();

async function calcShipping() {
  const shipping = await fetchShippingData();
  const countries = shipping.countries;

  let shippingCountries = document.querySelector("#country").options;

  for (let i = 0; i < countries.length; i++) {
    shippingCountries.add(
      new Option(countries[i].displayName, countries[i].isoCode)
    );
  }
  calculateTotal();
}

async function fetchShippingData() {
  try {
    const response = await fetch("./shipping.json");
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function calculateTotal() {
  const freeThresholdElem = document.getElementById("free-shipping-threshold");
  const freeShippingFormElem = document.getElementById("free-shipping-from");
  const shippingPriceElem = document.getElementById("price-shipping");
  const totalElem = document.getElementById("price-total");
  const subElem = document.getElementById("price-subtotal");
  const subtotal = parseFloat(subElem.innerText);

  const selectedCountryOption = document.getElementById("country").options;
  const selectedCountryIsoCode =
    selectedCountryOption[selectedCountryOption.selectedIndex].value;
  const shippingData = await fetchShippingData();
  const shippingCountries = shippingData.countries;

  let shippingPrice = 0;

  for (const country of shippingCountries) {
    if (country.isoCode !== selectedCountryIsoCode) {
      continue;
    }

    if (country.freeShippingPossible == false) {
      const price = (country.price / 100).toFixed(2);
      shippingPriceElem.textContent = `€ ${price}`;
      freeShippingFormElem.style.visibility = "hidden";
    } else if (country.freeShippingThreshold / 100 < subtotal) {
      shippingPriceElem.textContent = "Free";
      shippingPriceElem.style.fontWeight = "bold";
      freeShippingFormElem.style.visibility = "hidden";
    } else {
      const price = (country.price / 100).toFixed(2);
      shippingPriceElem.textContent = `€ ${price}`;
      shippingPriceElem.style.fontWeight = "none";
      freeShippingFormElem.style.visibility = "visible";
      freeThresholdElem.textContent = (
        country.freeShippingThreshold / 100
      ).toFixed(2);
      freeThresholdElem.style.fontSize = "0.65em";
    }
  }
  const total = (subtotal + parseFloat(shippingPrice)).toFixed(2);
  totalElem.textContent = total;
}
