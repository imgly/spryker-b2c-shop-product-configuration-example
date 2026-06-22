/**
 * Product detail footer tabs — Louis.de look & feel.
 *
 * Static demo content; the "Beschreibung" tab carries copy for the
 * personalizable jersey.
 */

import { useState } from 'react';
import classNames from 'classnames';

import styles from './FooterTabs.module.css';

const TABS = [
  'Beschreibung',
  'Dokumente (1)',
  'Bewertung (1)',
  'Alle Varianten',
  'Noch Fragen?'
];

export function FooterTabs() {
  const [active, setActive] = useState(0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabBar}>
        {TABS.map((tab, index) => (
          <button
            key={tab}
            className={classNames(styles.tab, {
              [styles.tabActive]: index === active
            })}
            onClick={() => setActive(index)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        {active === 0 ? (
          <>
            <h2 className={styles.heading}>TECHSTAR ARCH MX Jersey</h2>
            <p>
              Leichtes, atmungsaktives Motocross-Jersey mit feuchtigkeits&shy;-
              ableitendem Gewebe und ergonomischem Schnitt. Jetzt individuell
              gestaltbar: Bedrucke Vorder- und Rückseite mit eigenen Grafiken,
              Texten und Logos im integrierten Designer.
            </p>
            <ul className={styles.list}>
              <li>Personalisierbare Druckflächen (Vorder- &amp; Rückseite)</li>
              <li>10 Grundfarben zur Auswahl</li>
              <li>Digitaldruck, waschbeständig</li>
              <li>Druckdaten-Export als PDF &amp; PNG</li>
            </ul>
          </>
        ) : (
          <p className={styles.placeholder}>
            Demo-Inhalt — in einer echten Spryker-Integration speist sich dieser
            Bereich aus den Produktdaten des Shops.
          </p>
        )}
      </div>
    </div>
  );
}
