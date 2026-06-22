/**
 * Spryker integration — Glue Storefront API client (headless cart flow).
 *
 * On "IN DEN WARENKORB" the designer posts the configured item straight to the
 * Glue API. Spryker persists the productConfigurationInstance, and the Client
 * `TshirtDesignerPriceExtractorPlugin` recomputes the authoritative price
 * server-side — the client never sets the cart price.
 *
 * SKETCH: error handling, auth (OAuth for logged-in customers), CSRF and cart
 * lifecycle are intentionally thin. The shape of the request is the point.
 *
 * Reference: Spryker "Managing guest cart items" Glue API + the
 * `product-configurations-rest-api` module (already in composer.json) which
 * accepts `productConfigurationInstance` on cart-item requests.
 */

import type { SprykerSession } from './types';
import type { ProductConfigurationInstance } from './types';

interface AddToCartResult {
  ok: boolean;
  status: number;
  body: unknown;
}

/**
 * POST a configured concrete product to the shopper's guest cart.
 *
 * Endpoint: POST {glueBaseUrl}/guest-cart-items
 * Header:   X-Anonymous-Customer-Unique-Id: {anonymousId}
 */
export async function addConfiguredItemToCart(
  session: SprykerSession,
  instance: ProductConfigurationInstance
): Promise<AddToCartResult> {
  const url = `${session.glueBaseUrl.replace(/\/$/, '')}/guest-cart-items`;

  const payload = {
    data: {
      type: 'guest-cart-items',
      attributes: {
        sku: session.sku,
        quantity: session.quantity,
        // `product-configurations-rest-api` maps this onto the
        // ProductConfigurationInstance transfer on the cart item.
        productConfigurationInstance: {
          configuratorKey: instance.configuratorKey,
          isComplete: instance.isComplete,
          configuration: instance.configuration,
          displayData: instance.displayData
        }
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      ...(session.anonymousId
        ? { 'X-Anonymous-Customer-Unique-Id': session.anonymousId }
        : {})
    },
    body: JSON.stringify(payload)
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    /* empty / non-JSON response */
  }

  return { ok: response.ok, status: response.status, body };
}
