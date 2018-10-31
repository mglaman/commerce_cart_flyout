(($, _, Drupal, drupalSettings) => {
  const cache = {};
  Drupal.cartFlyout = {
    templates: {},
    models: [],
    views: [],
    offcanvas: null,
    offcanvasBackground: null,
    // @todo only require ID which loads template data from `Drupal.cartFlyout.templates[id]`
    getTemplate(data) {
      const id = data.id;
      if (!cache.hasOwnProperty(id)) {
        cache[id] = {
          render: _.template(data.data)
        };
      }
      return cache[id];
    },
    createFlyout() {
      const cartOffCanvas = document.createElement('aside');
      cartOffCanvas.id = 'cart-offcanvas';
      cartOffCanvas.classList.add('cart-offcanvas');
      cartOffCanvas.classList.add('is-closed');
      // @todo Allow customizing left/right.
      cartOffCanvas.classList.add('cart-offcanvas--right');

      const cartOffCanvasBg = document.createElement('div');
      cartOffCanvasBg.id = 'cart-offcanvas-bg';
      cartOffCanvasBg.classList.add('cart-offcanvas-bg');
      cartOffCanvasBg.classList.add('is-closed');
      cartOffCanvasBg.onclick = Drupal.cartFlyout.flyoutOffcanvasToggle;

      document.body.appendChild(cartOffCanvas);
      document.body.appendChild(cartOffCanvasBg);

      Drupal.cartFlyout.offcanvas = cartOffCanvas;
      Drupal.cartFlyout.offcanvasBackground = cartOffCanvasBg;
    },
    flyoutOffcanvasToggle() {
      Drupal.cartFlyout.offcanvas.classList.toggle('is-open')
      Drupal.cartFlyout.offcanvas.classList.toggle('is-closed')
      Drupal.cartFlyout.offcanvasBackground.classList.toggle('is-open')
      Drupal.cartFlyout.offcanvasBackground.classList.toggle('is-closed')
    },
    fetchCarts() {
      $.get(Drupal.url(`cart?_format=json`), json => {
        let count = json.reduce((previousValue, currentValue) => {
          if (drupalSettings.cartFlyout.use_quantity_count) {
            return previousValue + currentValue.order_items.reduce(
              (previousValue, currentValue) => (previousValue + parseInt(currentValue.quantity)), 0
            );
          } else {
            return previousValue + currentValue.order_items.length;
          }
        }, 0);

        _.each(Drupal.cartFlyout.models, (model) => {
          model.set('count', count);
          model.set('carts', json);
          model.trigger('cartsLoaded', model);
        });
      });
    }
  };
  Drupal.behaviors.cartFlyout = {
    attach(context) {
      Drupal.cartFlyout.templates = drupalSettings.cartFlyout.templates;
      $(context).find('.cart-flyout').once('cart-block-render').each(function () {
        Drupal.cartFlyout.createFlyout();
        const model = new Drupal.cartFlyout.CartBlockModel(
          drupalSettings.cartFlyout
        );
        Drupal.cartFlyout.models.push(model);
        const view = new Drupal.cartFlyout.CartBlockView({
          el: this,
          model,
        });
        const offcanvasView = new Drupal.cartFlyout.CartOffcanvasView({
          el: Drupal.cartFlyout.offcanvas,
          model,
        });
        Drupal.cartFlyout.views.push(view);
        Drupal.cartFlyout.views.push(offcanvasView);
        Drupal.cartFlyout.fetchCarts();
      });
    }
  };
})(jQuery, _, Drupal, drupalSettings);
