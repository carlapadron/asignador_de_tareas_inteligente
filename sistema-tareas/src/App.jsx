import React, { useState, useEffect } from 'react';

// --- DATOS INICIALES ---
const DEFAULT_EMPLOYEES = [
  { id: 1, name: "Carlos Gómez", role: "Frontend Developer", password: "123", skills: ["frontend", "react", "tailwind", "javascript", "css", "ui"] },
  { id: 2, name: "María Rodríguez", role: "Backend Developer", password: "123", skills: ["backend", "node", "express", "sql", "python", "api", "jwt", "stripe"] },
  { id: 3, name: "Juan Pérez", role: "Fullstack Engineer", password: "123", skills: ["frontend", "backend", "react", "node", "sql", "javascript", "pdf"] }
];

const DEFAULT_TASKS = [
  {
    id: 1,
    title: "Diseñar Dashboard Principal con React & Liquid Glass",
    category: "Frontend",
    requiredSkills: ["frontend", "react", "tailwind"],
    assignedTo: "Carlos Gómez",
    status: "En Progreso",
    createdAt: "2026-08-12"
  }
];

export default function App() {
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('tm_employees');
    return saved ? JSON.parse(saved) : DEFAULT_EMPLOYEES;
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tm_tasks');
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('tm_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Login State
  const [loginRole, setLoginRole] = useState('admin');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || 1);
  const [empPassword, setEmpPassword] = useState('');
  const [showManualLogin, setShowManualLogin] = useState(false);

  // Dashboard Tabs
  const [adminTab, setAdminTab] = useState('create');

  // Formulario Crear Tarea
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('Frontend');
  const [taskSkills, setTaskSkills] = useState('');

  // IA COPILOT
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('tm_gemini_key') || '');
  const [showAiKeyModal, setShowAiKeyModal] = useState(false);

  // Formulario Crear Empleado
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('Frontend Developer');
  const [newEmpPassword, setNewEmpPassword] = useState('123');
  const [newEmpSkills, setNewEmpSkills] = useState('');

  // Toast
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Inyectar fuentes Google (Fustat e Inter)
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Fustat:wght@700;800&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    localStorage.setItem('tm_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('tm_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('tm_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('tm_session');
    }
  }, [currentUser]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // GENERADOR IA
  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      showToast("Escribe una descripción para que la IA la analice", "error");
      return;
    }

    setIsAiLoading(true);

    if (geminiApiKey.trim()) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Eres un gestor de proyectos de software. Analiza esta necesidad: "${aiPrompt}". Devuelve ÚNICAMENTE un JSON con este formato exacto: {"title": "titulo sugerido corto", "category": "Frontend|Backend|Base de Datos|Fullstack|UI/UX Design", "skills": "lista de skills separadas por coma"}`
              }]
            }]
          })
        });

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (rawText) {
          const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
          setTaskTitle(parsed.title);
          setTaskCategory(parsed.category);
          setTaskSkills(parsed.skills);
          showToast("✨ Tarea analizada y generada con Google Gemini AI");
          setIsAiLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Fallo en API real, usando motor IA local de respaldo...");
      }
    }

    setTimeout(() => {
      const lower = aiPrompt.toLowerCase();
      let cat = 'Fullstack';
      let skillsArr = [];

      if (lower.includes('pago') || lower.includes('stripe') || lower.includes('bd') || lower.includes('api') || lower.includes('backend') || lower.includes('servidor') || lower.includes('jwt')) {
        cat = 'Backend';
        skillsArr.push('backend', 'node', 'express', 'sql', 'api', 'stripe', 'jwt');
      }
      if (lower.includes('pantalla') || lower.includes('diseño') || lower.includes('login') || lower.includes('frontend') || lower.includes('react') || lower.includes('css')) {
        if (cat === 'Backend') cat = 'Fullstack';
        else cat = 'Frontend';
        skillsArr.push('frontend', 'react', 'tailwind', 'javascript', 'ui');
      }
      if (lower.includes('pdf') || lower.includes('reporte')) {
        skillsArr.push('pdf', 'javascript', 'backend');
      }

      if (skillsArr.length === 0) {
        skillsArr = ['javascript', 'frontend', 'backend'];
      }

      const uniqueSkills = [...new Set(skillsArr)].join(', ');
      const cleanTitle = aiPrompt.charAt(0).toUpperCase() + aiPrompt.slice(1);

      setTaskTitle(cleanTitle.length > 55 ? cleanTitle.substring(0, 52) + '...' : cleanTitle);
      setTaskCategory(cat);
      setTaskSkills(uniqueSkills);

      setIsAiLoading(false);
      showToast("✨ Tarea analizada y generada por IA Copilot");
    }, 900);
  };

  // Auth Handlers - Demo Acceso Rápido
  const handleQuickDemoAdmin = () => {
    setCurrentUser({ role: 'admin', name: 'Administrador Principal' });
    showToast("⚡ ¡Acceso Demo como Administrador activado!");
  };

  const handleQuickDemoEmployee = () => {
    const firstEmp = employees[0] || DEFAULT_EMPLOYEES[0];
    setCurrentUser({ role: 'employee', name: firstEmp.name, id: firstEmp.id, empRole: firstEmp.role });
    showToast(`⚡ ¡Acceso Demo activado como ${firstEmp.name}!`);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUsername === 'admin' && adminPassword === 'admin123') {
      setCurrentUser({ role: 'admin', name: 'Administrador Principal' });
      showToast("¡Bienvenido, Administrador!");
    } else {
      showToast("Credenciales de Admin incorrectas (Prueba: admin / admin123)", "error");
    }
  };

  const handleEmployeeLogin = (e) => {
    e.preventDefault();
    const targetId = selectedEmpId || (employees[0] ? employees[0].id : 1);
    const emp = employees.find(e => String(e.id) === String(targetId));
    const validPassword = (emp && emp.password) ? emp.password : '123';

    if (emp && validPassword === empPassword) {
      setCurrentUser({ role: 'employee', name: emp.name, id: emp.id, empRole: emp.role });
      showToast(`¡Bienvenido/a, ${emp.name}!`);
    } else {
      showToast("Contraseña incorrecta. Intenta con 123", "error");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAdminUsername('');
    setAdminPassword('');
    setEmpPassword('');
    showToast("Sesión cerrada");
  };

  // Matcher Algorithm
  const calculateMatch = (employeeSkills, requiredSkills) => {
    if (!requiredSkills.length) return 100;
    const empSet = new Set(employeeSkills.map(s => s.toLowerCase().trim()));
    const reqSet = requiredSkills.map(s => s.toLowerCase().trim());
    const matches = reqSet.filter(skill => empSet.has(skill));
    return Math.round((matches.length / reqSet.length) * 100);
  };

  const handleAssignTask = (empName, reqSkillsList) => {
    if (!taskTitle.trim()) {
      showToast("Asigna un título a la tarea", "error");
      return;
    }

    const newTask = {
      id: Date.now(),
      title: taskTitle,
      category: taskCategory,
      requiredSkills: reqSkillsList,
      assignedTo: empName,
      status: "Pendiente",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTasks([newTask, ...tasks]);
    setTaskTitle('');
    setTaskSkills('');
    setAiPrompt('');
    showToast(`Tarea asignada exitosamente a ${empName}`);
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpSkills.trim()) {
      showToast("Completa los datos del empleado", "error");
      return;
    }

    const newEmp = {
      id: Date.now(),
      name: newEmpName,
      role: newEmpRole,
      password: newEmpPassword || '123',
      skills: newEmpSkills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    };

    setEmployees([...employees, newEmp]);
    setNewEmpName('');
    setNewEmpSkills('');
    showToast(`Empleado ${newEmpName} registrado`);
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    showToast("🗑️ Tarea eliminada del sistema");
  };

  const handleDeleteEmployee = (empId) => {
    const emp = employees.find(e => e.id === empId);
    setEmployees(employees.filter(e => e.id !== empId));
    showToast(`🗑️ Empleado ${emp ? emp.name : ''} dado de baja`);
  };

  const handleUpdateTaskStatus = (taskId, newStatus) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    showToast(`Estado actualizado: ${newStatus}`);
  };

  const reqSkillsList = taskSkills.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-[#0084FF] selection:text-white relative overflow-x-hidden">
      
      {/* GLOW DE FONDO TOP-LEFT (LIQUID GLASS) */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-gradient-to-br from-[#60B1FF]/30 to-[#319AFF]/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border text-sm font-semibold animate-bounce transition-all duration-300 ${
          notification.type === 'error' 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-700' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
        }`}>
          {notification.type === 'error' ? '⚠️ ' : '✅ '}
          {notification.message}
        </div>
      )}

      {/* BARRA SUPERIOR DE LOGUEADO (SOLO CUANDO HAY SESIÓN ACTIVA) */}
      {currentUser && (
        <header className="sticky top-[20px] z-50 max-w-[1400px] mx-auto px-4 sm:px-6">
          <nav className="w-full mx-auto backdrop-blur-[50px] bg-white/40 border border-black/10 rounded-[18px] p-3 sm:px-6 shadow-[inset_0px_4px_4px_0px_rgba(255,255,255,0.4)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0084FF] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#0084FF]/30">
                ✓
              </div>
              <span style={{ fontFamily: "'Fustat', sans-serif" }} className="text-xl font-extrabold tracking-tight text-slate-900">
                TaskMaster<span className="text-[#0084FF]">.ai</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="text-right text-xs">
                  <p className="font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-[10px] text-[#0084FF] font-semibold">{currentUser.role === 'admin' ? ' Admin' : `👨 ${currentUser.empRole}`}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs px-3 py-1.5 rounded-lg transition-all font-semibold border border-rose-200"
                >
                  Salir
                </button>
              </div>
            </div>
          </nav>
        </header>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-[1400px] mx-auto px-6 pt-6 pb-16 relative z-10">
        
        {!currentUser ? (
          /* ==================================================== */
          /* LANDING HERO SENCILLO Y LIMPIO */
          /* ==================================================== */
          <div className="pt-6 sm:pt-10">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[70vh]">
              
              {/* HERO IZQUIERDA: TÍTULO SENCILLO Y BOTONES DEMO */}
              <div className="lg:col-span-7 space-y-6 text-left">
                
                {/* TÍTULO PRINCIPAL SENCILLO */}
                 <h1 
                  style={{ fontFamily: "'Fustat', sans-serif" }} 
                  className="text-4xl sm:text-6xl lg:text-[68px] font-black leading-[1.08] tracking-tight text-slate-900"
                >
                  Asignación Inteligente <br />
                  <span className="bg-gradient-to-r from-[#0084FF] via-[#319AFF] to-[#60B1FF] bg-clip-text text-transparent">
                    de Tareas con IA
                  </span>
                </h1>

                {/* SUBTÍTULO CON BRAND TASKMASTER.AI */}
                <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
                  <strong>TaskMaster.ai</strong> es la plataforma inteligente para optimizar la productividad de tu equipo de software, desglosando requerimientos con Inteligencia Artificial y evaluando la compatibilidad (% Match) en tiempo real.
                </p>

                {/* BOTONES ACCESO RÁPIDO DEMO */}
                <div className="pt-2 space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleQuickDemoAdmin}
                      className="bg-[#0084FF] hover:bg-[#0073DC] text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-[16px] shadow-lg shadow-[#0084FF]/25 border border-white/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                    >
                      <span>Probar como Administrador</span>
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">→</span>
                    </button>

                    <button
                      onClick={handleQuickDemoEmployee}
                      className="bg-white/80 hover:bg-white text-slate-800 font-semibold text-sm sm:text-base px-6 py-3.5 rounded-[16px] border border-slate-300/80 shadow-md backdrop-blur-md transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                    >
                      <span>Probar como Desarrollador</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowManualLogin(!showManualLogin)}
                    className="text-xs font-semibold text-slate-500 hover:text-[#0084FF] underline transition-colors block pt-1"
                  >
                    {showManualLogin ? '▲ Ocultar formulario manual' : '⚙️ O ingresar con credenciales manuales (admin / admin123)'}
                  </button>
                </div>

                {/* FORMULARIO LOGIN MANUAL (OPCIONAL) */}
                {showManualLogin && (
                  <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-3xl border border-slate-200 shadow-xl max-w-md space-y-4 animate-fade-in mt-4">
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                      <button
                        onClick={() => setLoginRole('admin')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          loginRole === 'admin' ? 'bg-white text-[#0084FF] shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        Admin
                      </button>
                      <button
                        onClick={() => setLoginRole('employee')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          loginRole === 'employee' ? 'bg-white text-[#0084FF] shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        Empleado
                      </button>
                    </div>

                    {loginRole === 'admin' ? (
                      <form onSubmit={handleAdminLogin} className="space-y-3">
                        <input
                          type="text"
                          placeholder="Usuario (admin)"
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0084FF]"
                        />
                        <input
                          type="password"
                          placeholder="Contraseña (admin123)"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0084FF]"
                        />
                        <button type="submit" className="w-full bg-[#0084FF] text-white font-bold py-2.5 rounded-xl text-xs shadow-md">
                          Ingresar
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleEmployeeLogin} className="space-y-3">
                        <select
                          value={selectedEmpId}
                          onChange={(e) => setSelectedEmpId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0084FF]"
                        >
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.role})
                            </option>
                          ))}
                        </select>
                        <input
                          type="password"
                          placeholder="Contraseña (123)"
                          value={empPassword}
                          onChange={(e) => setEmpPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0084FF]"
                        />
                        <button type="submit" className="w-full bg-[#0084FF] text-white font-bold py-2.5 rounded-xl text-xs shadow-md">
                          Ingresar
                        </button>
                      </form>
                    )}
                  </div>
                )}

              </div>

              {/* HERO DERECHA: ESFERA 3D GIRANDO */}
              <div className="lg:col-span-5 flex items-center justify-center relative">
                <div className="relative w-full max-w-md lg:max-w-lg aspect-square flex items-center justify-center">
                  <div className="absolute w-72 h-72 bg-[#60B1FF]/30 rounded-full blur-3xl -z-10 animate-pulse" />
                  <div className="absolute w-64 h-64 bg-[#319AFF]/20 rounded-full blur-2xl -z-10" />

                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain mix-blend-screen scale-125 transition-transform duration-700 hover:scale-130 pointer-events-none"
                    style={{
                      filter: "hue-rotate(-55deg) saturate(250%) brightness(1.2) contrast(1.1)"
                    }}
                  >
                    <source src="https://future.co/images/homepage/glassy-orb/orb-purple.webm" type="video/webm" />
                  </video>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* ==================================================== */
          /* PANEL DE CONTROL (CUANDO HAY SESIÓN ACTIVA) */
          /* ==================================================== */
          <div className="space-y-8 animate-fade-in">
            
            {currentUser.role === 'admin' ? (
              <div className="space-y-8">
                
                <div className="flex border-b border-slate-200 gap-8 text-sm font-semibold">
                  <button
                    onClick={() => setAdminTab('create')}
                    className={`pb-3 transition-all ${
                      adminTab === 'create' 
                        ? 'border-b-2 border-[#0084FF] text-[#0084FF] font-bold' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                     Generador AI & Matcher
                  </button>
                  <button
                    onClick={() => setAdminTab('tasks')}
                    className={`pb-3 transition-all ${
                      adminTab === 'tasks' 
                        ? 'border-b-2 border-[#0084FF] text-[#0084FF] font-bold' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Todas las Tareas ({tasks.length})
                  </button>
                  <button
                    onClick={() => setAdminTab('employees')}
                    className={`pb-3 transition-all ${
                      adminTab === 'employees' 
                        ? 'border-b-2 border-[#0084FF] text-[#0084FF] font-bold' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Gestión de Empleados ({employees.length})
                  </button>
                </div>

                {adminTab === 'create' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    <div className="lg:col-span-5 space-y-6">
                      
                      <div className="bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 p-6 rounded-3xl border border-blue-200/80 shadow-xl space-y-4 backdrop-blur-xl relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0084FF] flex items-center gap-1.5 uppercase tracking-wider">
                            AI TASK COPILOT
                          </span>
                          <button
                            onClick={() => setShowAiKeyModal(!showAiKeyModal)}
                            className="text-[10px] text-slate-500 hover:text-[#0084FF] underline font-semibold"
                          >
                            {geminiApiKey ? '🔑 Gemini API Conectada' : '⚙️ Configurar Gemini Key'}
                          </button>
                        </div>

                        {showAiKeyModal && (
                          <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2 shadow-md">
                            <input
                              type="password"
                              placeholder="Pega tu Google Gemini API Key aquí"
                              value={geminiApiKey}
                              onChange={(e) => {
                                setGeminiApiKey(e.target.value);
                                localStorage.setItem('tm_gemini_key', e.target.value);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                            />
                            <p className="text-[10px] text-slate-500 leading-tight">Si se deja vacío, usará el motor IA simulado que responde al instante en la demostración.</p>
                          </div>
                        )}

                        <p className="text-xs text-slate-600 font-medium">
                          Describe el requerimiento en lenguaje natural. La IA extraerá el título, la categoría y las habilidades necesarias:
                        </p>

                        <textarea
                          rows={3}
                          placeholder='Ej: "Necesitamos desarrollar una pasarela de pagos con Stripe y autenticación mediante tokens JWT"'
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="w-full bg-white/90 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-[#0084FF] shadow-inner resize-none"
                        />

                        <button
                          onClick={handleGenerateWithAI}
                          disabled={isAiLoading}
                          className="w-full bg-[#0084FF] hover:bg-[#0073DC] text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md shadow-[#0084FF]/25 flex items-center justify-center gap-2"
                        >
                          {isAiLoading ? '🧠 La IA está analizando el proyecto...' : 'Autocompletar Tarea con IA'}
                        </button>
                      </div>

                      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-lg space-y-4">
                        <h3 className="text-sm font-bold text-slate-900">Detalles de la Tarea a Asignar</h3>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Título de la Tarea</label>
                          <input
                            type="text"
                            placeholder="Título asignado"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Categoría</label>
                          <select
                            value={taskCategory}
                            onChange={(e) => setTaskCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900"
                          >
                            <option value="Frontend">Frontend Development</option>
                            <option value="Backend">Backend API & Services</option>
                            <option value="Base de Datos">Database Engineering</option>
                            <option value="Fullstack">Fullstack Task</option>
                            <option value="UI/UX Design">UI/UX Design</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Habilidades Requeridas (Skills)</label>
                          <input
                            type="text"
                            placeholder="ej: react, node, sql"
                            value={taskSkills}
                            onChange={(e) => setTaskSkills(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900"
                          />
                        </div>
                      </div>

                    </div>

                    <div className="lg:col-span-7 bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 style={{ fontFamily: "'Fustat', sans-serif" }} className="text-xl font-bold text-slate-900">
                            Matcher de Compatibilidad
                          </h2>
                          <p className="text-xs text-slate-500">Evaluación algorítmica por habilidades en tiempo real</p>
                        </div>
                        <span className="text-xs font-bold text-[#0084FF] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                          Algoritmo Activo
                        </span>
                      </div>

                      <div className="space-y-4">
                        {employees
                          .map((emp) => ({
                            ...emp,
                            matchScore: calculateMatch(emp.skills, reqSkillsList)
                          }))
                          .sort((a, b) => b.matchScore - a.matchScore)
                          .map((emp) => (
                            <div key={emp.id} className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-[#0084FF]/40">
                              
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">{emp.name}</span>
                                  <span className="text-xs text-slate-500">({emp.role})</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {emp.skills.map((s, idx) => (
                                    <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                                      #{s}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-right">
                                  <span className={`text-sm font-extrabold ${
                                    emp.matchScore >= 70 ? 'text-emerald-600' : emp.matchScore >= 40 ? 'text-amber-600' : 'text-slate-500'
                                  }`}>
                                    {emp.matchScore}% Match
                                  </span>
                                  <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                                    <div 
                                      className={`h-full transition-all duration-500 ${
                                        emp.matchScore >= 70 ? 'bg-emerald-500' : emp.matchScore >= 40 ? 'bg-amber-500' : 'bg-slate-400'
                                      }`} 
                                      style={{ width: `${emp.matchScore}%` }} 
                                    />
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleAssignTask(emp.name, reqSkillsList)}
                                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0084FF] hover:bg-[#0073DC] text-white transition-all shadow-md shadow-[#0084FF]/20 active:scale-95"
                                >
                                  Asignar
                                </button>
                              </div>

                            </div>
                          ))}
                      </div>
                    </div>

                  </div>
                )}

                {adminTab === 'tasks' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.length === 0 ? (
                      <p className="text-slate-500 col-span-full py-16 text-center font-medium">No hay tareas creadas en el sistema.</p>
                    ) : (
                      tasks.map((task) => (
                        <div key={task.id} className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-lg space-y-4 flex flex-col justify-between hover:shadow-xl transition-all">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-[#0084FF] border border-blue-200">
                                {task.category}
                              </span>
                              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                                task.status === 'Completada' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                task.status === 'En Progreso' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {task.status}
                              </span>
                            </div>

                            <h3 className="font-bold text-slate-900 text-base leading-snug">{task.title}</h3>
                            <p className="text-xs text-slate-500">👤 Asignado a: <strong className="text-slate-900">{task.assignedTo}</strong></p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-semibold text-slate-400">{task.createdAt}</span>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold px-3 py-1.5 rounded-xl transition-all"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {adminTab === 'employees' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    <form onSubmit={handleAddEmployee} className="lg:col-span-4 bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-lg space-y-4">
                      <h2 style={{ fontFamily: "'Fustat', sans-serif" }} className="text-lg font-bold text-slate-900">
                        👤 Registrar Empleado
                      </h2>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          placeholder="Ej: Laura Martínez"
                          value={newEmpName}
                          onChange={(e) => setNewEmpName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Rol Profesional</label>
                        <select
                          value={newEmpRole}
                          onChange={(e) => setNewEmpRole(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900"
                        >
                          <option value="Frontend Developer">Frontend Developer</option>
                          <option value="Backend Developer">Backend Developer</option>
                          <option value="Fullstack Engineer">Fullstack Engineer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Contraseña / PIN</label>
                        <input
                          type="password"
                          placeholder="Ej: 123"
                          value={newEmpPassword}
                          onChange={(e) => setNewEmpPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Habilidades (Skills separadas por coma)</label>
                        <input
                          type="text"
                          placeholder="ej: react, sql, jwt"
                          value={newEmpSkills}
                          onChange={(e) => setNewEmpSkills(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900"
                        />
                      </div>

                      <button type="submit" className="w-full bg-[#0084FF] text-white font-bold py-3 rounded-2xl text-xs shadow-md">
                        Guardar Empleado
                      </button>
                    </form>

                    <div className="lg:col-span-8 bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-lg space-y-4">
                      <h2 style={{ fontFamily: "'Fustat', sans-serif" }} className="text-lg font-bold text-slate-900">
                        Personal Registrado ({employees.length})
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {employees.map((emp) => (
                          <div key={emp.id} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                                <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full">
                                  {emp.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">Clave: <code className="text-[#0084FF] font-bold">{emp.password || '123'}</code></p>
                              
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {emp.skills.map((s, idx) => (
                                  <span key={idx} className="text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                                    #{s}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200 flex justify-end">
                              <button
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold px-3 py-1 rounded-xl transition-all"
                              >
                                Dar de Baja
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            ) : (
              <div className="space-y-8 max-w-4xl mx-auto">
                
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 style={{ fontFamily: "'Fustat', sans-serif" }} className="text-2xl font-bold text-slate-900">
                      Panel Personal de {currentUser.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Visualiza y actualiza tus actividades asignadas en tiempo real</p>
                  </div>
                  <span className="text-xs font-bold px-4 py-1.5 bg-blue-50 text-[#0084FF] border border-blue-200 rounded-full">
                    {currentUser.empRole}
                  </span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900">
                    Mis Tareas Asignadas ({tasks.filter(t => t.assignedTo === currentUser.name).length})
                  </h3>

                  {tasks.filter(t => t.assignedTo === currentUser.name).length === 0 ? (
                    <div className="bg-white/80 border border-slate-200 p-16 text-center rounded-3xl text-slate-500 shadow-sm font-medium">
                      🎉 ¡No tienes tareas pendientes asignadas actualmente!
                    </div>
                  ) : (
                    tasks
                      .filter(t => t.assignedTo === currentUser.name)
                      .map((task) => (
                        <div key={task.id} className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-lg transition-all">
                          
                          <div className="space-y-2">
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-[#0084FF] border border-blue-200">
                              {task.category}
                            </span>
                            <h4 className="font-bold text-slate-900 text-lg">{task.title}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-slate-500">Estado:</label>
                            <select
                              value={task.status}
                              onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                              className={`text-xs font-bold px-4 py-2 rounded-xl border focus:outline-none shadow-sm ${
                                task.status === 'Completada' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                task.status === 'En Progreso' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-amber-50 text-amber-700 border-amber-300'
                              }`}
                            >
                              <option value="Pendiente" className="bg-white text-slate-900">Pendiente</option>
                              <option value="En Progreso" className="bg-white text-slate-900">En Progreso</option>
                              <option value="Completada" className="bg-white text-slate-900">Completada</option>
                            </select>
                          </div>

                        </div>
                      ))
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
}