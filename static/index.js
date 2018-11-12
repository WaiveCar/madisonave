var state = {};

axios
  .get('/splash_resources')
  .then(function(response) {
    var parser = new DOMParser();
    state.locationData = response.data;
    response.data.popularLocations.forEach(function(option, index) {
      var htmlString = parser.parseFromString(
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
      var parentNode = document.getElementById('popular-list');
      parentNode.append(htmlString);
    });
    console.log('state: ', state);
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
//This will eventually need to get real amounts based demand, but for now will show something
var enteredAmount = document.getElementById('desired-price');
enteredAmount.addEventListener('change', function(e) {
  console.log(e.target.value);
});

var optionCards = document.getElementById('option-cards');
function calculateOptions() {
  optionCards.style.visibility = 'visible';
  getFormData();
}

function getFormData() {
  let currentChecked = document.querySelector(
    'input[name="popular-location"]:checked',
  );
  if (!currentChecked) {
    alert('Please select a loction');
    return;
  }
  console.log(currentChecked.value);
  var formData = new FormData(document.querySelector('form'));
  return formData;
}
