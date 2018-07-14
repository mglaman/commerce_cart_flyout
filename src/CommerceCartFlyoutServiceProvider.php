<?php

namespace Drupal\commerce_cart_flyout;

use Drupal\Core\DependencyInjection\ContainerBuilder;
use Drupal\Core\DependencyInjection\ServiceProviderBase;

/**
 * Removes the add to cart message.
 */
class CommerceCartFlyoutServiceProvider extends ServiceProviderBase {

  /**
   * {@inheritdoc}
   */
  public function alter(ContainerBuilder $container) {
    // Remove the server side add to cart messaging.
    // @todo Make a way to silence the message without removing definition.
    if ($container->hasDefinition('commerce_cart.cart_subscriber')) {
      $container->removeDefinition('commerce_cart.cart_subscriber');
    }
  }

}
