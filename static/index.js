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
    response.data.popularLocations.forEach((option, index) => {
      let html = parser.parseFromString(
        '\
      <div class="card text-center"> \
        <img class="location-image" src="assets/' +
          option.image +
          '"> \
        <label for="' +
          index +
          '">' +
          option.name +
          '</label>\
        <div class="pb-2">\
          <input type="radio" name="popular-location" value="' +
          option.name +
          '"> \
        </div> \
      </div>',
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
  reader.onload = (e) => {
    let previewImage = document.getElementById('preview-image');
    previewImage.src = e.target.result;
    previewImage.style.visibility = 'visible';
    document.getElementById('upload-holder').style.display = 'none';
  };
  reader.readAsDataURL(uploadInput.files[0]);
});

document.addEventListener('keypress', e => {
  e.keyCode === 13 && e.preventDefault();
});

let enteredAmount = document.getElementById('desired-price');
enteredAmount.addEventListener('change', (e) => {
  state.currentDesiredPrice = Number(e.target.value) * 100;
});

function getCarts(price, multiplier) {
  let carts = [];
  let pricePerSecond = (200 / 60) * multiplier; // $1 per 30 Seconds
  let totalSeconds = price / pricePerSecond;
  carts.push({
    days: 1,
    secondsPerDay: totalSeconds,
    pricePerDay: price,
    options: [],
    price: price,
  });
  carts.push({
    days: 7,
    secondsPerDay: Math.floor(totalSeconds / 7),
    pricePerDay: price / 7,
    option: [],
    price: price,
  });
  carts.push({
    days: 30,
    pricePerDay: price / 30,
    secondsPerDay: Math.floor(totalSeconds / 30),
    option: [],
    price: price,
  });
  return carts;
}

function calculateOptions() {
  let currentChecked = document.querySelector(
    'input[name="popular-location"]:checked',
  );
  if (!currentChecked) {
    alert('Please select a loction');
    return;
  }
  if (!state.currentDesiredPrice) {
    alert('Please select a price');
    return;
  }
  let optionCards = document.getElementById('option-cards');
  while (optionCards.firstChild) {
    optionCards.removeChild(optionCards.firstChild);
  }
  let currentMultiplier = state.allLocations.find(item => {
    return item.name === currentChecked.value;
  }).multiplier;
  state.currentCarts = getCarts(state.currentDesiredPrice, currentMultiplier);
  state.currentCarts.forEach((option, index) => {
    let html = parser.parseFromString(
      '\
      <div class="card text-center mt-2"> \
        <label for="' +
        index +
        '"> Option ' +
        (index + 1) +
        ' <div class="mt-2"> \
      ' +
        option.days +
        (option.days > 1 ? ' Days' : ' Day') +
        ' \
      </div>\
      <div class="mt-2"> \
      ' +
        (option.secondsPerDay / 60).toFixed(2) +
        ' Minutes A Day\
      </div> \
      <div class="mt-2"> \
      $' +
        (option.pricePerDay / 100).toFixed(2) +
        ' Dollars Per Day\
      </div> \
      </label>\
        <div class="pb-2"> \
          <input type="radio" name="cart-options" value="' +
        (index) +
        '"> \
        </div> \
      </div> \
      ',
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
  });
}

