((Backbone, Drupal) => {
    Drupal.cartFlyout.CartOffcanvasView = Backbone.View.extend(/** @lends Drupal.cartFlyout.CartOffcanvasView# */{
        initialize() {
            this.listenTo(this.model, 'cartsLoaded', this.render);
        },
        events: {
          'click .cart-block--offcanvas-cart-table__remove button': 'removeItem',
          'click .cart--cart-offcanvas__close button': 'closeOffCanvas',
        },
        closeOffCanvas() {
          Drupal.cartFlyout.flyoutOffcanvasToggle();
        },
        removeItem(e) {
          e.preventDefault();
          const target = JSON.parse(e.currentTarget.value);
          const endpoint = Drupal.url(`cart/${target[0]}/items/${target[1]}?_format=json`);
          fetch(endpoint, {
            // By default cookies are not passed, and we need the session cookie!
            credentials: 'include',
            method: 'delete'
          })
            .then((res) => {})
            .then(() => Drupal.cartFlyout.fetchCarts());
        },
        /**
         * @inheritdoc
         */
        render() {

          // @todo create a new View, or move `cart--cart-offcanvas`
          // This would allow us to use Twig since we do not need condiitonals.
          const template = Drupal.cartFlyout.getTemplate({
            id: 'commerce_cart_flyout_offcanvas',
            data: Drupal.cartFlyout.templates.offcanvas,
          });
          this.$el.html(template.render({
            count: this.model.getCount(),
            links: this.model.getLinks(),
          }));
          const contents = new Drupal.cartFlyout.CartContentsView({
            el: this.$el.find('.cart-block--offcanvas-contents__items'),
            model: this.model
          });
          contents.render();
        },
      });
      Drupal.cartFlyout.CartContentsView = Backbone.View.extend(/** @lends Drupal.cartFlyout.CartContentsView# */{
        /**
         * @inheritdoc
         */
        render() {

          const template = Drupal.cartFlyout.getTemplate({
            id: 'commerce_cart_flyout_offcanvas_contents',
            data: Drupal.cartFlyout.templates.offcanvas_contents
          });
          this.$el.html(template.render({
            carts: this.model.getCarts(),
          }));

          // @todo Cart model and Collection.
          this.$el.find('[data-cart-contents]').each(function () {
            let contents = new Drupal.cartFlyout.CartContentsItemsView({
              el: this,
              model: Drupal.cartFlyout.model
            });
            contents.render();
          });
        },
      });
      Drupal.cartFlyout.CartContentsItemsView = Backbone.View.extend(/** @lends Drupal.cartFlyout.CartContentsItemsView# */{
        cart: {},
        initialize() {
          this.cart = this.$el.data('cart-contents');
        },
        events: {
          'change .cart-block--offcanvas-cart-table__quantity input[type="number"]': 'onQuantityChange',
          'blur .cart-block--offcanvas-cart-table__quantity input[type="number"]': 'doUpdateCart',
          'click .cart-block--offcanvas-contents__update': 'onUpdateCart'
        },
        onQuantityChange(e) {
          const targetDelta = e.target.dataset.key;
          const value = e.target.value;
          this.cart.order_items[targetDelta].quantity = parseInt(value);
        },
        onUpdateCart(event) {
          event.preventDefault();
          this.doUpdateCart();
        },
        doUpdateCart() {
          const endpoint = Drupal.url(`cart/${this.cart.order_id}/items?_format=json`);

          const body = {};
          for (let index = 0; index < this.cart.order_items.length; index++) {
            let orderItem = this.cart.order_items[index];
            body[orderItem.order_item_id] = {
              quantity: orderItem.quantity,
            }
          }

          fetch(endpoint, {
            // By default cookies are not passed, and we need the session cookie!
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            // Shout PATCH, see https://github.com/github/fetch/issues/254
            method: 'PATCH',
            body: JSON.stringify( body )
          })
            .then((res) => {})
            .then(() => Drupal.cartFlyout.fetchCarts());
        },
        /**
         * @inheritdoc
         */
        render() {
          const template = Drupal.cartFlyout.getTemplate({
            id: 'commerce_cart_flyout_offcanvas_contents_items',
            data: Drupal.cartFlyout.templates.offcanvas_contents_items
          });
          this.$el.html(template.render({
            cart: this.cart
          }));
        },
      });
})(Backbone, Drupal);
