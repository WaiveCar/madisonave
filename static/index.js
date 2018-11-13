var state = {};
var parser = new DOMParser();

axios
  .get('/splash_resources')
  .then(function(response) {
    state.locationData = response.data;
    state.allLocations = response.data.popularLocations.concat(
      response.data.cheapLocations,
    );
    var parentNode = document.getElementById('popular-list');
    response.data.popularLocations.forEach(function(option, index) {
      var html = parser.parseFromString(
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
  .catch(function(err) {
    console.log('error: ', err);
  });

var uploadInput = document.getElementById('image-upload');
uploadInput.addEventListener('change', function() {
  var reader = new FileReader();
  reader.onload = function(e) {
    var previewImage = document.getElementById('preview-image')
    previewImage.src = e.target.result;
    previewImage.style.visibility = 'visible';
    document.getElementById('upload-holder').style.display = 'none';
  };
  reader.readAsDataURL(uploadInput.files[0]);
});

document.addEventListener('keypress', function(e) {
  e.keyCode === 13 && e.preventDefault();
});

var enteredAmount = document.getElementById('desired-price');
enteredAmount.addEventListener('change', function(e) {
  state.currentDesiredPrice = Number(e.target.value) * 100;
});

function getCarts(price, multiplier) {
  let carts = [];
  console.log('price: ', price);
  console.log('multiplier: ', multiplier);
  let totalSeconds = price / 100 * 30 / multiplier;
  console.log('totalSeconds: ', totalSeconds);
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
    pricePerDay: (price / 7).toFixed(2),
    option: [],
    price: price,
  });
  carts.push({
    days: 30,
    pricePerDay: (price / 30).toFixed(2),
    secondsPerDay: Math.floor(totalSeconds / 30),
    option: [],
    price: price,
  });
  return carts;
}

function calculateOptions() {
  var currentChecked = document.querySelector(
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
  var optionCards = document.getElementById('option-cards');
  while (optionCards.firstChild) {
    optionCards.removeChild(optionCards.firstChild);
  }
  let currentMultiplier = state.allLocations.find(function(item) {
    return item.name === currentChecked.value;
  }).multiplier;
  state.currentCarts = getCarts(state.currentDesiredPrice, currentMultiplier);
  state.currentCarts.forEach(function(option, index) {
    var html = parser.parseFromString(
      '\
      <div class="card text-center"> \
        <label for="' +
        index +
        '"> Option ' +
        (index + 1) +
        ' <div> \
      ' +
        option.days +
        (option.days > 1 ? ' Days' : ' Day') +
        ' \
      </div>\
      <div> \
      ' + (option.secondsPerDay / 60).toFixed(2) + ' Minutes A Day\
      </div> \
      <div> \
      $' + (option.pricePerDay / 100).toFixed(2) + ' Dollars Per Day\
      </div> \
      </label>\
        <div class="pb-2"> \
          <input type="radio" name="cart-options" value="option-' +
        (index + 1) +
        '"> \
        </div> \
      </div> \
      ',
      'text/html',
    ).body.firstChild;
    optionCards.append(html);
  });
  optionCards.style.visibility = 'visible';
  console.log(currentChecked.value);
  console.log(state);
}
