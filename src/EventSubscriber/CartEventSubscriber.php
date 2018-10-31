<?php

namespace Drupal\commerce_cart_flyout\EventSubscriber;

use Drupal\commerce_cart\Event\CartEntityAddEvent;
use Drupal\commerce_cart\EventSubscriber\CartEventSubscriber as CommerceCartEventSubscriber;
use Drupal\Core\Messenger\MessengerInterface;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\StringTranslation\TranslationInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Replaces the original CartEventSubscriber from commerce_cart module.
 *
 * This prevents `_cart_api` routes from triggering messages.
 */
class CartEventSubscriber extends CommerceCartEventSubscriber {

  /**
   * The route match.
   *
   * @var \Drupal\Core\Routing\RouteMatchInterface
   */
  protected $routeMatch;

  /**
   * Constructs a new CartEventSubscriber object.
   *
   * @param \Drupal\Core\Messenger\MessengerInterface $messenger
   *   The messenger.
   * @param \Drupal\Core\StringTranslation\TranslationInterface $string_translation
   *   The string translation.
   */
  public function __construct(MessengerInterface $messenger, TranslationInterface $string_translation, RouteMatchInterface $route_match) {
    parent::__construct($messenger, $string_translation);

    $this->routeMatch = $route_match;
  }

  /**
   * {@inheritdoc}
   */
  public function displayAddToCartMessage(CartEntityAddEvent $event) {
    if (!$this->routeMatch->getRouteObject()->hasRequirement('_cart_api')) {
      parent::displayAddToCartMessage($event);
    }
  }

}
