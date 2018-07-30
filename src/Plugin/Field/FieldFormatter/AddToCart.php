<?php

namespace Drupal\commerce_cart_flyout\Plugin\Field\FieldFormatter;

use Drupal\commerce_product\Entity\ProductInterface;
use Drupal\commerce_product\Entity\ProductVariationInterface;
use Drupal\commerce_product\PreparedAttribute;
use Drupal\commerce_product\ProductVariationAttributeMapperInterface;
use Drupal\commerce_product\ProductVariationFieldRendererInterface;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Render\Markup;
use Drupal\Core\Render\RenderContext;
use Drupal\Core\Render\RendererInterface;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Template\Attribute;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Serializer\Serializer;

/**
 * Drop-in replacement for the default add to cart formatter.
 *
 * This is a progressively decoupled add to cart form for Commerce Product.
 */
class AddToCart extends FormatterBase implements ContainerFactoryPluginInterface {

  /**
   * The variation storage.
   *
   * @var \Drupal\commerce_product\ProductVariationStorageInterface
   */
  protected $variationStorage;

  /**
   * The route match.
   *
   * @var \Drupal\Core\Routing\RouteMatchInterface
   */
  protected $routeMatch;

  /**
   * The serialize.
   *
   * @var \Symfony\Component\Serializer\Serializer
   */
  protected $serializer;

  /**
   * The attribute mapper.
   *
   * @var \Drupal\commerce_product\ProductVariationAttributeMapperInterface
   */
  protected $attributeMapper;

  /**
   * The renderer.
   *
   * @var \Drupal\Core\Render\RendererInterface
   */
  protected $renderer;

  /**
   * The attribute value view builder.
   *
   * @var \Drupal\Core\Entity\EntityViewBuilderInterface
   */
  protected $attributeValueViewBuilder;

  /**The attribute value storage.
   *
   * @var \Drupal\Core\Entity\EntityStorageInterface
   */
  protected $attributeValueStorage;

  /**
   * The variation field renderer.
   *
   * @var \Drupal\commerce_product\ProductVariationFieldRendererInterface
   */
  protected $variationFieldRenderer;

