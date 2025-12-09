import React, { useState, useMemo, useCallback } from "react";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr";
import {
  MdOutlineSort,
  MdOutlineArrowDropDown,
  MdOutlineArrowDropUp,
} from "react-icons/md";
import { IoTrashOutline, IoPencilOutline } from "react-icons/io5";
import { FiUser } from "react-icons/fi";
import AddITBP from "./AddITBP";
import EditITBP from "./EditITBP";
import Alert from "../Alert";

// HOOKS REUSABLE
const useAlert = () => {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((message, type = "success", duration = 3000) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), duration);
  }, []);

  const showConfirm = useCallback((message, onConfirm, onCancel = null) => {
    setAlert({
      message,
      type: "confirm",
      actions: [
        { 
          label: "Cancel", 
          type: "cancel", 
          onClick: () => {
            onCancel?.();
            setAlert(null);
          }
        },
        {
          label: "Confirm",
          type: "confirm",
          onClick: () => {
            onConfirm();
            setAlert(null);
          },
        },
      ],
    });
  }, []);

  return { alert, setAlert, showAlert, showConfirm };
};

const useSorting = (initialKey = "SAP", initialDirection = "asc") => {
  const [sortConfig, setSortConfig] = useState({ 
    key: initialKey, 
    direction: initialDirection 
  });

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { 
          key, 
          direction: prev.direction === "asc" ? "desc" : "asc" 
        };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const renderSortIcon = useCallback((key) => {
    const iconClass = "inline ml-1 text-lg text-blue-300";
    if (sortConfig.key !== key) return <MdOutlineSort className={iconClass} />;
    
    return sortConfig.direction === "asc" ? (
      <MdOutlineArrowDropUp className={iconClass} />
    ) : (
      <MdOutlineArrowDropDown className={iconClass} />
    );
  }, [sortConfig]);

  return { sortConfig, handleSort, renderSortIcon };
};

const useITBPData = () => {
  const { mutate } = useSWRConfig();
  
  const fetcher = useCallback(async () => {
    const response = await axios.get("http://localhost:5000/users?role=ITBP");
    return response.data;
  }, []);

  const { data: itbps = [], isLoading, error } = useSWR("itbp", fetcher);

  const deleteITBP = useCallback(async (itbp, showAlert, showConfirm) => {
    if (itbp.totalProjects > 0) {
      showAlert("Cannot delete ITBP who already has projects", "error");
      return;
    }

    showConfirm("Are you sure you want to delete this ITBP?", async () => {
      try {
        await axios.delete(`http://localhost:5000/users/${itbp.SAP}`);
        mutate("itbp");
        showAlert("ITBP deleted successfully", "success");
      } catch (err) {
        console.error(err);
        showAlert("Failed to delete ITBP", "error");
      }
    });
  }, [mutate]);

  return { itbps, isLoading, error, deleteITBP };
};

// KOMPONEN REUSABLE
const TableHeader = React.memo(({ columns, sortConfig, onSort, renderSortIcon }) => (
  <thead>
    <tr>
      {columns.map((col) => (
        <th
          key={col.key}
          onClick={() => col.sortable !== false && onSort(col.key)}
          className={`text-left px-2 py-1 font-semibold text-white bg-blue-600 ${
            col.sortable === false 
              ? "text-center cursor-default" 
              : "cursor-pointer"
          } select-none`}
        >
          <div className="flex items-center gap-1">
            <span>{col.label}</span>
            {col.sortable !== false && renderSortIcon(col.key)}
          </div>
        </th>
      ))}
    </tr>
  </thead>
));

