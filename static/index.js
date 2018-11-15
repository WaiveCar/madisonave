let state = {};
let parser = new DOMParser();

function scrollDown() {
  let scrollStart = window.pageYOffset;
  window.scrollTo({
    top: scrollStart + 500,
    behavior: 'smooth',
  });
}

document.addEventListener('keypress', e => {
  e.keyCode === 13 && e.preventDefault();
});
axios
  .get('/splash_resources')
  .then(response => {
    state.locationData = response.data;
    state.allLocations = response.data.popularLocations.concat(
      response.data.cheapLocations,
    );
    let parentNode = document.getElementById('popular-list');
    response.data.popularLocations.forEach((option, index) => {
      let html = parser.parseFromString(
        `
      <div class="card text-center">
        <img class="location-image" src="assets/${option.image}">
        <label for="${index}">
          ${option.name}
          </label>
        <div class="pb-2">
          <input type="radio" name="popular-location" value="${option.name}">
        </div>
      </div>`,
        'text/html',
      ).body.firstChild;
      parentNode.append(html);
    });
  })
  .catch(err => {
    console.log('error: ', err);
  });

let uploadInput = document.getElementById('image-upload');
uploadInput.addEventListener('change', () => {
  let reader = new FileReader();
  reader.onload = e => {
    let previewImage = document.getElementById('preview-image');
    previewImage.src = e.target.result;
    previewImage.style.visibility = 'visible';
    document.getElementById('upload-holder').style.display = 'none';
    scrollDown();
  };
  reader.readAsDataURL(uploadInput.files[0]);
});

function getCarts(price, multiplier) {
  let carts = [];
  let pricePerSecond = 200 / 60 * multiplier; // $1 per 30 Seconds
  let totalSeconds = price / pricePerSecond;
  carts.push({
    days: 1,
    secondsPerDay: totalSeconds,
    pricePerDay: price,
    perMinutePerDay: pricePerSecond * 60,
    basePrice: price,
    addedDays: 0,
    addedMinutes: 0,
    total: price,
  });
  carts.push({
    days: 7,
    secondsPerDay: totalSeconds / 7,
    pricePerDay: price / 7,
    perMinutePerDay: pricePerSecond * 60,
    basePrice: price,
    addedDays: 0,
    addedMinutes: 0,
    total: price,
  });
  carts.push({
    days: 30,
    pricePerDay: price / 30,
    secondsPerDay: totalSeconds / 30,
    perMinutePerDay: pricePerSecond * 60,
    basePrice: price,
    addedDays: 0,
    addedMinutes: 0,
    total: price,
  });
  return carts;
}

