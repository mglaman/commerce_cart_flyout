<?php

namespace Drupal\commerce_cart_flyout\Normalizer;

use Drupal\commerce_product\Entity\ProductAttributeValueInterface;
use Drupal\commerce_product\PreparedAttribute;
use Drupal\serialization\Normalizer\NormalizerBase;

class PreparedAttributeNormalizer extends NormalizerBase {

  /**
   * The interface or class that this Normalizer supports.
   *
   * @var string
   */
  protected $supportedInterfaceOrClass = 'Drupal\commerce_product\PreparedAttribute';

  /**
   * @inheritDoc
   */
  public function normalize($object, $format = NULL, array $context = []) {
    if (!$object instanceof PreparedAttribute) {
      return '';
    }

    $data = $object->toArray();
    $attribute_ids = array_keys($data['values']);
    /** @var \Drupal\commerce_product\ProductAttributeValueStorageInterface $attribute_value_storage */
    $attribute_value_storage = \Drupal::entityTypeManager()->getStorage('commerce_product_attribute_value');
    /** @var \Drupal\commerce_product\Entity\ProductAttributeValueInterface[] $attributes */
    // @todo make sure loaded in same langcode.
    $attributes = array_reduce($attribute_value_storage->loadMultiple($attribute_ids), function ($carry, ProductAttributeValueInterface $value) {
      $carry[] = $value;
      return $carry;
    }, []);

    if ($object->getElementType() == 'commerce_product_rendered_attribute') {
      $view_builder = \Drupal::entityTypeManager()->getViewBuilder('commerce_product_attribute_value');
      /** @var \Drupal\Core\Render\RendererInterface $renderer */
      $renderer = \Drupal::service('renderer');
      foreach ($attributes as $key => $value) {
        $rendered_attribute = $view_builder->view($value, 'add_to_cart');
        $attributes[$key]->rendered = $renderer->render($rendered_attribute);
      }
    }

    $data['values'] = $this->serializer->normalize($attributes);

    return $data;
  }

}
