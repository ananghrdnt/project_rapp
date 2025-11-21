import React, { useState, useEffect } from "react";
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
import AddTask from "./AddTask";
import EditTask from "./EditTask";
import InfoTask from "./InfoTask";
import Alert from "../Alert";

const TaskList = () => {
  const { id_project } = useParams();
  const { mutate } = useSWRConfig();
  const [projectName, setProjectName] = useState("");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [infoTask, setInfoTask] = useState(null);
  const [alert, setAlert] = useState(null);
  const [sort, setSort] = useState({ key: "id_task", asc: true });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ==========================================================
  // DYNAMIC USER ROLE: ambil dari localStorage (atau fallback)
  // ==========================================================
  const [userRole, setUserRole] = useState("ITBP"); // default "ITBP"
  const [currentUserName, setCurrentUserName] = useState(null);

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData && userData.role) {
        setUserRole(String(userData.role).toUpperCase()); // Pastikan role dalam UPPERCASE
      } else {
        setUserRole("ITBP"); // Default jika tidak ada data user
      }
      if (userData && userData.name) {
        setCurrentUserName(String(userData.name).toLowerCase());
      }
    } catch (err) {
      setUserRole("ITBP");
      setCurrentUserName(null);
    }
  }, []);

  // Definisi feature flags
