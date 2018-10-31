((Backbone, Drupal) => {
  Drupal.addToCart.AddToCartModel = Backbone.Model.extend(/** @lends Drupal.addToCart.AddToCartModel# */{
    defaults: {
      defaultVariation: '',
      attributes: {},
      renderedAttributes: {},
      injectedFields: {},
      variations: {},
      variationCount: 0,
    },
    initialize() {
      this.set('variationCount', Object.keys(this.get('variations')).length);
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
    },
    getResolvedVariation(selectedAttributes) {
      return Object.keys(this.getVariations()).map(key => this.getVariation(key)).filter(variation => {
        return this.getAttributes().every(attribute => {
          let fieldName = 'attribute_' + attribute.id;
          return variation.hasOwnProperty(fieldName) && (variation[fieldName].toString() === selectedAttributes[fieldName].toString());
        });
      }).shift();
    },
    getVariationCount() {
      return this.get('variationCount');
    },
    getRenderedAttribute(fieldName) {
      return this.attributes['renderedAttributes'][fieldName];
    },
    getInjectedFieldsForVariation(uuid) {
      return this.attributes['injectedFields'][uuid];
    }
  });
})(Backbone, Drupal);
