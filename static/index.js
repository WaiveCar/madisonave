let state = {};
let parser = new DOMParser();

axios
  .get('/splash_resources')
  .then(response => {
    state.locationData = response.data;
    state.allLocations = response.data.popularLocations.concat(
      response.data.cheapLocations,
    );
    let parentNode = document.getElementById('popular-list');
    response.data.popularLocations.forEach((option, i) => {
      let html = parser.parseFromString(
        `
      <div class="card text-center">
        <img class="location-image" src="assets/${option.image}">
        <label for="${i}">
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

function scrollDown() {
  let scrollStart = window.pageYOffset;
  window.scrollTo({
    top: scrollStart + 500,
    behavior: 'smooth',
  });
}

document.getElementById('popular-list').addEventListener('change', e => {
  scrollDown();
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
    color: 'light',
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
    color: 'warning',
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
    color: 'secondary',
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
      <div class="card text-center mt-2 bg-${option.color} text-info">
        <div class="card-header">
          <h5 class="card-title">
           <label>
              ${option.days}
              ${option.days > 1 ? ' Days' : ' Day'}
            </label>
          </h5>
        </div>
        <div class="card-body">
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
      <div>
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
                <input type="number" "min="0" id="day-quantity" oninput="updateCart(true, 'addedDays', this.value)">
              </td>
              <td id="day-quantity-total">$0.00</td>
            </tr>
            <tr>
              <td scope="row">Extra Minutes Per Day</td>
              <td>${(state.selectedCart.perMinutePerDay / 100).toFixed(2)}</td>
              <td>
                <input type="number" "min="0" id="mins-quantity" oninput="updateCart(false, 'addedMinutes', this.value)">
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
        </table>
        <div class="row justify-content-md-center mt-5">
          <div id="paypal-button-container"></div>
          <!--<button class="btn btn-primary" type="button" onclick="submitCart()">Purchase Now!</button>-->
        </div>
      </div>`,
      'text/html',
    ).body.firstChild;
    addOns.append(html);
    updateCart();
    paypal.Button.render(
      {
        env: 'sandbox', // sandbox | production
        // Create a PayPal app: https://developer.paypal.com/developer/applications/create
        client: {
          sandbox:
            'ARrHtZndH9dLcfMG3bzxFAAtY6fCZcJ7EZcPzdDZ9Zg5tPznHAN2TTEoQ0rL_ijpDPOdzvPhMnayZf4p',
          production: '<insert production client id>',
        },
        // Show the buyer a 'Pay Now' button in the checkout flow
        commit: true,
        // payment() is called when the button is clicked
        payment: function(data, actions) {
          // Make a call to the REST api to create the payment
          return actions.payment.create({
            payment: {
              transactions: [
                {
                  amount: {
                    total: String((state.selectedCart.total / 100).toFixed(2)),
                    currency: 'USD',
                  },
                },
              ],
            },
          });
        },
        // onAuthorize() is called when the buyer approves the payment
        onAuthorize: function(data, actions) {
          // Make a call to the REST api to execute the payment
          return actions.payment
            .execute()
            .then(function() {
              return actions.payment.get().then(function(order) {
                console.log('cart: ', state.selectedCart);
                console.log('data', data);
                console.log('order: ', order.payer);
                let formData = new FormData();
                formData.append('file', uploadInput.files[0]);
                formData.set('cart', JSON.stringify(state.selectedCart));
                formData.set('payer', order.payer);
                formData.set('paymentInfo', data);
                axios({
                  method: 'post',
                  url: '/purchase',
                  data: formData,
                  config: {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                    },
                  },
                }).then(response => {
                  console.log('response');
                  //                  window.location = response.data.location;
                });
              });
            })
            .catch(e => console.log('error in request: ', e));
        },
      },
      '#paypal-button-container',
    );
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
  console.log(state.selectedCart);
}

function hideModal() {
  let warningModal = document.getElementById('warning-modal');
  warningModal.style.display = 'none';
}

