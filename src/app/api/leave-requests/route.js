// Script de sincronización temporal para prueba de integración con la base local.
const mysql = require('mysql2/promise');

// Inserta un permiso de ejemplo en la tabla leave_requests para validar la sincronización.
async function sincronizarPermisos() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '', // Reemplaza con tu contraseña real
        database: 'thirdpartydb'
    });

    try {
        console.log('Consultando registros para sincronizar...');

        // Datos de ejemplo (aquí luego mapearemos los datos que vienen de tu lista de SharePoint)
        const nuevoPermiso = {
            fullName: "Ejemplo Usuario",
            email: "usuario@acema.com",
            identificationID: "12345678",
            position: "Ingeniero",
            phone: "3001234567",
            directSupervisor: "Jefe Directo",
            leaveClass: "Cita médica"
        };

        // 1. Como la tabla exige un employee_id (llave foránea), 
        // primero buscamos al empleado en la tabla 'employees' usando su identificación.
        const [employees] = await connection.execute(
            'SELECT id FROM employees WHERE identification = ?', // Asegúrate de que la columna en 'employees' se llame identification o ajústala si es distinta
            [nuevoPermiso.identificationID]
        );

        if (employees.length === 0) {
            console.error(`Error: No se encontró un empleado registrado con la identificación ${nuevoPermiso.identificationID}`);
            return;
        }

        const employeeId = employees[0].id;

        // 2. Insertar en la tabla 'leave_requests' con las columnas correctas del esquema
        const query = `
            INSERT INTO leave_requests 
            (employee_id, form_full_name, form_email, identification_id, form_position, form_phone, direct_supervisor, leave_class, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        `;

        await connection.execute(query, [
            employeeId,
            nuevoPermiso.fullName,
            nuevoPermiso.email,
            nuevoPermiso.identificationID,
            nuevoPermiso.position,
            nuevoPermiso.phone,
            nuevoPermiso.directSupervisor,
            nuevoPermiso.leaveClass
        ]);

        console.log('¡Registro guardado exitosamente en la base de datos local!');

    } catch (error) {
        console.error('Error en la sincronización:', error);
    } finally {
        await connection.end();
    }
}

sincronizarPermisos();