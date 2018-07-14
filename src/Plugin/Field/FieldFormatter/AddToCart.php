<?php

namespace Drupal\commerce_cart_flyout\Plugin\Field\FieldFormatter;

use Drupal\commerce_product\Entity\ProductVariationInterface;
use Drupal\commerce_product\PreparedAttribute;
use Drupal\commerce_product\ProductVariationAttributeMapperInterface;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Render\Markup;
use Drupal\Core\Render\RendererInterface;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Template\Attribute;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Serializer\Serializer;

/**
 * Drop-in replacement for the default add to cart formatter.
 *
 * This is a progessively decoupled add to cart form for Commerce Product.
 */
class AddToCart extends FormatterBase implements ContainerFactoryPluginInterface {

  /**
   * @var \Drupal\commerce_product\ProductVariationStorageInterface
   */
  protected $variationStorage;

  protected $routeMatch;

  protected $serializer;

  protected $attributeMapper;

  protected $renderer;

  protected $attributeValueViewBuilder;

  protected $attributeValueStorage;

  public function __construct($plugin_id, $plugin_definition, FieldDefinitionInterface $field_definition, array $settings, $label, $view_mode, array $third_party_settings, EntityTypeManagerInterface $entity_type_manager, RouteMatchInterface $route_match, Serializer $serializer, ProductVariationAttributeMapperInterface $attribute_mapper, RendererInterface $renderer) {
    parent::__construct($plugin_id, $plugin_definition, $field_definition, $settings, $label, $view_mode, $third_party_settings);
    $this->variationStorage = $entity_type_manager->getStorage('commerce_product_variation');
    $this->routeMatch = $route_match;
    $this->serializer = $serializer;
    $this->attributeMapper = $attribute_mapper;
    $this->renderer = $renderer;
    $this->attributeValueViewBuilder = $entity_type_manager->getViewBuilder('commerce_product_attribute_value');
    $this->attributeValueStorage = $entity_type_manager->getStorage('commerce_product_attribute_value');
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $plugin_id,
      $plugin_definition,
      $configuration['field_definition'],
      $configuration['settings'],
      $configuration['label'],
      $configuration['view_mode'],
      $configuration['third_party_settings'],
      $container->get('entity_type.manager'),
      $container->get('current_route_match'),
      $container->get('serializer'),
      $container->get('commerce_product.variation_attribute_mapper'),
      $container->get('renderer')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    /** @var \Drupal\commerce_product\Entity\ProductInterface $product */
    $product = $items->getEntity();

    // If we could not load a default variation, just bail.
    $default_variation = $this->variationStorage->loadFromContext($product);
    if (!$default_variation) {
      return [];
    }

    // Fake a requirement on the current route so that our Normalizers run.
    $this->routeMatch->getRouteObject()->setRequirement('_cart_api', 'true');

    $variations = array_reduce(
      $this->variationStorage->loadEnabled($product),
      function ($carry, ProductVariationInterface $variation) {
        $carry[$variation->uuid()] = $variation;
        return $carry;
      }, []);


    $prepared_attributes = $this->attributeMapper->prepareAttributes($default_variation, $variations);
    $rendered_attributes = array_map(function (PreparedAttribute $attribute) {
      return array_map(function ($attribute_value_id) {
        $attribute_value = $this->attributeValueStorage->load($attribute_value_id);
        $attribute_value_build = $this->attributeValueViewBuilder->view($attribute_value, 'add_to_cart');
        return [
          'output' => $this->renderer->render($attribute_value_build),
          'attribute_value_id' => $attribute_value_id,
        ];
      }, array_keys($attribute->getValues()));
    }, $this->getPreparedAttributedByElementType($prepared_attributes, 'commerce_product_rendered_attribute'));

    $element_attributes = new Attribute([
      'data-product' => $product->uuid(),
      'data-view-mode' => $this->viewMode,
      'data-langcode' => $langcode,
    ]);

    $add_to_cart_button = ['#theme' => 'commerce_cart_flyout_add_to_cart_button'];
    $add_to_cart_select = ['#theme' => 'commerce_cart_flyout_add_to_cart_attributes_select'];
    $add_to_cart_radios = ['#theme' => 'commerce_cart_flyout_add_to_cart_attributes_radios'];
    $add_to_cart_rendered = ['#theme' => 'commerce_cart_flyout_add_to_cart_attributes_rendered'];

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
              'variations' => $this->serializer->normalize($variations),
              'attributes' => $this->serializer->normalize(array_values($prepared_attributes)),
              'renderedAttributes' => $rendered_attributes,
            ],
          ],
          'theme' => [
            'commerce_cart_flyout_add_to_cart_button' => $this->renderer->render($add_to_cart_button),
            'commerce_cart_flyout_add_to_cart_attributes_select' => $this->renderer->render($add_to_cart_select),
            'commerce_cart_flyout_add_to_cart_attributes_radios' => $this->renderer->render($add_to_cart_radios),
            'commerce_cart_flyout_add_to_cart_attributes_rendered' => $this->renderer->render($add_to_cart_rendered),
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

  protected function getPreparedAttributedByElementType(array $prepared_attributes, $element_type) {
    return array_filter($prepared_attributes, function (PreparedAttribute $attribute) use ($element_type) {
      return $attribute->getElementType() == $element_type;
    });
  }

}
