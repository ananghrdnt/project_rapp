import React, { useState } from "react";
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
import EditITBP from "./EditITBP"; // ✅ Modal edit
import Alert from "../Alert";

const ITBPList = () => {
  const { mutate } = useSWRConfig();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState(null); // ✅ Tambah state edit modal
  const [alert, setAlert] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "SAP", direction: "asc" });

  // ✅ Hanya ambil user dengan role ITBP
  const fetcher = async () =>
    (await axios.get("http://localhost:5000/users?role=ITBP")).data;

  const { data: itbps, isLoading } = useSWR("itbp", fetcher);

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

  const deleteITBP = (itbp) => {
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
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedITBP = [...itbps]
    .filter(
      (i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.username?.toLowerCase().includes(search.toLowerCase()) ||
        i.SAP?.toString().includes(search)
    )
    .sort((a, b) => {
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

  const renderSortIcon = (key) => {
    const iconClass = "inline ml-1 text-lg text-blue-300";
    if (sortConfig.key !== key) return <MdOutlineSort className={iconClass} />;
    return sortConfig.direction === "asc" ? (
      <MdOutlineArrowDropUp className={iconClass} />
    ) : (
      <MdOutlineArrowDropDown className={iconClass} />
    );
  };

  const columns = [
    { key: "SAP", label: "SAP" },
    { key: "name", label: "Name" },
    { key: "username", label: "Username" },
    { key: "position", label: "Position" },
    { key: "totalProjects", label: "Project" },
    { key: "action", label: "Action" },
  ];

  return (
    <div className="p-6 min-h-screen font-sans text-[0.7rem]">
      <h2 className="flex items-center gap-2 font-bold text-sm mb-4 text-gray-800">
        <FiUser className="text-blue-600" size={18} /> ITBP DATA
      </h2>

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

      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="table-fixed w-full border-collapse text-[0.65rem]">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.key !== "action" && handleSort(col.key)}
                  className={`text-left px-2 py-1 font-semibold text-white bg-blue-600 ${
                    col.key === "action"
                      ? "text-center cursor-default"
                      : "cursor-pointer"
                  } select-none`}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {col.key !== "action" && renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedITBP.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-2 text-gray-400 italic">
                  No ITBP found
                </td>
              </tr>
            ) : (
              sortedITBP.map((i) => (
                <tr key={i.SAP} className="hover:bg-blue-50 transition-colors">
                  <td className="px-2 py-1 border-b border-gray-200">{i.SAP}</td>
                  <td className="px-2 py-1 border-b border-gray-200">{i.name}</td>
                  <td className="px-2 py-1 border-b border-gray-200">{i.username}</td>
                  <td className="px-2 py-1 border-b border-gray-200">
                    {i.position
                      ? i.position.charAt(0).toUpperCase() +
                        i.position.slice(1).toLowerCase()
                      : ""}
                  </td>
                  <td className="px-2 py-1 border-b border-gray-200">
                    {i.totalProjects ?? 0}
                  </td>
                  <td className="px-2 py-1 border-b border-gray-200 text-left flex justify-left gap-1">
                    {/* 🔹 Edit button */}
                    <button
                      onClick={() => setEditId(i.SAP)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
                    >
                      <IoPencilOutline size={14} />
                    </button>

                    {/* 🔹 Delete button */}
                    <button
                      onClick={() => deleteITBP(i)}
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

      {/* 🔹 Alert */}
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

      {/* 🔹 Add Modal */}
      {showAddModal && (
        <AddITBP
          onClose={() => setShowAddModal(false)}
          onSave={async () => {
            await mutate("itbp");
            setShowAddModal(false);
            showAlert("ITBP added successfully", "success");
          }}
        />
      )}

      {/* 🔹 Edit Modal */}
      {editId && (
        <EditITBP
          SAP={editId}
          onClose={() => setEditId(null)}
          onSave={async () => {
            await mutate("itbp");
            setEditId(null);
            showAlert("ITBP updated successfully", "success");
          }}
        />
      )}
    </div>
  );
};

export default ITBPList;