function calculateOptions(value) {
  let warningModal = document.getElementById('warning-modal');
  let warningModalText = document.getElementById('warning-modal-text');
  let currentChecked = document.querySelector(
    'input[name="popular-location"]:checked',
  );
  if (!currentChecked) {
    warningModalText.innerHTML = 'Please select a location';
    warningModal.style.display = 'block';
    return;
  }
  let hasImage = uploadInput.files.length > 0;
  if (!hasImage) {
    warningModalText.innerHTML = 'Please upload an image';
    warningModal.style.display = 'block';
    return;
  }
  let optionCards = document.getElementById('option-cards');
  while (optionCards.firstChild) {
    optionCards.removeChild(optionCards.firstChild);
  }
  if (!value) {
    warningModalText.innerHTML = 'Please enter a price';
    warningModal.style.display = 'block';
    document.getElementById('options').style.display = 'none';
    return;
  }
  let priceInput = document.getElementById('desired-price');
  priceInput.value = value / 100;
  let addOns = document.getElementById('add-ons');
  addOns.firstChild && addOns.removeChild(addOns.firstChild);
  let currentMultiplier = state.allLocations.find(item => {
    return item.name === currentChecked.value;
  }).multiplier;
  state.currentCarts = getCarts(value, currentMultiplier);
  state.currentCarts.forEach((option, index) => {
    let html = parser.parseFromString(
      `
      <div class="card text-center mt-2">
        <div class="card-header">
          <h5 class="card-title">
           <label for="${index}"> Option
              ${index + 1}
            </label>
          </h5>
        </div>
        <div class="card-body">
          <div class="mt-2">
            ${option.days}
            ${option.days > 1 ? ' Days' : ' Day'}
          </div>
          <div class="mt-2">
            $${(option.pricePerDay / 100).toFixed(2)} per day
          </div>
          <div class="mt-2">
            ${(option.secondsPerDay / 60).toFixed(2)}
            Minutes per day
          </div>
        </div>
        <div class="card-footer pb-2">
          <input type="radio" name="cart-options" value="${index}">
        </div>
      </div>
      `,
      'text/html',
    ).body.firstChild;
    optionCards.append(html);
  });
  document.getElementById('options').style.display = 'block';
  optionCards.style.visibility = 'visible';
  optionCards.addEventListener('change', () => {
    let currentChecked = document.querySelector(
      'input[name="cart-options"]:checked',
    );
    state.selectedCart = state.currentCarts[currentChecked.value];
    let addOns = document.getElementById('add-ons');
    addOns.firstChild && addOns.removeChild(addOns.firstChild);
    let html = parser.parseFromString(
      `
      <table class="table table-bordered table-hover">
        <thead>
          <tr>
            <th scope="col" style="width: 20%">Item</th>
            <th scope="col" style="width: 20%">Price</th>
            <th scope="col" style="width: 20%">Quantity</th>
            <th scope="col" style="width: 20%">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td scope="row">Extra Days</td>
            <td>${(state.selectedCart.pricePerDay / 100).toFixed(2)}</td>
            <td>
              <input class="col-4" type="number" "min="0" id="day-quantity" oninput="updateCart(true, 'addedDays', this.value)">
            </td>
            <td id="day-quantity-total">$0.00</td>
          </tr>
          <tr>
            <td scope="row">Extra Minutes Per Day</td>
            <td>${(state.selectedCart.perMinutePerDay / 100).toFixed(2)}</td>
            <td>
              <input class="col-4" type="number" "min="0" id="mins-quantity" oninput="updateCart(false, 'addedMinutes', this.value)">
            </td>
            <td id="mins-quantity-total">$0.00</td>
          </tr>
          <tr>
            <td>
              Total minutes per day: <span id="minutes-per-day"/>
            <td>
              Total cost per day: <span id="cost-per-day"/>
            </td>
            </td>
            <td>
              Total days: <span id="total-days"/>
            </td>
            <td>
              Total cost: <span id="cost-with-options"/>
            </td>
          </tr>
        </tbody>
      </table>`,
      'text/html',
    ).body.firstChild;
    addOns.append(html);
    updateCart();
    let scrollStart = window.pageYOffset;
    scrollDown();
  });
  scrollDown();
}

function updateCart(isAddedDays, propToUpdate, val) {
  if (val) {
    state.selectedCart[propToUpdate] = Number(val);
  }
  let daysTotal, minsTotal;
  if (isAddedDays) {
    daysTotal = state.selectedCart.addedDays * state.selectedCart.pricePerDay;
    minsTotal =
      state.selectedCart.addedMinutes *
      state.selectedCart.perMinutePerDay *
      (state.selectedCart.days + state.selectedCart.addedDays);
  } else {
    minsTotal =
      state.selectedCart.addedMinutes *
      state.selectedCart.perMinutePerDay *
      (state.selectedCart.days + state.selectedCart.addedDays);
    daysTotal = state.selectedCart.addedDays * state.selectedCart.pricePerDay;
  }
  document.getElementById('day-quantity-total').innerHTML = (
    daysTotal / 100
  ).toFixed(2);
  document.getElementById('mins-quantity-total').innerHTML = (
    minsTotal / 100
  ).toFixed(2);
  state.selectedCart.total =
    Number(state.selectedCart.basePrice) + daysTotal + minsTotal;
  document.getElementById('cost-with-options').innerHTML = `$${(
    state.selectedCart.total / 100
  ).toFixed(2)}`;
  document.getElementById('total-days').innerHTML = `${state.selectedCart.days +
    state.selectedCart.addedDays}`;
  document.getElementById('day-quantity').value = state.selectedCart.addedDays;
  document.getElementById('mins-quantity').value =
    state.selectedCart.addedMinutes;
  document.getElementById('minutes-per-day').innerHTML = (
    state.selectedCart.addedMinutes +
    state.selectedCart.secondsPerDay / 60
  ).toFixed(2);
  document.getElementById('cost-per-day').innerHTML = (
    state.selectedCart.total /
    100 /
    (state.selectedCart.days + state.selectedCart.addedDays)
  ).toFixed(2);
}

function hideModal() {
  let warningModal = document.getElementById('warning-modal');
  warningModal.style.display = 'none';
}
