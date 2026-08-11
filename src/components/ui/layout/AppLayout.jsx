"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faTable,
  faChartLine,
  faCalendar,
  faUserXmark,
  faPlus,
  faPenToSquare,
  faUsers,
  faCalendarCheck,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { useAuthContext } from '@/context/AuthContext';
import styles from './app-layout.module.css';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: faHouse },
  {
    label: 'Asistencia',
    icon: faCalendarCheck,
    children: [
          { href: '/summary', label: 'Diario', icon: faChartLine },
      { href: '/attendance', label: 'Dispositivos', icon: faTable },
  
      { href: '/date-range', label: 'Rango', icon: faCalendar },
    ],
  },
  { href: '/absent', label: 'Ausentes', icon: faUserXmark },
  { href: '/absence/new', label: 'Registrar Ausencia', icon: faPlus },
  { href: '/absence/manage', label: 'Administrar Novedades', icon: faPenToSquare },
  { href: '/users', label: 'Gestión de usuarios', icon: faUsers },
];

export default function AppLayout({ children }) {
  const [expanded, setExpanded] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hydrated } = useAuthContext();
  const hideShell = pathname === '/login';
  const displayUser = hydrated ? user : null;
  const userInitials = displayUser
    ? `${displayUser.firstName?.[0] ?? ''}${displayUser.lastName?.[0] ?? ''}`.toUpperCase() || 'I'
    : '';
  const currentPage = navItems.find((item) => item.href === pathname)?.label || 'Panel';
  const toggleIcon = expanded ? faChevronLeft : faChevronRight;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (hideShell) {
    return <>{children}</>;
  }

  const handleMouseEnter = () => setExpanded(true);
  const handleMouseLeave = () => setExpanded(false);

  useEffect(() => {
    // auto-open submenu if current path matches a child
    const match = navItems.find((item) => item.children && item.children.some((c) => c.href === pathname));
    if (match) setOpenSubmenu(match.label);
  }, [pathname]);

  return (
    <div className={`${styles.appShell} ${expanded ? styles.expandedShell : styles.collapsedShell}`}>
      <aside
        className={`${styles.sidebar} ${expanded ? styles.expanded : styles.collapsed}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>
              <FontAwesomeIcon icon={faCalendarCheck} />
            </span>
            <span className={styles.brandText}>Rixco 1.0</span>
          </div>
           
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            if (item.children) {
              const isOpen = openSubmenu === item.label;
              return (
                <div key={item.label} className={styles.subMenu}>
                  <button
                    type="button"
                    className={`${styles.navLink} ${isOpen ? styles.active : ''} ${styles.subMenuToggle}`}
                    aria-expanded={isOpen}
                    onClick={() => setOpenSubmenu((s) => (s === item.label ? '' : item.label))}
                  >
                    <span className={styles.navIcon}>
                      <FontAwesomeIcon icon={item.icon} />
                    </span>
                    <span className={styles.navLabel}>{item.label}</span>
                    <span className={styles.subMenuBullet} aria-hidden="true" />
                  </button>
                  <div className={`${styles.subNav} ${isOpen ? styles.subNavOpen : ''}`}>
                    {item.children.map((child) => {
                      const isActive = pathname === child.href;
                      return (
                        <a key={child.href} href={child.href} className={`${styles.subNavLink} ${isActive ? styles.active : ''}`}>
                          <span className={styles.navIcon}>
                            <FontAwesomeIcon icon={child.icon} />
                          </span>
                          <span className={styles.navLabel}>{child.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                <span className={styles.navLabel}>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{userInitials || ' '}</div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>
                {displayUser ? `${displayUser.firstName} ${displayUser.lastName}`.trim() : 'Cargando...'}
              </div>
              <div className={styles.userRole}>{displayUser ? displayUser.role : ''}</div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Toggle sidebar"
            className={styles.sidebarToggle}
            onClick={() => setExpanded((s) => !s)}
          >
            <FontAwesomeIcon icon={toggleIcon} />
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitle}>{currentPage}</div>
          </div>
          <div className={styles.headerRight}>
            {displayUser ? (
              <>
                <div className={styles.headerUser}>
                  <div className={styles.headerAvatar}>{userInitials}</div>
                  <div className={styles.headerUserInfo}>
                    <div className={styles.headerUserName}>{`${displayUser.firstName} ${displayUser.lastName}`.trim()}</div>
                    <div className={styles.headerUserMeta}>{displayUser.role}</div>
                  </div>
                </div>
                <button className={styles.logoutButton} type="button" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className={styles.headerLoading}>Cargando usuario...</div>
            )}
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}