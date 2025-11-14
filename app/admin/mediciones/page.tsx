"use client";

import React from "react";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Input,
    Textarea,
    Divider,
    Chip,
    Select,
    SelectItem,
    Autocomplete,
    AutocompleteItem,
} from "@heroui/react";

type Sex = "male" | "female";

interface BodyMeasure {
    name: string;
    label: string;
    top: number;   // % sobre la figura
    left: number;  // % sobre la figura
}

interface Cliente {
    id_cliente: number;
    nombre: string;
    apellido: string;
    cedula: string;
    correo: string;
    telefono: string;
    activo: boolean;
    fecha_creacion: string;
    genero?: boolean;          // true = masculino, false = femenino
    fecha_nacimiento?: string; // "2002-01-01T00:00:00"
}

const API_BASE = "http://localhost:8000/api/v1";

const BODY_MEASURES: BodyMeasure[] = [
    { name: "neck", label: "Cuello", top: 11, left: 50 },
    { name: "chest", label: "Pecho", top: 22, left: 50 },
    { name: "waist", label: "Cintura", top: 33, left: 50 },
    { name: "hip", label: "Cadera", top: 44, left: 50 },

    { name: "bicepsLeft", label: "Bíceps izq.", top: 22, left: 20 },
    { name: "bicepsRight", label: "Bíceps der.", top: 22, left: 80 },

    { name: "forearmLeft", label: "Antebrazo izq.", top: 34, left: 18 },
    { name: "forearmRight", label: "Antebrazo der.", top: 34, left: 82 },

    { name: "thighLeft", label: "Femoral izq.", top: 56, left: 27 },
    { name: "thighRight", label: "Femoral der.", top: 56, left: 73 },

    { name: "calfLeft", label: "Gemelo izq.", top: 75, left: 32 },
    { name: "calfRight", label: "Gemelo der.", top: 75, left: 68 },
];

// ==== HELPER EDAD ====

function calculateAge(
    birthDateStr: string,
    measureDateStr?: string,
): number | "" {
    if (!birthDateStr) return "";

    const birth = new Date(birthDateStr);
    if (Number.isNaN(birth.getTime())) return "";

    const measure = measureDateStr
        ? new Date(measureDateStr)
        : new Date();

    if (Number.isNaN(measure.getTime())) return "";

    let years = measure.getFullYear() - birth.getFullYear();
    const m = measure.getMonth() - birth.getMonth();
    const d = measure.getDate() - birth.getDate();

    if (m < 0 || (m === 0 && d < 0)) {
        years--;
    }

    return years >= 0 ? years : "";
}

// helper number | "" → number
function numOr0(v: number | ""): number {
    return typeof v === "number" ? v : 0;
}

