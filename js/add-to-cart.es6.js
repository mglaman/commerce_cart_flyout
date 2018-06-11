(($, _, Drupal, drupalSettings) => {
  Drupal.addToCart = {};
  Drupal.behaviors.addToCart = {
    attach(context) {
      $(context).find('[data-product]').once('flyout-add-to-cart').each((k,el) => {
        const model = new Drupal.addToCart.AddToCartModel(
          drupalSettings.addToCart[el.dataset.product]
        );
        const view = new Drupal.addToCart.AddToCartView({
          el,
          model
        })
      });
    }
  }
})(jQuery, _, Drupal, drupalSettings);
