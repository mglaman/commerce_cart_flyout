/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, _, Drupal, drupalSettings) {
  var cache = {};
  Drupal.cartFlyout = {
    templates: {},
    models: [],
    views: [],
    offcanvas: null,
    offcanvasBackground: null,
    getTemplate: function getTemplate(data) {
      var id = data.id;
      if (!cache.hasOwnProperty(id)) {
        cache[id] = {
          render: _.template(data.data)
        };
      }
      return cache[id];
    },
    createFlyout: function createFlyout() {
      var cartOffCanvas = document.createElement('aside');
      cartOffCanvas.id = 'cart-offcanvas';
      cartOffCanvas.classList.add('cart-offcanvas');
      cartOffCanvas.classList.add('is-closed');

      cartOffCanvas.classList.add('cart-offcanvas--right');

      var cartOffCanvasBg = document.createElement('div');
      cartOffCanvasBg.id = 'cart-offcanvas-bg';
      cartOffCanvasBg.classList.add('cart-offcanvas-bg');
      cartOffCanvasBg.classList.add('is-closed');
      cartOffCanvasBg.onclick = Drupal.cartFlyout.flyoutOffcanvasToggle;

      document.body.appendChild(cartOffCanvas);
      document.body.appendChild(cartOffCanvasBg);

      Drupal.cartFlyout.offcanvas = cartOffCanvas;
      Drupal.cartFlyout.offcanvasBackground = cartOffCanvasBg;
    },
    flyoutOffcanvasToggle: function flyoutOffcanvasToggle() {
      Drupal.cartFlyout.offcanvas.classList.toggle('is-open');
      Drupal.cartFlyout.offcanvas.classList.toggle('is-closed');
      Drupal.cartFlyout.offcanvasBackground.classList.toggle('is-open');
      Drupal.cartFlyout.offcanvasBackground.classList.toggle('is-closed');
    },
    fetchCarts: function fetchCarts() {
      var data = fetch(Drupal.url('cart?_format=json'), {
        credentials: 'include'
      });
      data.then(function (res) {
        return res.json();
      }).then(function (json) {
        var count = 0;
        for (var i in json) {
          count += json[i].order_items.length;
        }
        _.each(Drupal.cartFlyout.models, function (model) {
          model.set('count', count);
          model.set('carts', json);
          model.trigger('cartsLoaded', model);
        });
      });
    }
  };
  Drupal.behaviors.cartFlyout = {
    attach: function attach(context) {
      Drupal.cartFlyout.templates = drupalSettings.cartFlyout.templates;
      $(context).find('.cart-flyout').once('cart-block-render').each(function () {
        Drupal.cartFlyout.createFlyout();
        var model = new Drupal.cartFlyout.CartBlockModel(drupalSettings.cartFlyout);
        Drupal.cartFlyout.models.push(model);
        var view = new Drupal.cartFlyout.CartBlockView({
          el: this,
          model: model
        });
        var offcanvasView = new Drupal.cartFlyout.CartOffcanvasView({
          el: Drupal.cartFlyout.offcanvas,
          model: model
        });
        Drupal.cartFlyout.views.push(view);
        Drupal.cartFlyout.views.push(offcanvasView);
        Drupal.cartFlyout.fetchCarts();
      });
    }
  };
})(jQuery, _, Drupal, drupalSettings);