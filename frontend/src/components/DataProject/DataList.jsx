import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  MdOutlineSort,
  MdOutlineArrowDropDown,
  MdOutlineArrowDropUp,
} from "react-icons/md";
import {
  IoTrashOutline,
  IoPencilOutline,
  IoLayersOutline,
  IoFolderOutline,
  IoListOutline,
  IoBriefcaseOutline,
  IoFilterOutline,
} from "react-icons/io5";
import { FiDatabase } from "react-icons/fi";
import Alert from "../Alert";
import AddData from "./AddData";
import EditData from "./EditData";

const DataList = () => {
  const [activeTab, setActiveTab] = useState("projectType");
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  
  // Data states
  const [projectTypes, setProjectTypes] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [taskGroups, setTaskGroups] = useState([]);
  const [positions, setPositions] = useState([]);

  // Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    mode: 'add', // 'add' atau 'edit'
    dataId: null
  });

  // Filter state
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [tempRole, setTempRole] = useState("ALL");

  // KONFIGURASI DATA - Pakai useMemo untuk stabilisasi
  const dataConfig = useMemo(() => ({
    projectType: {
      endpoint: "http://localhost:5000/projecttypes",
      idField: "id_type",
      nameField: "project_type",
      setter: setProjectTypes,
      getDeleteUrl: (id) => `http://localhost:5000/projecttypes/${id}`,
      label: "Project Type",
      icon: IoLayersOutline,
      color: "bg-blue-600",
      hasRole: false
    },
    platformTask: {
      endpoint: "http://localhost:5000/platforms",
      idField: "id_platform",
      nameField: "platform",
      setter: setPlatforms,
      getDeleteUrl: (id) => `http://localhost:5000/platforms/${id}`,
      label: "Platform Task",
      icon: IoFolderOutline,
      color: "bg-green-600",
      hasRole: false
    },
    taskGroup: {
      endpoint: "http://localhost:5000/task-groups",
      idField: "id_group",
      nameField: "task_group",
      setter: setTaskGroups,
      getDeleteUrl: (id) => `http://localhost:5000/task-groups/${id}`,
      label: "Task Group",
      icon: IoListOutline,
      color: "bg-orange-500",
      hasRole: false
    },
    positionUser: {
      endpoint: "http://localhost:5000/positions",
      idField: "id_position",
      nameField: "position",
      setter: setPositions,
      getDeleteUrl: (id) => `http://localhost:5000/positions/${id}`,
      label: "Position User",
      icon: IoBriefcaseOutline,
      color: "bg-purple-600",
      hasRole: true
    }
  }), [setProjectTypes, setPlatforms, setTaskGroups, setPositions]);

  // FUNGSI UTILITAS - Reusable functions
  // Format role untuk display
  const formatRoleDisplay = useCallback((role) => {
    if (!role || role === "ALL") return role === "ALL" ? "All Roles" : "N/A";
    if (["ITBP", "ITGA", "SAP", "Admin"].includes(role)) return role;
    
    return role
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }, []);

  // Get sort icon
  const getSortIcon = useCallback((key) => {
    const iconClass = "inline ml-1 text-lg text-blue-300";
    if (sortConfig.key !== key) return <MdOutlineSort className={iconClass} />;
    return sortConfig.direction === "asc" ? (
      <MdOutlineArrowDropUp className={iconClass} />
    ) : (
      <MdOutlineArrowDropDown className={iconClass} />
    );
  }, [sortConfig.direction, sortConfig.key]);

  // Show alert
  const showAlert = useCallback((message, type = "success", onConfirm = null) => {
    setAlert({ message, type, onConfirm });
    if (type !== "confirm") {
      setTimeout(() => setAlert(null), 2500);
    }
  }, []);

  // FUNGSI FETCH DATA - Single reusable function
  const fetchData = useCallback(async (type) => {
    const config = dataConfig[type];
    if (!config) return;
    
    try {
      const res = await axios.get(config.endpoint);
      if (type === "positionUser") {
        config.setter(res.data.map(item => ({
          id: item[config.idField],
          name: item[config.nameField],
          role: item.role ? item.role.role : 'N/A'
        })));
      } else {
        config.setter(res.data.map(item => ({
          id: item[config.idField],
          name: item[config.nameField]
        })));
      }
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      showAlert(`Failed to fetch ${config.label}`, "error");
    }
  }, [dataConfig, showAlert]);

  // Fetch all data untuk card counts
  const fetchAllData = useCallback(() => {
    Object.keys(dataConfig).forEach(type => fetchData(type));
  }, [dataConfig, fetchData]);

  // USE EFFECT
  useEffect(() => {
    // 1. Ambil SEMUA data saat mount (untuk card counts)
    fetchAllData();
    
    // 2. Reset filter dan search saat tab berubah
    setRoleFilter("ALL");
    setSearch("");
    setShowFilterDropdown(false);
    
    // 3. Fetch data untuk tab aktif
    fetchData(activeTab);
  }, [activeTab, fetchData, fetchAllData]);

  // DATA PROCESSING
  const getActiveData = useCallback(() => {
    switch (activeTab) {
      case "projectType": return projectTypes;
      case "platformTask": return platforms;
      case "taskGroup": return taskGroups;
      case "positionUser": return positions;
      default: return [];
    }
  }, [activeTab, projectTypes, platforms, taskGroups, positions]);

  const data = getActiveData();
  const currentConfig = dataConfig[activeTab];

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = item.name?.toLowerCase().includes(search.toLowerCase());
      
      // Filter role hanya untuk positionUser
      const matchRole = 
        activeTab !== "positionUser" || 
        roleFilter === "ALL" || 
        (item.role && item.role.toLowerCase() === roleFilter.toLowerCase());
      
      return matchSearch && matchRole;
    });
  }, [data, search, activeTab, roleFilter]);

  // Sort data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const order = sortConfig.direction === "asc" ? 1 : -1;
      return a.name.localeCompare(b.name) * order;
    });
  }, [filteredData, sortConfig.direction]);

  // HANDLERS
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const handleDelete = useCallback((item) => {
    showAlert(`Are you sure you want to delete this ${currentConfig.label}?`, "confirm", async () => {
      try {
        await axios.delete(currentConfig.getDeleteUrl(item.id));
        showAlert(`${currentConfig.label} deleted successfully`, "success");
        fetchData(activeTab); // Refresh data untuk tab aktif
      } catch (err) {
        console.error("Delete error:", err);
        showAlert("Failed to delete item", "error");
      }
    });
  }, [currentConfig, showAlert, fetchData, activeTab]);

  const handleModalOpen = useCallback((mode, dataId = null) => {
    setModalConfig({ isOpen: true, mode, dataId });
  }, []);

  const handleModalClose = useCallback(() => {
    setModalConfig({ isOpen: false, mode: 'add', dataId: null });
  }, []);

  const handleModalSave = useCallback(() => {
    handleModalClose();
    fetchData(activeTab);
    showAlert(`${currentConfig.label} ${modalConfig.mode === 'add' ? 'added' : 'updated'} successfully`);
  }, [handleModalClose, fetchData, activeTab, currentConfig, modalConfig.mode, showAlert]);

  // Filter handlers
  const openFilter = useCallback(() => {
    setTempRole(roleFilter);
    setShowFilterDropdown(true);
  }, [roleFilter]);

  const applyRoleFilter = useCallback(() => {
    setRoleFilter(tempRole);
    setShowFilterDropdown(false);
  }, [tempRole]);

  const clearRoleFilter = useCallback(() => {
    setTempRole("ALL");
    setRoleFilter("ALL");
    setShowFilterDropdown(false);
  }, []);

  // PREPARED DATA FOR RENDERING
  const cardList = useMemo(() => {
    return Object.keys(dataConfig).map(key => ({
      key,
      label: dataConfig[key].label,
      icon: dataConfig[key].icon,
      color: dataConfig[key].color
    }));
  }, [dataConfig]);

  const totals = useMemo(() => ({
    projectType: projectTypes.length,
    platformTask: platforms.length,
    taskGroup: taskGroups.length,
    positionUser: positions.length,
  }), [projectTypes.length, platforms.length, taskGroups.length, positions.length]);

  const uniqueRoles = useMemo(() => [
    "ALL",
    ...new Set(positions.map((p) => p.role).filter(Boolean)),
  ], [positions]);

  const tableHeaders = useMemo(() => ({
    projectType: { label: "Project Type", key: "name" },
    platformTask: { label: "Platform", key: "name" },
    taskGroup: { label: "Task Group", key: "name" },
    positionUser: { label: "Position", key: "name" },
  }), []);

  return (
    <div className="p-6 min-h-screen font-sans text-[0.7rem]">
      <h2 className="flex items-center gap-2 font-bold text-sm mb-4 text-gray-800">
        <FiDatabase className="text-blue-600" size={18} /> DATA MANAGEMENT
      </h2>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
        {cardList.map((card) => {
          const IconComponent = card.icon;
          const count = totals[card.key];
          return (
            <div
              key={card.key}
              className={`bg-white p-3 rounded-xl shadow flex justify-between items-center transition-shadow hover:shadow-lg`}
            >
              <div>
                <div className="text-gray-500 text-[0.65rem]">{card.label}</div>
                <div className="text-[0.8rem] font-bold text-gray-800">{count}</div>
              </div>
              <div
                className={`p-2.5 rounded-full text-white flex items-center justify-center text-[0.8rem] ${card.color}`}
              >
                <IconComponent size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {cardList.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-[0.7rem] font-semibold shadow-md transition-colors ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter & Search/Add */}
      <div className="flex justify-between items-center gap-2 mb-3 relative">
        {/* Filter Button (Hanya untuk Position User) */}
        <div className="relative">
          {activeTab === "positionUser" && (
            <button
              onClick={() => showFilterDropdown ? setShowFilterDropdown(false) : openFilter()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-2 transition-colors shadow-md"
            >
              <IoFilterOutline size={14} /> Filter
            </button>
          )}

          {/* Dropdown Filter Role */}
          {showFilterDropdown && activeTab === "positionUser" && (
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-xl rounded-xl border border-gray-200 z-50 p-3">
              <div className="mb-2">
                <label 
                  htmlFor="role-posision"
                  className="text-[0.65rem] block mb-1 text-gray-600">
                  Role Position
                </label>
                <select
                  id="role-posision"
                  value={tempRole}
                  onChange={(e) => setTempRole(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {uniqueRoles.map((r) => (
                    <option key={r} value={r}>
                      {formatRoleDisplay(r)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={clearRoleFilter}
                  className="bg-gray-300 text-black px-3 py-1 rounded-lg text-[0.65rem] hover:bg-gray-400 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={applyRoleFilter}
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg text-[0.65rem] hover:bg-blue-600 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search + Add */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`Search ${currentConfig?.label || ''}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-[0.65rem] w-48 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            onClick={() => handleModalOpen('add')}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-1 cursor-pointer transition-colors shadow-md"
          >
            Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="table-fixed w-full border-collapse text-[0.65rem]">
          <thead>
            <tr>
              <th
                onClick={() => handleSort(tableHeaders[activeTab].key)}
                className="text-left px-2 py-1 font-semibold text-white bg-blue-600 cursor-pointer select-none"
              >
                <div className="flex items-center gap-1">
                  <span>{tableHeaders[activeTab].label}</span>
                  {getSortIcon(tableHeaders[activeTab].key)}
                </div>
              </th>
              {activeTab === "positionUser" && (
                <th className="text-left px-2 py-1 font-semibold text-white bg-blue-600 cursor-default">
                  Role
                </th>
              )}
              <th className="text-center px-2 py-1 font-semibold text-white bg-blue-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={activeTab === "positionUser" ? 3 : 2} className="text-center py-2 text-gray-400 italic">
                  No data found
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-2 py-1 border-b border-gray-200">{item.name}</td>
                  
                  {activeTab === "positionUser" && (
                    <td className="px-2 py-1 border-b border-gray-200">
                      {formatRoleDisplay(item.role)}
                    </td>
                  )}
                  
                  <td className="px-2 py-1 border-b border-gray-200 text-left flex gap-1 justify-center">
                    <button
                      onClick={() => handleModalOpen('edit', item.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
                    >
                      <IoPencilOutline size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
                    >
                      <IoTrashOutline size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal (Add/Edit) */}
      {modalConfig.isOpen && (
        modalConfig.mode === 'add' ? (
          <AddData
            type={activeTab}
            onClose={handleModalClose}
            onSave={handleModalSave}
          />
        ) : (
          <EditData
            type={activeTab}
            dataId={modalConfig.dataId}
            onClose={handleModalClose}
            onSave={handleModalSave}
          />
        )
      )}

      {/* Alert Component */}
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
    </div>
  );
};

export default DataList;