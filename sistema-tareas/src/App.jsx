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
    title: "Diseñar Dashboard Principal con React",
    category: "Frontend",
    requiredSkills: ["frontend", "react", "tailwind"],
    assignedTo: "Carlos Gómez",
    status: "En Progreso",
    createdAt: "2026-07-21"
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

  // Login
  const [loginRole, setLoginRole] = useState('admin');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || 1);
  const [empPassword, setEmpPassword] = useState('');

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

  // Auth Handlers
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUsername === 'admin' && adminPassword === 'admin123') {
      setCurrentUser({ role: 'admin', name: 'Administrador Principal' });
      showToast("¡Bienvenido, Administrador!");
    } else {
      showToast("Credenciales de Admin incorrectas", "error");
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

  // Matcher
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

  // FUNCIONES DE ELIMINACIÓN
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white pb-12">
      {/* TOAST */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md border animate-bounce transition-all duration-300 ${
          notification.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
        }`}>
          {notification.type === 'error' ? '⚠️ ' : '✅ '}
          {notification.message}
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/30 animate-pulse">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  TaskMaster React AI
                </h1>
                <span className="text-[10px] font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                  AI POWERED
                </span>
              </div>
              <p className="text-xs text-slate-400">Sistema Inteligente de Gestión & Copiloto AI</p>
            </div>
          </div>

          {currentUser && (
            <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-200">{currentUser.name}</p>
                <p className="text-[10px] text-indigo-400 font-semibold uppercase">{currentUser.role === 'admin' ? '🛡️ Administrador' : `👨‍💻 ${currentUser.empRole}`}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-3 py-1.5 rounded-lg transition-all"
              >
                🚪 Salir
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        {!currentUser ? (
          /* LOGIN */
          <div className="max-w-md mx-auto my-12 bg-slate-900/80 backdrop-blur-2xl p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30 flex items-center justify-center text-3xl mx-auto text-indigo-400">
                🔒
              </div>
              <h2 className="text-2xl font-bold text-slate-100">Iniciar Sesión</h2>
              <p className="text-xs text-slate-400">Accede con tu rol correspondiente</p>
            </div>

            <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/50">
              <button
                onClick={() => setLoginRole('admin')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  loginRole === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                👨‍💼 Administrador
              </button>
              <button
                onClick={() => setLoginRole('employee')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  loginRole === 'employee' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                👨‍💻 Empleado
              </button>
            </div>

            {loginRole === 'admin' ? (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Usuario Admin</label>
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm">
                  Ingresar al Panel Admin
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmployeeLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Selecciona tu Nombre</label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Contraseña / PIN</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm">
                  Ingresar a mis Tareas
                </button>
              </form>
            )}

            
          </div>
        ) : (
          /* PANEL PRINCIPAL LOGUEADO */
          <div className="space-y-6">
            {currentUser.role === 'admin' ? (
              <div className="space-y-6">
                <div className="flex border-b border-slate-800 gap-6 text-sm font-medium">
                  <button
                    onClick={() => setAdminTab('create')}
                    className={`pb-3 transition-all ${adminTab === 'create' ? 'border-b-2 border-indigo-500 text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    🤖 Generador AI & Matcher
                  </button>
                  <button
                    onClick={() => setAdminTab('tasks')}
                    className={`pb-3 transition-all ${adminTab === 'tasks' ? 'border-b-2 border-indigo-500 text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    📋 Todas las Tareas ({tasks.length})
                  </button>
                  <button
                    onClick={() => setAdminTab('employees')}
                    className={`pb-3 transition-all ${adminTab === 'employees' ? 'border-b-2 border-indigo-500 text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    👤 Gestión de Empleados ({employees.length})
                  </button>
                </div>

                {adminTab === 'create' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-xl space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-1.5">
                            ✨ AI TASK COPILOT
                          </span>
                          <button
                            onClick={() => setShowAiKeyModal(!showAiKeyModal)}
                            className="text-[10px] text-slate-400 hover:text-indigo-300 underline"
                          >
                            {geminiApiKey ? '🔑 API Key Activa' : '⚙️ Configurar Gemini API'}
                          </button>
                        </div>

                        {showAiKeyModal && (
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-2">
                            <input
                              type="password"
                              placeholder="Pega tu Google Gemini API Key aquí"
                              value={geminiApiKey}
                              onChange={(e) => {
                                setGeminiApiKey(e.target.value);
                                localStorage.setItem('tm_gemini_key', e.target.value);
                              }}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                            />
                            <p className="text-[10px] text-slate-400">Si lo dejas vacío, usará el motor IA simulado que nunca falla en demostraciones.</p>
                          </div>
                        )}

                        <p className="text-xs text-slate-300">Describe el proyecto y la IA extraerá el título, categoría y skills automáticamente:</p>

                        <textarea
                          rows={2}
                          placeholder='Ej: "Necesito crear una pasarela de pagos con Stripe y autenticación JWT"'
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="w-full bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-400 resize-none"
                        />

                        <button
                          onClick={handleGenerateWithAI}
                          disabled={isAiLoading}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
                        >
                          {isAiLoading ? '🧠 La IA está analizando la tarea...' : '✨ Autocompletar Tarea con IA'}
                        </button>
                      </div>

                      <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                        <h3 className="text-sm font-bold text-slate-200">Detalles de la Tarea Generada</h3>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Título</label>
                          <input
                            type="text"
                            placeholder="Título asignado"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Categoría</label>
                          <select
                            value={taskCategory}
                            onChange={(e) => setTaskCategory(e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100"
                          >
                            <option value="Frontend">Frontend Development</option>
                            <option value="Backend">Backend API & Services</option>
                            <option value="Base de Datos">Database Engineering</option>
                            <option value="Fullstack">Fullstack Task</option>
                            <option value="UI/UX Design">UI/UX Design</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Habilidades Requeridas</label>
                          <input
                            type="text"
                            placeholder="ej: react, node, sql"
                            value={taskSkills}
                            onChange={(e) => setTaskSkills(e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                      <h2 className="text-lg font-bold text-slate-100 flex items-center justify-between">
                        <span>🤖 Matcher de Compatibilidad AI</span>
                        <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">En tiempo real</span>
                      </h2>

                      <div className="space-y-3 mt-4">
                        {employees
                          .map((emp) => ({
                            ...emp,
                            matchScore: calculateMatch(emp.skills, reqSkillsList)
                          }))
                          .sort((a, b) => b.matchScore - a.matchScore)
                          .map((emp) => (
                            <div key={emp.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-100">{emp.name}</span>
                                  <span className="text-xs text-slate-400">({emp.role})</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {emp.skills.map((s, idx) => (
                                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-right">
                                  <span className={`text-sm font-bold ${emp.matchScore >= 70 ? 'text-emerald-400' : emp.matchScore >= 40 ? 'text-amber-400' : 'text-slate-400'}`}>
                                    {emp.matchScore}% Match
                                  </span>
                                  <div className="w-24 bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div className={`h-full ${emp.matchScore >= 70 ? 'bg-emerald-500' : emp.matchScore >= 40 ? 'bg-amber-500' : 'bg-slate-500'}`} style={{ width: `${emp.matchScore}%` }} />
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAssignTask(emp.name, reqSkillsList)}
                                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-95 shadow-md shadow-indigo-600/20"
                                >
                                  📌 Asignar
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TABLAS DE TAREAS - AHORA CON BOTÓN DE ELIMINAR */}
                {adminTab === 'tasks' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.length === 0 ? (
                      <p className="text-slate-400 col-span-full py-12 text-center">No hay tareas en el sistema.</p>
                    ) : (
                      tasks.map((task) => (
                        <div key={task.id} className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{task.category}</span>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                task.status === 'Completada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                task.status === 'En Progreso' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>{task.status}</span>
                            </div>
                            <h3 className="font-bold text-slate-100 text-base">{task.title}</h3>
                            <p className="text-xs text-slate-400">👤 Asignado a: <strong className="text-slate-200">{task.assignedTo}</strong></p>
                          </div>

                          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-[10px] text-slate-500">{task.createdAt}</span>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                              title="Eliminar tarea definitivamente"
                            >
                               Eliminar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* GESTIÓN DE EMPLEADOS - CON BOTÓN DE BAJA / ELIMINAR */}
                {adminTab === 'employees' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <form onSubmit={handleAddEmployee} className="lg:col-span-4 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 space-y-4">
                      <h2 className="text-lg font-bold text-slate-100">👤 Registrar Empleado</h2>
                      <input
                        type="text"
                        placeholder="Nombre Completo"
                        value={newEmpName}
                        onChange={(e) => setNewEmpName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100"
                      />
                      <select
                        value={newEmpRole}
                        onChange={(e) => setNewEmpRole(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100"
                      >
                        <option value="Frontend Developer">Frontend Developer</option>
                        <option value="Backend Developer">Backend Developer</option>
                        <option value="Fullstack Engineer">Fullstack Engineer</option>
                      </select>
                      <input
                        type="password"
                        placeholder="Contraseña / PIN (Ej. 123)"
                        value={newEmpPassword}
                        onChange={(e) => setNewEmpPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100"
                      />
                      <input
                        type="text"
                        placeholder="Habilidades (ej: react, sql, jwt)"
                        value={newEmpSkills}
                        onChange={(e) => setNewEmpSkills(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100"
                      />
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm">
                        Guardar Empleado
                      </button>
                    </form>

                    <div className="lg:col-span-8 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 space-y-4">
                      <h2 className="text-lg font-bold text-slate-100">Personal Registrado ({employees.length})</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {employees.map((emp) => (
                          <div key={emp.id} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-3 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-100">{emp.name}</h3>
                                <span className="text-[11px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{emp.role}</span>
                              </div>
                              <p className="text-[11px] text-slate-400">Clave: <code className="text-indigo-300">{emp.password || '123'}</code></p>
                              <div className="flex flex-wrap gap-1 pt-1">
                                {emp.skills.map((s, idx) => (
                                  <span key={idx} className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                                    #{s}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-700/60 flex justify-end">
                              <button
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                                title="Dar de baja o eliminar empleado"
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
              /* DASHBOARD EMPLEADO */
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">Panel Personal de {currentUser.name}</h2>
                    <p className="text-xs text-slate-400">Visualiza y actualiza tus actividades asignadas</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                    {currentUser.empRole}
                  </span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-200">
                    Mis Tareas Asignadas ({tasks.filter(t => t.assignedTo === currentUser.name).length})
                  </h3>

                  {tasks.filter(t => t.assignedTo === currentUser.name).length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-800 p-12 text-center rounded-2xl text-slate-400">
                      🎉 ¡No tienes tareas pendientes asignadas actualmente!
                    </div>
                  ) : (
                    tasks
                      .filter(t => t.assignedTo === currentUser.name)
                      .map((task) => (
                        <div key={task.id} className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {task.category}
                            </span>
                            <h4 className="font-bold text-slate-100 text-lg">{task.title}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-400">Estado:</label>
                            <select
                              value={task.status}
                              onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                              className={`text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none ${
                                task.status === 'Completada' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                                task.status === 'En Progreso' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <option value="Pendiente" className="bg-slate-900 text-slate-100">Pendiente</option>
                              <option value="En Progreso" className="bg-slate-900 text-slate-100">En Progreso</option>
                              <option value="Completada" className="bg-slate-900 text-slate-100">Completada</option>
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