function selectLocation(what) {
  $(what).siblings().removeClass('checked');
  $(what).addClass('checked');
  $("input", what).prop('checked', true);
}

(function() {
  function price(amount) {
    return '$' + (parseInt(amount, 10)/100).toFixed(2);
  }
  // This 'state' is used to store anything that is needed within this scope
  let state = {};
  let parser = new DOMParser();
  let sessionId = sessionStorage.getItem('sessionId');
  // This call to the api fetches the locations that are currently popular and sends the
  // sessionId/quoteId if there is one. The sessionId is not currently used here, but is
  // used by the server and could be used to reload previous inputs by the user. These previous
  // inputs are already cached by the server
  axios
    .get('/splash_resources', sessionId && {headers: {'Session-Id': sessionId}})
    .then(response => {
      if (response.headers['session-id'] !== sessionId) {
        sessionStorage.setItem('sessionId', response.headers['session-id']);
      }
      state.allLocations = response.data.popularLocations.concat(
        response.data.cheapLocations,
      );
      let parentNode = document.getElementById('popular-list');
      // The code below generates the html that gives the user options for different
      // popular locations
      response.data.popularLocations.forEach((option, i) => {
        let checked = (i == 1) ? 'checked' : '';
        let html = parser.parseFromString(
          `
      <div onclick="selectLocation(this)" class="card text-center ${checked}">
        <img class="location-image" src="assets/${option.image}">
        <label for="${option.name}">${option.label}</label>
        <input type="radio" name="popular-location" ${checked} value="${option.name}">
      </div>`,
          'text/html',
        ).body.firstChild;
        parentNode.append(html);
      });
    })
    .catch(err => {
      console.log('error: ', err);
    });
  // This makes it so that if a location is selected, the page automatically scrolls
  // to the next section
  /*
  document.getElementById('popular-list').addEventListener('change', e => {
    scrollDown();
  });
  */

  let modalClosers = document.getElementsByClassName('modal-close');
  Array.prototype.forEach.call(modalClosers, el => {
    el.addEventListener('click', () => {
      hideModal();
    });
  });

  // The event handler below handles the user uploading new files
  let uploadInput = document.getElementById('image-upload');
  uploadInput.addEventListener('change', () => {
    let reader = new FileReader();
    reader.onload = e => {
      let previewImage = document.getElementById('preview-image');
      previewImage.src = e.target.result;
      previewImage.style.visibility = 'visible';
      document.getElementById('upload-holder').style.display = 'none';
      //scrollDown();
    };
    reader.readAsDataURL(uploadInput.files[0]);
  });

  let options = document.getElementsByClassName('popular-option');
  Array.prototype.forEach.call(options, el => {
    el.addEventListener('click', () => {
      calculateOptions(el.value);
    });
  });
  let priceInput = document.getElementById('desired-price');
  let to;
  priceInput.addEventListener('input', e => {
    if(to) {
      clearTimeout(to);
    }
    to = setTimeout(function() {
      calculateOptions(priceInput.value * 100);
    }, 300);
  });
  // The function below gets a user's options based on their inputs and then adds elements
  // displaying them to the page
  setTimeout(function(){
    calculateOptions(100 * 100);
  });
  function calculateOptions(value) {
    let warningModal = document.getElementById('warning-modal');
    let warningModalText = document.getElementById('warning-modal-text');
    let currentChecked = document.querySelector(
      'input[name="popular-location"]:checked',
    );
    /*
    let optionCards = document.getElementById('option-cards');
    // If there are old options being displayed, they need to be removed before the new ones can be displayed
    while (optionCards.firstChild) {
      optionCards.removeChild(optionCards.firstChild);
    }
    */
    let priceInput = document.getElementById('desired-price');
    priceInput.value = value / 100;
    let addOns = document.getElementById('add-ons');
    let locationId = state.allLocations.find(item => {
      return item.name === currentChecked.value;
    }).id;
    // This request fetches options from the server. Currently, static data is sent over
    // but in the future, the server will be able to calculate different options based on
    // usage, popularity of locations and other factors
    //$("#empty-text").hide();
    axios
      .get(
        `/deal?zone=${locationId}&price=${priceInput.value *
          100}&quoteId=${sessionStorage.getItem('sessionId')}&splash=true`,
      )
      .then(response => {
        $("#amount").html(price(response.data.amount));
        state.currentCarts = response.data.quotes;
        // This renders the list of options
        /*
        state.currentCarts.forEach((option, index) => {
          let html = parser.parseFromString(
            `
      <div class="card pricing-option mt-2">
        <div class="card-header text-center">
          <h4 class="card-title">
            ${option.title}
          </h4>
        </div>
        <div class="card-body">
          <ul>
          <li>
            $${(option.pricePerDay / 100).toFixed(2)} per day
          </li>
          <li>
            ${(option.secondsPerDay / 60).toFixed(2)}
            Minutes per day
          </li>
          </ul>
        </div>
        <div class="card-footer pb-2 text-center">
          <button type="button" class="btn btn-secondary">${option.action}</button>
        </div>
      </div>
      `,
            'text/html',
          ).body.firstChild;
          optionCards.append(html);
        });
        */
        //optionCards.style.visibility = 'visible';
        // This event listener handles selecting of different carts and rendering of 
        // the table for adding options
        
        {
          let currentChecked = document.querySelector(
            'input[name="cart-options"]:checked',
          );
          let addOns = document.getElementById('add-ons');
          addOns.firstChild && addOns.removeChild(addOns.firstChild);
          updateCart();
          paypal.Button.render(
            {
              env: 'sandbox', // sandbox | production
              // Create a PayPal app: https://developer.paypal.com/developer/applications/create
              client: {
                sandbox:
                // Currently, this is a code for my personal paypal account and definitely will need to be changed
                  'ARrHtZndH9dLcfMG3bzxFAAtY6fCZcJ7EZcPzdDZ9Zg5tPznHAN2TTEoQ0rL_ijpDPOdzvPhMnayZf4p',
                // A valid key will need to be added below for payment to work in production
                production: '<insert production client id>',
              },
              // Show the buyer a 'Pay Now' button in the checkout flow
              commit: true,
              // payment() is called when the button is clicked
              payment: (data, actions) => {
                // Before the payment is processed by paypal, a user's purchase is sent to the server with 
                // the information that has so far been obtained including the picture.
                let formData = new FormData();
                formData.append('file', uploadInput.files[0]);
                formData.append('cart', JSON.stringify(state.selectedCart));
                formData.append('quoteId', sessionStorage.getItem('sessionId'));
                return axios({
                  method: 'post',
                  url: '/capture',
                  data: formData,
                  config: {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                    },
                  },
                }).then(resp => {
                  // Make a call to the REST api to create the payment
                  return actions.payment.create({
                    payment: {
                      transactions: [
                        {
                          amount: {
                            total: String(
                              (state.selectedCart.total / 100).toFixed(2),
                            ),
                            currency: 'USD',
                          },
                        },
                      ],
                    },
                  });
                });
              },
              // onAuthorize() is called when the buyer approves the payment
              onAuthorize: (data, actions) => {
                // Make a call to the REST api to execute the payment
                // This happens when the payment to paypal is completed 
                return actions.payment
                  .execute()
                  .then(() => {
                    return actions.payment.get().then(order => {
                      // Once the payment is completed, the payment information is fetched and then sent to the server
                      // so that it can be stored in the database for future use
                      let formData = new FormData();
                      formData.append('file', uploadInput.files[0]);
                      formData.append(
                        'cart',
                        JSON.stringify(state.selectedCart),
                      );
                      formData.append('payer', JSON.stringify(order.payer));
                      formData.append('paymentInfo', JSON.stringify(data));
                      axios({
                        method: 'put',
                        url: '/capture',
                        data: {
                          quoteId: sessionStorage.getItem('sessionId'),
                          payer: JSON.stringify(order.payer),
                          paymentInfo: JSON.stringify(data),
                        },
                      }).then(response => {
                        window.location = response.data.location;
                      });
                    });
                  })
                  .catch(e => console.log('error in request: ', e));
              },
            },
            '#paypal-button-container',
          );
          let scrollStart = window.pageYOffset;
          //scrollDown();
        }
        //scrollDown();
      });
  }

  // This function updates the cart based on the additional days and minutes that the user has selected
  function updateCart(isAddedDays, propToUpdate, val) {
    // The isAddedDays argument is a boolean that tells this function whether it is updating the 
    // additional days or additional minutes option
    if (val) {
      state.selectedCart[propToUpdate] = Number(val);
    }
  }

  // This is a utility function that is only used for hiding the modal when the two different buttons 
  // for closing the modal are clicked
  function hideModal() {
    let warningModal = document.getElementById('warning-modal');
    warningModal.style.display = 'none';
  }
  
  // This is a utility function that scrolls down. The expected behavior is that it scrolls to the 
  // current bottom of the page from wherever it is called
})();
