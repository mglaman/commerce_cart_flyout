<?php

namespace Drupal\commerce_cart_flyout\Plugin\Block;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Cache\Cache;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Render\Markup;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Session\AccountInterface;
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
   * The route match.
   *
   * @var \Drupal\Core\Routing\RouteMatchInterface
   */
  protected $routeMatch;

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
   * @param \Drupal\Core\Routing\RouteMatchInterface $route_match
   *   The request stack.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, Registry $registry, ThemeRegistryLoader $theme_registry_loader, RouteMatchInterface $route_match) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->themeRegistry = $registry;
    $this->themeRegistryLoader = $theme_registry_loader;
    $this->routeMatch = $route_match;
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
      $container->get('twig.loader.theme_registry'),
      $container->get('current_route_match')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration() {
    return [
      'use_quantity_count' => FALSE,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state) {
    $form = parent::blockForm($form, $form_state);
    $form['use_quantity_count'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Use a accumulative quantity of each item as item count.'),
      '#description' => $this->t('Instead of counting the unique items in the cart this will show the sum of the quantity for all items in the cart.'),
      '#default_value' => $this->configuration['use_quantity_count'],
    ];
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state) {
    $this->configuration['use_quantity_count'] = $form_state->getValue('use_quantity_count');
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
            'use_quantity_count' => $this->configuration['use_quantity_count'],
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

  /**
   * {@inheritdoc}
   */
  protected function blockAccess(AccountInterface $account) {
    // Do not allow the cart flyout to render on the checkout form, as this
    // would allow for modifying the order outside of checkout.
    return AccessResult::allowedIf($this->routeMatch->getRouteName() != 'commerce_checkout.form');
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheContexts() {
    return Cache::mergeContexts(parent::getCacheContexts(), ['route']);
  }

}
