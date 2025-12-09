import React, { useState, useMemo, useCallback } from "react";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr";
import {
  MdOutlineSort,
  MdOutlineArrowDropDown,
  MdOutlineArrowDropUp,
} from "react-icons/md";
import { IoTrashOutline, IoPencilOutline } from "react-icons/io5";
import { FiUsers } from "react-icons/fi";
import AddEngineer from "./AddEngineer";
import EditEngineer from "./EditEngineer";
import Alert from "../Alert";

const EngineerList = () => {
  const { mutate } = useSWRConfig();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "SAP", direction: "asc" });
  const [editId, setEditId] = useState(null);

  // KONFIGURASI TERPUSAT
  const tableConfig = useMemo(() => ({
    columns: [
      { key: "SAP", label: "SAP", sortable: true },
      { key: "name", label: "Name", sortable: true },
      { key: "username", label: "Username", sortable: true },
      { key: "position", label: "Position", sortable: true },
      { key: "totalTasks", label: "Task", sortable: true },
      { key: "action", label: "Action", sortable: false }
    ],
    pageSize: 10,
    sortIconClass: "inline ml-1 text-lg text-blue-300"
  }), []);

  // FUNGSI UTILITAS REUSABLE
  
  // Format position text (dari "engineer position" ke "Engineer Position")
  const formatPositionText = useCallback((position) => {
    if (!position) return "";
    return position
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, []);

  // Alert handlers
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

  // Sort icon renderer
  const renderSortIcon = useCallback((key) => {
    const { sortIconClass } = tableConfig;
    
    if (sortConfig.key !== key) {
      return <MdOutlineSort className={sortIconClass} />;
    }
    
    return sortConfig.direction === "asc" ? (
      <MdOutlineArrowDropUp className={sortIconClass} />
    ) : (
      <MdOutlineArrowDropDown className={sortIconClass} />
    );
  }, [sortConfig, tableConfig]);

  // DATA FETCHING
  
  const fetcher = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/users?role=ENGINEER");
      return res.data;
    } catch (error) {
      console.error("Error fetching engineers:", error);
      showAlert("Failed to load engineer data", "error");
      return [];
    }
  }, [showAlert]);

  const { data: engineers = [], isLoading } = useSWR("engineers", fetcher);

  // DATA PROCESSING
  
  // Filter engineers berdasarkan search
  const filteredEngineers = useMemo(() => {
    if (!search.trim()) return engineers;

    const searchLower = search.toLowerCase();
    return engineers.filter((eng) => {
      return (
        eng.name?.toLowerCase().includes(searchLower) ||
        eng.username?.toLowerCase().includes(searchLower) ||
        eng.SAP?.toString().includes(search)
      );
    });
  }, [engineers, search]);

  // Sort engineers
  const sortedEngineers = useMemo(() => {
    return [...filteredEngineers].sort((a, b) => {
      const { key, direction } = sortConfig;
      const order = direction === "asc" ? 1 : -1;
      
      const valA = a[key];
      const valB = b[key];
      
      // Handle numeric comparison for SAP and totalTasks
      if (key === "SAP" || key === "totalTasks") {
        return (valA - valB) * order;
      }
      
      // String comparison for other fields
      if (typeof valA === "string" && typeof valB === "string") {
        return valA.localeCompare(valB) * order;
      }
      
      return 0;
    });
  }, [filteredEngineers, sortConfig]);

  // HANDLERS
  
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const handleDelete = useCallback((engineer) => {
    if (engineer.totalTasks > 0) {
      showAlert("Cannot delete engineer with assigned tasks", "error");
      return;
    }

    showConfirm("Are you sure you want to delete this engineer?", async () => {
      try {
        await axios.delete(`http://localhost:5000/users/${engineer.SAP}`);
        mutate("engineers");
        showAlert("Engineer deleted successfully", "success");
      } catch (err) {
        console.error(err);
        showAlert("Failed to delete engineer", "error");
      }
    });
  }, [showAlert, showConfirm, mutate]);

  const handleEdit = useCallback((SAP) => {
    setEditId(SAP);
  }, []);

  const handleAdd = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleModalClose = useCallback((type) => {
    if (type === "add") {
      setShowAddModal(false);
    } else if (type === "edit") {
      setEditId(null);
    }
  }, []);

  const handleModalSave = useCallback(async (type) => {
    await mutate("engineers");
    
    if (type === "add") {
      setShowAddModal(false);
      showAlert("Engineer added successfully", "success");
    } else if (type === "edit") {
      setEditId(null);
      showAlert("Engineer updated successfully", "success");
    }
  }, [mutate, showAlert]);

  // RENDER COMPONENTS
  
  if (isLoading) {
    return <h2 className="text-center mt-10 text-gray-600">Loading...</h2>;
  }

  return (
    <div className="p-6 min-h-screen font-sans text-[0.7rem]">
      <h2 className="flex items-center gap-2 font-bold text-sm mb-4 text-gray-800">
        <FiUsers className="text-blue-600" size={18} /> ENGINEER DATA
      </h2>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <div className="bg-white p-3 rounded-xl shadow flex justify-between items-center hover:shadow-lg transition-shadow">
          <div>
            <div className="text-gray-500 text-[0.65rem]">Total Engineers</div>
            <div className="text-[0.8rem] font-bold text-gray-800">
              {engineers.length}
            </div>
          </div>
          <div className="bg-blue-600 p-2.5 rounded-full text-white flex items-center justify-center text-[0.8rem]">
            <FiUsers size={16} />
          </div>
        </div>
      </div>

      {/* Search & Add */}
      <div className="flex justify-end gap-2 mb-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, username, or SAP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-[0.65rem] w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={handleAdd}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-1 cursor-pointer transition-colors shadow-md"
        >
          Add Engineer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="table-fixed w-full border-collapse text-[0.65rem]">
          <thead>
            <tr>
              {tableConfig.columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`text-left px-2 py-1 font-semibold text-white bg-blue-600 ${
                    col.sortable ? "cursor-pointer select-none" : "cursor-default"
                  }`}
                >
                  <span className="flex items-center">
                    {col.label}
                    {col.sortable && renderSortIcon(col.key)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedEngineers.length === 0 ? (
              <tr>
                <td colSpan={tableConfig.columns.length} className="text-center py-2 text-gray-400 italic">
                  {search ? "No engineers match your search" : "No engineers found"}
                </td>
              </tr>
            ) : (
              sortedEngineers.map((engineer) => (
                <EngineerRow
                  key={engineer.SAP}
                  engineer={engineer}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  formatPosition={formatPositionText}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

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
      {showAddModal && (
        <AddEngineer
          onClose={() => handleModalClose("add")}
          onSave={() => handleModalSave("add")}
        />
      )}

      {editId && (
        <EditEngineer
          SAP={editId}
          onClose={() => handleModalClose("edit")}
          onSave={() => handleModalSave("edit")}
        />
      )}
    </div>
  );
};


// ENGINEER ROW COMPONENT 
const EngineerRow = React.memo(({ engineer, onEdit, onDelete, formatPosition }) => {
  return (
    <tr className="hover:bg-blue-50 transition-colors">
      <td className="px-2 py-1 border-b border-gray-200">{engineer.SAP}</td>
      <td className="px-2 py-1 border-b border-gray-200">{engineer.name}</td>
      <td className="px-2 py-1 border-b border-gray-200">{engineer.username}</td>
      <td className="px-2 py-1 border-b border-gray-200">
        {formatPosition(engineer.position)}
      </td>
      <td className="px-2 py-1 border-b border-gray-200">{engineer.totalTasks}</td>
      <td className="px-2 py-1 border-b border-gray-200">
        <div className="flex gap-1">
          <ActionButton
            icon={IoPencilOutline}
            color="blue"
            onClick={() => onEdit(engineer.SAP)}
            tooltip="Edit engineer"
          />
          <ActionButton
            icon={IoTrashOutline}
            color="red"
            onClick={() => onDelete(engineer)}
            tooltip="Delete engineer"
          />
        </div>
      </td>
    </tr>
  );
});

EngineerRow.displayName = 'EngineerRow';


// ACTION BUTTON COMPONENT 
const ActionButton = React.memo(({ icon: Icon, color, onClick, tooltip }) => {
  const colorClasses = {
    blue: "bg-blue-500 hover:bg-blue-600",
    red: "bg-red-500 hover:bg-red-600"
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color] || "bg-gray-500"} text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm`}
      title={tooltip}
      aria-label={tooltip}
    >
      <Icon size={14} />
    </button>
  );
});

ActionButton.displayName = 'ActionButton';

export default EngineerList;