import React, { useState } from "react";
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
import EditEngineer from "./EditEngineer"; // ✅ Import modal edit
import Alert from "../Alert";

const EngineerList = () => {
  const { mutate } = useSWRConfig();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "SAP", direction: "asc" });
  const [editId, setEditId] = useState(null); // ✅ handle edit modal
  

  // ✅ ambil data engineer
  const fetcher = async () =>
    (await axios.get("http://localhost:5000/users?role=ENGINEER")).data;

  const { data: engineers, isLoading } = useSWR("engineers", fetcher);

  if (isLoading)
    return <h2 className="text-center mt-10 text-gray-600">Loading...</h2>;

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
        setAlert(null);
      },
    });
  };

  const deleteEngineer = (SAP) => {
    showConfirm("Are you sure you want to delete this engineer?", async () => {
      try {
        await axios.delete(`http://localhost:5000/users/${SAP}`);
        mutate("engineers");
        showAlert("Engineer deleted successfully", "success");
      } catch (err) {
        console.error(err);
        showAlert("Failed to delete engineer", "error");
      }
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedEngineers = [...engineers]
    .filter(
      (eng) =>
        eng.name.toLowerCase().includes(search.toLowerCase()) ||
        eng.username?.toLowerCase().includes(search.toLowerCase()) ||
        eng.SAP?.toString().includes(search)
    )
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      const order = direction === "asc" ? 1 : -1;
      if (typeof a[key] === "string") return a[key].localeCompare(b[key]) * order;
      return (a[key] - b[key]) * order;
    });

  const renderSortIcon = (key) => {
    const iconClass = "inline ml-1 text-lg text-blue-300";
    if (sortConfig.key !== key) return <MdOutlineSort className={iconClass} />;
    return sortConfig.direction === "asc" ? (
      <MdOutlineArrowDropUp className={iconClass} />
    ) : (
      <MdOutlineArrowDropDown className={iconClass} />
    );
  };

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
            <div className="text-[0.8rem] font-bold text-gray-800">{engineers.length}</div>
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
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-[0.65rem] w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          onClick={() => setShowAddModal(true)}
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
              {[
                { key: "SAP", label: "SAP" },
                { key: "name", label: "Name" },
                { key: "username", label: "Username" },
                { key: "position", label: "Position" },
                { key: "totalTasks", label: "Task" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left px-2 py-1 font-semibold text-white bg-blue-600 cursor-pointer select-none"
                >
                  {col.label} {renderSortIcon(col.key)}
                </th>
              ))}
              <th className="text-left px-2 py-1 font-semibold text-white bg-blue-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedEngineers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-2 text-gray-400 italic">
                  No engineers found
                </td>
              </tr>
            ) : (
              sortedEngineers.map((eng) => (
                <tr key={eng.SAP} className="hover:bg-blue-50 transition-colors">
                  <td className="px-2 py-1 border-b border-gray-200">{eng.SAP}</td>
                  <td className="px-2 py-1 border-b border-gray-200">{eng.name}</td>
                  <td className="px-2 py-1 border-b border-gray-200">{eng.username}</td>
                  <td className="px-2 py-1 border-b border-gray-200">
                    {eng.position
                      ? eng.position
                          .toLowerCase()
                          .split(" ")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")
                      : ""}
                  </td>
                  <td className="px-2 py-1 border-b border-gray-200">{eng.totalTasks}</td>
                  <td className="px-2 py-1 border-b border-gray-200 text-left flex justify-left gap-1">
                    {/* 🔹 Edit button */}
                    <button
                      onClick={() => setEditId(eng.SAP)} // ✅ buka modal edit
                      className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
                    >
                      <IoPencilOutline size={14} />
                    </button>

                    {/* 🔹 Delete button */}
                    <button
                      onClick={() => {
                        if (eng.totalTasks > 0) {
                          showAlert("Cannot delete engineer with assigned tasks", "error");
                          return;
                        }
                        deleteEngineer(eng.SAP);
                      }}
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

      {/* Add Modal */}
      {showAddModal && (
        <AddEngineer
          onClose={() => setShowAddModal(false)}
          onSave={async () => {
            await mutate("engineers");
            setShowAddModal(false);
            showAlert("Engineer added successfully", "success");
          }}
        />
      )}

      {/* ✅ Edit Modal */}
      {editId && (
        <EditEngineer
          SAP={editId}
          onClose={() => setEditId(null)}
          onSave={async () => {
            await mutate("engineers");
            setEditId(null);
            showAlert("Engineer updated successfully", "success");
          }}
        />
      )}
    </div>
  );
};

export default EngineerList;
