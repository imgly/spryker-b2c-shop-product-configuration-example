/**
 * Product information column — Louis.de look & feel.
 *
 * Combines storefront PDP elements (brand, title, rating, size selection,
 * price, add-to-cart) with the personalizer-specific controls (colour swatches
 * and front/back print-area selector) that drive the CE.SDK scene.
 */

import { useState } from 'react';
import classNames from 'classnames';

import { ProductConfig, ProductColor } from '../product-catalog';
import { ColorPicker } from '../ColorPicker/ColorPicker';
import { AreaSelector } from '../AreaSelector/AreaSelector';
import styles from './ProductInfo.module.css';

interface ProductInfoProps {
  product: ProductConfig;
  color: ProductColor;
  areaId: string;
  onColorChange: (color: ProductColor) => void;
  onAreaChange: (areaId: string) => void;
  onAddToCart: (data: {
    size: string;
    quantity: number;
    totalPrice: number;
  }) => void;
  onExportRequest: () => void;
}

const PRICE = (value: number) => `${value.toFixed(2).replace('.', ',')} €`;

export function ProductInfo({
  product,
  color,
  areaId,
  onColorChange,
  onAreaChange,
  onAddToCart,
  onExportRequest
}: ProductInfoProps) {
  const sizes = product.sizes ?? [];
  const [size, setSize] = useState<string>(sizes[1]?.id ?? sizes[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);

  const unitPrice = product.unitPrice ?? 0;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    onAddToCart({ size, quantity, totalPrice });
  };

  return (
    <section className={styles.info}>
      <p className={styles.brand}>{product.brand}</p>
      <h1 className={styles.title}>{product.label}</h1>
      {product.subtitle && <p className={styles.subtitle}>{product.subtitle}</p>}

      <p className={styles.artNo}>Art. No. {product.artNo}</p>

      <div className={styles.ratingRow}>
        <span className={styles.stars} aria-label="5 von 5 Sternen">
          ★★★★★
        </span>
        <a href="#" className={styles.reviewLink}>
          1 Bewertung
        </a>
      </div>

      {/* Colour (personalizer) */}
      <ColorPicker
        colors={product.colors}
        selectedColor={color}
        onSelect={onColorChange}
      />

      {/* Size selection */}
      <div className={styles.block}>
        <div className={styles.sizeHeader}>
          <span className={styles.blockTitle}>Größe wählen</span>
          <a href="#" className={styles.sizeChart}>
            Größentabelle
          </a>
        </div>
        <div className={styles.sizes}>
          {sizes.map((s) => (
            <button
              key={s.id}
              className={classNames(styles.sizeButton, {
                [styles.sizeButtonActive]: s.id === size
              })}
              onClick={() => setSize(s.id)}
            >
              {s.id}
            </button>
          ))}
        </div>
      </div>

      {/* Print area (personalizer) */}
      <AreaSelector
        areas={product.areas}
        selectedAreaId={areaId}
        colorId={color.id}
        onSelect={onAreaChange}
      />

      {/* Price */}
      <div className={styles.priceBlock}>
        {product.listPrice && (
          <p className={styles.listPrice}>
            UVP {PRICE(product.listPrice)} <sup>2</sup>
          </p>
        )}
        <p className={styles.price}>
          {PRICE(unitPrice)} <sup>1</sup>
        </p>
      </div>

      {/* Quantity + add to cart */}
      <div className={styles.cartRow}>
        <div className={styles.quantity}>
          <button
            className={styles.qtyButton}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Weniger"
          >
            −
          </button>
          <span className={styles.qtyValue}>{quantity}</span>
          <button
            className={styles.qtyButton}
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Mehr"
          >
            +
          </button>
        </div>
        <button
          className={styles.addToCart}
          disabled={!size || quantity < 1}
          onClick={handleAddToCart}
        >
          IN DEN WARENKORB
        </button>
        <button className={styles.wishlist} aria-label="Auf den Merkzettel">
          ♡
        </button>
      </div>

      <p className={styles.priceNote}>
        <sup>1</sup> Alle Preise inkl. gesetzl. MwSt. (Deutschland).
        <br />
        Versandkosten: 5,99 € (ab 199,00 € Bestellwert gratis).
        <br />
        <sup>2</sup> Preisangabe ohne Personalisierung; finaler Preis je nach
        bedruckten Flächen.
      </p>

      <button className={styles.downloadLink} onClick={onExportRequest}>
        Druckdaten herunterladen (PDF / PNG)
      </button>
    </section>
  );
}
