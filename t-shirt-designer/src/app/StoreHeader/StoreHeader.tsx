/**
 * Storefront header — Louis.de look & feel.
 *
 * Pure presentational chrome (logo, search, utility icons, category nav).
 * No CE.SDK interaction; lives outside the editor so the same shell can wrap
 * the designer whether it runs standalone or as Spryker's configurator host.
 */

import styles from './StoreHeader.module.css';

const CATEGORIES = [
  'BEKLEIDUNG & HELME',
  'TECHNIK & FREIZEIT',
  'SALE %',
  'MARKEN',
  'MAGAZIN',
  'SERVICE'
];

export function StoreHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <a className={styles.logo} href="#" aria-label="Louis">
          <img
            className={styles.logoImg}
            src="https://cdn5.louis.de/Yves/assets/v4-299-0/default/img/logo.svg"
            alt="Louis"
          />
        </a>

        <div className={styles.search}>
          <input
            className={styles.searchInput}
            placeholder="Suchbegriff"
            aria-label="Suchbegriff"
          />
          <button className={styles.searchButton} aria-label="Suchen">
            ⌕
          </button>
        </div>

        <div className={styles.utils}>
          <button className={styles.iconButton} aria-label="Filialen">⌖</button>
          <button className={styles.iconButton} aria-label="Vergleichen">⇄</button>
          <button className={styles.iconButton} aria-label="Merkzettel">♡</button>
          <button className={styles.iconButton} aria-label="Warenkorb">🛒</button>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <ul className={styles.navList}>
            {CATEGORIES.map((label) => (
              <li key={label}>
                <a
                  href="#"
                  className={
                    label === 'SALE %' ? styles.navLinkSale : styles.navLink
                  }
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <a href="#" className={styles.account}>
            <span className={styles.accountIcon}>👤</span> ANMELDEN
          </a>
        </div>
      </nav>
    </header>
  );
}
