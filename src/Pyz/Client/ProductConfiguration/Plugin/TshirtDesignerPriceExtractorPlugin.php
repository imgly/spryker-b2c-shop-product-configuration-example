<?php

/**
 * Designer integration — server-side price calculation for the headless
 * t-shirt/jersey designer (configuratorKey = TSHIRT_DESIGNER).
 *
 * The React designer posts the productConfigurationInstance straight to the
 * Glue Storefront API (no Yves redirect / CRC handshake), so the client price
 * is untrusted. This plugin recomputes the authoritative price from the
 * configuration JSON (base + per-printed-area surcharge); the result feeds cart
 * re-pricing and the checkout pre-condition. Register it alongside the demo
 * shop's existing price extractor in ProductConfigurationDependencyProvider.
 */

declare(strict_types = 1);

namespace Pyz\Client\ProductConfiguration\Plugin;

use Generated\Shared\Transfer\CurrencyTransfer;
use Generated\Shared\Transfer\MoneyValueTransfer;
use Generated\Shared\Transfer\PriceProductTransfer;
use Generated\Shared\Transfer\ProductConfigurationInstanceTransfer;
use Spryker\Client\ProductConfigurationExtension\Dependency\Plugin\ProductConfigurationPriceExtractorPluginInterface;

class TshirtDesignerPriceExtractorPlugin implements ProductConfigurationPriceExtractorPluginInterface
{
    protected const CONFIGURATOR_KEY = 'TSHIRT_DESIGNER';

    /** Base unit price in cents — mirror in frontend config + mock server. */
    protected const BASE_UNIT_PRICE_GROSS = 2995;

    /** Surcharge per printed area, in cents. */
    protected const PRINT_AREA_SURCHARGE_GROSS = 500;

    protected const DEFAULT_CURRENCY = 'EUR';
    protected const VAT_DIVISOR = 1.19;

    /**
     * @param \Generated\Shared\Transfer\ProductConfigurationInstanceTransfer $productConfigurationInstanceTransfer
     *
     * @return array<\Generated\Shared\Transfer\PriceProductTransfer>
     */
    public function extractProductPrices(
        ProductConfigurationInstanceTransfer $productConfigurationInstanceTransfer
    ): array {
        if ($productConfigurationInstanceTransfer->getConfiguratorKey() !== static::CONFIGURATOR_KEY) {
            return [];
        }

        $printedAreaCount = $this->countPrintedAreas($productConfigurationInstanceTransfer);
        $grossAmount = static::BASE_UNIT_PRICE_GROSS
            + ($printedAreaCount * static::PRINT_AREA_SURCHARGE_GROSS);
        $netAmount = (int)round($grossAmount / static::VAT_DIVISOR);

        $moneyValueTransfer = (new MoneyValueTransfer())
            ->setCurrency((new CurrencyTransfer())->setCode(static::DEFAULT_CURRENCY))
            ->setGrossAmount($grossAmount)
            ->setNetAmount($netAmount);

        return [
            (new PriceProductTransfer())->setMoneyValue($moneyValueTransfer),
        ];
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
