# T-Shirt Designer — Spryker Integration Reference

A customized fork of IMG.LY's [CE.SDK](https://img.ly/creative-sdk) t-shirt
designer, wrapped in a storefront-styled product detail page (Louis.de look &
feel) and wired up as a **Spryker** product configurator.

It runs standalone in the browser (no Spryker needed) and, when launched with a
Spryker context, posts the design back to the Glue Storefront API as a
`productConfigurationInstance`.

> **📐 Architecture:** see **[SPRYKER_INTEGRATION.md](./SPRYKER_INTEGRATION.md)**
> for how CE.SDK plugs into the Spryker architecture — the flow diagram, the
> front/back wire contract, the component map, and what is stubbed.

## Quick start

```bash
npm install
npm run dev   # http://localhost:5173  (standalone demo; add-to-cart = alert)
```

Embedded (Spryker configurator) mode activates automatically when opened with a
SKU + Glue base URL:

```
http://localhost:5173/?sku=001_25904006&quantity=1&glueBaseUrl=https://glue.eu.spryker.local&anonymousId=demo-anon-1&returnUrl=https://yves.eu.spryker.local/cart
```

### What's customized here

- **`src/spryker/`** — Spryker integration adapter (session parsing, configuration
  builder, Glue client). See [SPRYKER_INTEGRATION.md](./SPRYKER_INTEGRATION.md).
- **`src/app/`** — Louis.de-style PDP chrome (`StoreHeader`, `Breadcrumb`,
  `ProductInfo`, `FooterTabs`) around the CE.SDK editor; product identity in
  `src/app/product-catalog.ts`.

The backend half (price extractor, OMS command, state machine, import CSV) lives
in the parent Spryker project under `src/Pyz/…` and `config/Zed/oms/…` — also
mapped in [SPRYKER_INTEGRATION.md](./SPRYKER_INTEGRATION.md).

---

## Upstream starter kit

The sections below are from the original IMG.LY starter kit.

<p>
  <a href="https://img.ly/docs/cesdk/js/starterkits/t-shirt-designer-jwinqr/">Documentation</a>
</p>

![T-Shirt Designer starter kit showing a t-shirt customization interface](./hero.webp)

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/imgly/starterkit-t-shirt-designer-react-web.git
cd starterkit-t-shirt-designer-react-web
```

### Install Dependencies

```bash
npm install
```

### Download Assets

CE.SDK requires engine assets (fonts, icons, UI elements) served from your `public/` directory.

```bash
curl -O https://cdn.img.ly/packages/imgly/cesdk-js/$UBQ_VERSION$/imgly-assets.zip
unzip imgly-assets.zip -d public/
rm imgly-assets.zip
```

### Run the Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Configuration

### T-Shirt Product

The t-shirt product is configured in `src/product-catalog.ts`:

```typescript
export const PRODUCT_SAMPLES: ProductConfig[] = [
  {
    id: 'tshirt',
    label: 'Mens T-Shirt',
    designUnit: 'Inch',
    unitPrice: 19.99,
    areas: [
      { id: 'front', label: 'Front', pageSize: { width: 12, height: 12 } },
      { id: 'back', label: 'Back', pageSize: { width: 12, height: 12 } }
    ],
    colors: [/* 10 color options */],
    sizes: [{ id: 'XS' }, { id: 'S' }, { id: 'M' }, { id: 'L' }, { id: 'XL' }]
  }
];
```

### Theming

```typescript
cesdk.ui.setTheme('dark'); // 'light' | 'dark' | 'system'
```

See [Theming](https://img.ly/docs/cesdk/web/ui-styling/theming/) for custom color schemes and styling.

### Localization

```typescript
cesdk.i18n.setTranslations({
  de: { 'common.save': 'Speichern' }
});
cesdk.i18n.setLocale('de');
```

See [Localization](https://img.ly/docs/cesdk/web/ui-styling/localization/) for supported languages and translation keys.

## Architecture

```
src/
├── app/                          # Demo application
├── imgly/
│   ├── backdrop.ts               # Backdrop management
│   ├── config/
│   │   ├── actions.ts                # Export/import actions
│   │   ├── features.ts               # Feature toggles
│   │   ├── i18n.ts                   # Translations
│   │   ├── plugin.ts                 # Main configuration plugin
│   │   ├── settings.ts               # Engine settings
│   │   └── ui/
│   │       ├── canvas.ts                 # Canvas configuration
│   │       ├── components.ts             # Custom component registration
│   │       ├── dock.ts                   # Dock layout configuration
│   │       ├── index.ts                  # Combines UI customization exports
│   │       ├── inspectorBar.ts           # Inspector bar layout
│   │       ├── navigationBar.ts          # Navigation bar layout
│   │       └── panel.ts                  # Panel configuration
│   ├── constants.ts              # Configuration constants
│   ├── index.ts                  # Editor initialization function
│   ├── mask.ts                   # Mask handling
│   ├── page.ts                   # Scene and area management
│   └── types.ts                  # TypeScript type definitions
└── index.tsx                 # Application entry point
```

## Key Capabilities

- **Print Area Editing** – Front and back print areas
- **Color Customization** – 10 color options with real-time preview
- **Size Selection** – XS to XL with quantity counters
- **Real-time Mockup** – See designs on product mockups
- **E-commerce Cart** – Add to cart with price calculation
- **Export** – PDF and PNG export for all areas

## Prerequisites

- **Node.js v20+** with npm – [Download](https://nodejs.org/)
- **Supported browsers** – Chrome 114+, Edge 114+, Firefox 115+, Safari 15.6+

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Editor doesn't load | Verify assets are accessible at `baseURL` |
| Mockups don't appear | Check `public/assets/products/tshirt/` directory |
| Watermark appears | Add your license key |

## Documentation

For complete integration guides and API reference, visit the [T-Shirt Designer Documentation](https://img.ly/docs/cesdk/starterkits/t-shirt-designer/).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Built with <a href="https://img.ly/creative-sdk?utm_source=github&utm_medium=project&utm_campaign=starterkit-t-shirt-designer">CE.SDK</a> by <a href="https://img.ly?utm_source=github&utm_medium=project&utm_campaign=starterkit-t-shirt-designer">IMG.LY</a></p>
