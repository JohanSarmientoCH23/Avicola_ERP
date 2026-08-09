"use client";

import { useEffect, useState } from "react";
import { galponesService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Galpon {
  id: string;
  codigo: string;
  capacidad: number;
  gallinasActuales: number;
  estado: string;
  descripcion?: string;
  lote?: { id: string; nombre: string } | null;
}

export default function GalponesPage() {
  const [galpones, setGalpones] = useState<Galpon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ codigo: "", capacidad: "", gallinasActuales: "", descripcion: "", estado: "ACTIVO" });
  const [saving, setSaving] = useState(false);
  const [userRol, setUserRol] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try { setUserRol(JSON.parse(stored).rol || ""); } catch {}
      }
    }
    loadGalpones();
  }, []);

  const loadGalpones = async () => {
    try {
      const response = await galponesService.getAll();
      setGalpones(response.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const openNew = () => {
    setEditId(null);
    setForm({ codigo: "", capacidad: "", gallinasActuales: "0", descripcion: "", estado: "ACTIVO" });
    setShowForm(true);
  };

  const openEdit = (g: Galpon) => {
    setEditId(g.id);
    setForm({
      codigo: g.codigo,
      capacidad: String(g.capacidad),
      gallinasActuales: String(g.gallinasActuales),
      descripcion: g.descripcion || "",
      estado: g.estado,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.codigo || !form.capacidad) return;
    setSaving(true);
    try {
      const payload = {
        codigo: form.codigo,
        capacidad: parseInt(form.capacidad),
        gallinasActuales: parseInt(form.gallinasActuales) || 0,
        descripcion: form.descripcion || undefined,
        estado: form.estado as any,
      };
      if (editId) {
        await galponesService.update(editId, payload);
      } else {
        await galponesService.create(payload);
      }
      setShowForm(false);
      loadGalpones();
    } catch (e: any) {
      alert("Error: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const toggleEstado = async (g: Galpon) => {
    const newEstado = g.estado === "ACTIVO" ? "MANTENIMIENTO" : "ACTIVO";
    try {
      await galponesService.update(g.id, { estado: newEstado });
      loadGalpones();
    } catch (e: any) {
      alert("Error: " + (e.response?.data?.message || e.message));
    }
  };

  const deleteGalpon = async (g: Galpon) => {
    if (!confirm(`Desea eliminar el Galpon ${g.codigo}?`)) return;
    try {
      await galponesService.delete(g.id);
      loadGalpones();
    } catch (e: any) {
      alert("Error: " + (e.response?.data?.message || e.message));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Cargando galpones...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Galpones</h1>
          <p className="text-muted-foreground text-sm">Gestion de galpones de la granja</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 sm:w-auto" onClick={openNew}>+ Nuevo Galpon</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {galpones.map((galpon) => {
          const ocupacion = galpon.capacidad > 0 ? (galpon.gallinasActuales / galpon.capacidad) * 100 : 0;
          return (
            <Card key={galpon.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Galpon {galpon.codigo}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    galpon.estado === "ACTIVO" ? "bg-green-100 text-green-700" :
                    galpon.estado === "MANTENIMIENTO" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>{galpon.estado}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Capacidad</p>
                    <p className="font-medium">{galpon.capacidad.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gallinas actuales</p>
                    <p className="font-medium">{galpon.gallinasActuales.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ocupacion</p>
                    <p className="font-medium">{ocupacion.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lote</p>
                    <p className="font-medium">{galpon.lote?.nombre || "Sin asignar"}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(ocupacion, 100)}%` }}></div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(galpon)}>Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleEstado(galpon)}>
                    {galpon.estado === "ACTIVO" ? "Mantenimiento" : "Activar"}
                  </Button>
                  {userRol === "ADMINISTRADOR" && (
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => deleteGalpon(galpon)}>Eliminar</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showForm && (
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>{editId ? "Editar Galpon" : "Nuevo Galpon"}</h2>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "4px" }}>Codigo *</label>
              <input
                type="text"
                placeholder="Ej: 1A, 2B"
                value={form.codigo}
                onChange={e => setForm({...form, codigo: e.target.value})}
                disabled={!!editId}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", opacity: editId ? 0.6 : 1 }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "4px" }}>Capacidad *</label>
              <input
                type="number"
                placeholder="Ej: 25000"
                value={form.capacidad}
                onChange={e => setForm({...form, capacidad: e.target.value})}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "4px" }}>Gallinas actuales</label>
              <input
                type="number"
                placeholder="0"
                value={form.gallinasActuales}
                onChange={e => setForm({...form, gallinasActuales: e.target.value})}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "4px" }}>Estado</label>
              <select
                value={form.estado}
                onChange={e => setForm({...form, estado: e.target.value})}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "4px" }}>Descripcion</label>
              <input
                type="text"
                placeholder="Descripcion opcional"
                value={form.descripcion}
                onChange={e => setForm({...form, descripcion: e.target.value})}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowForm(false)}
                style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", cursor: "pointer", backgroundColor: "white" }}
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "14px", cursor: "pointer", backgroundColor: "#16a34a", color: "white", border: "none", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Guardando..." : editId ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