// Definisi feature flags: role ITGA, SAP, Data Science juga bisa
const canAdd = ["ADMIN", "ITGA", "SAP", "DATA_SCIENCE"].includes(userRole);
const canEdit = ["ADMIN", "ITGA", "SAP", "DATA_SCIENCE"].includes(userRole);
const canDelete = ["ADMIN", "ITGA", "SAP", "DATA_SCIENCE"].includes(userRole);


  // --- Filter states ---
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [tempStatus, setTempStatus] = useState("ALL");
  const [tempMonth, setTempMonth] = useState("");
  const [tempYear, setTempYear] = useState("");

  // --- Filter UI helpers ---
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) =>
    (currentYear - 5 + i).toString()
  );

  const openFilter = () => {
    setTempStatus(statusFilter);
    setTempMonth(monthFilter);
    setTempYear(yearFilter);
    setShowFilterDropdown(true);
  };

  const applyFilter = () => {
    setStatusFilter(tempStatus || "ALL");
    setMonthFilter(tempMonth || "");
    setYearFilter(tempYear || "");
    setShowFilterDropdown(false);
    setPage(1);
  };

  const clearFilter = () => {
    setTempStatus("ALL");
    setTempMonth("");
    setTempYear("");
    setStatusFilter("ALL");
    setMonthFilter("");
    setYearFilter("");
    setShowFilterDropdown(false);
    setPage(1);
  };

  useEffect(() => {
    const fetchProjectName = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/projects/${id_project}`
        );
        setProjectName(res.data.project_name);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjectName();
  }, [id_project]);

  // fetcher menggunakan endpoint yang disamakan dengan ProjectList
  const fetcher = async () => {
    const res = await axios.get(
      `http://localhost:5000/projects/${id_project}/tasks`
    );
    return res.data;
  };
  const { data: tasks, isLoading } = useSWR(`tasks-${id_project}`, fetcher);
  if (isLoading)
    return <h2 className="text-center mt-10 text-gray-600">Loading...</h2>;
  if (!tasks)
    return <h2 className="text-center mt-10 text-gray-600">Loading...</h2>;

  // --- Apply search + filter ---
  const filteredTasks = tasks.filter((t) => {
    const term = search.toLowerCase();
    
    // SESUAIKAN DENGAN SKEMA CONTROLLER: user -> engineer, group -> task_group, platform -> platform
    const matchSearch =
      t.user?.name?.toLowerCase().includes(term) || // Engineer Name
      t.group?.group_name?.toLowerCase().includes(term) || // Task Group Name
      t.task_detail?.toLowerCase().includes(term);

    const taskMonth = t.actual_start
      ? new Date(t.actual_start).toLocaleString("en-US", {
          month: "long",
          timeZone: "UTC",
        })
      : "";
    const taskYear = t.actual_start
      ? new Date(t.actual_start).getFullYear().toString()
      : "";

    const matchStatus =
      statusFilter === "ALL" || t.status === statusFilter.toUpperCase();
    const matchMonth = !monthFilter || taskMonth === monthFilter;
    const matchYear = !yearFilter || taskYear === yearFilter;

    return matchSearch && matchStatus && matchMonth && matchYear;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let valA = a[sort.key];
    let valB = b[sort.key];
    // Khusus untuk nested properties seperti user.name dan group.group_name
    if (sort.key === "user") {
      valA = a.user?.name;
      valB = b.user?.name;
    } else if (sort.key === "group") {
        valA = a.group?.group_name;
        valB = b.group?.group_name;
    } else if (sort.key === "platform") {
        valA = a.platform?.platform; // Sesuaikan dengan field platform di controller
        valB = b.platform?.platform;
    }

    if (valA === null || valA === undefined) valA = "";
    if (valB === null || valB === undefined) valB = "";
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sort.asc ? -1 : 1;
    if (valA > valB) return sort.asc ? 1 : -1;
    return 0;
  });

  const pageCount = Math.ceil(sortedTasks.length / pageSize);
  const pageTasks = sortedTasks.slice((page - 1) * pageSize, page * pageSize);

  const totalTask = filteredTasks.length;
  const toDo = filteredTasks.filter((t) => t.status === "TO_DO").length;
  const inProgress = filteredTasks.filter((t) => t.status === "IN_PROGRESS")
    .length;
  const completed = filteredTasks.filter((t) => t.status === "COMPLETED")
    .length;

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const showConfirm = (message, onConfirm) => {
    setAlert({
      message,
      type: "confirm",
      onConfirm: () => {
        onConfirm();
        setAlert(null); // Tutup alert setelah konfirmasi dijalankan
      },
    });
  };

  const deleteTask = (id) => {
    showConfirm("Are you sure you want to delete this task?", async () => {
      try {
        await axios.delete(`http://localhost:5000/tasks/${id}`);
        mutate(`tasks-${id_project}`);
        showAlert("Task Deleted Successfully", "success");
      } catch (err) {
        console.error(err);
        showAlert("Failed to delete task", "error");
      }
    });
  };

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const humanize = (str) => {
    if (!str) return "-";
    return str
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const statusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500";
      case "IN_PROGRESS":
        return "bg-yellow-500";
      case "TO_DO":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const summaryColor = (label) => {
    switch (label) {
      case "Total Task":
        return "bg-blue-600";
      case "To Do":
        return statusColor("TO_DO");
      case "In Progress":
        return statusColor("IN_PROGRESS");
      case "Completed":
        return statusColor("COMPLETED");
      default:
        return "bg-gray-400";
    }
  };

  const isLateStart = (planStart, actualStart) => {
    if (!planStart || actualStart) return false; // Sudah mulai, atau Plan Start tidak ada
    const today = new Date();
    const planDate = new Date(planStart);
    // Bandingkan tanggal saja, abaikan waktu
    planDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    // Jika hari ini sudah lewat dari Plan Start Date
    return today > planDate;
  };

  const isLateEnd = (planEnd, actualEnd) => {
    if (!planEnd || !actualEnd) return false;
    // Pengecekan akhir: actualEnd > planEnd
    const planDate = new Date(planEnd);
    const actualDate = new Date(actualEnd);
    // Bandingkan tanggal saja
    planDate.setHours(0, 0, 0, 0);
    actualDate.setHours(0, 0, 0, 0);
    return actualDate > planDate;
  };

  const summaryItems = [
    { label: "Total Task", value: totalTask, bg: summaryColor("Total Task") },
    { label: "To Do", value: toDo, bg: summaryColor("To Do") },
    { label: "In Progress", value: inProgress, bg: summaryColor("In Progress") },
    { label: "Completed", value: completed, bg: summaryColor("Completed") },
  ];

  const handleSort = (key) =>
    setSort({ key, asc: sort.key === key ? !sort.asc : true });

  const getSortIcon = (key) => {
    if (sort.key !== key)
      return <MdOutlineSort size={16} className="inline ml-1 text-blue-300" />;
    return sort.asc ? (
      <MdOutlineArrowDropUp size={16} className="inline ml-1 text-blue-300" />
    ) : (
      <MdOutlineArrowDropDown size={16} className="inline ml-1 text-blue-300" />
    );
  };

  // Definisikan header tabel
  const tableHeaders = [
    { key: "task_detail", label: "Task Detail" },
    { key: "group", label: "Task Group" }, // Diubah ke 'group' untuk sorting
    { key: "user", label: "Assigned To" }, // Diubah ke 'user' untuk sorting
    { key: "plan_start_date", label: "Plan Start" },
    { key: "plan_end_date", label: "Plan End" },
    { key: "actual_start", label: "Actual Start" },
    { key: "actual_end", label: "Actual End" },
    { key: "platform", label: "Platform" },
    { key: "task_progress", label: "Progress" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="p-4 min-h-screen font-sans text-[0.7rem]">
      <h2 className="flex items-center gap-2 font-bold text-sm mb-4 text-gray-800">
        <IoDocumentTextOutline className="text-blue-600" size={18} /> TASK LIST
        ({projectName || "Loading..."})
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {summaryItems.map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-3 rounded-xl flex justify-between items-center shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div>
              <div className="text-[0.65rem] text-gray-500">{item.label}</div>
              <div className="text-[0.8rem] font-bold text-gray-800">
                {item.value}
              </div>
            </div>
            <div
              className={`p-2.5 rounded-full flex items-center justify-center text-white ${item.bg} text-[0.8rem]`}
            >
              <IoDocumentTextOutline size={16} />
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center gap-2 mb-3 relative">
        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() =>
              showFilterDropdown ? setShowFilterDropdown(false) : openFilter()
            }
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-2 transition-colors shadow-md"
          >
            <IoFilterOutline size={14} /> Filter
          </button>

          {showFilterDropdown && (
            <div className="absolute left-0 mt-2 w-72 bg-white shadow-xl rounded-xl border border-gray-200 z-50 p-3">
              <div className="mb-2">
                <label className="text-[0.65rem] block mb-1 text-gray-600">
                  Status
                </label>
                <select
                  value={tempStatus}
                  onChange={(e) => setTempStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="ALL">All Status</option>
                  <option value="TO_DO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div className="mb-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.65rem] block mb-1 text-gray-600">
                    Month
                  </label>
                  <select
                    value={tempMonth}
                    onChange={(e) => setTempMonth(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">All Months</option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[0.65rem] block mb-1 text-gray-600">
                    Year
                  </label>
                  <select
                    value={tempYear}
                    onChange={(e) => setTempYear(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={clearFilter}
                  className="bg-gray-300 text-black px-3 py-1 rounded-lg text-[0.65rem] hover:bg-gray-400 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={applyFilter}
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg text-[0.65rem] hover:bg-blue-600 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search + Add Task */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg w-40 text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {/* FLAGGING BUTTON ADD TASK */}
          {canAdd && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-1 cursor-pointer transition-colors shadow-md"
            >
              Add Task
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-0 rounded-xl shadow-lg border border-gray-200 w-full overflow-x-auto">
        <div className="overflow-x-auto overflow-y-hidden max-w-full block">
          <table className={`table-auto border-collapse w-full text-[0.65rem]`}>
            <thead>
              <tr className="bg-blue-600 text-white">
                {tableHeaders.map((h, i) => (
                  <th
                    key={i}
                    className={`text-left px-3 py-2 font-semibold cursor-pointer select-none whitespace-nowrap ${
                      i === 0 ? "rounded-tl-xl" : ""
                    }`}
                    onClick={() => handleSort(h.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {h.label}
                      {getSortIcon(h.key)}
                    </span>
                  </th>
                ))}
                <th className="text-center px-3 py-2 font-semibold rounded-tr-xl whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {pageTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableHeaders.length + 1}
                    className="text-center py-4 text-gray-500 italic border-b"
                  >
                    No Tasks Found
                  </td>
                </tr>
              ) : (
                pageTasks.map((t) => {
                  const lateStart = isLateStart(t.plan_start_date, t.actual_start);
                  const lateEnd = isLateEnd(t.plan_end_date, t.actual_end);
                  
                 // Cek apakah user ini yang ditugaskan ke task
const isAssignedEngineer = t.user?.name?.toLowerCase() === currentUserName;

// Hanya ADMIN bisa edit semua, sedangkan ITGA/SAP/DATA_SCIENCE hanya task miliknya
const showEditButton =
  userRole === "ADMIN" ||
  (["ITGA", "SAP", "DATA_SCIENCE"].includes(userRole) && isAssignedEngineer);

// Hanya ADMIN bisa hapus semua, sedangkan ITGA/SAP/DATA_SCIENCE hanya task miliknya
const showDeleteButton =
  userRole === "ADMIN" ||
  (["ITGA", "SAP", "DATA_SCIENCE"].includes(userRole) && isAssignedEngineer);


                  return (
                    <tr
                      key={t.id_task}
                      className={`transition-colors hover:bg-blue-50 ${
                        lateStart || lateEnd ? "bg-red-100 hover:bg-red-200" : ""
                      }`}
                    >
                <td
                        className={`px-3 py-2 border-b border-gray-200 break-words max-w-[400px] ${
                          t.task_detail?.includes("\n")
                            ? "align-top whitespace-pre-wrap"
                            : "align-middle whitespace-nowrap overflow-hidden text-ellipsis"
                        }`}
                      >
                        {t.task_detail}
                      </td>

                      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap">
                        {t.group?.task_group || "-"} {/* Akses melalui relasi group */}
                      </td>

                      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap">
                        {t.user?.name || "-"} {/* Akses melalui relasi user (Engineer) */}
                      </td>

                      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]">
                        {formatDate(t.plan_start_date)}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]">
                        {formatDate(t.plan_end_date)}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]">
                        {formatDate(t.actual_start)}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]">
                        {formatDate(t.actual_end)}
                      </td>

                      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap">
                        {t.platform?.platform || "-"} {/* Akses melalui relasi platform */}
                      </td>

                      <td className="px-3 py-2 border-b border-gray-200 font-bold text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px]">
                        {t.task_progress}%
                      </td>

                      <td className="px-3 py-2 border-b border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[90px]">
                        <span
                          className={`inline-block px-2 py-1 rounded-lg font-semibold text-[0.6rem] text-white shadow-sm ${statusColor(
                            t.status
                          )}`}
                        >
                          {humanize(t.status)}
                        </span>
                      </td>

                      <td className="px-3 py-2 border-b border-gray-200 text-center whitespace-nowrap max-w-[120px]">
                        <div className="flex justify-center items-center gap-1">
                          {/* Tombol Edit */}
                        {/* Tombol Edit */}
{showEditButton && (
  <button
    onClick={() => setEditId(t.id_task)}
    className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
    title="Edit"
  >
    <IoPencilOutline size={14} />
  </button>
)}

{/* Tombol Delete */}
{showDeleteButton && (
  <button
    onClick={() => deleteTask(t.id_task)}
    className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
    title="Delete"
  >
    <IoTrashOutline size={14} />
  </button>
)}
                          {/* Tombol Info (selalu tampil) */}
                          <button
                            onClick={() => setInfoTask(t)}
                            className="bg-gray-400 hover:bg-gray-500 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
                            title="Info"
                          >
                            <IoInformationCircleOutline size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-4 flex justify-end gap-1 text-[0.65rem] p-3 pt-0">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className={`px-2 py-1 border border-gray-300 rounded-lg transition-colors ${
                page === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100 text-gray-700"
              }`}
            >
              Prev
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                className={`px-2 py-1 border border-gray-300 rounded-lg transition-colors font-semibold ${
                  page === i + 1
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white hover:bg-blue-50 text-gray-700"
                }`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              disabled={page === pageCount}
              className={`px-2 py-1 border border-gray-300 rounded-lg transition-colors ${
                page === pageCount
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100 text-gray-700"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
          actions={
            alert.type === "confirm"
              ? [
                  { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
                  { label: "Confirm", type: "confirm", onClick: alert.onConfirm },
                ]
              : [{ label: "OK", type: "confirm", onClick: () => setAlert(null) }]
          }
        />
      )}

      {/* AddTask modal */}
      {showAddModal && canAdd && (
        <AddTask
          id_project={id_project}
          onClose={() => setShowAddModal(false)}
          onSave={async () => {
            await mutate(`tasks-${id_project}`);
            setShowAddModal(false);
            showAlert("Task Added Successfully", "success");
          }}
        />
      )}

      {/* EditTask modal */}
      {editId && canEdit && (
        <EditTask
          id_task={editId}
          onClose={() => setEditId(null)}
          onSave={async () => {
            await mutate(`tasks-${id_project}`);
            setEditId(null);
            showAlert("Task Updated Successfully", "success");
          }}
        />
      )}

      {infoTask && <InfoTask task={infoTask} onClose={() => setInfoTask(null)} />}
    </div>
  );
};

export default TaskList;