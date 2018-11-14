let state = {};
let parser = new DOMParser();

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
  let priceInput = document.getElementById('desired-price');
  priceInput.value = value / 100;
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
    return;
  }
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
            ${(option.secondsPerDay / 60).toFixed(2)}
            Minutes per day
          </div>
          <div class="mt-2">
            $${(option.pricePerDay / 100).toFixed(2)} per day
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
  optionCards.style.visibility = 'visible';
  optionCards.addEventListener('change', () => {
    let currentChecked = document.querySelector(
      'input[name="cart-options"]:checked',
    );
    state.selectedCart = state.currentCarts[currentChecked.value];
    console.log(state.selectedCart);
    let addOns = document.getElementById('add-ons');
    addOns.removeChild(addOns.firstChild)
    let html = parser.parseFromString(
      `
      <table class="table table-bordered table-hover">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Price</th>
            <th scope="col">Quantity</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td scope="row">Extra Minutes Per Day</td>
            <td>${(state.selectedCart.perMinutePerDay / 100).toFixed(2)}</td>
            <td>
              <input class="col-2" "type="number" "min="0" id="min-quantity" oninput="changeOptions(this.value, 'addedMinutes', this.id)">
            </td>
            <td id="min-quantity-total">$0.00</td>
          </tr>
          <tr>
            <td scope="row">Extra Days</td>
            <td>${(state.selectedCart.pricePerDay / 100).toFixed(2)}</td>
            <td>
              <input class="col-2" "type="number" "min="0" id="day-quantity" oninput="changeOptions(this.value, 'addedDays', this.id)">
            </td>
            <td id="day-quantity-total">$0.00</td>
          </tr>
        </tbody>
      </table>`,
      'text/html',
    ).body.firstChild;
    addOns.append(html);
  });
}

function changeOptions(count, propToUpdate, id) {
  state.selectedCart[propToUpdate] = Number(count);
  if (propToUpdate === 'addedMinutes') {
    console.log('addedMinutes!');
    document.getElementById(id + '-total').innerHTML = `$${(((state.selectedCart.addedMinutes * state.selectedCart.perMinutePerDay) * (state.selectedCart.days + state.selectedCart.addedDays)) / 100).toFixed(2)}`;
  }
  console.log(state.selectedCart);
}

function hideModal() {
  let warningModal = document.getElementById('warning-modal');
  warningModal.style.display = 'none';
}