export default function MedicionPage(): React.JSX.Element {
    const [autoNumber, setAutoNumber] = React.useState("3");
    const [date, setDate] = React.useState(
        new Date().toISOString().slice(0, 16),
    );

    const [birthDate, setBirthDate] = React.useState<string>("");
    const [age, setAge] = React.useState<number | "">("");

    const [sex, setSex] = React.useState<Sex>("male");
    const [weightKg, setWeightKg] = React.useState<number | "">("");
    const [heightCm, setHeightCm] = React.useState<number | "">("");
    const [musclePercent, setMusclePercent] = React.useState<number | "">("");
    const [notes, setNotes] = React.useState("");
    const [registeredBy, setRegisteredBy] = React.useState("12345"); // por si luego lo usas
    const [measurements, setMeasurements] = React.useState<
        Record<string, number | "">
    >(
        () =>
            BODY_MEASURES.reduce(
                (acc, m) => ({ ...acc, [m.name]: "" }),
                {} as Record<string, number | "">,
            ),
    );

    // ==== CLIENTES ====

    const [clientQuery, setClientQuery] = React.useState("");
    const [allClients, setAllClients] = React.useState<Cliente[]>([]);
    const [clientResults, setClientResults] = React.useState<Cliente[]>([]);
    const [selectedClient, setSelectedClient] = React.useState<Cliente | null>(null);
    const [clientLoading, setClientLoading] = React.useState(false);
    const [clientError, setClientError] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function loadClients() {
            try {
                setClientLoading(true);
                setClientError(null);

                let headers: HeadersInit = { "Content-Type": "application/json" };
                try {
                    const token = localStorage.getItem("auth:token");
                    if (token) {
                        headers = {
                            ...headers,
                            Authorization: `Bearer ${token}`,
                        };
                    }
                } catch {
                    // ignore
                }

                const res = await fetch(`${API_BASE}/clientes`, {
                    method: "GET",
                    headers,
                });

                if (!res.ok) {
                    throw new Error(`Error al cargar clientes (${res.status})`);
                }

                const data = await res.json();
                const clientes: Cliente[] = Array.isArray(data) ? data : [];
                setAllClients(clientes);
                setClientResults(clientes);
            } catch (err) {
                console.error(err);
                setClientError("No se pudieron cargar los clientes.");
            } finally {
                setClientLoading(false);
            }
        }

        loadClients();
    }, []);

    React.useEffect(() => {
        const q = clientQuery.trim().toLowerCase();
        if (!q) {
            setClientResults(allClients);
            return;
        }

        const filtered = allClients.filter((c) => {
            const fullName = `${c.nombre} ${c.apellido}`.toLowerCase();
            return (
                fullName.includes(q) ||
                (c.cedula ?? "").toLowerCase().includes(q) ||
                (c.telefono ?? "").toLowerCase().includes(q) ||
                (c.correo ?? "").toLowerCase().includes(q)
            );
        });

        setClientResults(filtered);
    }, [clientQuery, allClients]);

    function handleSelectClient(id: number) {
        const c = allClients.find((x) => x.id_cliente === id) || null;
        setSelectedClient(c);
        if (c) {
            setClientQuery(`${c.nombre} ${c.apellido}`);

            if (c.fecha_nacimiento) {
                setBirthDate(c.fecha_nacimiento);
            } else {
                setBirthDate("");
            }

            if (typeof c.genero === "boolean") {
                setSex(c.genero ? "male" : "female");
            }
        } else {
            setBirthDate("");
        }
    }

    function resetForm() {
        // Fecha actual
        setDate(new Date().toISOString().slice(0, 16));

        // Cliente
        setSelectedClient(null);
        setClientQuery("");
        setBirthDate("");
        setAge("");

        // Datos físicos
        setSex("male");
        setWeightKg("");
        setHeightCm("");
        setMusclePercent("");
        setNotes("");

        // Medidas corporales
        setMeasurements(
            BODY_MEASURES.reduce(
                (acc, m) => ({ ...acc, [m.name]: "" }),
                {} as Record<string, number | "">,
            ),
        );
    }


    // ==== CÁLCULO AUTOMÁTICO EDAD ====
    React.useEffect(() => {
        const years = calculateAge(birthDate, date);
        setAge(years);
    }, [birthDate, date]);

    // ==== CÁLCULOS IMC / GRASA / AGUA ====

    const heightM =
        typeof heightCm === "number" && heightCm > 0 ? heightCm / 100 : null;
    const bmi =
        heightM && typeof weightKg === "number" && weightKg > 0
            ? parseFloat((weightKg / (heightM * heightM)).toFixed(1))
            : null;

    const bmiLabel = React.useMemo(() => {
        if (!bmi) return { text: "—", color: "default" as const };
        if (bmi < 18.5) return { text: "BAJO PESO", color: "warning" as const };
        if (bmi < 25) return { text: "SALUDABLE", color: "success" as const };
        if (bmi < 30) return { text: "SOBREPESO", color: "warning" as const };
        return { text: "OBESIDAD", color: "danger" as const };
    }, [bmi]);

    const bodyFat =
        bmi !== null &&
            bmi !== undefined &&
            typeof age === "number" &&
            age > 0
            ? parseFloat(
                (
                    1.2 * bmi +
                    0.23 * age -
                    10.8 * (sex === "male" ? 1 : 0) -
                    5.4
                ).toFixed(1),
            )
            : null;

    const bodyFatLabel = React.useMemo(() => {
        if (bodyFat === null) return { text: "—", color: "default" as const };

        const bf = bodyFat;
        const isMale = sex === "male";
        const low = isMale ? 8 : 18;
        const high = isMale ? 24 : 31;

        if (bf < low) return { text: "BAJO", color: "warning" as const };
        if (bf <= high) return { text: "ESTÁNDAR", color: "success" as const };
        return { text: "ALTO", color: "danger" as const };
    }, [bodyFat, sex]);

    const waterPercent =
        typeof weightKg === "number" && weightKg > 0
            ? parseFloat((sex === "male" ? 60 : 50).toFixed(1))
            : null;

    const waterLabel = React.useMemo(() => {
        if (waterPercent === null) return { text: "—", color: "default" as const };
        if (waterPercent < 45) return { text: "BAJO", color: "warning" as const };
        if (waterPercent <= 65) return { text: "NORMAL", color: "success" as const };
        return { text: "ALTO", color: "warning" as const };
    }, [waterPercent]);

    // ==== HANDLERS MEDIDAS ====

    function handleMeasurementChange(name: string, value: string) {
        const num = value === "" ? "" : Number(value.replace(",", "."));
        if (num !== "" && Number.isNaN(num)) return;
        setMeasurements((prev) => ({ ...prev, [name]: num }));
    }

    function parseNumber(
        value: string,
        setter: (n: number | "") => void,
    ): void {
        if (value === "") {
            setter("");
            return;
        }
        const num = Number(value.replace(",", "."));
        if (Number.isNaN(num)) return;
        setter(num);
    }

    const silhouetteSrc = sex === "female" ? "/persona2.png" : "/persona.png";
    const silhouetteAlt =
        sex === "female" ? "Figura corporal femenina" : "Figura corporal masculina";


    async function handleSave() {
        if (!selectedClient) {
            alert("Selecciona un cliente antes de guardar la medición.");
            return;
        }

        const payload = {
            id_cliente: selectedClient.id_cliente,

            cuello: numOr0(measurements.neck as any),
            bicep_izquierdo: numOr0(measurements.bicepsLeft as any),
            bicep_derecho: numOr0(measurements.bicepsRight as any),
            pecho: numOr0(measurements.chest as any),
            antebrazo_izquierdo: numOr0(measurements.forearmLeft as any),
            antebrazo_derecho: numOr0(measurements.forearmRight as any),
            cintura: numOr0(measurements.waist as any),
            cadera: numOr0(measurements.hip as any),
            femoral_izquierdo: numOr0(measurements.thighLeft as any),
            femoral_derecho: numOr0(measurements.thighRight as any),
            gemelo_izquierdo: numOr0(measurements.calfLeft as any),
            gemelo_derecho: numOr0(measurements.calfRight as any),
            peso: numOr0(weightKg),
            altura: numOr0(heightCm),
            musculo: numOr0(musclePercent),
            fecha_creacion: new Date().toISOString(),
        };

        try {
            let headers: HeadersInit = { "Content-Type": "application/json" };
            try {
                const token = localStorage.getItem("auth:token");
                if (token) {
                    headers = {
                        ...headers,
                        Authorization: `Bearer ${token}`,
                    };
                }
            } catch {
                // ignore
            }

            const res = await fetch(`${API_BASE}/medidas_corporales`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(`Error al guardar medición (${res.status})`);
            }

            alert("Medición guardada correctamente en /medidas_corporales.");

            // 🔹 AQUÍ LIMPIAMOS TODO
            resetForm();
        } catch (err) {
            console.error(err);
            alert("Ocurrió un error al guardar la medición.");
        }
    }

    return (
        <div className="flex h-full w-full flex-col gap-4">
            <Card className="border border-slate-200 bg-white shadow-xl w-full">
                <CardBody className="space-y-6 p-4 md:p-6">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
                        {/* IZQUIERDA */}
                        <div className="space-y-6">
                            <Card className="border border-slate-200 bg-white">
                                <CardHeader className="pb-0">
                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                        Medidas en centímetros
                                    </h2>
                                </CardHeader>

                                <CardBody className="pt-4 space-y-6">
                                    <div className="hidden justify-center md:flex">
                                        <div className="relative w-full max-w-sm lg:max-w-md">
                                            <img
                                                src={silhouetteSrc}
                                                alt={silhouetteAlt}
                                                className="w-full rounded-2xl border transparent"
                                            />
                                            {BODY_MEASURES.map((m) => (
                                                <div
                                                    key={m.name}
                                                    style={{
                                                        top: `${m.top}%`,
                                                        left: `${m.left}%`,
                                                        transform: "translate(-50%, -50%)",
                                                    }}
                                                    className="absolute flex flex-col items-center gap-1"
                                                >
                                                    <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm">
                                                        {m.label}
                                                    </span>
                                                    <Input
                                                        size="sm"
                                                        type="number"
                                                        className="w-20 bg-white text-[12px]"
                                                        radius="sm"
                                                        variant="bordered"
                                                        aria-label={m.label}
                                                        endContent={
                                                            <span className="text-[10px] text-default-500">
                                                                cm
                                                            </span>
                                                        }
                                                        value={
                                                            measurements[m.name] === ""
                                                                ? ""
                                                                : String(measurements[m.name])
                                                        }
                                                        onChange={(e) =>
                                                            handleMeasurementChange(
                                                                m.name,
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* DERECHA */}
                        <Card className="border border-slate-200 bg-white">
                            {/* Detalles */}
                            <Card className="border border-slate-200 bg-white">
                                <CardHeader className="pb-0">
                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                        Detalles
                                    </h2>
                                </CardHeader>
                                <CardBody className="grid gap-4 pt-3 md:grid-cols-3">
                                    <div className="md:col-span-3 flex flex-col gap-1">
                                        <Autocomplete
                                            size="sm"
                                            label="Cliente"
                                            placeholder="Escribe nombre, cédula, teléfono o correo"
                                            variant="bordered"
                                            defaultItems={clientResults}
                                            inputValue={clientQuery}
                                            onInputChange={(value) => {
                                                setClientQuery(value);
                                                setSelectedClient(null);
                                                setBirthDate("");
                                            }}
                                            selectedKey={
                                                selectedClient
                                                    ? String(selectedClient.id_cliente)
                                                    : null
                                            }
                                            onSelectionChange={(key) => {
                                                if (key) {
                                                    handleSelectClient(Number(key as string));
                                                } else {
                                                    setSelectedClient(null);
                                                    setBirthDate("");
                                                }
                                            }}
                                            isLoading={clientLoading}
                                            isDisabled={
                                                clientLoading && allClients.length === 0
                                            }
                                            errorMessage={clientError ?? undefined}
                                            isInvalid={Boolean(clientError)}
                                        >
                                            {(c: Cliente) => (
                                                <AutocompleteItem
                                                    key={c.id_cliente}
                                                    textValue={`${c.nombre} ${c.apellido}`}
                                                >
                                                    <div className="flex flex-col gap-0.5 text-xs">
                                                        <span className="font-medium">
                                                            {c.nombre} {c.apellido}
                                                        </span>
                                                        <span className="text-[11px] text-default-500">
                                                            CI: {c.cedula} · {c.telefono} ·{" "}
                                                            {c.correo}
                                                        </span>
                                                    </div>
                                                </AutocompleteItem>
                                            )}
                                        </Autocomplete>
                                    </div>

                                    <Input
                                        size="sm"
                                        label="Edad"
                                        type="number"
                                        readOnly
                                        endContent={
                                            <span className="text-xs text-default-500">
                                                años
                                            </span>
                                        }
                                        value={age === "" ? "" : String(age)}
                                    />

                                    <Input
                                        size="sm"
                                        type="number"
                                        label="Peso"
                                        endContent={
                                            <span className="text-xs text-default-500">
                                                kg
                                            </span>
                                        }
                                        value={weightKg === "" ? "" : String(weightKg)}
                                        onChange={(e) =>
                                            parseNumber(e.target.value, setWeightKg)
                                        }
                                    />
                                    <Input
                                        size="sm"
                                        type="number"
                                        label="Altura"
                                        endContent={
                                            <span className="text-xs text-default-500">
                                                cm
                                            </span>
                                        }
                                        value={heightCm === "" ? "" : String(heightCm)}
                                        onChange={(e) =>
                                            parseNumber(e.target.value, setHeightCm)
                                        }
                                    />
                                    <Input
                                        size="sm"
                                        type="number"
                                        label="Músculo"
                                        endContent={
                                            <span className="text-xs text-default-500">
                                                %
                                            </span>
                                        }
                                        value={
                                            musclePercent === ""
                                                ? ""
                                                : String(musclePercent)
                                        }
                                        onChange={(e) =>
                                            parseNumber(
                                                e.target.value,
                                                setMusclePercent,
                                            )
                                        }
                                    />

                                </CardBody>
                            </Card>

                            {/* Resultados */}
                            <CardHeader className="pb-0">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    Resultados obtenidos
                                </h2>
                            </CardHeader>
                            <CardBody className="space-y-4 pt-3">
                                {/* IMC */}
                                <section className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-sm font-semibold text-slate-800">
                                            IMC: índice de masa corporal
                                        </h3>
                                        <Select
                                            size="sm"
                                            defaultSelectedKeys={["peso-altura2"]}
                                            className="max-w-[180px]"
                                            aria-label="Método para IMC"
                                        >
                                            <SelectItem key="peso-altura2">
                                                Peso / altura²
                                            </SelectItem>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <Input
                                            readOnly
                                            size="sm"
                                            label="Resultado"
                                            value={bmi !== null ? String(bmi) : ""}
                                            endContent={
                                                <span className="text-xs text-default-500">
                                                    kg/m²
                                                </span>
                                            }
                                        />
                                        <Chip
                                            size="sm"
                                            color={bmiLabel.color}
                                            variant="flat"
                                            className="min-w-[110px] justify-center text-xs font-semibold"
                                        >
                                            {bmiLabel.text}
                                        </Chip>
                                    </div>
                                </section>

                                <Divider className="bg-slate-200" />

                                {/* Grasa corporal */}
                                <section className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-sm font-semibold text-slate-800">
                                            Grasa corporal
                                        </h3>
                                        <Select
                                            size="sm"
                                            defaultSelectedKeys={["deurenberg"]}
                                            className="max-w-[180px]"
                                            aria-label="Método para grasa corporal"
                                        >
                                            <SelectItem key="deurenberg">
                                                Deurenberg
                                            </SelectItem>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <Input
                                            readOnly
                                            size="sm"
                                            label="Resultado"
                                            value={bodyFat !== null ? String(bodyFat) : ""}
                                            endContent={
                                                <span className="text-xs text-default-500">%</span>
                                            }
                                        />
                                        <Chip
                                            size="sm"
                                            color={bodyFatLabel.color}
                                            variant="flat"
                                            className="min-w-[110px] justify-center text-xs font-semibold"
                                        >
                                            {bodyFatLabel.text}
                                        </Chip>
                                    </div>
                                    <p className="text-[11px] leading-tight text-slate-500">
                                        Cálculo aproximado a partir de IMC, edad y sexo. No
                                        reemplaza una medición profesional.
                                    </p>
                                </section>

                                <Divider className="bg-slate-200" />

                                {/* Agua corporal */}
                                <section className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-sm font-semibold text-slate-800">
                                            Agua / líquido corporal
                                        </h3>
                                        <Select
                                            size="sm"
                                            defaultSelectedKeys={["regla3"]}
                                            className="max-w-[220px]"
                                            aria-label="Método para agua corporal"
                                        >
                                            <SelectItem key="regla3">
                                                Regla de 3 (60% M, 50% F)
                                            </SelectItem>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <Input
                                            readOnly
                                            size="sm"
                                            label="Resultado"
                                            value={
                                                waterPercent !== null ? String(waterPercent) : ""
                                            }
                                            endContent={
                                                <span className="text-xs text-default-500">%</span>
                                            }
                                        />
                                        <Chip
                                            size="sm"
                                            color={waterLabel.color}
                                            variant="flat"
                                            className="min-w-[110px] justify-center text-xs font-semibold"
                                        >
                                            {waterLabel.text}
                                        </Chip>
                                    </div>
                                    <p className="text-[11px] leading-tight text-slate-500">
                                        Estimación general según peso y sexo. Puedes sustituirla
                                        por el valor obtenido en tu balanza profesional.
                                    </p>
                                </section>
                            </CardBody>
                            <CardFooter className="flex items-center justify-end gap-2">
                                <Button variant="flat" color="default">
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleSave}
                                >
                                    Guardar medición
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
