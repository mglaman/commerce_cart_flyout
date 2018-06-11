((Backbone, Drupal) => {
  Drupal.addToCart.AddToCartModel = Backbone.Model.extend(/** @lends Drupal.cartFlyout.CartBlockModel# */{
    /**
     * @type {object}
     */
    defaults: /** @lends Drupal.commerceCart.CartBlockModel# */ {
      defaultVariation: '',
      attributes: {},
      variations: {},
    },
    getDefaultVariation() {
      return this.get('defaultVariation');
    },
    getAttributes() {
      return this.get('attributes');
    },
    getVariations() {
      return this.get('variations');
    },
    getVariation(uuid) {
      return this.attributes['variations'][uuid]
    }
  });
})(Backbone, Drupal);
