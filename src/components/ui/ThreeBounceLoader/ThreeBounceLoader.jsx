'use client';

import styles from './ThreeBounceLoader.module.css';

// Loader reutilizable para indicar carga con tres puntos animados y personalización visual básica.
export default function ThreeBounceLoader({ 
  size = 8, 
  className = '',
  color = '#36BBA7',
}) {
  return (
    <div className={`${styles.loaderContainer} ${className}`.trim()}>
      <div className={styles.loader}>
        <span 
          className={styles.dot} 
          style={{ width: size, height: size, backgroundColor: color }} 
        />
        <span 
          className={styles.dot} 
          style={{ width: size, height: size, backgroundColor: color, animationDelay: '0.16s' }} 
        />
        <span 
          className={styles.dot} 
          style={{ width: size, height: size, backgroundColor: color, animationDelay: '0.32s' }} 
        />
      </div>
    </div>
  );
}