  /**
   * Constructs a new AddToCart object.
   *
   * @param string $plugin_id
   *   The plugin_id for the formatter.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Field\FieldDefinitionInterface $field_definition
   *   The definition of the field to which the formatter is associated.
   * @param array $settings
   *   The formatter settings.
   * @param string $label
   *   The formatter label display setting.
   * @param string $view_mode
   *   The view mode.
   * @param array $third_party_settings
   *   Any third party settings.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Routing\RouteMatchInterface $route_match
   *   The route match.
   * @param \Symfony\Component\Serializer\Serializer $serializer
   *   The serializer.
   * @param \Drupal\commerce_product\ProductVariationAttributeMapperInterface $attribute_mapper
   *   The attribute mapper.
   * @param \Drupal\Core\Render\RendererInterface $renderer
   *   The renderer.
   * @param \Drupal\commerce_product\ProductVariationFieldRendererInterface $variation_field_renderer
   *   The variation field renderer.
   *
   * @throws \Drupal\Component\Plugin\Exception\InvalidPluginDefinitionException
   * @throws \Drupal\Component\Plugin\Exception\PluginNotFoundException
   */
  public function __construct($plugin_id, $plugin_definition, FieldDefinitionInterface $field_definition, array $settings, $label, $view_mode, array $third_party_settings, EntityTypeManagerInterface $entity_type_manager, RouteMatchInterface $route_match, Serializer $serializer, ProductVariationAttributeMapperInterface $attribute_mapper, RendererInterface $renderer, ProductVariationFieldRendererInterface $variation_field_renderer) {
    parent::__construct($plugin_id, $plugin_definition, $field_definition, $settings, $label, $view_mode, $third_party_settings);
    $this->variationStorage = $entity_type_manager->getStorage('commerce_product_variation');
    $this->routeMatch = $route_match;
    $this->serializer = $serializer;
    $this->attributeMapper = $attribute_mapper;
    $this->renderer = $renderer;
    $this->attributeValueViewBuilder = $entity_type_manager->getViewBuilder('commerce_product_attribute_value');
    $this->attributeValueStorage = $entity_type_manager->getStorage('commerce_product_attribute_value');
    $this->variationFieldRenderer = $variation_field_renderer;
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
      $container->get('renderer'),
      $container->get('commerce_product.variation_field_renderer')
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
    $variations = $this->loadVariations($product);
    $prepared_attributes = $this->attributeMapper->prepareAttributes($default_variation, $variations);
    $prepared_attributes = array_filter($prepared_attributes, function (PreparedAttribute $prepared_attribute) {
      // There will always be at least one value, possibly `_none`.
      // If we have more than one value, allow the prepared attribute. But if
      // we only have one, do not consider it, if it is the `_none` value.
      $values = $prepared_attribute->getValues();
      return (count($values) > 1) || !isset($values['_none']);
    });

    // Fake a requirement on the current route so that our Normalizers run.
    $this->routeMatch->getRouteObject()->setRequirement('_cart_api', 'true');

    $elements = [];
    $elements[0]['add_to_cart_form'] = [
      '#attached' => [
        'library' => [
          'core/drupalSettings',
          'commerce_product/rendered-attributes',
          'commerce_cart_flyout/add_to_cart',
        ],
        'drupalSettings' => [
          'addToCart' => [
            $product->uuid() => [
              'defaultVariation' => $default_variation->uuid(),
              'variations' => $this->serializer->normalize($variations),
              'attributes' => $this->serializer->normalize(array_values($prepared_attributes)),
              'renderedAttributes' => $this->renderPreparedAttributes($prepared_attributes),
              'injectedFields' => $this->getVariationInjectedFields($variations),
            ],
          ],
          'theme' => [
            'commerce_cart_flyout_add_to_cart_button' => $this->renderTemplate('commerce_cart_flyout_add_to_cart_button'),
            'commerce_cart_flyout_add_to_cart_attributes_select' => $this->renderTemplate('commerce_cart_flyout_add_to_cart_attributes_select'),
            'commerce_cart_flyout_add_to_cart_attributes_radios' => $this->renderTemplate('commerce_cart_flyout_add_to_cart_attributes_radios'),
            'commerce_cart_flyout_add_to_cart_attributes_rendered' => $this->renderTemplate('commerce_cart_flyout_add_to_cart_attributes_rendered'),
          ],
        ],
      ],
      '#markup' => Markup::create(sprintf('<div %s></div>', new Attribute([
        'data-product' => $product->uuid(),
        'data-view-mode' => $this->viewMode,
        'data-langcode' => $langcode,
      ]))),
    ];

    $cacheability = new CacheableMetadata();
    $cacheability->addCacheableDependency($product);
    foreach ($variations as $variation) {
      $cacheability->addCacheableDependency($variation);
    }
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

  /**
   * Filters prepared attributes by element type.
   *
   * @param array $prepared_attributes
   *   The prepared attributes.
   * @param string $element_type
   *   The element type to filter on.
   *
   * @return array
   *   An array of filter prepared attributes.
   */
  protected function filterPreparedAttributedByElementType(array $prepared_attributes, $element_type) {
    return array_filter($prepared_attributes, function (PreparedAttribute $attribute) use ($element_type) {
      return $attribute->getElementType() == $element_type;
    });
  }

  /**
   * Renders the prepared attributes.
   *
   * @param array $prepared_attributes
   *   The prepared attributed.
   *
   * @return array
   *   The array of rendered prepated attributes.
   */
  protected function renderPreparedAttributes(array $prepared_attributes) {
    return array_map(function (PreparedAttribute $attribute) {
      return array_map(function ($attribute_value_id) {
        $attribute_value = $this->attributeValueStorage->load($attribute_value_id);
        $attribute_value_build = $this->attributeValueViewBuilder->view($attribute_value, 'add_to_cart');
        return [
          'output' => $this->renderer->render($attribute_value_build),
          'attribute_value_id' => $attribute_value_id,
        ];
      }, array_keys($attribute->getValues()));
    }, $this->filterPreparedAttributedByElementType($prepared_attributes, 'commerce_product_rendered_attribute'));
  }

  /**
   * Load variations for the product.
   *
   * @param \Drupal\commerce_product\Entity\ProductInterface $product
   *   The product.
   *
   * @return \Drupal\commerce_product\Entity\ProductVariationInterface[]
   *   The variations.
   */
  protected function loadVariations(ProductInterface $product) {
    return array_reduce(
      $this->variationStorage->loadEnabled($product),
      function ($carry, ProductVariationInterface $variation) {
        $carry[$variation->uuid()] = $variation;
        return $carry;
      }, []);
  }

  /**
   * Renders a template.
   *
   * @param string $hook
   *   The theme hook.
   *
   * @return string
   *   The rendered template.
   */
  protected function renderTemplate($hook) {
    return $this->renderer->executeInRenderContext(new RenderContext(), function () use ($hook) {
      $build = ['#theme' => $hook];
      return $this->renderer->render($build);
    });
  }

  /**
   * Get injected variation fields.
   *
   * @param \Drupal\commerce_product\Entity\ProductVariationInterface[] $variations
   *   The variations.
   *
   * @return array
   *   The array of injected variation fields.
   */
  protected function getVariationInjectedFields(array $variations) {
    return array_map(
      function (ProductVariationInterface $variation) {
        return array_filter(
          array_map(function ($build) {
            return [
              'class' => $build['#ajax_replace_class'],
              'output' => trim($this->renderer->render($build)),
            ];
          }, $this->variationFieldRenderer->renderFields($variation, $this->viewMode)),
          function ($built) {
            return !empty($built['output']);
          });
      }, $variations
    );
  }

}
