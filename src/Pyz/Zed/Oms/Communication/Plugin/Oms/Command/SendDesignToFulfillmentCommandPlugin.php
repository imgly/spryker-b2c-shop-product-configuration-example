<?php

/**
 * Designer integration — OMS command that forwards a configured order item's
 * print assets to fulfillment. Registered in OmsDependencyProvider as
 * 'TshirtDesigner/SendToFulfillment' and triggered by the state machine
 * (see config/Zed/oms/TshirtDesignerFulfillment01.xml).
 *
 * The heavy PNG/PDF assets live in object storage; only their URLs travel
 * through Spryker, so this command forwards references, not blobs.
 */

declare(strict_types = 1);

namespace Pyz\Zed\Oms\Communication\Plugin\Oms\Command;

use Generated\Shared\Transfer\OrderTransfer;
use Orm\Zed\Sales\Persistence\SpySalesOrderItem;
use Spryker\Zed\Oms\Business\Util\ReadOnlyArrayObject;
use Spryker\Zed\Oms\Communication\Plugin\Oms\Command\CommandByItemInterface;

class SendDesignToFulfillmentCommandPlugin implements CommandByItemInterface
{
    protected const CONFIGURATOR_KEY = 'TSHIRT_DESIGNER';

    /**
     * @param \Orm\Zed\Sales\Persistence\SpySalesOrderItem $orderItem
     * @param \Generated\Shared\Transfer\OrderTransfer $orderTransfer
     * @param \Spryker\Zed\Oms\Business\Util\ReadOnlyArrayObject $data
     *
     * @return array
     */
    public function run(SpySalesOrderItem $orderItem, OrderTransfer $orderTransfer, ReadOnlyArrayObject $data): array
    {
        foreach ($orderTransfer->getItems() as $itemTransfer) {
            if ($itemTransfer->getIdSalesOrderItem() !== $orderItem->getIdSalesOrderItem()) {
                continue;
            }

            $configurationInstance = $itemTransfer->getProductConfigurationInstance();
            if ($configurationInstance === null
                || $configurationInstance->getConfiguratorKey() !== static::CONFIGURATOR_KEY
            ) {
                return [];
            }

            $configuration = json_decode((string)$configurationInstance->getConfiguration(), true) ?: [];

            $this->dispatchToFulfillment([
                'orderReference' => $orderTransfer->getOrderReference(),
                'salesOrderItemId' => $orderItem->getIdSalesOrderItem(),
                'sku' => $orderItem->getSku(),
                'quantity' => $orderItem->getQuantity(),
                'designArchiveUrl' => $configuration['designArchiveUrl'] ?? null,
                'color' => $configuration['color'] ?? null,
                'areas' => $configuration['areas'] ?? [],
            ]);
        }

        return [];
    }

    /**
     * Replace with a real call to your print MIS / fulfillment API. Keep it
     * idempotent — OMS may retry. Logged here so the recipe runs without an
     * external service.
     *
     * @param array $payload
     *
     * @return void
     */
    protected function dispatchToFulfillment(array $payload): void
    {
        error_log('[TshirtDesigner] dispatch to fulfillment: ' . json_encode($payload));
    }
}
