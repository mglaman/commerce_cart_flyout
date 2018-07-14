/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function (Backbone, _, Drupal) {
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
      'click [name="addToCart"]': 'addToCart',
      'change input[type="radio"]': 'onAttributeChange',
      'change select': 'onAttributeChange'
    },
    onAttributeChange: function onAttributeChange(event) {
      var value = event.target.value;
      var attribute = event.target.name;
      this.selectedAttributes[attribute] = value;
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
        Drupal.cartFlyout.fetchCarts();Drupal.cartFlyout.flyoutOffcanvasToggle();
      });
    },
    render: function render() {
      var count = this.model.getVariationCount();
      if (count === 1) {
        this.$el.html('<div><input name="addToCart" type="submit" value="Add to cart"/></div>');
      } else {
        var view = this;
        var html = ['<div class="attribute-widgets form-group">'];
        this.model.getAttributes().forEach(function (entry) {
          if (entry.element_type === 'select') {
            var selectCompiled = _.template('<div class="form-group">' + '<label class="control-label"><%= label %></label>' + '<select name="attribute_<%= attributeId %>" class="form-control">' + '<% _.each(attributeValues, function(currentValue, key) { %>' + '<option value="<%= currentValue.attribute_value_id %>" <%= (activeValue === currentValue.attribute_value_id) ? \'selected\' : \'\' %>><%= currentValue.name %></option>' + '<% }); %>' + '</select></div>');
            html.push(selectCompiled({
              label: entry.label,
              attributeId: entry.id,
              attributeValues: entry.values,
              activeValue: view.selectedAttributes['attribute_' + entry.id]
            }));
          } else if (entry.element_type === 'radios') {
            var radiosCompiled = _.template('<div class="form-group">' + '<label class="control-label"><%= label %></label>' + '<% _.each(attributeValues, function(currentValue, key) { %>' + '<div class="radio">' + '<label><input type="radio" class="form-radio" name="attribute_<%= attributeId %>" value="<%= currentValue.attribute_value_id %>" <%= (activeValue === currentValue.attribute_value_id) ? \'checked\' : \'\' %>/><%= currentValue.name %></label>' + '</div>' + '<% }); %>' + '</div>');
            html.push(radiosCompiled({
              label: entry.label,
              attributeId: entry.id,
              attributeValues: entry.values,
              activeValue: view.selectedAttributes['attribute_' + entry.id]
            }));
          } else if (entry.element_type === 'commerce_product_rendered_attribute') {

            var _radiosCompiled = _.template('<div class="product--rendered-attribute fieldgroup form-composite form-item">' + '<div style="width: 100%;"><label><%= label %></label></div>' + '<% _.each(attributeValues, function(currentValue, key) { %>' + '<div class="form-item js-form-item form-type-radio js-form-type-radio">' + '<input type="radio" class="form-radio" name="attribute_<%= attributeId %>" id="attribute_<%= attributeId %>_<%= currentValue.attribute_value_id %>" value="<%= currentValue.attribute_value_id %>" <%= (activeValue === currentValue.attribute_value_id) ? \'checked\' : \'\' %>/>' + '<label class="control-label option" for="attribute_<%= attributeId %>_<%= currentValue.attribute_value_id %>"><% print (currentValue.output) %></label>' + '</div>' + '<% }); %>' + '</div>');
            html.push(_radiosCompiled({
              label: entry.label,
              attributeId: entry.id,
              attributeValues: view.model.getRenderedAttribute('attribute_' + entry.id),
              activeValue: view.selectedAttributes['attribute_' + entry.id]
            }));
          }
        });
        html.push('</div>');
        html.push('<div><input class="button btn btn-primary" name="addToCart" type="submit" value="Add to cart"/></div>');
        var compiled = _.template(html.join(''));
        this.$el.html(compiled);
      }
    }
  });
  Drupal.addToCart.AddToCartView.prototype.selectedAttributes = {};
})(Backbone, _, Drupal);