/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, _, Drupal, drupalSettings) {
  Drupal.theme.addToCartButton = function () {
    return drupalSettings.theme.commerce_cart_flyout_add_to_cart_button;
  };
  Drupal.theme.addToCartAttributesSelect = function (_) {
    return function (args) {
      var template = _.template(drupalSettings.theme.commerce_cart_flyout_add_to_cart_attributes_select);
      return template(args);
    };
  }(_);
  Drupal.theme.addToCartAttributesRadios = function (_) {
    return function (args) {
      var template = _.template(drupalSettings.theme.commerce_cart_flyout_add_to_cart_attributes_radios);
      return template(args);
    };
  }(_);
  Drupal.theme.addToCartAttributesRendered = function (_) {
    return function (args) {
      var template = _.template(drupalSettings.theme.commerce_cart_flyout_add_to_cart_attributes_rendered);
      return template(args);
    };
  }(_);

  Drupal.addToCart = {};
  Drupal.behaviors.addToCart = {
    attach: function attach(context) {
      $(context).find('[data-product]').once('flyout-add-to-cart').each(function (k, el) {
        var model = new Drupal.addToCart.AddToCartModel(drupalSettings.addToCart[el.dataset.product]);
        new Drupal.addToCart.AddToCartView({ el: el, model: model });
      });
    }
  };
})(jQuery, _, Drupal, drupalSettings);