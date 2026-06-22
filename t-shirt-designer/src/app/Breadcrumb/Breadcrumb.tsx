/**
 * Breadcrumb trail — Louis.de look & feel.
 */

import styles from './Breadcrumb.module.css';

interface BreadcrumbProps {
  trail: string[];
}

export function Breadcrumb({ trail }: BreadcrumbProps) {
  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {trail.map((item, index) => {
        const isLast = index === trail.length - 1;
        return (
          <span key={item} className={styles.item}>
            {isLast ? (
              <span className={styles.current}>{item}</span>
            ) : (
              <a href="#" className={styles.link}>
                {item}
              </a>
            )}
            {!isLast && <span className={styles.sep}>/</span>}
          </span>
        );
      })}
    </nav>
  );
}
