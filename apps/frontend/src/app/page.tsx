"use client";

import { useState } from "react";
import { authService } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await authService.login(email, password);
      window.location.href = result.user?.rol === "GALPONERO" ? "/dashboard/production" : "/dashboard";
    } catch (err: any) {
      setError(err.response?.data?.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  const quickRoles = [
    { label: "Administrador", email: "admin@avicola.com" },
    { label: "Contador", email: "contador@avicola.com" },
    { label: "Galponero", email: "galponero@avicola.com" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF8FF]">
      {/* Left Hero Branding */}
      <section className="relative w-full lg:w-[52%] xl:w-[55%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden text-white min-h-[500px] lg:min-h-screen" style={{ background: "linear-gradient(135deg, #0b2a20 0%, #114232 60%, #0f172a 100%)" }}>
        {/* Overlay */}
        <div className="absolute inset-0 z-10" style={{ background: "radial-gradient(ellipse at top left, rgba(16,185,129,0.15) 0%, transparent 60%)" }} />

        {/* Top Branding */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 flex-shrink-0 rounded-xl shadow-xl" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>
              <rect width="48" height="48" rx="12" fill="#114232"/>
              <path d="M24 10C17.5 10 13 16 13 24C13 32 17.8 38 24 38C30.2 38 35 32 35 24C35 16 30.5 10 24 10Z" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M24 16V32M18 24H30" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="4" fill="#F59E0B"/>
              <path d="M33 13L37 9M37 13L33 9" stroke="#34D399" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-white uppercase">AVÍCOLA</span>
                <span className="text-xs font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 tracking-wider">ERP</span>
              </div>
              <p className="text-xs text-emerald-300/80 font-medium tracking-wide">Agro-Industrial Precision Suite</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white/90 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="font-medium tracking-wide">Plataforma V2.4</span>
            <span className="text-white/40">•</span>
            <span className="text-emerald-300 font-mono text-[11px]">Conexión Segura SSL/TLS</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 my-auto py-10 lg:py-16 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-5">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
            Operación de Aves de Postura &amp; Bio-Control
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight mb-5">
            Control inteligente para una operación avícola eficiente.
          </h1>
          <p className="text-slate-300 text-base sm:text-lg mb-8 font-light leading-relaxed">
            Centraliza recolección diaria de postura, control biológico de lotes y despacho logístico sin desfases ni errores manuales.
          </p>
          <ul className="space-y-4 text-sm text-slate-200">
            {[
              <><strong className="text-white font-semibold">Monitoreo biométrico y postura en tiempo real:</strong> Detección instantánea de variaciones por galpón y edad del lote.</>,
              <><strong className="text-white font-semibold">Conciliación inteligente OCR vs hojas de cálculo:</strong> Digitalización sin fricción de planillas operativas de campo.</>,
              <><strong className="text-white font-semibold">Trazabilidad completa:</strong> Supervisión granular de galpones, consumo de silos y clasificación de inventario.</>,
            ].map((text, i) => (
              <li key={i} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mt-0.5 text-emerald-300">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" />
                  </svg>
                </div>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Floating Stat Card */}
        <div className="relative z-20 pt-4">
          <div className="rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 max-w-lg shadow-2xl" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.16)" }}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/25 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black tracking-tight text-white">+48.000</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Huevos / Día</span>
                </div>
                <p className="text-xs text-slate-300">Procesados hoy con <span className="text-emerald-400 font-semibold">99.4% de precisión operativa</span></p>
              </div>
            </div>
            <div className="hidden sm:block text-right border-l border-white/10 pl-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Auditoría</span>
              <span className="text-xs font-medium text-emerald-200">Granja Llano Grande</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Auth Form */}
      <section className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between bg-[#FAF8FF] px-6 py-8 sm:px-12 lg:px-16 xl:px-20 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-slate-200/80 mb-6 sm:mb-8">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
            <select className="bg-transparent text-xs font-medium text-slate-600 border-none focus:ring-0 cursor-pointer py-1 pr-6 pl-0" defaultValue="es">
              <option value="es">Español (CO)</option>
              <option value="en">English (US)</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium text-[11px] tracking-wide">Sistemas Operativos 100%</span>
          </div>
        </header>

        {/* Form */}
        <div className="my-auto w-full max-w-md mx-auto">
          <div className="mb-6 text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-900 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-900" />
              Portal Empresarial Seguro
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Iniciar Sesión</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Ingresa tus credenciales para acceder a la gestión de <strong className="text-slate-800 font-medium">Granja Llano Grande</strong>.
            </p>
          </div>

          {/* Quick Role Switcher */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-500 mb-2">Acceso rápido por perfil (Demostración):</label>
            <div className="grid grid-cols-3 gap-2">
              {quickRoles.map((role) => (
                <button
                  key={role.email}
                  type="button"
                  onClick={() => { setEmail(role.email); setPassword(""); }}
                  className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition duration-150 flex items-center justify-center gap-1 ${
                    email === role.email
                      ? "border-emerald-900 bg-emerald-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="email">
                Correo Electrónico Corporativo
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@avicola.com"
                  required
                  className="block w-full pl-11 pr-4 py-2.5 sm:py-3 text-sm bg-white border border-slate-300 rounded-xl placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 transition duration-150"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="password">
                  Contraseña de Seguridad
                </label>
                <button type="button" className="text-xs font-semibold text-emerald-900 hover:text-emerald-600 hover:underline transition">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu clave de acceso"
                  required
                  className="block w-full pl-11 pr-11 py-2.5 sm:py-3 text-sm bg-white border border-slate-300 rounded-xl placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold text-white bg-emerald-900 hover:bg-emerald-800 active:bg-emerald-950 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-800 transition duration-150 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verificando credenciales...
                  </>
                ) : (
                  <>
                    <span>Ingresar a AVÍCOLA ERP</span>
                    <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3 rounded-lg bg-amber-50/70 border border-amber-200/60 flex items-start space-x-2.5">
            <svg className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
            <p className="text-[11px] text-amber-900 leading-snug">
              <strong>Acceso restringido:</strong> Exclusivo para colaboradores autorizados de operaciones avícolas. Sesiones auditadas bajo protocolo SAG &amp; DIAN.
            </p>
          </div>

          {/* Credentials Help */}
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 mb-2 font-medium">Credenciales de demostración:</p>
            <div className="text-xs space-y-1 text-slate-600">
              <p><span className="font-semibold text-slate-800">Admin:</span> admin@avicola.com</p>
              <p><span className="font-semibold text-slate-800">Contador:</span> contador@avicola.com</p>
              <p><span className="font-semibold text-slate-800">Galponero:</span> galponero@avicola.com</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400 mt-6">
          <div className="flex flex-wrap justify-center items-center gap-3">
            <span className="font-medium text-slate-500">AVÍCOLA ERP v2.4</span>
            <span>•</span>
            <a className="hover:text-emerald-800 transition" href="#">Soporte Técnico</a>
            <span>•</span>
            <a className="hover:text-emerald-800 transition" href="#">Política de Privacidad</a>
            <span>•</span>
            <span>Granja Llano Grande S.A.S.</span>
          </div>
        </footer>
      </section>
    </div>
  );
}
