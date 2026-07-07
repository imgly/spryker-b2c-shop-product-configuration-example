/**
 * Spryker integration — shared types.
 *
 * These mirror the Spryker transfer objects involved in the product
 * configurator flow. Field names match the JSON the backend reads:
 *
 *  - The Zed cart item expander (`TshirtDesignerPriceItemExpanderPlugin`)
 *    reads `configuration.areas[].printed` to compute the authoritative price.
 *  - The OMS command (`SendDesignToFulfillmentCommandPlugin`) reads
 *    `configuration.designArchiveUrl`, `configuration.color`,
 *    `configuration.areas`.
 *
 * Keep this file in sync with those PHP plugins — it is the wire contract.
 */

/** The configurator key registered for this product family in Spryker. */
export const CONFIGURATOR_KEY = 'TSHIRT_DESIGNER';

/**
 * Launch context passed to the designer when Spryker opens it as the external
 * configurator for a configurable SKU. For the headless (Glue) flow these
 * arrive as query parameters; for the classic Yves gateway flow they arrive in
 * a signed payload (see SPRYKER_INTEGRATION.md).
 */
export interface SprykerSession {
  /** Concrete SKU being configured, e.g. `001_25904006`. */
  sku: string;
  /** Requested quantity (defaults to 1). */
  quantity: number;
  /** Base URL of the Glue Storefront API, e.g. `https://glue.eu.spryker.local`. */
  glueBaseUrl: string;
  /**
   * Anonymous customer id for guest carts (X-Anonymous-Customer-Unique-Id).
   * Effectively required: the Glue guest-cart endpoints reject requests
   * without it. Also reused as the CE.SDK `userId` for MAU tracking.
   */
  anonymousId?: string;
  /** Storefront URL to return the shopper to after add-to-cart. */
  returnUrl?: string;
  /**
   * Opaque integrity token echoed back to Spryker (classic gateway flow only).
   * Unused in the headless Glue flow.
   */
  signature?: string;
}

/** One print area as it appears in the persisted configuration. */
export interface ConfigurationArea {
  /** Area id — must match the import (`front`, `back`, ...). */
  id: string;
  /** True when the shopper placed at least one element in this area. */
  printed: boolean;
}

/**
 * The source-of-truth configuration JSON. Stringified into
 * `productConfigurationInstance.configuration`. The backend recomputes price
 * and routes fulfillment from exactly these fields.
 *
 * Deliberately out of scope for this reference: variant selection (size). In
 * a real shop the chosen size maps to a different concrete SKU *before* the
 * designer is launched — it is not part of the design configuration.
 */
export interface DesignConfiguration {
  color: string;
  areas: ConfigurationArea[];
  /** Object-storage URL of the exported print assets (PDF/PNG + scene). */
  designArchiveUrl: string | null;
}

/** Human-readable summary shown in cart / order line items. */
export interface DesignDisplayData {
  color: string;
  printedAreas: string[];
  summary: string;
}

/**
 * Spryker `ProductConfigurationInstance` transfer (the cross-cutting payload
 * carried from cart → checkout → order). `configuration` and `displayData` are
 * JSON-encoded strings, as Spryker stores them.
 */
export interface ProductConfigurationInstance {
  configuratorKey: string;
  isComplete: boolean;
  configuration: string;
  displayData: string;
}
