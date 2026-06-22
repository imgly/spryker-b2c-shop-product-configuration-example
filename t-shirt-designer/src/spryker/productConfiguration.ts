/**
 * Spryker integration — build the productConfigurationInstance from editor state.
 *
 * This is the bridge between CE.SDK (the scene) and Spryker (the cart). It
 * produces the exact JSON shape the backend PHP plugins consume, so the two
 * sides stay in lock-step.
 */

import type CreativeEditorSDK from '@cesdk/cesdk-js';

import {
  CONFIGURATOR_KEY,
  type ConfigurationArea,
  type DesignConfiguration,
  type DesignDisplayData,
  type ProductConfigurationInstance
} from './types';

/**
 * Price constants — MUST mirror `TshirtDesignerPriceExtractorPlugin` (PHP).
 * The server price is authoritative; this is for in-editor display only.
 */
const BASE_UNIT_PRICE_GROSS = 2995; // cents
const PRINT_AREA_SURCHARGE_GROSS = 500; // cents per printed area

/**
 * Inspect each product page (area) and decide whether the shopper actually
 * placed content on it. A page is "printed" when it has any child block other
 * than the mockup backdrop.
 */
export function collectPrintedAreas(
  cesdk: CreativeEditorSDK,
  areaIds: string[]
): ConfigurationArea[] {
  const engine = cesdk.engine;
  const pagesByName = new Map<string, number>();
  for (const page of engine.block.findByType('page')) {
    pagesByName.set(engine.block.getName(page), page);
  }

  return areaIds.map((id) => {
    const page = pagesByName.get(id);
    if (page == null) return { id, printed: false };
    // Backdrop is a graphic the plugin tags; treat any extra child as design.
    const children = engine.block.getChildren(page);
    const designChildren = children.filter((child) => {
      const name = engine.block.getName(child);
      return name !== 'backdrop' && name !== 'mockup';
    });
    return { id, printed: designChildren.length > 0 };
  });
}

/** Gross unit price in cents for the current configuration (display only). */
export function computeUnitPriceGross(areas: ConfigurationArea[]): number {
  const printed = areas.filter((a) => a.printed).length;
  return BASE_UNIT_PRICE_GROSS + printed * PRINT_AREA_SURCHARGE_GROSS;
}

/**
 * Export the scene + per-area print files and hand them to object storage.
 *
 * SKETCH: the heavy PNG/PDF/scene assets must not travel through Spryker — only
 * their URL does (see `SendDesignToFulfillmentCommandPlugin`). Replace the body
 * with a real upload (S3 presigned PUT, your DAM, etc.) and return the URL.
 */
export async function exportAndUploadDesign(
  cesdk: CreativeEditorSDK
): Promise<string | null> {
  const archive = await cesdk.engine.scene.saveToArchive();
  // TODO: upload `archive` (a Blob) to object storage and return its URL.
  // return await uploadToObjectStorage(archive);
  void archive;
  return null;
}

/**
 * Assemble the full `ProductConfigurationInstance` ready to send to Spryker.
 */
export async function buildProductConfigurationInstance(
  cesdk: CreativeEditorSDK,
  color: string,
  areaIds: string[]
): Promise<ProductConfigurationInstance> {
  const areas = collectPrintedAreas(cesdk, areaIds);
  const designArchiveUrl = await exportAndUploadDesign(cesdk);

  const configuration: DesignConfiguration = { color, areas, designArchiveUrl };

  const printedAreas = areas.filter((a) => a.printed).map((a) => a.id);
  const displayData: DesignDisplayData = {
    color,
    printedAreas,
    summary:
      printedAreas.length > 0
        ? `${color} · bedruckt: ${printedAreas.join(', ')}`
        : `${color} · unbedruckt`
  };

  return {
    configuratorKey: CONFIGURATOR_KEY,
    isComplete: true,
    configuration: JSON.stringify(configuration),
    displayData: JSON.stringify(displayData)
  };
}
