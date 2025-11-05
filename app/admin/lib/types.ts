// lib/types.ts
export type EstadoSucursal = "Abierta" | "Cerrada" | "Mantenimiento";
export type TierKey = "oro" | "plata" | "bronce" | "neutral";

export type ApiGimnasio = {
    id_gimnasio: number; id_empresa: number; nombre: string; direccion: string;
    telefono: string; correo: string; activo: number; fecha_creacion: string;
};

export type ApiHorarioGimnasio = {
    id_gimnasio: number; dia_semana: number; hora_apertura: string; hora_cierre: string;
    id_horario_gimnasio: number; activo: boolean;
};

export type ApiPrecioMembresia = {
    id_gimnasio: number; tipo: string; precio: number; fecha_creacion: string;
    id_precio_membresia: number; activo: boolean;
};

export type ApiEmpleado = {
    id_empleado: number; nombre: string; apellido: string; cedula: string; correo: string;
    telefono: string; id_empresa: number; id_gimnasio: number; id_tipo_empleado: number;
    fecha_creacion: string; activo: boolean;
};

export type ApiEstadoPago = { nombre: string; id_estado_pago: number; activo: boolean; };
export type ApiMetodoPago = { nombre: string; id_metodo_pago: number; activo: boolean; };

export type ApiCliente = {
    nombre: string; apellido: string; cedula: string; correo: string; telefono: string;
    fecha_creacion: string; id_cliente: number; activo: boolean; id_gimnasio?: number | null;
    contrasena?: string;
};

export type ApiMembresia = {
    id_gimnasio: number; id_cliente: number; id_metodo_pago: number; id_estado_pago: number;
    unidad_duracion: string; cantidad_duracion: number; precio_unitario: number; descuento: number;
    precio_total: number; fecha_creacion: string; fecha_inicio: string; fecha_expiracion: string;
    renovable: boolean; id_membresia: number; activo: boolean;
};

export type SucursalView = {
    id: string; gymId: string; nombre: string; ciudad: string; estado: EstadoSucursal;
    miembros: number; aforo: number; checkinsHoy: number; telefono?: string; correo?: string;
    fechaCreacion?: string;
};
