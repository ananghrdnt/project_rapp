import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { List, Loader, CheckCircle, Home, Folder, Calendar, ArrowDown, ArrowUp, Search } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const Dashboard = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({ todo: 0, inprogress: 0, completed: 0, all: 0 });
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [searchTable1, setSearchTable1] = useState("");
  const [sortConfig1, setSortConfig1] = useState({ key: "project_name", direction: "asc" });
  const [pageTable1, setPageTable1] = useState(1);
  const [searchTable2, setSearchTable2] = useState("");
  const [filterStatus2, setFilterStatus2] = useState("");
  const [sortConfig2, setSortConfig2] = useState({ key: "project_name", direction: "asc" });
  const [pageTable2, setPageTable2] = useState(1);


const currentYear = new Date().getFullYear();
const [filterMonth1, setFilterMonth1] = useState("");
const [filterYear1, setFilterYear1] = useState(currentYear.toString());
const [filterStatus1, setFilterStatus1] = useState("");
const [filterMonth2, setFilterMonth2] = useState("");
const [filterYear2, setFilterYear2] = useState(currentYear.toString());

  
  const pageSize = 10;
  const [reminderTasks, setReminderTasks] = useState([]);
  const [filterRoleChart, setFilterRoleChart] = useState("");

  useEffect(() => {
    if (user) {
      let role = user.role?.toLowerCase() || "admin";
      if (role === "engineer") role = "itga";
      setUserRole(role);
      setUserName(user.name?.toLowerCase() || "");
    }
  }, [user]);

  // Helper Function: Menentukan Status (Project/Task)
  const getStatus = (planEnd, actualEnd) => {
    if (!actualEnd) return "N/A";	
    const planEndDate = new Date(planEnd);
    const actualEndDate = new Date(actualEnd);

    if (isNaN(planEndDate.getTime()) || isNaN(actualEndDate.getTime())) return "N/A";
    
    const actualIsLater = actualEndDate > planEndDate;
    
    return actualIsLater ? "Delay" : "On Time";
  };
  
  const getProjectStatus = useCallback((p) => getStatus(p.plan_end_date, p.actual_end), []);
  const getTaskStatus = useCallback((t) => getStatus(t.plan_end_date, t.actual_end), []);

  // 1. useEffect utama (fetch data)
  useEffect(() => {
    const fetchProjects = async () => {
      if (!userRole) return;
      try {
        const res = await axios.get("http://localhost:5000/dashboard", {
          params: { role: userRole, name: userName },
        });
        let { projectsSummary, reminderTasks } = res.data;

        // 🔹 Filter data berdasarkan role (logika yang sudah ada)
        let data = projectsSummary;

        if (userRole === "itbp") {
          data = data.filter((p) => p.itbp_name?.toLowerCase() === userName);
        } else if (userRole === "itga") {
          data = data.filter((p) =>	
              p.tasks?.some((t) => t.assigned_to?.toLowerCase() === userName)
          );
        } else if (["sap", "data_science"].includes(userRole)) {
          data = data.filter(
            (p) =>
              p.itbp_name?.toLowerCase() === userName ||
              p.tasks?.some((t) => t.assigned_to?.toLowerCase() === userName)
          );
        }

        setProjects(data);
        setReminderTasks(reminderTasks || []);

        // Hitung summary
        const total = {
          todo: data.reduce((a, c) => a + (c.task_todo || 0), 0),
          inprogress: data.reduce((a, c) => a + (c.task_inprogress || 0), 0),
          completed: data.reduce((a, c) => a + (c.task_completed || 0), 0),
          all: data.reduce(
            (a, c) => a + (c.task_todo || 0) + (c.task_inprogress || 0) + (c.task_completed || 0),
            0
          ),
        };
        setSummary(total);
      } catch (err) {
        console.error(err);
      }
    };

    if (userRole) {
      fetchProjects();
    }
  }, [userRole, userName]);

  // 2. useMemo untuk chartData
  const chartData = useMemo(() => {
    if (!projects.length) return [];

    let filteredProjects = projects;

    // 🔹 Filter Role untuk Project
    if (filterRoleChart) {
      const role = filterRoleChart.toUpperCase();	

      filteredProjects = projects.filter((p) => {
        const projectRole = p.itbp_role?.toUpperCase();
        const taskRoles = p.tasks?.map((t) => t.assigned_role?.toUpperCase()) || [];

        if (role === "ITBP") {
          return projectRole === "ITBP";
        }

        if (role === "ITGA") {
          return taskRoles.includes("ITGA");
        }

        if (role === "SAP") {
          return projectRole === "SAP" || taskRoles.includes("SAP");
        }

        if (role === "DATA_SCIENCE") {
          return projectRole === "DATA_SCIENCE" || taskRoles.includes("DATA_SCIENCE");
        }

        return false;
      });
    }

    const grouped = {};
    const lowerUserName = userName.toLowerCase();

    // Menggunakan filteredProjects setelah filter Role Project
    filteredProjects.forEach((p) => {
      
      const planStartDate = new Date(p.plan_start_date);
      if (isNaN(planStartDate.getTime())) return;

      const month = planStartDate.getMonth() + 1;
      const year = planStartDate.getFullYear();

      // 1. Filter by Plan Start Date
      const monthMatch = filterMonth1 ? month === parseInt(filterMonth1) : true;
      const yearMatch = filterYear1 ? year === parseInt(filterYear1) : true;

      if (!monthMatch || !yearMatch) return;

      // 2. Project Count logic (respecting status filter)
      const projectStatus = getProjectStatus(p);
      let projectCount = 0;

      if (filterStatus1) {
        if (projectStatus !== "N/A" && projectStatus === filterStatus1) {
          projectCount = 1;
        }
      } else {
        projectCount = 1;
      }

      // 3. Task Count logic (respecting role and status filter)
      let relevantTasks = [];
      
      // Tentukan task yang relevan berdasarkan role user yang login (Filter level 1: Role User)
      if (userRole === "admin" || userRole === "itbp") {
        relevantTasks = p.tasks || [];
      } else if (["sap", "data_science", "itga"].includes(userRole)) {
        relevantTasks = (p.tasks || []).filter(t =>	
          t.assigned_to?.toLowerCase() === lowerUserName
        );
      }
      
      // Filter level 2: Role (Role Filter di Chart - Hanya berlaku untuk task, karena project sudah difilter di atas)
      if (filterRoleChart) {
        relevantTasks = relevantTasks.filter(
          (t) => t.assigned_role?.toLowerCase() === filterRoleChart.toLowerCase()
        );
      }


      let finalTaskCount = relevantTasks.length; // Default count (All relevant tasks)

      // Filter level 3: Status (hanya jika filterStatus1 aktif)
      if (filterStatus1) {
        finalTaskCount = relevantTasks.filter(t =>	
            getTaskStatus(t) !== "N/A" && getTaskStatus(t) === filterStatus1
        ).length;
      }
      
      // 4. Grouping and Aggregation
      const dateKey = planStartDate.toLocaleString("en-US", { month: "short", year: 'numeric' });
      const monthLabel = planStartDate.toLocaleString("en-US", { month: "short", year: 'numeric' });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {	
          month: monthLabel,	
          projects: 0,	
          tasks: 0,	
          sortDate: planStartDate.getTime()	
        };
      }

      grouped[dateKey].projects += projectCount;
      grouped[dateKey].tasks += finalTaskCount;
    });

    // Convert to array and sort by date
    return Object.values(grouped).filter(g => g.projects > 0 || g.tasks > 0).sort((a, b) => a.sortDate - b.sortDate);

  }, [
    projects,	
    filterMonth1,	
    filterYear1,	
    filterStatus1,	
    filterRoleChart,	
    userRole,	
    userName,	
    getProjectStatus,	
    getTaskStatus
  ]);


  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`;
  };

  // Mengganti statusLabel dengan getProjectStatus (untuk Table 2)
  const statusLabel = (planEnd, actualEnd) => {
    const status = getStatus(planEnd, actualEnd);
    return status === "N/A" ? "-" : status;
  };

  const statusColor = (planEnd, actualEnd) => {
    const status = getStatus(planEnd, actualEnd);
    if (status === "Delay") return "bg-red-500 text-white";
    if (status === "On Time") return "bg-green-500 text-white";
    return "bg-gray-400 text-white";
  };

  const summaryColor = (label) => {
    switch (label) {
      case "Task To Do": return "bg-red-500";
      case "Task In Progress": return "bg-yellow-500";
      case "Task Completed": return "bg-green-500";
      default: return "bg-gray-400";
    }
  };

  const summaryItems = [
    { label: "Task To Do", value: summary.todo, bg: summaryColor("Task To Do"), icon: <List size={18} /> },
    { label: "Task In Progress", value: summary.inprogress, bg: summaryColor("Task In Progress"), icon: <Loader size={18} className="animate-spin" /> },
    { label: "Task Completed", value: summary.completed, bg: summaryColor("Task Completed"), icon: <CheckCircle size={18} /> },
  ];

  const sortData = (data, sortConfig) => {
    const { key, direction } = sortConfig;
    const order = direction === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      let valA = a[key] ?? "";
      let valB = b[key] ?? "";
      if (typeof valA === "number" && typeof valB === "number") return (valA - valB) * order;
      return valA.toString().toLowerCase().localeCompare(valB.toString().toLowerCase()) * order;
    });
  };

  // Filtering Table 1 (Task Summary) - MENGHAPUS filterStatus1
  const filteredTable1 = projects.filter((p) => {
    const nameMatch = p.project_name.toLowerCase().includes(searchTable1.toLowerCase());
    const monthMatch = filterMonth1 ? new Date(p.plan_start_date).getMonth() + 1 === parseInt(filterMonth1) : true;
    const yearMatch = filterYear1 ? new Date(p.plan_start_date).getFullYear() === parseInt(filterYear1) : true;
    
    // Hapus: Status Filter for Table 1
    // const projectStatus = getProjectStatus(p);
    // const filterStatusMatch = !filterStatus1 || (projectStatus !== "N/A" && projectStatus === filterStatus1);

    // return nameMatch && monthMatch && yearMatch && filterStatusMatch;
    return nameMatch && monthMatch && yearMatch;
  });
  const sortedTable1 = sortData(filteredTable1, sortConfig1);
  const pageData1 = sortedTable1.slice((pageTable1 - 1) * pageSize, pageTable1 * pageSize);
  const pageCount1 = Math.ceil(sortedTable1.length / pageSize);

  // Filtering Table 2 (Status)
  const filteredTable2 = projects.filter((p) => {
    const searchMatch = p.project_name.toLowerCase().includes(searchTable2.toLowerCase());
    const status = statusLabel(p.plan_end_date, p.actual_end);
    const statusMatch = !filterStatus2 || status === filterStatus2;
    // Menggunakan plan_start_date untuk filter bulan/tahun Tabel 2
    const monthMatch = filterMonth2 ? new Date(p.plan_start_date).getMonth() + 1 === parseInt(filterMonth2) : true;
    const yearMatch = filterYear2 ? new Date(p.plan_start_date).getFullYear() === parseInt(filterYear2) : true;
    return searchMatch && statusMatch && monthMatch && yearMatch;
  });
  const sortedTable2 = sortData(filteredTable2, sortConfig2);
  const pageData2 = sortedTable2.slice((pageTable2 - 1) * pageSize, pageTable2 * pageSize);
  const pageCount2 = Math.ceil(sortedTable2.length / pageSize);

  const handleSort1 = (key) => setSortConfig1(prev => prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });
  const handleSort2 = (key) => setSortConfig2(prev => prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });

  const renderSortIcon = (key, sortConfig) => {
    const iconClass = "inline ml-1 text-blue-300";
    if (sortConfig.key !== key) return <List className={iconClass} size={12} />;
    return sortConfig.direction === "asc" ? <ArrowUp className={iconClass} size={12} /> : <ArrowDown className={iconClass} size={12} />;
  };

  // Mengganti "All Months" menjadi "All Month"
  const months = Array.from({ length: 12 }, (_, i) => ({ value: `${i + 1}`, label: new Date(0, i).toLocaleString('en', { month: 'long' }) })).concat({ value: "", label: "All Month" });
  const years = Array.from({ length: 6 }, (_, i) => 2022 + i);

  const Pagination = ({ currentPage, pageCount, onPageChange }) => {
    if (pageCount <= 1) return null;
    return (
      <div className="flex justify-end mt-3 text-[0.65rem] select-none">
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`px-2 py-1 rounded border transition-colors ${currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}>Prev</button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((num) => (
            <button key={num} onClick={() => onPageChange(num)} className={`px-2 py-1 rounded border transition-colors ${num === currentPage ? "bg-blue-600 text-white font-semibold" : "bg-white text-gray-600 hover:bg-blue-100"}`}>{num}</button>
          ))}
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === pageCount} className={`px-2 py-1 rounded border transition-colors ${currentPage === pageCount ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}>Next</button>
        </div>
      </div>
    );
  };

  // Hapus kolom 'status' dari table1Headers
  const table1Headers = [
    { key: "project_name", label: "Project Name" },
    { key: "task_todo", label: "Task To Do" },
    { key: "task_inprogress", label: "Task In Progress" },
    { key: "task_completed", label: "Task Completed" },
    // { key: "status", label: "Status" }, <-- DIHAPUS
  ];

  const table2Headers = [
    { key: "project_name", label: "Project Name" },
    { key: "plan_start_date", label: "Plan Start" },
    { key: "plan_end_date", label: "Plan End" },
    { key: "actual_start", label: "Actual Start" },
    { key: "actual_end", label: "Actual End" },
    { key: "status", label: "Status" },
  ];

  const DashboardChart = ({ title, data, filterStatus, setFilterStatus }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-100 p-3 mb-6">
      <h3 className="font-bold text-gray-700 mb-3 text-[0.75rem]">{title}</h3>
      <div className="flex justify-end mb-3 gap-2 flex-wrap">
        {/* Filter Role (Hanya untuk Admin) */}
        {userRole === "admin" && (
          <select
            value={filterRoleChart}
            onChange={(e) => setFilterRoleChart(e.target.value)}
            className="p-1 border border-gray-300 rounded-md text-[0.65rem]"
          >
            <option value="">All Roles</option>
            <option value="itbp">ITBP</option>
            <option value="itga">ITGA</option>
            <option value="sap">SAP</option>
            <option value="data_science">Data Science</option>
          </select>
        )}

        {/* Filter Status (TETAP ADA untuk Chart) */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-1 border border-gray-300 rounded-md text-[0.65rem]"
        >
          <option value="">All Status</option>
          <option value="On Time">On Time</option>
          <option value="Delay">Delay</option>
        </select>

        {/* Filter Bulan dan Tahun (Menggunakan "All Month") */}
        <select
          value={filterMonth1}
          onChange={(e) => setFilterMonth1(e.target.value)}
          className="p-1 border border-gray-300 rounded-md text-[0.65rem]"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label === "All Month" ? "All Month" : m.label.substring(0, 3)}</option>
          ))}
        </select>
        <select
          value={filterYear1}
          onChange={(e) => setFilterYear1(e.target.value)}
          className="p-1 border border-gray-300 rounded-md text-[0.65rem]"
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: "0.65rem", borderRadius: "5px" }}
            labelStyle={{ fontWeight: "bold", color: "#1e3a8a" }}
          />
          <Legend wrapperStyle={{ fontSize: "0.6rem" }} iconSize={8} />
          <Bar dataKey="projects" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Projects" />
          <Bar dataKey="tasks" fill="#f97316" radius={[3, 3, 0, 0]} name="Tasks" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );


  return (
    <div className="p-3 min-h-screen font-sans text-[0.65rem]">
      <h2 className="flex items-center gap-1 font-bold text-sm mb-3 text-gray-800"><Home className="text-blue-600" size={16} /> DASHBOARD</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {summaryItems.map((item, idx) => (
          <div key={idx} className="bg-white p-3 rounded-lg flex justify-between items-center shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div>
              <div className="text-[0.65rem] text-gray-500 font-medium">{item.label}</div>
              <div className="text-[0.85rem] font-bold text-gray-800">{item.value}</div>
            </div>
            <div className={`p-2 rounded-full flex items-center justify-center text-white ${item.bg}`}>{item.icon}</div>
          </div>
        ))}
      </div>

      {/* Dashboard Chart for Admin and ITBP (after Summary Card) */}
      {["admin", "itbp"].includes(userRole) && (
        <DashboardChart
          title="Project and Task Overview"
          data={chartData}
          filterStatus={filterStatus1}
          setFilterStatus={setFilterStatus1}
        />
      )}

      {/* Reminder Tasks (Engineer / ITGA / SAP / Data Science) */}
      {["engineer", "itga", "sap", "data_science"].includes(userRole) && (
        <div className="mb-6">
          <div className="flex items-center gap-1 mb-3">
          </div>
       <div className="bg-white rounded-lg shadow-md border border-gray-100 p-3">
  <h3 className="font-bold text-gray-800 text-[0.75rem] tracking-wide mb-3">
    Upcoming Tasks (Next 7 Days)
  </h3>

            {reminderTasks.length === 0 ? (
              <p className="text-gray-500 italic text-[0.65rem] text-center py-2">No upcoming tasks within 7 days</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(reminderTasks.reduce((acc, task) => {
                  if (!acc[task.project_name]) acc[task.project_name] = [];
                  acc[task.project_name].push(task);
                  return acc;
                }, {})).map(([projectName, tasks]) => (
                  <div key={projectName} >
                    <div className="flex items-center gap-1 mb-2 border-b border-gray-200 pb-1">
                      <Folder className="text-blue-500" size={14} />
                      <h4 className="text-gray-800 font-semibold text-[0.7rem]">{projectName}</h4>
                    </div>
                    <ul className="space-y-1">
                      {tasks.map((t) => (
                        <li key={t.id_task} className="flex flex-col bg-blue-50 hover:bg-blue-100 transition-all p-2 rounded-md border border-blue-100">
                          <span className="font-medium text-gray-800 text-[0.65rem]">{t.task_detail}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`text-[0.6rem] font-semibold px-2 py-0.5 rounded-full shadow-sm ${t.isDelay ? "bg-red-600 text-white" : t.status === "TO_DO" ? "bg-red-400 text-white" : t.status === "IN_PROGRESS" ? "bg-yellow-400 text-white" : "bg-green-500 text-white"}`}>
                              {t.isDelay ? "DELAY" : t.status.replace("_", " ")}
                            </div>
                            <div className="text-gray-600 text-[0.6rem] font-medium flex items-center gap-0.5">
                              <Calendar className="text-gray-400" size={12} /> {formatDate(t.plan_end_date)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dashboard Chart for SAP, Data Science, ITGA (below Reminder) */}
      {["sap", "data_science", "itga"].includes(userRole) && (
        <DashboardChart
          title="Project and Task Overview"
          data={chartData}
          filterStatus={filterStatus1}
          setFilterStatus={setFilterStatus1}
        />
      )}

      {/* TABLE 1: Task Summary by Project */}
     
      <div className="bg-white rounded-lg shadow-md border border-gray-100 w-full overflow-x-auto mb-6 p-3">
         <h3 className="font-bold mb-2 text-gray-700 text-[0.75rem]">
        Task Summary by Project
      </h3>
        <div className="flex justify-between pb-3 gap-2 flex-wrap items-center">
          <div className="flex gap-2">
            {/* Filter Bulan/Tahun berdasarkan plan_start_date (Menggunakan "All Month") */}
            <select
              value={filterMonth1}
              onChange={(e) => {
                setFilterMonth1(e.target.value);
                setPageTable1(1);
              }}
              className="p-1 border border-gray-300 rounded-md text-[0.65rem]"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label === "All Month" ? "All Month" : m.label.substring(0, 3)}
                </option>
              ))}
            </select>
            <select
              value={filterYear1}
              onChange={(e) => {
                setFilterYear1(e.target.value);
                setPageTable1(1);
              }}
              className="p-1 border border-gray-300 rounded-md text-[0.65rem]"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 border border-gray-300 rounded-md px-2 py-1">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search Project..."
              className="outline-none w-32 text-[0.65rem]"
              value={searchTable1}
              onChange={(e) => {
                setSearchTable1(e.target.value);
                setPageTable1(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-w-full block">
          <table className="table-auto border-collapse w-full text-[0.65rem]">
            <thead>
              <tr className="bg-blue-600 text-white">
                {table1Headers.map((h, i) => (
                  <th
                    key={h.key}
                    // FIX: Combined className to a single line to resolve syntax error
                    className={`text-left px-3 py-2 font-semibold cursor-pointer select-none whitespace-nowrap ${i === 0 ? "rounded-tl-lg" : ""} ${i === table1Headers.length - 1 ? "rounded-tr-lg" : ""}`} 
                    onClick={() => handleSort1(h.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {h.label}
                      {/* FIX: Replaced incomplete sortConfig with sortConfig1 */}
                      {renderSortIcon(h.key, sortConfig1)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData1.map((p, rowIndex) => (
                <tr key={p.id_project} className={`border-t border-gray-200 ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <td className="px-3 py-2 text-left font-medium text-gray-700">{p.project_name}</td>
                  <td className={`px-3 py-2 font-semibold text-center ${p.task_todo > 0 ? 'text-red-500' : 'text-gray-500'}`}>{p.task_todo}</td>
                  <td className={`px-3 py-2 font-semibold text-center ${p.task_inprogress > 0 ? 'text-yellow-500' : 'text-gray-500'}`}>{p.task_inprogress}</td>
                  <td className={`px-3 py-2 font-semibold text-center ${p.task_completed > 0 ? 'text-green-500' : 'text-gray-500'}`}>{p.task_completed}</td>
                </tr>
              ))}
              {pageData1.length === 0 && (
                <tr>
                  <td colSpan={table1Headers.length} className="text-center py-4 text-gray-500 italic">No projects found matching the criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={pageTable1} pageCount={pageCount1} onPageChange={setPageTable1} />
      </div>

      {/* TABLE 2: Project Status */}
     
      <div className="bg-white rounded-lg shadow-md border border-gray-100 w-full overflow-x-auto p-3">
         <h3 className="font-bold mb-2 text-gray-700 text-[0.75rem]">
        Project Status Overview
      </h3>
        <div className="flex justify-between pb-3 gap-2 flex-wrap items-center">
          <div className="flex gap-2">
            <select
              value={filterStatus2}
              onChange={(e) => {
                setFilterStatus2(e.target.value);
                setPageTable2(1);
              }}
              className="p-1 border border-gray-300 rounded-md text-[0.65rem]"
            >
              <option value="">All Status</option>
              <option value="On Time">On Time</option>
              <option value="Delay">Delay</option>
              <option value="-">N/A</option>
            </select>
            {/* Filter Bulan/Tahun berdasarkan plan_start_date (Menggunakan "All Month") */}
            <select
              value={filterMonth2}
              onChange={(e) => {
                setFilterMonth2(e.target.value);
                setPageTable2(1);
              }}
              className="p-1 border border-gray-300 rounded-md text-[0.65rem]"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label === "All Month" ? "All Month" : m.label.substring(0, 3)}
                </option>
              ))}
            </select>
            <select
              value={filterYear2}
              onChange={(e) => {
                setFilterYear2(e.target.value);
                setPageTable2(1);
              }}
              className="p-1 border border-gray-300 rounded-md text-[0.65rem]"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 border border-gray-300 rounded-md px-2 py-1">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search Project..."
              className="outline-none w-32 text-[0.65rem]"
              value={searchTable2}
              onChange={(e) => {
                setSearchTable2(e.target.value);
                setPageTable2(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-w-full block">
          <table className="table-auto border-collapse w-full text-[0.65rem]">
            <thead>
              <tr className="bg-blue-600 text-white">
                {table2Headers.map((h, i) => (
                  <th
                    key={h.key}
                    className={`text-left px-3 py-2 font-semibold cursor-pointer select-none whitespace-nowrap ${i === 0 ? "rounded-tl-lg" : ""} ${i === table2Headers.length - 1 ? "rounded-tr-lg" : ""}`}
                    onClick={() => handleSort2(h.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {h.label}
                      {renderSortIcon(h.key, sortConfig2)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData2.map((p, rowIndex) => (
                <tr key={p.id_project} className={`border-t border-gray-200 ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <td className="px-3 py-2 text-left font-medium text-gray-700">{p.project_name}</td>
                  <td className="px-3 py-2 text-gray-600">{formatDate(p.plan_start_date)}</td>
                  <td className="px-3 py-2 text-gray-600">{formatDate(p.plan_end_date)}</td>
                  <td className="px-3 py-2 text-gray-600">{formatDate(p.actual_start)}</td>
                  <td className="px-3 py-2 text-gray-600">{formatDate(p.actual_end)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[0.6rem] font-medium ${statusColor(p.plan_end_date, p.actual_end)}`}>
                      {statusLabel(p.plan_end_date, p.actual_end)}
                    </span>
                  </td>
                </tr>
              ))}
              {pageData2.length === 0 && (
                <tr>
                  <td colSpan={table2Headers.length} className="text-center py-4 text-gray-500 italic">No projects found matching the criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={pageTable2} pageCount={pageCount2} onPageChange={setPageTable2} />
      </div>
    </div>
  );
};

export default Dashboard;