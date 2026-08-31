import Link from 'next/link';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={styles.nav}>
      <ol
        className={styles.list}
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, i) => (
          <li
            key={i}
            className={styles.item}
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {item.href ? (
              <Link href={item.href} className={styles.link} itemProp="item">
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span className={styles.current} itemProp="name" aria-current="page">
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(i + 1)} />
            {i < items.length - 1 && (
              <span className={styles.sep} aria-hidden="true">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
