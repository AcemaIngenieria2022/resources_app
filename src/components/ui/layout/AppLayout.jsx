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
  faPenToSquare,
  faUsers,
  faCalendarCheck,
  faChevronLeft,
  faChevronRight,
  faBuilding,
  faUser,
  faClipboardList,
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
          { href: '/absent', label: 'Ausentes', icon: faUserXmark },
      { href: '/attendance', label: 'Dispositivos', icon: faTable },
  
      { href: '/date-range', label: 'Rango', icon: faCalendar },
    ],
  },
  {
    label: 'Novedades',
    icon: faClipboardList,
    children: [
      { href: '/absence/manage', label: 'Administrar', icon: faPenToSquare },
      { href: '/leave-requests', label: 'Validaciones', icon: faClipboardList },
    ],
  },
  {
    label: 'Gestión de usuarios',
    icon: faUsers,
    children: [
      { href: '/collaborators', label: 'Colaboradores', icon: faBuilding },
      { href: '/users', label: 'Cuentas', icon: faUser },
    ],
  },
];

const roleDescriptions = {
  admin: 'Administrador',
  hr: 'RR.HH.',
  rrhh: 'RR.HH.',
  supervisor: 'Supervisor',
  approver: 'Aprobador',
  user: 'Usuario',
};

export default function AppLayout({ children }) {
  const [expanded, setExpanded] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hydrated } = useAuthContext();
  const hideShell = pathname === '/login' || pathname === '/register-novelty' || pathname === '/registrar-novedad';
  const displayUser = hydrated ? user : null;
  const normalizedRole = String(displayUser?.role || '').toLowerCase().replace(/[.\s]/g, '');
  const isHumanResources = normalizedRole === 'hr' || normalizedRole === 'rrhh';
  const isApprover = normalizedRole === 'approver' || normalizedRole === 'leader';
  const isUserManagementRoute = pathname === '/users' || pathname === '/collaborators';
  const roleDescription = displayUser?.roleDescription || roleDescriptions[normalizedRole] || displayUser?.role || '';
  const userInitials = displayUser
    ? `${displayUser.firstName?.[0] ?? ''}${displayUser.lastName?.[0] ?? ''}`.toUpperCase() || 'I'
    : '';
  const currentItem = navItems.find(
    (item) => item.href === pathname || item.children?.some((child) => child.href === pathname)
  );
  const currentPage = currentItem?.children?.find((child) => child.href === pathname)?.label
    || currentItem?.label
    || 'Panel';
  const toggleIcon = expanded ? faChevronLeft : faChevronRight;

  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    window.setTimeout(() => {
      logout();
      router.push('/loading?next=/login');
    }, 500);
  };
  // Ensure Hooks are always called in the same order by placing
  // the effect before any early return.
  useEffect(() => {
    // auto-open submenu if current path matches a child
    const match = navItems.find((item) => item.children && item.children.some((c) => c.href === pathname));
    if (!match) return undefined;
    const timer = window.setTimeout(() => {
      setOpenSubmenus((current) => current.includes(match.label) ? current : [...current, match.label]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/login' || !displayUser) {
      const timer = window.setTimeout(() => setIsLoggingOut(false), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [pathname, displayUser]);

  useEffect(() => {
    if (hydrated && (isHumanResources || isApprover) && isUserManagementRoute) {
      router.replace('/dashboard');
    }
  }, [hydrated, isApprover, isHumanResources, isUserManagementRoute, router]);

  if (hideShell) {
    return <>{children}</>;
  }

  const handleMouseEnter = () => setExpanded(true);
  const handleMouseLeave = () => setExpanded(false);

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
          {navItems
            .filter((item) => {
              if (normalizedRole === 'supervisor') {
                return item.label === 'Inicio' || item.label === 'Asistencia';
              }
              return !(isHumanResources || isApprover) || item.label !== 'Gestión de usuarios';
            })
            .map((item) => {
            if (item.children) {
              const isOpen = openSubmenus.includes(item.label);
              return (
                <div key={item.label} className={styles.subMenu}>
                  <button
                    type="button"
                    className={`${styles.navLink} ${isOpen ? styles.active : ''} ${styles.subMenuToggle}`}
                    aria-expanded={isOpen}
                    onClick={() => setOpenSubmenus((current) => (
                      current.includes(item.label)
                        ? current.filter((label) => label !== item.label)
                        : [...current, item.label]
                    ))}
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
              <div className={styles.userRole}>{roleDescription}</div>
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
                    <div className={styles.headerUserMeta}>{roleDescription}</div>
                  </div>
                </div>
                <button className={styles.logoutButton} type="button" onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
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