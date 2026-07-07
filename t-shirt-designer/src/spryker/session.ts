/**
 * Spryker integration — launch-context parsing.
 *
 * Reads the query parameters Spryker appends when it opens the designer as the
 * external configurator for a configurable product. When none are present the
 * app is running standalone (the demo at localhost:5173) and add-to-cart falls
 * back to a local alert.
 *
 * Example embedded URL:
 *   https://designer.spryker.local/?sku=001_25904006&quantity=1
 *     &glueBaseUrl=https://glue.eu.spryker.local
 *     &anonymousId=abc-123&returnUrl=https://yves.eu.spryker.local/cart
 */

import type { SprykerSession } from './types';

export function readSprykerSession(
  search: string = window.location.search
): SprykerSession | null {
  const params = new URLSearchParams(search);
  const sku = params.get('sku');
  const glueBaseUrl = params.get('glueBaseUrl');

  // Require at minimum a SKU and an API base to consider ourselves embedded.
  if (!sku || !glueBaseUrl) {
    return null;
  }

  return {
    sku,
    glueBaseUrl,
    quantity: Number(params.get('quantity')) || 1,
    anonymousId: params.get('anonymousId') ?? undefined,
    returnUrl: params.get('returnUrl') ?? undefined,
    signature: params.get('signature') ?? undefined
  };
}

export function isEmbedded(session: SprykerSession | null): session is SprykerSession {
  return session != null;
}
