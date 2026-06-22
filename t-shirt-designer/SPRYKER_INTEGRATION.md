# CE.SDK × Spryker — T-Shirt Designer Integration (Reference Sketch)

How the IMG.LY **CreativeEditor SDK** (CE.SDK) t-shirt designer plugs into the
**Spryker Commerce OS** as a custom **product configurator**. This is a wiring
sketch and an architecture reference — not a runnable backend. It shows where
each piece lives, the contract between front and back end, and what remains
stubbed.

> TL;DR — A configurable SKU in Spryker delegates "how do I build this product?"
> to an external app. Here that app is the CE.SDK designer. The designer returns
> a `productConfigurationInstance` (a JSON description of the design); Spryker
> carries it through cart → checkout → order, recomputes the price server-side,
> and hands the print assets to fulfillment.

---

## 1. The Spryker concept: product configurators

Spryker products can be marked **configurable**. A configurable concrete product
is mapped to a **configurator key** in the product-configuration import:

```
# data/import/common/common/product_configuration.csv
concrete_sku,configurator_key,is_complete,default_configuration,default_display_data
001_25904006,TSHIRT_DESIGNER,0,,
002_25904004,TSHIRT_DESIGNER,0,,
```

When a shopper configures such a product, Spryker hands off to the configurator
identified by that key, and receives back a **`ProductConfigurationInstance`**:

| Field             | Meaning                                                       |
| ----------------- | ------------------------------------------------------------ |
| `configuratorKey` | `TSHIRT_DESIGNER` — which configurator produced this         |
| `isComplete`      | May this item be checked out?                                |
| `configuration`   | JSON — the **source of truth** (drives price + fulfillment)  |
| `displayData`     | JSON — human-readable summary for cart/order line display    |

That instance is the single object that travels with the cart item everywhere.

---

## 2. Two integration patterns (and which this uses)

Spryker supports two ways to drive an external configurator:

| Pattern | Handshake | Best for |
| ------- | --------- | -------- |
| **Classic Yves gateway** | Browser redirect to the configurator with a signed (CRC-hashed) request; configurator POSTs back to `ProductConfiguratorGatewayPage`. Strategy plugins (`ProductDetailPage`/`Cart`/`Wishlist`) build the request and handle the response. | Server-rendered (Twig) storefronts |
| **Headless Glue API** ← *this reference* | Designer is a SPA opened with the SKU/context; on add-to-cart it POSTs the `productConfigurationInstance` directly to the **Glue Storefront API**. No CRC handshake. | SPA / decoupled storefronts, modern UX |

This reference targets the **headless Glue** path — matching the note in
`TshirtDesignerPriceExtractorPlugin`: *"the React designer posts the
productConfigurationInstance straight to the Glue Storefront API."* The classic
gateway wiring already exists in the repo
(`ProductConfiguratorGatewayPageDependencyProvider`) if you prefer that path.

---

## 3. End-to-end flow

```mermaid
sequenceDiagram
    participant Shop as Storefront (PDP)
    participant Designer as CE.SDK Designer (this app)
    participant OS as Object Storage
    participant Glue as Glue Storefront API
    participant Zed as Spryker Zed (cart/checkout/OMS)

    Shop->>Designer: open ?sku=001_25904006&quantity=1&glueBaseUrl=…&anonymousId=…
    Note over Designer: shopper picks colour, edits front/back print
    Designer->>OS: export scene + PDFs/PNGs, upload (→ designArchiveUrl)
    Designer->>Glue: POST /guest-cart-items { sku, quantity, productConfigurationInstance }
    Glue->>Zed: add item + persist ProductConfigurationInstance
    Zed-->>Glue: cart (price = base + per-printed-area surcharge)
    Note over Zed: TshirtDesignerPriceExtractorPlugin recomputes price (client price ignored)
    Glue-->>Designer: 201 Created
    Designer->>Shop: redirect to returnUrl (cart)
    Note over Zed: checkout places order
    Zed->>Zed: OMS "send to fulfillment" → SendDesignToFulfillmentCommandPlugin
    Zed->>OS: (downstream) fulfillment fetches print assets by URL
```

---

## 4. The wire contract

`configuration` (the JSON inside `productConfigurationInstance.configuration`)
is the shared contract. **Frontend writes it; backend reads it.** Keep both
sides in sync.

```jsonc
{
  "color": "white",
  "areas": [
    { "id": "front", "printed": true },
    { "id": "back",  "printed": false }
  ],
  "designArchiveUrl": "https://storage.example.com/designs/abc123.zip"
}
```

- **Price** depends on `areas[].printed` →
  `TshirtDesignerPriceExtractorPlugin::countPrintedAreas()`.
- **Fulfillment** depends on `designArchiveUrl`, `color`, `areas` →
  `SendDesignToFulfillmentCommandPlugin::run()`.

