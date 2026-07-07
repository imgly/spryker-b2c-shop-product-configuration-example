/**
 * Spryker integration — build the productConfigurationInstance from editor state.
 *
 * This is the bridge between CE.SDK (the scene) and Spryker (the cart). It
 * produces the exact JSON shape the backend PHP plugins consume, so the two
 * sides stay in lock-step.
 *
 * Pricing note: the price is computed exclusively server-side
 * (`TshirtDesignerPriceItemExpanderPlugin`, Zed) from `areas[].printed`. The
 * designer never sends a price — anything a client sent would be overwritten.
 */

import type CreativeEditorSDK from '@cesdk/cesdk-js';

import { BACKDROP_BLOCK_KIND } from '../imgly/plugins/product-backdrop';

import {
  CONFIGURATOR_KEY,
  type ConfigurationArea,
  type DesignConfiguration,
  type DesignDisplayData,
  type ProductConfigurationInstance
} from './types';

/**
 * Inspect each product page (area) and decide whether the shopper actually
 * placed content on it.
 *
 * The ProductBackdrop plugin keeps mockup backdrops at scene level (they are
 * never page children), so page children are exactly the shopper's design
 * blocks. The kind check makes this robust against the plugin ever parenting
 * a backdrop into the page: backdrop blocks are tagged with
 * `BACKDROP_BLOCK_KIND` via `engine.block.setKind()`.
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
    const designChildren = engine.block
      .getChildren(page)
      .filter((child) => engine.block.getKind(child) !== BACKDROP_BLOCK_KIND);
    return { id, printed: designChildren.length > 0 };
  });
}

/**
 * Everything fulfillment needs to print the design, plus the re-editable
 * source. This is the payload `exportAndUploadDesign` hands to object storage.
 */
export interface PrintAssetBundle {
  /** CE.SDK scene archive (.zip) — the re-editable source of the design. */
  archive: Blob;
  /** Print-ready PDF per area, keyed by area id (`front`, `back`, ...). */
  pdfs: Record<string, Blob>;
  /** Small PNG preview per area, keyed by area id. */
  thumbnails: Record<string, Blob>;
}

/**
 * Render the print-ready assets for every area plus the scene archive.
 * A scene archive alone is not printable without a CreativeEngine on the
 * receiving side — fulfillment needs the rendered PDFs.
 */
export async function exportPrintAssets(
  cesdk: CreativeEditorSDK
): Promise<PrintAssetBundle> {
  const engine = cesdk.engine;
  const archive = await engine.scene.saveToArchive();
  const pdfs: Record<string, Blob> = {};
  const thumbnails: Record<string, Blob> = {};

  for (const page of engine.block.findByType('page')) {
    const areaId = engine.block.getName(page);
    // Temporarily disable the page stroke so it doesn't appear in the export.
    engine.block.setStrokeEnabled(page, false);
    try {
      pdfs[areaId] = await engine.block.export(page, {
        mimeType: 'application/pdf'
      });
      thumbnails[areaId] = await engine.block.export(page, {
        mimeType: 'image/png',
        targetWidth: 200,
        targetHeight: 200
      });
    } finally {
      engine.block.setStrokeEnabled(page, true);
    }
  }

  return { archive, pdfs, thumbnails };
}

/**
 * Export the print assets and hand them to object storage.
 *
 * SKETCH: the heavy PDF/PNG/scene assets must not travel through Spryker —
 * only their URL does (see `SendDesignToFulfillmentCommandPlugin`). Replace
 * the TODO with a real upload (S3 presigned PUT, your DAM, ...) and return
 * the URL of the uploaded bundle.
 */
export async function exportAndUploadDesign(
  cesdk: CreativeEditorSDK
): Promise<string | null> {
  const bundle = await exportPrintAssets(cesdk);
  // TODO: upload `bundle` (archive + per-area PDFs/thumbnails) to object
  // storage and return its URL, e.g.:
  // return await uploadToObjectStorage(bundle);
  void bundle;
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
    // NOTE: once the upload above is real, gate this on its success —
    // isComplete is what allows the item through checkout.
    isComplete: true,
    configuration: JSON.stringify(configuration),
    displayData: JSON.stringify(displayData)
  };
}
