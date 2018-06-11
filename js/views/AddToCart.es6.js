((Backbone, _, Drupal) => {
  Drupal.addToCart.AddToCartView = Backbone.View.extend(/** @lends Drupal.cartFlyout.CartBlockView# */{
    selectedVariation: '',
    selectedAttributes: [],
    variations: {},
    attributes: {},
    initialize() {
      this.selectedVariation = this.model.getDefaultVariation();
      this.variations = this.model.getVariations();
      this.attributes = this.model.getAttributes();

      const defaultVariation = this.variations[this.selectedVariation];
      const self = this;
      _.each(this.attributes, (attribute, i) => {
        let attributeFieldName = 'attribute_' + attribute.id;
        if (defaultVariation.hasOwnProperty(attributeFieldName)) {
          self.selectedAttributes[attributeFieldName] = defaultVariation[attributeFieldName];
        }
      });
      this.render();
    },
    events: {
      'click [name="addToCart"]': 'addToCart',
      'change input[type="radio"]': 'onAttributeChange',
      'change select': 'onAttributeChange',
    },
    onAttributeChange(event) {
      const value = event.target.value;
      const attribute = event.target.name;
      this.selectedAttributes[attribute] = value;
    },
    resolveSelectedVariation() {
      // What if there was an add to cart endpoint which took the attributes and figured out the purchasable entity
      // for us?
      let match;
      let selectedVariation = this.selectedVariation;
      let attributes = this.attributes;
      let variations = this.variations;
      while (attributes.length > 0) {
        _.each(variations, (variation, i) => {
          match = true;
          _.each(attributes, (attribute, k) => {
            let attributeFieldName = 'attribute_' + attribute.id;
            if (variation.hasOwnProperty(attributeFieldName)) {
              _.each(attribute.values, (attributeValue) => {
                debugger;
                if (variation[attributeFieldName] !== attributeValue.attribute_value_id) {
                  match = false;
                }
              })
            }
            if (match) {
              selectedVariation = variation;
              return;
            }
          });
        });
        attributes.pop()
      }
      this.selectedVariation = selectedVariation;
    },
    addToCart() {
      console.log(this.selectedAttributes);
      console.log(this.selectedVariation);
      this.resolveSelectedVariation();
      console.log(this.selectedVariation);
      console.log(
        {
          purchased_entity_type: 'commerce_product_variation',
          purchased_entity_id: this.variations[this.selectedVariation].variation_id,
          quantity: 1
        }
      );
      return;
      const endpoint = Drupal.url(`cart/add?_format=json`);
      fetch(endpoint, {
        // By default cookies are not passed, and we need the session cookie!
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify( [
          {
            purchased_entity_type: 'commerce_product_variation',
            purchased_entity_id: this.variations[this.selectedVariation].variation_id,
            quantity: 1
          }
        ] )
      })
        .then((res) => {})
        // @todo this should just trigger an event.
        .then(() => Drupal.cartFlyout.fetchCarts());
    },
    generateSelect(attribute) {

    },
    render() {
      const count = Object.keys(this.variations).length;
      if (count === 1) {
        this.$el.html('<div><input name="addToCart" type="submit" value="Add to cart"/></div>');
      } else {
        let html = [];
        this.attributes.forEach(entry => {
          if (entry.element_type === 'select') {
            let selectCompiled = _.template('<div class="form-group">' +
              '<label class="control-label"><%= label %></label>' +
              '<select name="attribute_<%= attributeId %>" class="form-control">' +
              '<% _.each(attributeValues, function(currentValue, key) { %>' +
              // '<% debugger; %>' +
              '<option value="<%= currentValue.attribute_value_id %>" <%= (activeValue === currentValue.attribute_value_id) ? \'selected\' : \'\' %>><%= currentValue.name %></option>' +
              '<% }); %>' +
              '</select></div>');
            html.push(selectCompiled({
              label: entry.label,
              attributeId: entry.id,
              attributeValues: entry.values,
              activeValue: this.selectedAttributes[entry.id]
            }))
          } else if (entry.element_type === 'radios') {
            let radiosCompiled = _.template('<div class="form-group">' +
              '<label class="control-label"><%= label %></label>' +
              '<% _.each(attributeValues, function(currentValue, key) { %>' +
              '<div class="radio">' +
              '<label><input type="radio" class="form-radio" name="attribute_<%= attributeId %>" value="<%= currentValue.attribute_value_id %>" <%= (activeValue === currentValue.attribute_value_id) ? \'checked\' : \'\' %>/><%= currentValue.name %></label>' +
              '</div>' +
              '<% }); %>' +
              '</div>');
            html.push(radiosCompiled({
              label: entry.label,
              attributeId: entry.id,
              attributeValues: entry.values,
              activeValue: this.selectedAttributes[entry.id]
            }))
          } else if (entry.element_type === 'commerce_product_rendered_attribute') {

            let radiosCompiled = _.template('<div class="form-group">' +
              '<label class="control-label"><%= label %></label>' +
              '<% _.each(attributeValues, function(currentValue, key) { %>' +
              '<div class="radio">' +
              '<label><input type="radio" class="form-radio" name="attribute_<%= attributeId %>" value="<%= currentValue.attribute_value_id %>" <%= (activeValue === currentValue.attribute_value_id) ? \'checked\' : \'\' %>/>' +
              '<div class="swatch--square" style="background-color: <%= currentValue.field_color.color %>; width: 30px; height: 30px;"></div>' +
              '</label>' +
              '</div>' +
              '<% }); %>' +
              '</div>');
            html.push(radiosCompiled({
              label: entry.label,
              attributeId: entry.id,
              attributeValues: entry.values,
              activeValue: this.selectedAttributes[entry.id]
            }))

          }
        });

        html.push('<div><input name="addToCart" type="submit" value="Add to cart"/></div>');
        const compiled = _.template(
          html.join('')
        );
        this.$el.html(compiled);
      }
    }
  });
})(Backbone, _, Drupal);
