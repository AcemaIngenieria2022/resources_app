'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './DashboardCard.module.css';

// Tarjeta reutilizable para cada acceso principal del dashboard.
export default function DashboardCard({ icon, title, description, href, draggable, onDragStart, onDragOver, onDrop, style }) {
  return (
    <Link
      href={href}
      className={styles.card}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={style}
    >
      <span className={styles.iconBox} aria-hidden="true">
        <FontAwesomeIcon icon={icon} />
      </span>
      <span className={styles.copy}>
        <span className={styles.title}>{title}</span>
        <span className={styles.description}>{description}</span>
      </span>
    </Link>
  );
}
