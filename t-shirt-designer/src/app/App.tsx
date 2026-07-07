/**
 * CE.SDK T-Shirt Designer - Main App Component
 *
 * Orchestrates all product-related logic and wraps the CE.SDK editor in a
 * storefront-styled product detail page (Louis.de look & feel). The imgly
 * folder stays product-agnostic; product-specific operations are mapped here
 * onto the generic scene actions.
 *
 * The CreativeEditor component is passed as children from index.tsx, while the
 * cesdk instance is provided via prop for product operations.
 */

import { useEffect, useState, type ReactNode } from 'react';
import type CreativeEditorSDK from '@cesdk/cesdk-js';

import { initTShirtDesigner } from '../imgly';

import { PRODUCT_SAMPLES, ProductColor } from './product-catalog';
import {
  setupSceneOptions,
  storeProductMetadata,
  downloadProductAssets
} from './utils/product';
import { StoreHeader } from './StoreHeader/StoreHeader';
import { Breadcrumb } from './Breadcrumb/Breadcrumb';
import { ProductInfo } from './ProductInfo/ProductInfo';
import { FooterTabs } from './FooterTabs/FooterTabs';
import { readSprykerSession } from '../spryker/session';
import { buildProductConfigurationInstance } from '../spryker/productConfiguration';
import { addConfiguredItemToCart } from '../spryker/glueClient';
import styles from './App.module.css';

// Detected once at load: present only when Spryker opened the designer as the
// external configurator (see ../spryker/session.ts). null ⇒ standalone demo.
const sprykerSession = readSprykerSession();

// ============================================================================
// Types
// ============================================================================

interface AppProps {
  cesdk: CreativeEditorSDK | null;
  children: ReactNode;
}

const BREADCRUMB = [
  'Startseite',
  'Bekleidung & Helme',
  'Textilbekleidung',
  'Motocrossbekleidung',
  'Techstar Arch'
];

// ============================================================================
// App Component
// ============================================================================

export default function App({ cesdk, children }: AppProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [areaId, setAreaId] = useState('front');
  const [color, setColor] = useState<ProductColor>(
    PRODUCT_SAMPLES[0].colors.find((color) => color.isDefault) ||
      PRODUCT_SAMPLES[0].colors[0]
  );

  const product = PRODUCT_SAMPLES[0];

  // Initialize product scene when cesdk becomes available
  useEffect(() => {
    if (!cesdk || isInitialized) return;

    const initializeProduct = async () => {
      // Initialize editor (plugins, UI, actions)
      await initTShirtDesigner(cesdk);

      // Set up default product scene (t-shirt)
      const defaultColor =
        product.colors.find((c) => c.isDefault) || product.colors[0];

      await cesdk.actions.run(
        'product.setupScene',
        setupSceneOptions(product, defaultColor)
      );
      storeProductMetadata(cesdk, product, defaultColor);

      // Switch to first area
      await cesdk.actions.run('product.switchArea', product.areas[0].id);

      // Update React state
      setAreaId(product.areas[0].id);
      setColor(defaultColor);
      setIsInitialized(true);
    };

    initializeProduct();
  }, [cesdk, isInitialized, product]);

  // ============================================================================
  // Callbacks
  // ============================================================================

  const handleAreaChange = async (newAreaId: string) => {
    if (!cesdk) return;
    setAreaId(newAreaId);
    await cesdk.actions.run('product.switchArea', newAreaId);
  };

  const handleColorChange = async (newColor: ProductColor) => {
    if (!cesdk) return;

    setColor(newColor);

    // Swap backdrop images for the new color via the plugin's variable
    // substitution action.
    const enabledAreas = product.areas
      .filter((area) => !area.disabled)
      .map((area) => ({ id: area.id, mockup: area.mockup }));
    await cesdk.actions.run(
      'product.applyVariables',
      { color: newColor.id },
      enabledAreas
    );

    const scene = cesdk.engine.scene.get();
    if (scene != null) {
      cesdk.engine.block.setMetadata(scene, 'color', JSON.stringify(newColor));
    }

    // Refresh view
    await cesdk.actions.run('product.switchArea', areaId);
  };

  const handleExportRequest = async () => {
    if (!cesdk) return;
    // Export every area to PDF + thumbnail plus the scene archive and
    // trigger the downloads.
    await downloadProductAssets(cesdk);
  };

  const handleAddToCart = async (data: {
    size: string;
    quantity: number;
    totalPrice: number;
  }) => {
    const enabledAreaIds = product.areas
      .filter((area) => !area.disabled)
      .map((area) => area.id);

    // Embedded in Spryker: build the productConfigurationInstance from the live
    // scene and POST it to the Glue Storefront API. The server recomputes the
    // authoritative price (TshirtDesignerPriceItemExpanderPlugin, Zed) — we
    // never send it. See ../spryker and SPRYKER_INTEGRATION.md.
    if (sprykerSession && cesdk) {
      const instance = await buildProductConfigurationInstance(
        cesdk,
        color.id,
        enabledAreaIds
      );
      const result = await addConfiguredItemToCart(
        { ...sprykerSession, quantity: data.quantity },
        instance
      );
      if (result.ok && sprykerSession.returnUrl) {
        window.location.assign(sprykerSession.returnUrl);
        return;
      }
      // eslint-disable-next-line no-console
      console.log('Glue add-to-cart result:', result, instance);
      alert(
        result.ok
          ? 'Konfiguriertes Produkt wurde dem Warenkorb hinzugefügt.'
          : `Warenkorb-Aufruf fehlgeschlagen (HTTP ${result.status}).`
      );
      return;
    }

    // Standalone demo fallback.
    // eslint-disable-next-line no-console
    console.log('Add to cart (demo):', {
      product: product.label,
      color: color.id,
      size: data.size,
      quantity: data.quantity,
      totalPrice: `${data.totalPrice.toFixed(2).replace('.', ',')} €`
    });
    alert(
      `In den Warenkorb gelegt:\n` +
        `${product.brand} ${product.label}\n` +
        `Größe: ${data.size} · Menge: ${data.quantity} · Farbe: ${color.id}\n` +
        `Gesamt: ${data.totalPrice.toFixed(2).replace('.', ',')} €`
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={styles.page}>
      <StoreHeader />
      <Breadcrumb trail={BREADCRUMB} />

      <main className={styles.product}>
        <div className={styles.editorColumn}>{children}</div>

        <ProductInfo
          product={product}
          color={color}
          areaId={areaId}
          onColorChange={handleColorChange}
          onAreaChange={handleAreaChange}
          onAddToCart={handleAddToCart}
          onExportRequest={handleExportRequest}
        />
      </main>

      <FooterTabs />
    </div>
  );
}
