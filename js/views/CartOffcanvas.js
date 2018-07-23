/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function (Backbone, Drupal) {
  Drupal.cartFlyout.CartOffcanvasView = Backbone.View.extend({
    initialize: function initialize() {
      this.listenTo(this.model, 'cartsLoaded', this.render);
    },

    events: {
      'click .cart-block--offcanvas-cart-table__remove button': 'removeItem',
      'click .cart--cart-offcanvas__close button': 'closeOffCanvas'
    },
    closeOffCanvas: function closeOffCanvas() {
      Drupal.cartFlyout.flyoutOffcanvasToggle();
    },
    removeItem: function removeItem(e) {
      e.preventDefault();
      var target = JSON.parse(e.currentTarget.value);
      var endpoint = Drupal.url('cart/' + target[0] + '/items/' + target[1] + '?_format=json');
      fetch(endpoint, {
        credentials: 'include',
        method: 'delete'
      }).then(function (res) {}).then(function () {
        return Drupal.cartFlyout.fetchCarts();
      });
    },
    render: function render() {
      var template = Drupal.cartFlyout.getTemplate({
        id: 'commerce_cart_flyout_offcanvas',
        data: Drupal.cartFlyout.templates.offcanvas
      });
      this.$el.html(template.render({
        count: this.model.getCount(),
        links: this.model.getLinks()
      }));
      var contents = new Drupal.cartFlyout.CartContentsView({
        el: this.$el.find('.cart-block--offcanvas-contents__items'),
        model: this.model
      });
      contents.render();
    }
  });
  Drupal.cartFlyout.CartContentsView = Backbone.View.extend({
    render: function render() {

      var template = Drupal.cartFlyout.getTemplate({
        id: 'commerce_cart_flyout_offcanvas_contents',
        data: Drupal.cartFlyout.templates.offcanvas_contents
      });
      this.$el.html(template.render({
        carts: this.model.getCarts()
      }));

      this.$el.find('[data-cart-contents]').each(function () {
        var contents = new Drupal.cartFlyout.CartContentsItemsView({
          el: this,
          model: Drupal.cartFlyout.model
        });
        contents.render();
      });
    }
  });
  Drupal.cartFlyout.CartContentsItemsView = Backbone.View.extend({
    cart: {},
    initialize: function initialize() {
      this.cart = this.$el.data('cart-contents');
    },

    events: {
      'change .cart-block--offcanvas-cart-table__quantity input[type="number"]': 'onQuantityChange',
      'blur .cart-block--offcanvas-cart-table__quantity input[type="number"]': 'doUpdateCart',
      'keypress .cart-block--offcanvas-cart-table__quantity input[type="number"]': 'onKeypress',
      'click .cart-block--offcanvas-contents__update': 'onUpdateCart'
    },
    onQuantityChange: function onQuantityChange(e) {
      var targetDelta = e.target.dataset.key;
      var value = e.target.value >= 1 ? e.target.value : "1.00";
      this.cart.order_items[targetDelta].quantity = parseInt(value);
    },
    onUpdateCart: function onUpdateCart(event) {
      event.preventDefault();
      this.doUpdateCart();
    },
    onKeypress: function onKeypress(event) {
      if (event.keyCode === 13) {
        event.target.blur();
      }
    },
    doUpdateCart: function doUpdateCart() {
      var endpoint = Drupal.url('cart/' + this.cart.order_id + '/items?_format=json');

      var body = {};
      for (var index = 0; index < this.cart.order_items.length; index++) {
        var orderItem = this.cart.order_items[index];
        body[orderItem.order_item_id] = {
          quantity: orderItem.quantity
        };
      }

      fetch(endpoint, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },

        method: 'PATCH',
        body: JSON.stringify(body)
      }).then(function (res) {}).then(function () {
        return Drupal.cartFlyout.fetchCarts();
      });
    },
    render: function render() {
      var template = Drupal.cartFlyout.getTemplate({
        id: 'commerce_cart_flyout_offcanvas_contents_items',
        data: Drupal.cartFlyout.templates.offcanvas_contents_items
      });
      this.$el.html(template.render({
        cart: this.cart
      }));
    }
  });
})(Backbone, Drupal);