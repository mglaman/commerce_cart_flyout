/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function (Backbone, Drupal) {
  Drupal.addToCart.AddToCartModel = Backbone.Model.extend({
    defaults: {
      defaultVariation: '',
      attributes: {},
      variations: {}
    },
    getDefaultVariation: function getDefaultVariation() {
      return this.get('defaultVariation');
    },
    getAttributes: function getAttributes() {
      return this.get('attributes');
    },
    getVariations: function getVariations() {
      return this.get('variations');
    },
    getVariation: function getVariation(uuid) {
      return this.attributes['variations'][uuid];
    }
  });
})(Backbone, Drupal);