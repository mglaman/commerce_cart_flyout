/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, _, Drupal, drupalSettings) {
  Drupal.addToCart = {};
  Drupal.behaviors.addToCart = {
    attach: function attach(context) {
      $(context).find('[data-product]').once('flyout-add-to-cart').each(function (k, el) {
        var model = new Drupal.addToCart.AddToCartModel(drupalSettings.addToCart[el.dataset.product]);
        var view = new Drupal.addToCart.AddToCartView({
          el: el,
          model: model
        });
      });
    }
  };
})(jQuery, _, Drupal, drupalSettings);