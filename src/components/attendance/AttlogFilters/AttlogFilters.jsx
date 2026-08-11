    import { useEffect, useState } from 'react';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faFileLines, faMagnifyingGlass, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
    import styles from './AttlogFilters.module.css';

    export default function AttlogFilters({
        date,
        toDate,
        showRange = false,
        search,
        device = 'all',
        onDateChange,
        onToDateChange,
        onSearchChange,
        onDeviceChange,
        onClearSearch,
        onSubmit,
        title = 'Registros del día',
        useForm = true,
        showDateButton = true,
        showDevice = true,
        showSubmitInDateArea = false,
        submitLabel = 'Buscar',
        searchResults = [],
        selectedEmployeeIds = [],
        onEmployeeToggle,
        }) {
    const [localDevice, setLocalDevice] = useState(device);

    useEffect(() => {
        setLocalDevice(device);
    }, [device]);

    const handleDeviceClick = (d) => {
        setLocalDevice(d);
        if (onDeviceChange) onDeviceChange(d);
    };

    const handleClear = () => {
        if (onClearSearch) onClearSearch();
    };

    const showClearButton = Boolean(search && String(search).trim());

    return (
        <div className={styles.container}>
        <h2 className={styles.title}>
            <FontAwesomeIcon icon={faFileLines} style={{ marginRight: 12, color: 'var(--primary)' }} />
            {title}
        </h2>

                <div className={styles.filtersBar}>
                        {useForm ? (
                            <form method="get" action="/" className={styles.dateFilter} id="dateFilterForm" onSubmit={onSubmit}>
                                <input type="date" name="date" id="dateInput" value={date} onChange={onDateChange} required />
                                {showRange && (
                                        <input type="date" name="toDate" id="toDateInput" value={toDate} onChange={onToDateChange} required />
                                )}
                                {showDateButton && (
                                    <button type="submit" className={styles.dateButton}>
                                            <FontAwesomeIcon icon={faMagnifyingGlass} style={{ marginRight: 6 }} />Buscar
                                    </button>
                                )}
                            </form>
                        ) : (
                            <div className={styles.dateFilter} id="dateFilterForm">
                                <input type="date" name="date" id="dateInput" value={date} onChange={onDateChange} required />
                                {showRange && (
                                        <input type="date" name="toDate" id="toDateInput" value={toDate} onChange={onToDateChange} required />
                                )}
                            </div>
                        )}

                        <div className={styles.searchBox}>
                        <FontAwesomeIcon icon={faSearch} />
                        <input type="text" id="searchInput" placeholder="Buscar por nombre..." value={search} onChange={onSearchChange} autoComplete="off" />
                        {showClearButton && (
                                <button type="button" id="clearSearch" className={styles.clearSearch} title="Limpiar búsqueda" onClick={handleClear}>
                                <FontAwesomeIcon icon={faTimes} />
                                </button>
                        )}

                        {Array.isArray(searchResults) && searchResults.length > 0 && (
                            <div className={styles.employeeSearchResults}>
                                {searchResults.slice(0, 10).map((employee) => {
                                    const id = String(employee.employeedID || employee.id);
                                    const checked = selectedEmployeeIds.includes(id);
                                    return (
                                        <label key={id} className={styles.employeeOption}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => onEmployeeToggle && onEmployeeToggle(id)}
                                                className={styles.checkboxInput}
                                            />
                                            <span className={styles.checkboxVisual} aria-hidden="true" />
                                            <div className={styles.employeeNameText}>{employee.personName || ''}</div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                        </div>

                        {showDevice && (
                            <div className={styles.deviceFilter} id="deviceFilter">
                                <button type="button" className={`${styles.deviceOption} ${localDevice === 'interno' ? styles.active : ''}`} data-device="interno" onClick={() => handleDeviceClick('interno')}>Interno</button>
                                <button type="button" className={`${styles.deviceOption} ${localDevice === 'externo' ? styles.active : ''}`} data-device="externo" onClick={() => handleDeviceClick('externo')}>Externo</button>
                            </div>
                        )}
                        {showSubmitInDateArea && (
                            <div>
                                <button type={useForm ? 'submit' : 'button'} className={styles.dateButton} onClick={!useForm ? onSubmit : undefined}>
                                    <FontAwesomeIcon icon={faMagnifyingGlass} style={{ marginRight: 8 }} />
                                    {submitLabel}
                                </button>
                            </div>
                        )}
        </div>
        </div>
    );
    }
