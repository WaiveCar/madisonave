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
    document.getElementById('preview-image').src = e.target.result;
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
  [1, 2, 3].forEach(function(option, index) {
    var html = parser.parseFromString(
      '\
      <div class="card text-center"> \
        <label for="' +
        index +
        '"> Option ' +
        (index + 1) +
        '</label>\
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