const TableRow = React.memo(({ itbp, onEdit, onDelete }) => (
  <tr key={itbp.SAP} className="hover:bg-blue-50 transition-colors">
    <td className="px-2 py-1 border-b border-gray-200">{itbp.SAP}</td>
    <td className="px-2 py-1 border-b border-gray-200">{itbp.name}</td>
    <td className="px-2 py-1 border-b border-gray-200">{itbp.username}</td>
    <td className="px-2 py-1 border-b border-gray-200">
      {itbp.position
        ? itbp.position.charAt(0).toUpperCase() +
          itbp.position.slice(1).toLowerCase()
        : ""}
    </td>
    <td className="px-2 py-1 border-b border-gray-200">
      {itbp.totalProjects ?? 0}
    </td>
    <td className="px-2 py-1 border-b border-gray-200 text-left">
      <div className="flex justify-left gap-1">
        <button
          onClick={() => onEdit(itbp.SAP)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
          aria-label={`Edit ${itbp.name}`}
        >
          <IoPencilOutline size={14} />
        </button>
        <button
          onClick={() => onDelete(itbp)}
          className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
          aria-label={`Delete ${itbp.name}`}
        >
          <IoTrashOutline size={14} />
        </button>
      </div>
    </td>
  </tr>
));

const EmptyState = () => (
  <tr>
    <td colSpan={6} className="text-center py-2 text-gray-400 italic">
      No ITBP found
    </td>
  </tr>
);

const LoadingState = () => (
  <div className="text-center mt-10 text-gray-600">Loading...</div>
);

const ITBPList = () => {
  // STATE
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // HOOKS - PERBAIKAN: tambahkan setAlert ke destructuring
  const { alert, setAlert, showAlert, showConfirm } = useAlert(); // ✅ setAlert sekarang didefinisikan
  const { sortConfig, handleSort, renderSortIcon } = useSorting();
  const { itbps, isLoading, deleteITBP } = useITBPData();

  // KONFIGURASI TABEL
  const columns = useMemo(() => [
    { key: "SAP", label: "SAP", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "username", label: "Username", sortable: true },
    { key: "position", label: "Position", sortable: true },
    { key: "totalProjects", label: "Project", sortable: true },
    { key: "action", label: "Action", sortable: false },
  ], []);

  // FUNGSI UTILITAS
  const filteredAndSortedITBP = useMemo(() => {
    if (!itbps) return [];

    const filtered = itbps.filter((i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.username?.toLowerCase().includes(search.toLowerCase()) ||
      i.SAP?.toString().includes(search)
    );

    return [...filtered].sort((a, b) => {
      const { key, direction } = sortConfig;
      const order = direction === "asc" ? 1 : -1;

      let valA = a[key] ?? "";
      let valB = b[key] ?? "";

      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * order;
      }
      return (
        valA.toString().toLowerCase().localeCompare(valB.toString().toLowerCase()) *
        order
      );
    });
  }, [itbps, search, sortConfig]);

  const handleDelete = useCallback((itbp) => {
    deleteITBP(itbp, showAlert, showConfirm);
  }, [deleteITBP, showAlert, showConfirm]);

  const handleEdit = useCallback((id) => {
    setEditId(id);
  }, []);

  const handleAddSuccess = useCallback(async () => {
    setShowAddModal(false);
    showAlert("ITBP added successfully", "success");
  }, [showAlert]);

  const handleEditSuccess = useCallback(async () => {
    setEditId(null);
    showAlert("ITBP updated successfully", "success");
  }, [showAlert]);

  // RENDER
  if (isLoading) return <LoadingState />;

  return (
    <div className="p-6 min-h-screen font-sans text-[0.7rem]">
      {/* HEADER */}
      <h2 className="flex items-center gap-2 font-bold text-sm mb-4 text-gray-800">
        <FiUser className="text-blue-600" size={18} /> ITBP DATA
      </h2>

      {/* STATS CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <div className="bg-white p-3 rounded-xl shadow flex justify-between items-center hover:shadow-lg transition-shadow">
          <div>
            <div className="text-gray-500 text-[0.65rem]">Total ITBP</div>
            <div className="text-[0.8rem] font-bold text-gray-800">
              {itbps.length}
            </div>
          </div>
          <div className="bg-blue-600 p-2.5 rounded-full text-white flex items-center justify-center text-[0.8rem]">
            <FiUser size={16} />
          </div>
        </div>
      </div>

      {/* SEARCH & ACTIONS */}
      <div className="flex justify-end gap-2 mb-3 flex-wrap">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-[0.65rem] w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-1 cursor-pointer transition-colors shadow-md"
        >
          Add ITBP
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="table-fixed w-full border-collapse text-[0.65rem]">
          <TableHeader
            columns={columns}
            sortConfig={sortConfig}
            onSort={handleSort}
            renderSortIcon={renderSortIcon}
          />
          <tbody>
            {filteredAndSortedITBP.length === 0 ? (
              <EmptyState />
            ) : (
              filteredAndSortedITBP.map((itbp) => (
                <TableRow
                  key={itbp.SAP}
                  itbp={itbp}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ALERT */}
      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => alert.type !== "confirm" && setAlert(null)} // ✅ setAlert sekarang tersedia
          actions={
            alert.type === "confirm"
              ? alert.actions
              : [{ 
                  label: "OK", 
                  type: "confirm", 
                  onClick: () => setAlert(null) // ✅ setAlert sekarang tersedia
                }]
          }
        />
      )}

      {/* MODALS */}
      {showAddModal && (
        <AddITBP
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSuccess}
        />
      )}

      {editId && (
        <EditITBP
          SAP={editId}
          onClose={() => setEditId(null)}
          onSave={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default ITBPList;