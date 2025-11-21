import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  MdOutlineSort,
  MdOutlineArrowDropDown,
  MdOutlineArrowDropUp,
} from "react-icons/md";
// Import semua ikon io5 yang dibutuhkan
import {
  IoTrashOutline,
  IoPencilOutline,
  IoLayersOutline, // Project Type
  IoFolderOutline, // Platform Task
  IoListOutline, // Task Group
  IoBriefcaseOutline, // Position User
  IoFilterOutline, // Untuk Filter
} from "react-icons/io5";
import {
  FiDatabase
} from "react-icons/fi";

import Alert from "../Alert";
import AddData from "./AddData";
import EditData from "./EditData"; // <-- import modal edit

const DataList = () => {
  const [activeTab, setActiveTab] = useState("projectType");
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [projectTypes, setProjectTypes] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [taskGroups, setTaskGroups] = useState([]);
  // Position data sekarang harus menyertakan role
  const [positions, setPositions] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDataId, setEditDataId] = useState(null);

  // 🆕 State untuk filter Role di Position User
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [tempRole, setTempRole] = useState("ALL"); // State sementara untuk dropdown

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchProjectTypes = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/projecttypes");
      setProjectTypes(res.data.map((item) => ({ id: item.id_type, name: item.project_type })));
    } catch (err) { console.error(err); }
  }, []);

  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/platforms");
      setPlatforms(res.data.map((item) => ({ id: item.id_platform, name: item.platform })));
    } catch (err) { console.error(err); }
  }, []);

  const fetchTaskGroups = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/task-groups");
      setTaskGroups(res.data.map((item) => ({ id: item.id_group, name: item.task_group })));
    } catch (err) { console.error(err); }
  }, []);

  // ✅ PERBAIKAN UTAMA: Mengambil nama role dari item.role.role
  const fetchPositions = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/positions");
      setPositions(res.data.map((item) => ({
        id: item.id_position,
        name: item.position,
        // Dapatkan nama role dari objek 'role' yang disarangkan
        role: item.role ? item.role.role : 'N/A' 
      })));
    } catch (err) { console.error(err); }
  }, []);

  const fetchAllData = useCallback(() => {
    fetchProjectTypes();
    fetchPlatforms();
    fetchTaskGroups();
    fetchPositions();
  }, [fetchProjectTypes, fetchPlatforms, fetchTaskGroups, fetchPositions]);

  // 🐛 PERBAIKAN WARNING: Menambahkan semua fungsi fetch spesifik yang dipanggil
  // di dalam switch ke array dependensi, meskipun fetchAllData sudah dipanggil.
  // Ini untuk menenangkan linter sepenuhnya, terutama karena fetch spesifik 
  // juga dipanggil di dalam switch.
  useEffect(() => {
    // 1. Ambil SEMUA data saat mount (Card counts)
    fetchAllData();

    // 2. Ambil data HANYA untuk tab aktif saat tab berubah (Table content)
    // dan reset filter Role saat ganti tab
    setRoleFilter("ALL");
    setSearch("");
    setShowFilterDropdown(false);

    switch (activeTab) {
      case "projectType":
        fetchProjectTypes();
        break;
      case "platformTask":
        fetchPlatforms();
        break;
      case "taskGroup":
        fetchTaskGroups();
        break;
      case "positionUser":
        fetchPositions();
        break;
      default:
        break;
    }
  }, [
    activeTab,
    fetchAllData,
    fetchProjectTypes,
    fetchPlatforms,
    fetchTaskGroups,
    fetchPositions // ⬅️ Dependency array yang lengkap
  ]);


  const data =
    activeTab === "projectType"
      ? projectTypes
      : activeTab === "platformTask"
      ? platforms
      : activeTab === "taskGroup"
      ? taskGroups
      : positions;

  // =====================================================
  // FILTERING DATA + SORT
  // =====================================================
  const filteredData = data.filter((item) => {
    const matchSearch = item.name?.toLowerCase().includes(search.toLowerCase());

    // 🆕 Filter Role hanya berlaku untuk Position User
    const matchRole =
      activeTab !== "positionUser" ||
      roleFilter === "ALL" ||
      (item.role && item.role.toLowerCase() === roleFilter.toLowerCase());

    return matchSearch && matchRole;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const order = sortConfig.direction === "asc" ? 1 : -1;
    return a.name.localeCompare(b.name) * order;
  });

  // 🆕 Fungsi untuk Filter Role
  const openFilter = () => {
    setTempRole(roleFilter); // Set nilai sementara dari filter aktif
    setShowFilterDropdown(true);
  };

  const applyRoleFilter = () => {
    setRoleFilter(tempRole); // Terapkan nilai sementara
    setShowFilterDropdown(false);
  };

  const clearRoleFilter = () => {
    setTempRole("ALL");
    setRoleFilter("ALL");
    setShowFilterDropdown(false);
  };

  // 🆕 Dapatkan daftar unik role dari data positions
  const uniqueRoles = [
    "ALL",
    ...new Set(positions.map((p) => p.role).filter(Boolean)),
  ];

  // 🆕 Mapping header dan key per tab
