(($, _, Drupal, drupalSettings) => {
  Drupal.theme.addToCartButton = () => {
    return `<div><input class="button btn btn-primary" name="addToCart" type="submit" value="${Drupal.t('Add to cart')}"/></div>`
  };
  Drupal.theme.addToCartAttributesSelect = ((_) => (args) => {
    const template = _.template('<div class="form-group">' +
      '<label class="control-label"><%= label %></label>' +
      '<select name="attribute_<%= attributeId %>" class="form-control">' +
        '<% _.each(attributeValues, function(currentValue, key) { %>' +
        '<option value="<%= currentValue.attribute_value_id %>" <%= (activeValue === currentValue.attribute_value_id) ? "selected" : "" %>><%= currentValue.name %></option>' +
        '<% }); %>' +
      '</select>' +
      '</div>'
    );
    return template(args);
  })(_);
  Drupal.theme.addToCartAttributesRadios = ((_) => (args) => {
    const template = _.template('<div class="form-group">' +
      '<label class="control-label"><%= label %></label>' +
      '<% _.each(attributeValues, function(currentValue, key) { %>' +
      '<div class="radio">' +
      '<label for="attribute_<%= attributeId %>_<%= currentValue.attribute_value_id %>">' +
      '<input type="radio" class="form-radio" id="attribute_<%= attributeId %>_<%= currentValue.attribute_value_id %>" name="attribute_<%= attributeId %>" value="<%= currentValue.attribute_value_id %>" <%= (activeValue === currentValue.attribute_value_id) ? \'checked\' : \'\' %>/><%= currentValue.name %>' +
      '</label>' +
      '</div>' +
      '<% }); %>' +
      '</div>'
    );
    return template(args);
  })(_);
  Drupal.theme.addToCartAttributesRendered = ((_) => (args) => {
    const template = _.template('<div class="product--rendered-attribute fieldgroup form-composite form-item">' +
      '<div style="width: 100%;"><label><%= label %></label></div>' +
      '<% _.each(attributeValues, function(currentValue, key) { %>' +
      '<div class="form-item js-form-item form-type-radio js-form-type-radio">' +
      '<input type="radio" class="form-radio" name="attribute_<%= attributeId %>" id="attribute_<%= attributeId %>_<%= currentValue.attribute_value_id %>" value="<%= currentValue.attribute_value_id %>" <%= (activeValue === currentValue.attribute_value_id) ? \'checked\' : \'\' %>/>' +
      '<label class="control-label option" for="attribute_<%= attributeId %>_<%= currentValue.attribute_value_id %>"><% print (currentValue.output) %></label>' +
      '</div>' +
      '<% }); %>' +
      '</div>'
    );
    return template(args);
  })(_);

  Drupal.addToCart = {};
  Drupal.behaviors.addToCart = {
    attach(context) {
      $(context).find('[data-product]').once('flyout-add-to-cart').each((k,el) => {
        const model = new Drupal.addToCart.AddToCartModel(
          drupalSettings.addToCart[el.dataset.product]
        );
        new Drupal.addToCart.AddToCartView({el, model})
      });
    }
  }
})(jQuery, _, Drupal, drupalSettings);
