<?php

namespace Drupal\commerce_cart_flyout\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Render\Markup;
use Drupal\Core\Template\Loader\ThemeRegistryLoader;
use Drupal\Core\Theme\Registry;
use Drupal\Core\Url;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a cart block.
 *
 * @Block(
 *   id = "commerce_cart_flyout",
 *   admin_label = @Translation("Cart Flyout"),
 *   category = @Translation("Commerce")
 * )
 */
class CartBlock extends BlockBase implements ContainerFactoryPluginInterface {

  /**
   * The theme registry.
   *
   * @var \Drupal\Core\Theme\Registry
   */
  protected $themeRegistry;

  /**
   * The theme registry loader.
   *
   * @var \Drupal\Core\Template\Loader\ThemeRegistryLoader
   */
  protected $themeRegistryLoader;

  /**
   * Registry data.
   *
   * @var array
   */
  protected $registryData;

  /**
   * Constructs a new CartBlock object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin ID for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Theme\Registry $registry
   *   The theme registry.
   * @param \Drupal\Core\Template\Loader\ThemeRegistryLoader $theme_registry_loader
   *   The theme registry loader.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, Registry $registry, ThemeRegistryLoader $theme_registry_loader) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->themeRegistry = $registry;
    $this->themeRegistryLoader = $theme_registry_loader;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('theme.registry'),
      $container->get('twig.loader.theme_registry')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function build() {
    $this->registryData = $this->themeRegistry->get();

    $block_twig = $this->getSourceContext('commerce_cart_flyout_block');
    $icon_twig = $this->getSourceContext('commerce_cart_flyout_block_icon');
    $offcanvas_twig = $this->getSourceContext('commerce_cart_flyout_offcanvas');
    $offcanvas_contents_twig = $this->getSourceContext('commerce_cart_flyout_offcanvas_contents');
    $offcanvas_contents_items_twig = $this->getSourceContext('commerce_cart_flyout_offcanvas_contents_items');

    return [
      '#attached' => [
        'library' => [
          'commerce_cart_flyout/flyout',
        ],
        'drupalSettings' => [
          'cartFlyout' => [
            'templates' => [
              'icon' => $icon_twig->getCode(),
              'block' => $block_twig->getCode(),
              'offcanvas' => $offcanvas_twig->getCode(),
              'offcanvas_contents' => $offcanvas_contents_twig->getCode(),
              'offcanvas_contents_items' => $offcanvas_contents_items_twig->getCode(),
            ],
            'url' => Url::fromRoute('commerce_cart.page')->toString(),
            'icon' => file_url_transform_relative(file_create_url(drupal_get_path('module', 'commerce') . '/icons/ffffff/cart.png')),
          ],
        ],
      ],
      '#markup' => Markup::create('<div class="cart-flyout"></div>'),
    ];
  }

  /**
   * Get the source context for a theme hook.
   *
   * @param string $theme_hook
   *   The theme hook.
   *
   * @return \Twig_Source
   *   The Twig source.
   *
   * @throws \Twig_Error_Loader
   */
  protected function getSourceContext($theme_hook) {
    $theme_hook_info = $this->registryData[$theme_hook];
    return $this->themeRegistryLoader->getSourceContext($theme_hook_info['template'] . '.html.twig');
  }

}