const tableHeaders = {
  projectType: { label: "Project Type", key: "name" },
  platformTask: { label: "Platform", key: "name" },
  taskGroup: { label: "Task Group", key: "name" },
  positionUser: { label: "Position", key: "name" },
};

  // =====================================================
  // UTILS (showAlert, handleSort, handleDelete, totals, cardList)
  // =====================================================
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      return { key, direction: "asc" };
    });
  };

  const renderSortIcon = (key) => {
    const iconClass = "inline ml-1 text-lg text-blue-300";
    if (sortConfig.key !== key) return <MdOutlineSort className={iconClass} />;
    return sortConfig.direction === "asc" ? (
      <MdOutlineArrowDropUp className={iconClass} />
    ) : (
      <MdOutlineArrowDropDown className={iconClass} />
    );
  };

  const handleDelete = (item) => {
    showAlert(`Are you sure you want to delete this ${activeTab}?`, "confirm", async () => {
      let url = "";
      switch (activeTab) {
        case "projectType":
          url = `http://localhost:5000/projecttypes/${item.id}`;
          break;
        case "platformTask":
          url = `http://localhost:5000/platforms/${item.id}`;
          break;
        case "taskGroup":
          url = `http://localhost:5000/task-groups/${item.id}`;
          break;
        case "positionUser":
          url = `http://localhost:5000/positions/${item.id}`;
          break;
        default:
          return;
      }

      try {
        await axios.delete(url);
        showAlert(`${activeTab} deleted successfully`, "success");
        fetchAllData(); // Refresh semua data
      } catch (err) {
        console.error("Delete error:", err);
        showAlert("Failed to delete item", "error");
      }
    });
  };

  const showAlert = (message, type = "success", onConfirm = null) => {
    setAlert({ message, type, onConfirm, });
    if(type !== "confirm") {
      setTimeout(() => setAlert(null), 2500);
    }
  };

  const totals = {
    projectType: projectTypes.length,
    platformTask: platforms.length,
    taskGroup: taskGroups.length,
    positionUser: positions.length,
  };

  const cardList = [
    { key: "projectType", label: "Project Type", count: totals.projectType, icon: IoLayersOutline, color: "bg-blue-600" },
    { key: "platformTask", label: "Platform Task", count: totals.platformTask, icon: IoFolderOutline, color: "bg-green-600" },
    { key: "taskGroup", label: "Task Group", count: totals.taskGroup, icon: IoListOutline, color: "bg-orange-500" },
    { key: "positionUser", label: "Position User", count: totals.positionUser, icon: IoBriefcaseOutline, color: "bg-purple-600" },
  ];

  return (
    <div className="p-6 min-h-screen font-sans text-[0.7rem]">
      <h2 className="flex items-center gap-2 font-bold text-sm mb-4 text-gray-800">
        <FiDatabase className="text-blue-600" size={18} /> DATA MANAGEMENT
      </h2>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
        {cardList.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.key}
              className={`bg-white p-3 rounded-xl shadow flex justify-between items-center transition-shadow hover:shadow-lg`}
            >
              <div>
                <div className="text-gray-500 text-[0.65rem]">{card.label}</div>
                <div className="text-[0.8rem] font-bold text-gray-800">{card.count}</div>
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

      {/* 🔄 Filter & Search/Add (Layout Mirip UserList) */}
      <div className="flex justify-between items-center gap-2 mb-3 relative">

        {/* 🆕 Tombol Filter (Hanya muncul di Position User) */}
        <div className="relative">
          {activeTab === "positionUser" && (
            <button
              onClick={() =>
                showFilterDropdown ? setShowFilterDropdown(false) : openFilter()
              }
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-2 transition-colors shadow-md"
            >
              <IoFilterOutline size={14} /> Filter
            </button>
          )}

          {/* 🆕 Dropdown Filter Role */}
          {showFilterDropdown && activeTab === "positionUser" && (
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-xl rounded-xl border border-gray-200 z-50 p-3">
              <div className="mb-2">
                <label className="text-[0.65rem] block mb-1 text-gray-600">
                  Role Position
                </label>
                <select
                  value={tempRole}
                  onChange={(e) => setTempRole(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                {uniqueRoles.map((r) => (
  <option key={r} value={r}>
    {r === "ALL"
      ? "All Roles"
      : ["ITBP", "ITGA", "SAP", "Admin"].includes(r)
      ? r
      : r
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")}
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

        {/* Search + Add (Kanan) */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={"Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-[0.65rem] w-48 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            onClick={() => setShowAddModal(true)}
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
        {renderSortIcon(tableHeaders[activeTab].key)}
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
                  {/* 🆕 Tampilkan data Role hanya untuk Position User */}
                  {activeTab === "positionUser" && (
                    <td className="px-2 py-1 border-b border-gray-200">
                        {/* item.role sekarang berisi nama role yang benar */}
{item.role
  ? ["ITBP", "ITGA", "SAP", "Admin"].includes(item.role)
    ? item.role
    : item.role
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
  : "N/A"}
                    </td>
                  )}
                  <td className="px-2 py-1 border-b border-gray-200 text-left flex gap-1 justify-center">
                    <button
                      onClick={() => {
                        setEditDataId(item.id);
                        setShowEditModal(true);
                      }}
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

      {/* Modal Add */}
      {showAddModal && (
        <AddData
          type={activeTab}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            fetchAllData();
            showAlert(`${activeTab} added successfully`);
          }}
        />
      )}

      {/* Modal Edit */}
      {showEditModal && (
        <EditData
          type={activeTab}
          dataId={editDataId}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            fetchAllData();
            showAlert(`${activeTab} updated successfully`);
          }}
        />
      )}

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