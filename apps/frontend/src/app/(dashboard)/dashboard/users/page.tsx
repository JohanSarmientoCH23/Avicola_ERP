"use client";

import { useState, useEffect } from "react";
import { usersService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface User {
  id: string; email: string; nombre: string; apellido: string;
  rol: string; estado: string; telefono?: string; createdAt: string; lastLoginAt?: string;
}

const ROLES = ["ADMINISTRADOR", "CONTADOR", "RESPONSABLE_PRODUCCION", "GALPONERO", "AUDITOR", "ALMACENISTA"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ email: "", nombre: "", apellido: "", password: "", rol: "GALPONERO", telefono: "" });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await usersService.getAll({ limit: 100 });
      setUsers(res.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createUser = async () => {
    if (!form.email || !form.nombre || !form.apellido || (!editingUser && !form.password)) return;
    try {
      const payload: any = { email: form.email, nombre: form.nombre, apellido: form.apellido, rol: form.rol };
      if (form.telefono) payload.telefono = form.telefono;
      if (!editingUser && form.password) payload.password = form.password;
      if (editingUser) {
        await usersService.update(editingUser.id, payload);
      } else {
        await usersService.create({ ...payload, password: form.password });
      }
      setShowForm(false);
      setEditingUser(null);
      setForm({ email: "", nombre: "", apellido: "", password: "", rol: "GALPONERO", telefono: "" });
      loadUsers();
    } catch (e: any) { alert("Error: " + (e.response?.data?.message || e.message)); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Está seguro de desactivar este usuario?")) return;
    try {
      await usersService.delete(id);
      loadUsers();
    } catch (e: any) { alert("Error: " + (e.response?.data?.message || e.message)); }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setForm({ email: user.email, nombre: user.nombre, apellido: user.apellido, password: "", rol: user.rol, telefono: user.telefono || "" });
    setShowForm(true);
  };

  const getRolBadge = (rol: string) => {
    const colors: Record<string, string> = {
      ADMINISTRADOR: "bg-red-100 text-red-700",
      CONTADOR: "bg-blue-100 text-blue-700",
      RESPONSABLE_PRODUCCION: "bg-yellow-100 text-yellow-700",
      GALPONERO: "bg-green-100 text-green-700",
      AUDITOR: "bg-purple-100 text-purple-700",
      ALMACENISTA: "bg-orange-100 text-orange-700",
    };
    return colors[rol] || "bg-gray-100 text-gray-700";
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex items-center gap-3 text-gray-500"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-sm font-medium">Cargando usuarios...</span></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Gestion de Usuarios</h1>
          <p className="page-subtitle">Administrar cuentas de acceso al sistema</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 sm:w-auto" onClick={() => { setEditingUser(null); setForm({ email: "", nombre: "", apellido: "", password: "", rol: "GALPONERO", telefono: "" }); setShowForm(true); }}>+ Nuevo Usuario</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="p-3 text-left">Nombre</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Rol</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-left">Telefono</th>
                  <th className="p-3 text-left">Creado</th>
                  <th className="p-3 text-left">Ultimo Login</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="p-3 font-medium">{u.nombre} {u.apellido}</td>
                    <td className="p-3 text-gray-500">{u.email}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getRolBadge(u.rol)}`}>{u.rol}</span></td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.estado === "ACTIVO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.estado}</span>
                    </td>
                    <td className="p-3 text-gray-500">{u.telefono || "-"}</td>
                    <td className="p-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-gray-500 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Nunca"}</td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="outline" onClick={() => startEdit(u)}>Editar</Button>
                        {u.estado === "ACTIVO" && <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => deleteUser(u.id)}>Desactivar</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={8} className="p-4 text-center text-gray-400">No hay usuarios registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingUser(null); } }}>
          <div className="modal-content">
            <h2 className="text-lg font-bold mb-4">{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</h2>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500">Nombre *</label><Input placeholder="Nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
              <div><label className="text-xs text-gray-500">Apellido *</label><Input placeholder="Apellido" value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} /></div>
              <div><label className="text-xs text-gray-500">Email *</label><Input type="email" placeholder="email@avicola.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              {!editingUser && <div><label className="text-xs text-gray-500">Password *</label><Input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>}
              <div><label className="text-xs text-gray-500">Rol *</label>
                <select className="input-field w-full" value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-gray-500">Telefono</label><Input placeholder="Telefono (opcional)" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} /></div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditingUser(null); }}>Cancelar</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={createUser}>{editingUser ? "Actualizar" : "Crear"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
