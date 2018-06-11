<?php

namespace Drupal\commerce_cart_flyout\Plugin\Field\FieldFormatter;

use Drupal\commerce_product\Entity\ProductVariationInterface;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Render\Markup;
use Drupal\Core\Template\Attribute;

/**
 * Plugin implementation of the 'commerce_cart_flyout_add_to_cart' formatter.
 *
 * This is a progessively decoupled add to cart form for Commerce Product.
 *
 * @FieldFormatter(
 *   id = "commerce_cart_flyout_add_to_cart",
 *   label = @Translation("Flyout Add to cart form"),
 *   field_types = {
 *     "entity_reference",
 *   },
 * )
 */
class AddToCart extends FormatterBase {

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    /** @var \Drupal\commerce_product\Entity\ProductInterface $product */
    $product = $items->getEntity();

    /** @var \Drupal\commerce_product\ProductVariationStorageInterface $variation_storage */
    $variation_storage = \Drupal::entityTypeManager()->getStorage('commerce_product_variation');

    // If we could not load a default variation, just bail.
    $default_variation = $variation_storage->loadFromContext($product);
    if (!$default_variation) {
      return [];
    }

    // Fake a requirement on the current route so that our Normalizers run.
    \Drupal::routeMatch()->getRouteObject()->setRequirement('_cart_api', 'true');
    $serializer = \Drupal::getContainer()->get('serializer');

    $variations = $variation_storage->loadEnabled($product);
    $variations = array_reduce($variations, function ($carry, ProductVariationInterface $variation) {
      $carry[$variation->uuid()] = $variation;
      return $carry;
    }, []);

    $attribute_mapper = \Drupal::getContainer()->get('commerce_product.variation_attribute_mapper');
    $prepared_attributes = array_values($attribute_mapper->prepareAttributes($default_variation, $variations));

    $element_attributes = new Attribute([
      'data-product' => $product->uuid(),
      'data-view-mode' => $this->viewMode,
      'data-langcode' => $langcode,
    ]);

    $elements = [];
    $elements[0]['add_to_cart_form'] = [
      '#attached' => [
        'library' => [
          'core/drupalSettings',
          'commerce_cart_flyout/add_to_cart',
        ],
        'drupalSettings' => [
          'addToCart' => [
            $product->uuid() => [
              'defaultVariation' => $default_variation->uuid(),
              'variations' => $serializer->normalize($variations),
              // @todo we need a normalizer for this class.
              'attributes' => $serializer->normalize($prepared_attributes),
            ],
          ],
        ],
      ],
      '#markup' => Markup::create(sprintf('<div %s></div>', $element_attributes)),
    ];

    $cacheability = new CacheableMetadata();
    $cacheability->addCacheableDependency($product);
    $cacheability->setCacheMaxAge(0);
    $cacheability->applyTo($elements);

    return $elements;
  }

  /**
   * {@inheritdoc}
   */
  public static function isApplicable(FieldDefinitionInterface $field_definition) {
    $has_cart = \Drupal::moduleHandler()->moduleExists('commerce_cart');
    $entity_type = $field_definition->getTargetEntityTypeId();
    $field_name = $field_definition->getName();
    return $has_cart && $entity_type == 'commerce_product' && $field_name == 'variations';
  }

}
