/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Backbone, _, Drupal) {
  Drupal.addToCart.AddToCartView = Backbone.View.extend({
    initialize: function initialize() {
      var _this = this;

      var defaultVariation = this.model.getVariation(this.model.getDefaultVariation());
      _.each(this.model.getAttributes(), function (attribute, i) {
        var attributeFieldName = 'attribute_' + attribute.id;
        if (defaultVariation.hasOwnProperty(attributeFieldName)) {
          _this.selectedAttributes[attributeFieldName] = defaultVariation[attributeFieldName];
        }
      });
      this.render();
    },

    events: {
      'click .form-submit': 'addToCart',
      'change input[type="radio"]': 'onAttributeChange',
      'change select': 'onAttributeChange'
    },
    onAttributeChange: function onAttributeChange(event) {
      this.selectedAttributes[event.target.name] = event.target.value;
    },
    addToCart: function addToCart() {
      var selectedVariation = this.model.getResolvedVariation(this.selectedAttributes);
      fetch(Drupal.url('cart/add?_format=json'), {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify([{
          purchased_entity_type: 'commerce_product_variation',
          purchased_entity_id: selectedVariation.variation_id,
          quantity: 1
        }])
      }).then(function (res) {}).then(function () {
        Drupal.cartFlyout.fetchCarts();
        Drupal.cartFlyout.flyoutOffcanvasToggle();
      });
    },
    render: function render() {
      var count = this.model.getVariationCount();
      if (count === 1) {
        this.$el.html(Drupal.theme('addToCartButton'));
      } else {
        var view = this;
        var html = ['<div class="attribute-widgets form-group">'];
        this.model.getAttributes().forEach(function (entry) {
          var defaultArgs = {
            label: entry.label,
            attributeId: entry.id,
            attributeValues: entry.values,
            activeValue: view.selectedAttributes['attribute_' + entry.id]
          };

          if (entry.element_type === 'select') {
            html.push(Drupal.theme('addToCartAttributesSelect', defaultArgs));
          } else if (entry.element_type === 'radios') {
            html.push(Drupal.theme('addToCartAttributesRadios', defaultArgs));
          } else if (entry.element_type === 'commerce_product_rendered_attribute') {
            html.push(Drupal.theme('addToCartAttributesRendered', Object.assign({}, defaultArgs, {
              attributeValues: view.model.getRenderedAttribute('attribute_' + entry.id)
            })));
          }
        });
        html.push('</div>');
        html.push(Drupal.theme('addToCartButton'));
        this.$el.html(html.join(''));
      }
    }
  });
  Drupal.addToCart.AddToCartView.prototype.selectedAttributes = {};
})(jQuery, Backbone, _, Drupal);