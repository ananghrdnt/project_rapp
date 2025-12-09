import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr";
import {
  IoTrashOutline,
  IoPencilOutline,
  IoDocumentTextOutline,
  IoInformationCircleOutline,
  IoFilterOutline,
} from "react-icons/io5";
import {
  MdOutlineSort,
  MdOutlineArrowDropDown,
  MdOutlineArrowDropUp,
} from "react-icons/md";

// Import komponen modal Anda
import AddTask from "./AddTask";
import EditTask from "./EditTask";
import InfoTask from "./InfoTask";
import Alert from "../Alert";

// --- 1. CONSTANTS & UTILS (Bisa dipindah ke utils/taskUtils.js) ---

const PAGE_SIZE = 10;
const ALLOWED_ROLES = ["ADMIN", "ITGA", "SAP", "DATA_SCIENCE"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Helper: Format Date
const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

// Helper: Humanize Text
const humanize = (str) => {
  if (!str) return "-";
  return str
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

// Helper: Get Colors
const getStatusColor = (status) => {
  const colors = {
    COMPLETED: "bg-green-500",
    IN_PROGRESS: "bg-yellow-500",
    TO_DO: "bg-red-500",
  };
  return colors[status] || "bg-gray-300";
};

const getSummaryColor = (label) => {
  const map = {
    "Total Task": "bg-blue-600",
    "To Do": getStatusColor("TO_DO"),
    "In Progress": getStatusColor("IN_PROGRESS"),
    "Completed": getStatusColor("COMPLETED"),
  };
  return map[label] || "bg-gray-400";
};

// Helper: Late Detection
const isLate = (planDate, actualDate, isEnd = false) => {
  if (!planDate) return false;
  // Jika cek start: return false jika sudah mulai (actual ada)
  if (!isEnd && actualDate) return false; 
  // Jika cek end: return false jika actualEnd belum ada (belum selesai)
  if (isEnd && !actualDate) return false;

  const compareDate = isEnd ? new Date(actualDate) : new Date(); // Start bandingkan dgn today
  const plan = new Date(planDate);
  
  compareDate.setHours(0, 0, 0, 0);
  plan.setHours(0, 0, 0, 0);
  
  return compareDate > plan;
};

// --- 2. SUB-COMPONENTS (Memecah UI agar bersih) ---

const SummaryCards = ({ tasks }) => {
  const stats = useMemo(() => [
    { label: "Total Task", value: tasks.length },
    { label: "To Do", value: tasks.filter((t) => t.status === "TO_DO").length },
    { label: "In Progress", value: tasks.filter((t) => t.status === "IN_PROGRESS").length },
    { label: "Completed", value: tasks.filter((t) => t.status === "COMPLETED").length },
  ], [tasks]);

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {stats.map((item, idx) => (
        <div key={idx} className="bg-white p-3 rounded-xl flex justify-between items-center shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div>
            <div className="text-[0.65rem] text-gray-500">{item.label}</div>
            <div className="text-[0.8rem] font-bold text-gray-800">{item.value}</div>
          </div>
          <div className={`p-2.5 rounded-full flex items-center justify-center text-white ${getSummaryColor(item.label)} text-[0.8rem]`}>
            <IoDocumentTextOutline size={16} />
          </div>
        </div>
      ))}
    </div>
  );
};

const FilterDropdown = ({ isOpen, onClose, onApply, onClear, currentFilters }) => {
  const [localStatus, setLocalStatus] = useState(currentFilters.status);
  const [localMonth, setLocalMonth] = useState(currentFilters.month);
  const [localYear, setLocalYear] = useState(currentFilters.year);

  // Sync internal state when external filters change or modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalStatus(currentFilters.status);
      setLocalMonth(currentFilters.month);
      setLocalYear(currentFilters.year);
    }
  }, [isOpen, currentFilters]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());

  if (!isOpen) return null;

  return (
    <div className="absolute left-0 mt-2 w-72 bg-white shadow-xl rounded-xl border border-gray-200 z-50 p-3">
      <div className="mb-2">
        <label className="text-[0.65rem] block mb-1 text-gray-600">Status</label>
        <select value={localStatus} onChange={(e) => setLocalStatus(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="ALL">All Status</option>
          <option value="TO_DO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <label className="text-[0.65rem] block mb-1 text-gray-600">Month</label>
          <select value={localMonth} onChange={(e) => setLocalMonth(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">All Months</option>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[0.65rem] block mb-1 text-gray-600">Year</label>
          <select value={localYear} onChange={(e) => setLocalYear(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onClear} className="bg-gray-300 text-black px-3 py-1 rounded-lg text-[0.65rem] hover:bg-gray-400 transition-colors">Clear</button>
        <button onClick={() => onApply(localStatus, localMonth, localYear)} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-[0.65rem] hover:bg-blue-600 transition-colors">Apply</button>
      </div>
    </div>
  );
};

const TaskRow = ({ task, userRole, currentUserName, onEdit, onDelete, onInfo }) => {
  const lateStart = isLate(task.plan_start_date, task.actual_start, false);
  const lateEnd = isLate(task.plan_end_date, task.actual_end, true);
  
  const isAssignedEngineer = task.user?.name?.toLowerCase() === currentUserName;
  // Gunakan allowed_roles untuk logic permission
  const hasAccess = ALLOWED_ROLES.includes(userRole);
  
  const showEdit = userRole === "ADMIN" || (hasAccess && isAssignedEngineer);
  const showDelete = userRole === "ADMIN" || (hasAccess && isAssignedEngineer);

  const rowClass = `transition-colors hover:bg-blue-50 ${lateStart || lateEnd ? "bg-red-100 hover:bg-red-200" : ""}`;

  return (
    <tr className={rowClass}>
      <td className={`px-3 py-2 border-b border-gray-200 break-words max-w-[400px] ${task.task_detail?.includes("\n") ? "align-top whitespace-pre-wrap" : "align-middle whitespace-nowrap overflow-hidden text-ellipsis"}`}>
        {task.task_detail}
      </td>
      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap">{task.group?.task_group || "-"}</td>
      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap">{task.user?.name || "-"}</td>
      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]">{formatDate(task.plan_start_date)}</td>
      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]">{formatDate(task.plan_end_date)}</td>
      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]">{formatDate(task.actual_start)}</td>
      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]">{formatDate(task.actual_end)}</td>
      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap">{task.platform?.platform || "-"}</td>
      <td className="px-3 py-2 border-b border-gray-200 font-bold text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px]">{task.task_progress}%</td>
      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[90px]">
        <span className={`inline-block px-2 py-1 rounded-lg font-semibold text-[0.6rem] text-white shadow-sm ${getStatusColor(task.status)}`}>
          {humanize(task.status)}
        </span>
      </td>
      <td className="px-3 py-2 border-b border-gray-200 text-center whitespace-nowrap max-w-[120px]">
        <div className="flex justify-center items-center gap-1">
          {showEdit && (
            <button onClick={() => onEdit(task.id_task)} className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-lg w-6 h-6 flex justify-center items-center transition-colors shadow-sm" title="Edit">
              <IoPencilOutline size={14} />
            </button>
          )}
          {showDelete && (
            <button onClick={() => onDelete(task.id_task)} className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg w-6 h-6 flex justify-center items-center transition-colors shadow-sm" title="Delete">
              <IoTrashOutline size={14} />
            </button>
          )}
          <button onClick={() => onInfo(task)} className="bg-gray-400 hover:bg-gray-500 text-white p-1 rounded-lg w-6 h-6 flex justify-center items-center transition-colors shadow-sm" title="Info">
            <IoInformationCircleOutline size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- 3. MAIN COMPONENT ---

const TaskList = () => {
  const { id_project } = useParams();
  const { mutate } = useSWRConfig();
  
  // State
  const [projectName, setProjectName] = useState("");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [infoTask, setInfoTask] = useState(null);
  const [alert, setAlert] = useState(null);
  const [sort, setSort] = useState({ key: "id_task", asc: true });
  const [page, setPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Filter State
  const [filters, setFilters] = useState({ status: "ALL", month: "", year: "" });

  // User Role Logic
  const { userRole, currentUserName } = useMemo(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      return {
        userRole: userData?.role ? String(userData.role).toUpperCase() : "ITBP",
        currentUserName: userData?.name ? String(userData.name).toLowerCase() : null
      };
    } catch {
      return { userRole: "ITBP", currentUserName: null };
    }
  }, []);

  const canAdd = ALLOWED_ROLES.includes(userRole);

  // Data Fetching
  useEffect(() => {
    const fetchProjectName = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/projects/${id_project}`);
        setProjectName(res.data.project_name);
      } catch (err) { console.error(err); }
    };
    fetchProjectName();
  }, [id_project]);

  const { data: tasks, isLoading } = useSWR(`tasks-${id_project}`, async () => {
    const res = await axios.get(`http://localhost:5000/projects/${id_project}/tasks`);
    return res.data;
  });

  // --- Filtering & Sorting Logic (Memoized) ---
  const processedTasks = useMemo(() => {
    if (!tasks) return [];

    // 1. Filtering
    let result = tasks.filter((t) => {
      const term = search.toLowerCase();
      const matchSearch =
        t.user?.name?.toLowerCase().includes(term) ||
        t.group?.group_name?.toLowerCase().includes(term) ||
        t.task_detail?.toLowerCase().includes(term);

      // Date parsing for filter
      const d = t.actual_start ? new Date(t.actual_start) : null;
      const taskMonth = d ? d.toLocaleString("en-US", { month: "long", timeZone: "UTC" }) : "";
      const taskYear = d ? d.getFullYear().toString() : "";

      const matchStatus = filters.status === "ALL" || t.status === filters.status.toUpperCase();
      const matchMonth = !filters.month || taskMonth === filters.month;
      const matchYear = !filters.year || taskYear === filters.year;

      return matchSearch && matchStatus && matchMonth && matchYear;
    });

    // 2. Sorting
    result.sort((a, b) => {
      let valA = a[sort.key];
      let valB = b[sort.key];

      // Handle nested
      if (sort.key === "user") valA = a.user?.name;
      else if (sort.key === "group") valA = a.group?.group_name;
      else if (sort.key === "platform") valA = a.platform?.platform;
      
      if (sort.key === "user") valB = b.user?.name;
      else if (sort.key === "group") valB = b.group?.group_name;
      else if (sort.key === "platform") valB = b.platform?.platform;

      // Normalize
      valA = (valA ?? "").toString().toLowerCase();
      valB = (valB ?? "").toString().toLowerCase();

      if (valA < valB) return sort.asc ? -1 : 1;
      if (valA > valB) return sort.asc ? 1 : -1;
      return 0;
    });

    return result;
  }, [tasks, search, filters, sort]);

  // Pagination Logic
  const pageCount = Math.ceil(processedTasks.length / PAGE_SIZE);
  const pageTasks = processedTasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // --- Handlers ---
  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleDelete = (id) => {
    setAlert({
      message: "Are you sure you want to delete this task?",
      type: "confirm",
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5000/tasks/${id}`);
          mutate(`tasks-${id_project}`);
          showAlert("Task Deleted Successfully", "success");
        } catch (err) {
          console.error(err);
          showAlert("Failed to delete task", "error");
        }
        setAlert(null);
      },
    });
  };

  const handleApplyFilter = (st, mo, ye) => {
    setFilters({ status: st, month: mo, year: ye });
    setShowFilterDropdown(false);
    setPage(1);
  };

  const handleSort = (key) => setSort({ key, asc: sort.key === key ? !sort.asc : true });

  const getSortIcon = (key) => {
    if (sort.key !== key) return <MdOutlineSort size={16} className="inline ml-1 text-blue-300" />;
    return sort.asc ? <MdOutlineArrowDropUp size={16} className="inline ml-1 text-blue-300" /> : <MdOutlineArrowDropDown size={16} className="inline ml-1 text-blue-300" />;
  };

  if (isLoading || !tasks) return <h2 className="text-center mt-10 text-gray-600">Loading...</h2>;

  return (
    <div className="p-4 min-h-screen font-sans text-[0.7rem]">
      <h2 className="flex items-center gap-2 font-bold text-sm mb-4 text-gray-800">
        <IoDocumentTextOutline className="text-blue-600" size={18} /> TASK LIST ({projectName || "..."})
      </h2>

      <SummaryCards tasks={processedTasks} />

      <div className="flex justify-between items-center gap-2 mb-3 relative">
        <div className="relative">
          <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-2 transition-colors shadow-md">
            <IoFilterOutline size={14} /> Filter
          </button>
          <FilterDropdown 
            isOpen={showFilterDropdown} 
            onClose={() => setShowFilterDropdown(false)}
            onApply={handleApplyFilter}
            onClear={() => handleApplyFilter("ALL", "", "")}
            currentFilters={filters}
          />
        </div>

        <div className="flex items-center gap-2">
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg w-40 text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400" />
          {canAdd && (
            <button onClick={() => setShowAddModal(true)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-1 cursor-pointer transition-colors shadow-md">
              Add Task
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-0 rounded-xl shadow-lg border border-gray-200 w-full overflow-x-auto">
        <table className="table-auto border-collapse w-full text-[0.65rem]">
          <thead>
            <tr className="bg-blue-600 text-white">
              {[
                { k: "task_detail", l: "Task Detail" }, { k: "group", l: "Task Group" },
                { k: "user", l: "Assigned To" }, { k: "plan_start_date", l: "Plan Start" },
                { k: "plan_end_date", l: "Plan End" }, { k: "actual_start", l: "Actual Start" },
                { k: "actual_end", l: "Actual End" }, { k: "platform", l: "Platform" },
                { k: "task_progress", l: "Progress" }, { k: "status", l: "Status" }
              ].map((h, i) => (
                <th key={i} className={`text-left px-3 py-2 font-semibold cursor-pointer select-none whitespace-nowrap ${i === 0 ? "rounded-tl-xl" : ""}`} onClick={() => handleSort(h.k)}>
                  <span className="inline-flex items-center gap-1">{h.l} {getSortIcon(h.k)}</span>
                </th>
              ))}
              <th className="text-center px-3 py-2 font-semibold rounded-tr-xl whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageTasks.length === 0 ? (
              <tr><td colSpan={11} className="text-center py-4 text-gray-500 italic border-b">No Tasks Found</td></tr>
            ) : (
              pageTasks.map((t) => (
                <TaskRow 
                  key={t.id_task} 
                  task={t} 
                  userRole={userRole} 
                  currentUserName={currentUserName} 
                  onEdit={setEditId} 
                  onDelete={handleDelete} 
                  onInfo={setInfoTask}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Modals */}
      {pageCount > 1 && (
        <div className="mt-4 flex justify-end gap-1 text-[0.65rem] p-3 pt-0">
           <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 disabled:bg-gray-200">Prev</button>
           <span className="px-2 py-1">{page} / {pageCount}</span>
           <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 disabled:bg-gray-200">Next</button>
        </div>
      )}

      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} actions={alert.type === "confirm" ? [{ label: "Cancel", onClick: () => setAlert(null) }, { label: "Confirm", onClick: alert.onConfirm }] : undefined} />}
      
      {showAddModal && <AddTask id_project={id_project} onClose={() => setShowAddModal(false)} onSave={async () => { await mutate(`tasks-${id_project}`); setShowAddModal(false); showAlert("Task Added"); }} />}
      {editId && <EditTask id_task={editId} onClose={() => setEditId(null)} onSave={async () => { await mutate(`tasks-${id_project}`); setEditId(null); showAlert("Task Updated"); }} />}
      {infoTask && <InfoTask task={infoTask} onClose={() => setInfoTask(null)} />}
    </div>
  );
};

export default TaskList;