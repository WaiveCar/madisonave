(function() {
  let cart = null;
  let sessionId = sessionStorage.getItem('sessionId');
  axios
    .get(
      '/prev_cart',
      sessionId && {
        headers: {'Session-Id': sessionId},
      },
    )
    .then(result => {
      cart = result.data;
      console.log('cart: ', cart);
    })
    .catch(e => (window.location = '/'));
})();