The TypeScript type and the PHP plugin are two ends of this one contract —
`src/spryker/types.ts` documents it on the frontend side.

---

## 5. Component map

### Frontend — the designer app (this repo: `t-shirt-designer/`)

| File | Responsibility |
| ---- | -------------- |
| `src/spryker/types.ts` | The wire contract: session + `productConfigurationInstance` shapes. |
| `src/spryker/session.ts` | Parse the launch context (`?sku=…&glueBaseUrl=…`). Returns `null` when standalone. |
| `src/spryker/productConfiguration.ts` | Inspect the CE.SDK scene → printed-area detection, export+upload (**stubbed**), build the instance. Mirrors the PHP price constants for in-editor display. |
| `src/spryker/glueClient.ts` | `POST {glueBaseUrl}/guest-cart-items` with the configured item. |
| `src/app/App.tsx` | `handleAddToCart`: if embedded → build instance + Glue POST + redirect; else demo alert. |

### Backend — Spryker project (`src/Pyz/…`, already in this repo)

| File | Responsibility |
| ---- | -------------- |
| `data/import/common/common/product_configuration.csv` | Marks the two SKUs as `TSHIRT_DESIGNER` configurable. |
| `src/Pyz/Client/ProductConfiguration/Plugin/TshirtDesignerPriceExtractorPlugin.php` | **Authoritative price** from `configuration` (base + per-printed-area surcharge, VAT). |
| `src/Pyz/Client/ProductConfiguration/ProductConfigurationDependencyProvider.php` | Registers the price extractor. |
| `src/Pyz/Zed/Oms/Communication/Plugin/Oms/Command/SendDesignToFulfillmentCommandPlugin.php` | OMS command: forward print-asset **URLs** (not blobs) to fulfillment. |
| `src/Pyz/Zed/Oms/OmsDependencyProvider.php` | Registers the OMS command as `TshirtDesigner/SendToFulfillment`. |
| `config/Zed/oms/TshirtDesignerFulfillment01.xml` | State-machine fragment: `paid → sent to fulfillment → in production → shipped`. |
| `src/Pyz/Glue/ProductConfigurationsRestApi/…` (+ `spryker/product-configurations-rest-api` in composer) | Lets the Glue cart-item endpoint accept `productConfigurationInstance`. |

---

## 6. The integration seams (where you actually plug in)

1. **Mark products configurable** — the import CSV (done).
2. **Launch the designer** — point Spryker's configurator endpoint for
   `TSHIRT_DESIGNER` at this app's host and pass `sku`, `quantity`,
   `glueBaseUrl`, `anonymousId`, `returnUrl`. In the demo deploy the single
   configurator host is set via `SPRYKER_PRODUCT_CONFIGURATOR_HOST`
   (`deploy.*.yml`); for multiple configurators, route by `configurator_key`.
3. **Accept the configuration** — Glue (`product-configurations-rest-api`)
   already maps `productConfigurationInstance` onto the cart item.
4. **Price it** — the Client price-extractor plugin (done).
5. **Fulfill it** — the OMS command + state machine (done); merge the
   `send to fulfillment` step into the process assigned to these SKUs.

---

## 7. Pricing model

Client price is **untrusted** (the SPA talks to Glue directly), so the server
recomputes it from the configuration:

```
gross = BASE (2995¢)  +  printedAreaCount × SURCHARGE (500¢)
net   = round(gross / 1.19)        # 19% VAT backed out
```

The constants live in **both** `TshirtDesignerPriceExtractorPlugin.php`
(authoritative) and `src/spryker/productConfiguration.ts` (display only) — keep
them in sync, or have the frontend read them from a shared config endpoint.

---

## 8. What is stubbed (to make it runnable)

- **Asset upload** — `exportAndUploadDesign()` exports the scene but returns
  `null`. Wire it to S3/your DAM and return the URL → `designArchiveUrl`.
- **Auth & cart lifecycle** — `glueClient` uses a guest cart with an anonymous
  id; add OAuth for logged-in customers, CSRF, and real error handling.
- **Printed-area detection** — `collectPrintedAreas()` is best-effort
  (counts non-backdrop children per page); tighten to your scene structure.
- **Fulfillment dispatch** — `SendDesignToFulfillmentCommandPlugin` logs via
  `error_log`; replace with your print MIS/fulfillment API call (idempotent).
- **License** — set `VITE_CESDK_LICENSE` (see `.env.example`) to remove the
  CE.SDK watermark.

---

## 9. Running the designer standalone

```bash
npm install
npm run dev   # http://localhost:5173  (no Spryker needed; demo add-to-cart = alert)
```

Embedded mode activates automatically when opened with `?sku=…&glueBaseUrl=…`.
```
http://localhost:5173/?sku=001_25904006&quantity=1&glueBaseUrl=https://glue.eu.spryker.local&anonymousId=demo-anon-1&returnUrl=https://yves.eu.spryker.local/cart
```
