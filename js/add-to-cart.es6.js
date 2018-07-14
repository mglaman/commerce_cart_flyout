(($, _, Drupal, drupalSettings) => {
  Drupal.theme.addToCartButton = () => {
    return drupalSettings.theme.commerce_cart_flyout_add_to_cart_button
  };
  Drupal.theme.addToCartAttributesSelect = ((_) => (args) => {
    const template = _.template(drupalSettings.theme.commerce_cart_flyout_add_to_cart_attributes_select);
    return template(args);
  })(_);
  Drupal.theme.addToCartAttributesRadios = ((_) => (args) => {
    const template = _.template(drupalSettings.theme.commerce_cart_flyout_add_to_cart_attributes_radios);
    return template(args);
  })(_);
  Drupal.theme.addToCartAttributesRendered = ((_) => (args) => {
    const template = _.template(drupalSettings.theme.commerce_cart_flyout_add_to_cart_attributes_rendered);
    return template(args);
  })(_);

  Drupal.addToCart = {};
  Drupal.behaviors.addToCart = {
    attach(context) {
      $(context).find('[data-product]').once('flyout-add-to-cart').each((k,el) => {
        const model = new Drupal.addToCart.AddToCartModel(
          drupalSettings.addToCart[el.dataset.product]
        );
        new Drupal.addToCart.AddToCartView({el, model})
      });
    }
  }
})(jQuery, _, Drupal, drupalSettings);
