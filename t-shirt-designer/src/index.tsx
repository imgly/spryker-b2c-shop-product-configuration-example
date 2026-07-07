/**
 * CE.SDK T-Shirt Designer Starterkit - React Entry Point
 *
 * Creates the editor at the top level and passes it to App as children.
 * This separation allows App to focus on product logic while keeping
 * editor instantiation centralized.
 */

import { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import CreativeEditor from '@cesdk/cesdk-js/react';
import type CreativeEditorSDK from '@cesdk/cesdk-js';

import App from './app/App';
import styles from './app/App.module.css';
import { readSprykerSession } from './spryker/session';

// ============================================================================
// Configuration
// ============================================================================

// When Spryker opened the designer as the external configurator, reuse the
// shopper's anonymous id so CE.SDK user (MAU) tracking counts real shoppers.
const sprykerSession = readSprykerSession();

const config = {
  // Set VITE_CESDK_LICENSE in .env (see .env.example). Without it the editor
  // runs in trial mode and renders a watermark.
  license: import.meta.env.VITE_CESDK_LICENSE,
  userId: sprykerSession?.anonymousId ?? 'starterkit-t-shirt-designer-user',

  // Enable single page mode for t-shirt editing (Front/Back areas)
  featureFlags: {
    singlePageMode: true
  }

  // Engine assets (fonts, icons, UI) load from the IMG.LY CDN by default. To
  // self-host them instead, unzip the imgly-assets bundle into public/ and set
  // `baseURL: '/assets'` here (see README "Download Assets").
};

// ============================================================================
// Main Component
// ============================================================================

function TShirtDesigner() {
  const [cesdk, setCesdk] = useState<CreativeEditorSDK | null>(null);

  const handleInit = useCallback((sdk: CreativeEditorSDK) => {
    // Debug access (remove in production)
    (window as any).cesdk = sdk;
    setCesdk(sdk);
  }, []);

  return (
    <App cesdk={cesdk}>
      <CreativeEditor
        className={styles.editor}
        config={config}
        init={handleInit}
      />
    </App>
  );
}

// ============================================================================
// Render
// ============================================================================

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

const root = createRoot(container);
root.render(<TShirtDesigner />);
