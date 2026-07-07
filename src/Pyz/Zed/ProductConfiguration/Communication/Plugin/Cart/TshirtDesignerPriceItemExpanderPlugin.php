<?php

/**
 * Designer integration — authoritative server-side pricing for the headless
 * t-shirt/jersey designer (configuratorKey = TSHIRT_DESIGNER).
 *
 * In the headless Glue flow the designer POSTs the productConfigurationInstance
 * to /guest-cart-items. Spryker's stock wiring then prices the item from
 * `ProductConfigurationInstance::prices` — which would come from the client and
 * therefore cannot be trusted. This item expander runs in Zed on every cart
 * change and OVERWRITES `prices` with values computed from the configuration
 * JSON (base + per-printed-area surcharge), discarding whatever the client sent.
 *
 * Downstream, the demo shop's existing wiring picks these prices up:
 *  - ProductConfigurationPriceProductExpanderPlugin (PriceCartConnector) merges
 *    `instance.prices` into the price-product collection during recalculation.
 *  - ProductConfigurationPriceProductFilterPlugin (Service\PriceProduct)
 *    selects them by the price dimension's configuration hash.
 *
 * Registration: Pyz\Zed\Cart\CartDependencyProvider::getExpanderPlugins(),
 * BEFORE ProductConfigurationGroupKeyItemExpanderPlugin — group keys hash the
 * whole instance including prices, so prices must be final first.
 */

declare(strict_types = 1);

namespace Pyz\Zed\ProductConfiguration\Communication\Plugin\Cart;

use ArrayObject;
use Generated\Shared\Transfer\CartChangeTransfer;
use Generated\Shared\Transfer\CurrencyTransfer;
use Generated\Shared\Transfer\MoneyValueTransfer;
use Generated\Shared\Transfer\PriceProductDimensionTransfer;
use Generated\Shared\Transfer\PriceProductTransfer;
use Generated\Shared\Transfer\ProductConfigurationInstanceTransfer;
use Spryker\Shared\ProductConfiguration\ProductConfigurationConfig;
use Spryker\Zed\CartExtension\Dependency\Plugin\ItemExpanderPluginInterface;
use Spryker\Zed\Kernel\Communication\AbstractPlugin;

class TshirtDesignerPriceItemExpanderPlugin extends AbstractPlugin implements ItemExpanderPluginInterface
{
    protected const CONFIGURATOR_KEY = 'TSHIRT_DESIGNER';

    /** Base unit price in cents. The server is the single source of truth. */
    protected const BASE_UNIT_PRICE_GROSS = 2995;

    /** Surcharge per printed area, in cents. */
    protected const PRINT_AREA_SURCHARGE_GROSS = 500;

    protected const DEFAULT_CURRENCY = 'EUR';
    protected const VAT_DIVISOR = 1.19;

    /**
     * @uses \Spryker\Shared\PriceProduct\PriceProductConfig::PRICE_TYPE_DEFAULT
     */
    protected const PRICE_TYPE_DEFAULT = 'DEFAULT';

    /**
     * {@inheritDoc}
     * - Recomputes the authoritative price of TSHIRT_DESIGNER items from the
     *   configuration JSON and overwrites any client-supplied instance prices.
     *
     * @param \Generated\Shared\Transfer\CartChangeTransfer $cartChangeTransfer
     *
     * @return \Generated\Shared\Transfer\CartChangeTransfer
     */
    public function expandItems(CartChangeTransfer $cartChangeTransfer): CartChangeTransfer
    {
        foreach ($cartChangeTransfer->getItems() as $itemTransfer) {
            $productConfigurationInstanceTransfer = $itemTransfer->getProductConfigurationInstance();
            if ($productConfigurationInstanceTransfer === null
                || $productConfigurationInstanceTransfer->getConfiguratorKey() !== static::CONFIGURATOR_KEY
            ) {
                continue;
            }

            $productConfigurationInstanceTransfer->setPrices(new ArrayObject([
                $this->createPriceProductTransfer($productConfigurationInstanceTransfer),
            ]));
        }

        return $cartChangeTransfer;
    }

    /**
     * @param \Generated\Shared\Transfer\ProductConfigurationInstanceTransfer $productConfigurationInstanceTransfer
     *
     * @return \Generated\Shared\Transfer\PriceProductTransfer
     */
    protected function createPriceProductTransfer(
        ProductConfigurationInstanceTransfer $productConfigurationInstanceTransfer
    ): PriceProductTransfer {
        $grossAmount = static::BASE_UNIT_PRICE_GROSS
            + ($this->countPrintedAreas($productConfigurationInstanceTransfer) * static::PRINT_AREA_SURCHARGE_GROSS);
        $netAmount = (int)round($grossAmount / static::VAT_DIVISOR);

        // The dimension hash only needs to identify this configuration so the
        // price filter can match it during recalculation; a hash of the
        // configuration JSON is stable and unique per distinct design.
        $priceProductDimensionTransfer = (new PriceProductDimensionTransfer())
            ->setType(ProductConfigurationConfig::PRICE_DIMENSION_PRODUCT_CONFIGURATION)
            ->setProductConfigurationInstanceHash(
                md5(static::CONFIGURATOR_KEY . ':' . (string)$productConfigurationInstanceTransfer->getConfiguration()),
            );

        $moneyValueTransfer = (new MoneyValueTransfer())
            ->setCurrency((new CurrencyTransfer())->setCode(static::DEFAULT_CURRENCY))
            ->setGrossAmount($grossAmount)
            ->setNetAmount($netAmount);

        return (new PriceProductTransfer())
            ->setPriceTypeName(static::PRICE_TYPE_DEFAULT)
            ->setIsMergeable(false)
            ->setPriceDimension($priceProductDimensionTransfer)
            ->setMoneyValue($moneyValueTransfer);
    }

    /**
     * @param \Generated\Shared\Transfer\ProductConfigurationInstanceTransfer $productConfigurationInstanceTransfer
     *
     * @return int
     */
    protected function countPrintedAreas(
        ProductConfigurationInstanceTransfer $productConfigurationInstanceTransfer
    ): int {
        $configuration = json_decode(
            (string)$productConfigurationInstanceTransfer->getConfiguration(),
            true
        );

        if (!is_array($configuration) || !isset($configuration['areas'])) {
            return 0;
        }

        return count(array_filter(
            $configuration['areas'],
            static fn ($area): bool => !empty($area['printed'])
        ));
    }
}
