import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr";
import { FiFolder } from "react-icons/fi";
import {
  IoTrashOutline,
  IoPencilOutline,
  IoInformationCircleOutline,
  IoDownloadOutline,
  IoGitBranchOutline,
  IoFilterOutline,
} from "react-icons/io5";
import { 
  MdOutlineSort, 
  MdOutlineArrowDropDown, 
  MdOutlineArrowDropUp 
} from "react-icons/md";
import AddProject from "./AddProject";
import EditProject from "./EditProject";
import InfoProject from "./InfoProject";
import KanbanBoard from "./KanbanBoard";
import Alert from "../Alert";

const ProjectList = () => {
  const { mutate } = useSWRConfig();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [infoProject, setInfoProject] = useState(null);
  const [alert, setAlert] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadStart, setDownloadStart] = useState("");
  const [downloadEnd, setDownloadEnd] = useState("");
  const [showKanban, setShowKanban] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("DEFAULT");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [tempStatus, setTempStatus] = useState(statusFilter);
  const [tempMonth, setTempMonth] = useState(monthFilter);
  const [tempYear, setTempYear] = useState(yearFilter);

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "id_project", asc: true });
  const pageSize = 10;

  // KONFIGURASI TERPUSAT - Semua config di satu tempat
  
  const colorConfig = useMemo(() => ({
    level: {
      HIGH: "bg-red-500",
      MID: "bg-yellow-500",
      LOW: "bg-green-500",
      default: "bg-gray-300"
    },
    status: {
      COMPLETED: "bg-green-500",
      IN_PROGRESS: "bg-yellow-500",
      TO_DO: "bg-red-500",
      DEFAULT: "bg-gray-300"
    }
  }), []);

  const tableColumns = useMemo(() => [
    { key: "project_name", label: "Project", width: "whitespace-nowrap" },
    { key: "assigned_to", label: "Assigned To", width: "whitespace-nowrap" },
    { key: "project_type", label: "Type", width: "whitespace-nowrap" },
    { key: "level", label: "Effort", width: "whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px]" },
    { key: "req_date", label: "Req Date", width: "whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]" },
    { key: "plan_start_date", label: "Plan Start", width: "whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]" },
    { key: "plan_end_date", label: "Plan End", width: "whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]" },
    { key: "actual_start", label: "Actual Start", width: "whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]" },
    { key: "actual_end", label: "Actual End", width: "whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]" },
    { key: "live_date", label: "Go Live", width: "whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]" },
    { key: "project_progress", label: "Progress", width: "whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px] text-center font-bold" },
    { key: "status", label: "Status", width: "whitespace-nowrap overflow-hidden text-ellipsis max-w-[90px]" },
    { key: "remark", label: "Remark", width: "align-top min-w-[300px] max-w-[400px] break-words whitespace-pre-wrap" }
  ], []);

  // FUNGSI UTILITAS REUSABLE
  
  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }, []);

  const humanize = useCallback((str) => {
    if (!str) return "-";
    return str
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, []);

  const getColor = useCallback((type, value) => {
    const config = colorConfig[type];
    return config[value] || config.default;
  }, [colorConfig]);

  const getMonthName = useCallback((dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  }, []);

  // PERMISSION HANDLING
  
  useEffect(() => {
  const userData = JSON.parse(localStorage.getItem("user"));
  const role = userData?.role?.toUpperCase() || "ITGA";
  setUserRole(role);
  }, []);

  const isAdmin = userRole === "ADMIN";
  const isITBP = userRole === "ITBP";
  const isSAP = userRole === "SAP";
  const isDataScience = userRole === "DATA_SCIENCE";
  
  const canAdd = isAdmin || isITBP || isSAP || isDataScience;
  const canEdit = isAdmin || isITBP || isSAP || isDataScience;
  const canDelete = isAdmin || isITBP || isSAP || isDataScience;
  const canDownload = isAdmin;

  // DATA FETCHING
  
  const fetcher = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await axios.get("http://localhost:5000/projects");
    
    const projects = res.data.map(p => ({
      ...p,
      assigned_to_name: p.user?.name || "-",
      assigned_to_role: p.user?.role?.role || null,
      project_type_name: p.projectType?.project_type || "-",
    }));

    const role = user?.role?.toUpperCase();
    const userNameLower = user?.name?.toLowerCase();

    if (role === "ADMIN") return projects;

    if (["ITBP", "SAP", "DATA_SCIENCE"].includes(role)) {
      return projects.filter(p => 
        (p.assigned_to_name?.toLowerCase() === userNameLower) || 
        (p.tasks?.some(t => t.user?.name?.toLowerCase() === userNameLower)) ||
        (["SAP", "DATA_SCIENCE"].includes(role) && p.assigned_to_role === "ITBP")
      );
    }

    if (role === "ITGA") {
      return projects.filter(p => p.assigned_to_role === "ITBP");
    }

    return [];
  }, []);

  const { data: projects, isLoading } = useSWR(
    userRole ? "projects" : null, 
    fetcher
  );

  const updateProjectProgress = useCallback(async (id) => {
    try {
      await axios.put(`http://localhost:5000/projects/${id}/update-progress`);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (projects?.length > 0) {
      projects.forEach((p) => updateProjectProgress(p.id_project));
      mutate("projects");
    }
  }, [projects, mutate, updateProjectProgress]);

  // DATA PROCESSING
  
  // Sorting
  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    
    return [...projects].sort((a, b) => {
      let valA = a[sort.key];
      let valB = b[sort.key];
      
      if (sort.key === 'itbp') {
        valA = a.itbp?.name;
        valB = b.itbp?.name;
      }
      
      valA = valA ?? "";
      valB = valB ?? "";
      
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      
      if (valA < valB) return sort.asc ? -1 : 1;
      if (valA > valB) return sort.asc ? 1 : -1;
      return 0;
    });
  }, [projects, sort]);

  // Filtering
  const filteredProjects = useMemo(() => {
    return sortedProjects.filter((p) => {
      const matchSearch = p.project_name
        .toLowerCase()
        .includes(search.toLowerCase());

      const planMonth = getMonthName(p.plan_start_date);
      const planYear = p.plan_start_date
        ? new Date(p.plan_start_date).getFullYear().toString()
        : "";

      const matchMonth = monthFilter === "" || planMonth === monthFilter;
      const matchYear = yearFilter === "" || planYear === yearFilter;
      
      const isDefault = statusFilter === "DEFAULT";
      const isAll = statusFilter === "ALL";

        let matchStatusFinal = false;

        if (isAll) {
          matchStatusFinal = true;
        } else if (isDefault) {
          matchStatusFinal = ["TO_DO", "IN_PROGRESS"].includes(p.status);
        } else {
          matchStatusFinal = p.status === statusFilter;
        }

      return matchSearch && matchStatusFinal && matchMonth && matchYear;
    });
  }, [sortedProjects, search, statusFilter, monthFilter, yearFilter, getMonthName]);

  // Pagination
  const pageCount = Math.ceil(filteredProjects.length / pageSize);
  const pageData = filteredProjects.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Summary data
  const summaryData = useMemo(() => {
    const totalProject = filteredProjects.length;
    const toDo = filteredProjects.filter((p) => p.status === "TO_DO").length;
    const inProgress = filteredProjects.filter((p) => p.status === "IN_PROGRESS").length;
    const completed = filteredProjects.filter((p) => p.status === "COMPLETED").length;

    return [
      { label: "Total Project", value: totalProject, bg: "bg-blue-600" },
      { label: "To Do", value: toDo, bg: getColor("status", "TO_DO") },
      { label: "In Progress", value: inProgress, bg: getColor("status", "IN_PROGRESS") },
      { label: "Completed", value: completed, bg: getColor("status", "COMPLETED") }
    ];
  }, [filteredProjects, getColor]);

  // HANDLERS
  
  const handleSort = useCallback((key) => {
    setSort({ key, asc: sort.key === key ? !sort.asc : true });
  }, [sort]);

  const showAlert = useCallback((message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  const showConfirm = useCallback((message, onConfirm) => {
    setAlert({
      message,
      type: "confirm",
      onConfirm: () => {
        onConfirm();
        setAlert(null);
      },
    });
  }, []);

  const deleteProject = useCallback((id) => {
    if (!canDelete) {
      showAlert("You do not have permission to delete projects.", "error");
      return;
    }
    
    showConfirm("Are you sure you want to delete this project?", async () => {
      try {
        await axios.delete(`http://localhost:5000/projects/${id}`);
        mutate("projects");
        showAlert("Project Deleted Successfully", "success");
      } catch (err) {
        const errorMessage = err.response?.data?.message?.includes("foreign key") ||
          err.response?.data?.message?.includes("task")
          ? "Failed to delete project"
          : err.response?.data?.message || "Failed to delete project because it contains task list inside";
        showAlert(errorMessage, "error");
      }
    });
  }, [canDelete, showAlert, showConfirm, mutate]);

  const handleInfo = useCallback(async (id_project) => {
    try {
      const res = await axios.get(`http://localhost:5000/projects/${id_project}`);
      setInfoProject(res.data);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load project info", "error");
    }
  }, [showAlert]);

  const downloadExcel = useCallback(async () => {
    if (!canDownload) {
      showAlert("You do not have permission to download data.", "error");
      return;
    }
    
    try {
      if (!downloadStart || !downloadEnd) {
        showAlert("Please select start and end dates", "error");
        return;
      }
      
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/projects/download?start=${downloadStart}&end=${downloadEnd}`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `projects_tasks.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setShowDownloadModal(false);
      showAlert("Download Started", "success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to download project data", "error");
    }
  }, [canDownload, downloadStart, downloadEnd, showAlert]);

  // Filter handlers
  const openFilter = useCallback(() => {
    setTempStatus(statusFilter);
    setTempMonth(monthFilter);
    setTempYear(yearFilter);
    setShowFilterDropdown(true);
  }, [statusFilter, monthFilter, yearFilter]);

  const applyFilter = useCallback(() => {
    setStatusFilter(tempStatus || "ALL");
    setMonthFilter(tempMonth || "");
    setYearFilter(tempYear || "");
    setShowFilterDropdown(false);
    setPage(1);
  }, [tempStatus, tempMonth, tempYear]);

  const clearFilter = useCallback(() => {
    setTempStatus("ALL");
    setTempMonth("");
    setTempYear("");
    setStatusFilter("ALL");
    setMonthFilter("");
    setYearFilter("");
    setShowFilterDropdown(false);
    setPage(1);
  }, []);

  // FILTER OPTIONS
  
  const months = useMemo(() => [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ], []);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());
  }, []);

  const statusOptions = useMemo(() => [
    { value: "DEFAULT", label: "Choose Status" },
    { value: "ALL", label: "All Status" },
    { value: "TO_DO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" }
  ], []);

  // RENDER FUNCTIONS
  
  const renderTableCell = useCallback((column, project) => {
    const { key } = column;
    
    switch (key) {
      case "level":
        return (
          <span className={`inline-block px-2 py-1 rounded-lg font-semibold text-[0.6rem] text-white ${getColor("level", project.level)}`}>
            {humanize(project.level)}
          </span>
        );
        
      case "status":
        return (
          <span className={`inline-block px-2 py-1 rounded-lg font-semibold text-[0.6rem] text-white ${getColor("status", project.status)}`}>
            {humanize(project.status)}
          </span>
        );
        
      case "project_progress":
        return `${project.project_progress}%`;
        
      case "assigned_to":
        return project.assigned_to_name || "-";
        
      case "project_type":
        return project.project_type_name ? humanize(project.project_type_name) : "-";
        
      case "remark":
        return project.remark || "-";
        
      default:
        // Handle date fields
        if (key.includes("date") || key.includes("start") || key.includes("end") || key === "live_date") {
          return formatDate(project[key]);
        }
        return project[key];
    }
  }, [getColor, humanize, formatDate]);

  const renderSortIcon = useCallback((key) => {
    if (sort.key !== key) return <MdOutlineSort size={16} className="inline ml-1 text-blue-300" />;
    return sort.asc ? (
      <MdOutlineArrowDropUp size={16} className="inline ml-1 text-blue-300" />
    ) : (
      <MdOutlineArrowDropDown size={16} className="inline ml-1 text-blue-300" />
    );
  }, [sort]);

  if (isLoading || userRole === null) {
    return <h2 className="text-center mt-10 text-gray-600">Loading...</h2>;
  }

  return (
    <div className="p-4 min-h-screen font-sans text-[0.7rem]">
      <h2 className="flex items-center gap-2 font-bold text-sm mb-4 text-gray-800">
        <FiFolder className="text-blue-600" size={18} /> PROJECT
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {summaryData.map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-3 rounded-xl flex justify-between items-center shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div>
              <div className="text-[0.65rem] text-gray-500">{item.label}</div>
              <div className="text-[0.8rem] font-bold text-gray-800">{item.value}</div>
            </div>
            <div className={`p-2.5 rounded-full flex items-center justify-center text-white ${item.bg} text-[0.8rem]`}>
              <FiFolder size={16} />
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center gap-2 mb-3">
        <div className="flex items-center gap-2 relative">
          {/* Download Data Button */}
          {canDownload && (
            <button
              onClick={() => setShowDownloadModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-1 transition-colors shadow-md"
            >
              <IoDownloadOutline size={14} /> Download Data
            </button>
          )}
          
          <button
            onClick={() => setShowKanban(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-1 transition-colors shadow-md"
          >
            <IoGitBranchOutline size={14} /> View Kanban Board
          </button>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => showFilterDropdown ? setShowFilterDropdown(false) : openFilter()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-2 transition-colors shadow-md"
            >
              <IoFilterOutline size={14} /> Filter
            </button>

            {showFilterDropdown && (
              <div className="absolute left-0 mt-2 w-72 bg-white shadow-xl rounded-xl border border-gray-200 z-50 p-3">
                <div className="mb-2">
                  <label 
                    htmlFor="status-filter-project"
                    className="text-[0.65rem] block mb-1 text-gray-600">
                      Status
                  </label>
                  <select
                    id="status-filter-project"
                    value={tempStatus}
                    onChange={(e) => setTempStatus(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2 grid grid-cols-2 gap-2">
                  <div>
                    <label 
                      htmlFor="mounth-filter-project"
                      className="text-[0.65rem] block mb-1 text-gray-600">Month</label>
                    <select
                      id="mounth-filter-project"
                      value={tempMonth}
                      onChange={(e) => setTempMonth(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">All Months</option>
                      {months.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label 
                      htmlFor="year-filter-project"
                      className="text-[0.65rem] block mb-1 text-gray-600">Year</label>
                    <select
                      id="year-filter-project"
                      value={tempYear}
                      onChange={(e) => setTempYear(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">All Years</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={clearFilter}
                    className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-1 rounded-lg text-[0.65rem] transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={applyFilter}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-[0.65rem] transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-1 text-[0.65rem] w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {/* Add Project Button */}
          {canAdd && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-1 cursor-pointer transition-colors shadow-md"
            >
              Add Project
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-0 rounded-xl shadow-lg border border-gray-200 w-full overflow-x-auto">
        <table className="table-auto border-collapse w-full text-[0.65rem]">
          <thead>
            <tr className="bg-blue-600 text-white">
              {tableColumns.map((col, i) => (
                <th
                  key={col.key}
                  className={`text-left px-3 py-2 font-semibold cursor-pointer select-none ${col.width} ${
                    i === 0 ? "rounded-tl-xl" : ""
                  }`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label} {renderSortIcon(col.key)}
                  </span>
                </th>
              ))}
              <th className="text-center px-3 py-2 font-semibold rounded-tr-xl whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={tableColumns.length + 1} className="text-center py-4 text-gray-500 italic">
                  No Projects Found
                </td>
              </tr>
            ) : (
              pageData.map((p) => (
                <tr key={p.id_project} className="hover:bg-blue-50 transition-colors">
                  {tableColumns.map((col) => (
                    <td key={col.key} className={`px-3 py-2 border-b border-gray-200 ${col.width}`}>
                      {renderTableCell(col, p)}
                    </td>
                  ))}
                  
                  {/* Action Column */}
                  <td className="px-3 py-2 border-b border-gray-200 text-center whitespace-nowrap max-w-[120px]">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Link
                        to={`/projects/${p.id_project}`}
                        className="bg-blue-800 hover:bg-blue-900 text-white text-[0.6rem] rounded-lg px-2 py-1 whitespace-nowrap transition-colors shadow-md w-full flex items-center justify-center"
                      >
                        View Task
                      </Link>

                      <div className="flex justify-center items-center gap-2 mt-1">
                        {canEdit && (
                          <button
                            onClick={() => setEditId(p.id_project)}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
                          >
                            <IoPencilOutline size={14} />
                          </button>
                        )}
                        
                        {canDelete && (
                          <button
                            onClick={() => deleteProject(p.id_project)}
                            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
                          >
                            <IoTrashOutline size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => handleInfo(p.id_project)}
                          className="bg-gray-400 hover:bg-gray-500 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
                        >
                          <IoInformationCircleOutline size={14} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="mt-4 flex justify-end gap-1 text-[0.65rem]">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className={`px-2 py-1 border border-gray-300 rounded-lg transition-colors ${
              page === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
          >
            Prev
          </button>
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              className={`px-2 py-1 border border-gray-300 rounded-lg transition-colors font-semibold ${
                page === i + 1 ? "bg-blue-600 text-white shadow-md" : "bg-white hover:bg-blue-50 text-gray-700"
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
              page === pageCount ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Alert */}
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

      {/* Modals */}
      {showKanban && <KanbanBoard onClose={() => setShowKanban(false)} />}

      {showDownloadModal && canDownload && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 shadow-2xl">
            <h3 className="font-bold mb-4 text-base text-gray-800 border-b pb-2">Download Project Data</h3>
            <div className="flex flex-col gap-3 mb-5 text-[0.7rem]">
              <div>
                <label 
                  htmlFor="startDate-download"
                  className="text-gray-600 block mb-1">Start Date (Plan)</label>
                <input
                  id="startDate-download"
                  type="date"
                  value={downloadStart}
                  onChange={(e) => setDownloadStart(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label 
                  htmlFor="endDate-download"
                  className="text-gray-600 block mb-1">End Date (Plan)</label>
                <input
                  id="endDate-download"
                  type="date"
                  value={downloadEnd}
                  onChange={(e) => setDownloadEnd(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 text-[0.7rem]">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={downloadExcel}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && canAdd && (
        <AddProject
          onClose={() => setShowModal(false)}
          onSave={async () => {
            await mutate("projects");
            showAlert("Project Added Successfully", "success");
          }}
        />
      )}

      {editId && canEdit && (
        <EditProject
          id_project={editId}
          onClose={() => setEditId(null)}
          onSave={async () => {
            await mutate("projects");
            setEditId(null);
            showAlert("Project Updated Successfully", "success");
          }}
        />
      )}

      {infoProject && (
        <InfoProject
          project={infoProject}
          onClose={() => setInfoProject(null)}
        />
      )}
    </div>
  );
};

export default ProjectList;