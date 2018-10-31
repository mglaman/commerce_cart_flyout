<?php

namespace Drupal\commerce_cart_flyout;

use Drupal\commerce_cart_flyout\EventSubscriber\CartEventSubscriber;
use Drupal\Core\DependencyInjection\ContainerBuilder;
use Drupal\Core\DependencyInjection\ServiceProviderBase;
use Symfony\Component\DependencyInjection\Reference;

/**
 * Replaces the add to cart message.
 */
class CommerceCartFlyoutServiceProvider extends ServiceProviderBase {

  /**
   * {@inheritdoc}
   */
  public function alter(ContainerBuilder $container) {
    // Replace the server side add to cart messaging.
    if ($container->hasDefinition('commerce_cart.cart_subscriber')) {
      $definition = $container->getDefinition('commerce_cart.cart_subscriber');
      $definition->setClass(CartEventSubscriber::class)
        ->addArgument(new Reference('current_route_match'));
    }
  }

}
