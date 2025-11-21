import React, { useState } from "react";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr";
import {
  MdOutlineSort,
  MdOutlineArrowDropDown,
  MdOutlineArrowDropUp,
} from "react-icons/md";
import { IoTrashOutline, IoPencilOutline, IoFilterOutline } from "react-icons/io5";
import { FiUsers } from "react-icons/fi";
import AddUser from "./AddUser";
import EditUser from "./EditUser";
import Alert from "../Alert";

const UserList = () => {
  const { mutate } = useSWRConfig();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "SAP", direction: "asc" });

  // 🔹 Filter dropdown states
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [tempRole, setTempRole] = useState("ALL");
  const [tempPosition, setTempPosition] = useState("ALL");

  const fetcher = async () => (await axios.get("http://localhost:5000/users")).data;
  const { data: users, isLoading } = useSWR("users", fetcher);

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

const deleteUser = (user) => {
  // 🔒 Cegah hapus kalau user masih punya project atau task aktif
  if (user.totalProjects > 0 || user.totalTasks > 0) {
    showAlert(
      "Cannot delete user who still has active projects or tasks",
      "error"
    );
    return;
  }

  // 🔹 Konfirmasi hapus user
  showConfirm("Are you sure you want to delete this user?", async () => {
    try {
      await axios.delete(`http://localhost:5000/users/${user.SAP}`);
      mutate("users");
      showAlert("User deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showAlert("Failed to delete user", "error");
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

  const openFilter = () => {
    setTempRole(roleFilter);
    setTempPosition(positionFilter);
    setShowFilterDropdown(true);
  };

  const applyFilter = () => {
    setRoleFilter(tempRole);
    setPositionFilter(tempPosition);
    setShowFilterDropdown(false);
  };

  const clearFilter = () => {
    setTempRole("ALL");
    setTempPosition("ALL");
    setRoleFilter("ALL");
    setPositionFilter("ALL");
    setShowFilterDropdown(false);
  };

  // 🔹 Filtering + sorting
  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchSearch =
      u.name?.toLowerCase().includes(term) ||
      u.username?.toLowerCase().includes(term) ||
      u.SAP?.toString().includes(term);

    const matchRole =
      roleFilter === "ALL" ||
      u.role?.role?.toLowerCase() === roleFilter.toLowerCase();

    const matchPosition =
      positionFilter === "ALL" ||
      u.position?.position?.toLowerCase() === positionFilter.toLowerCase();

    return matchSearch && matchRole && matchPosition;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
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
    { key: "role", label: "Role" },
    { key: "position", label: "Position" },
    { key: "totalProjects", label: "Project" },
    { key: "totalTasks", label: "Task" },
    { key: "action", label: "Action" },
  ];

  const uniqueRoles = [
    "ALL",
    ...new Set(users.map((u) => u.role?.role).filter(Boolean)),
  ];
  const uniquePositions = [
    "ALL",
    ...new Set(users.map((u) => u.position?.position).filter(Boolean)),
  ];

  return (
    <div className="p-6 min-h-screen font-sans text-[0.7rem]">
      <h2 className="flex items-center gap-2 font-bold text-sm mb-4 text-gray-800">
        <FiUsers className="text-blue-600" size={18} /> USER MANAGEMENT
      </h2>

      {/* Total Users berubah sesuai filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <div className="bg-white p-3 rounded-xl shadow flex justify-between items-center hover:shadow-lg transition-shadow">
          <div>
            <div className="text-gray-500 text-[0.65rem]">Total Users</div>
            <div className="text-[0.8rem] font-bold text-gray-800">
              {filteredUsers.length}
            </div>
          </div>
          <div className="bg-blue-600 p-2.5 rounded-full text-white flex items-center justify-center text-[0.8rem]">
            <FiUsers size={16} />
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex justify-between items-center gap-2 mb-3 relative">
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
            <div className="absolute left-0 mt-2 w-64 bg-white shadow-xl rounded-xl border border-gray-200 z-50 p-3">
              <div className="mb-2">
                <label className="text-[0.65rem] block mb-1 text-gray-600">
                  Role
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
                        : ["ITBP", "ITGA", "SAP"].includes(r.toUpperCase())
                        ? r.toUpperCase()
                        : r
                            .toLowerCase()
                            .split("_")
                            .map(
                              (w) => w.charAt(0).toUpperCase() + w.slice(1)
                            )
                            .join(" ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="text-[0.65rem] block mb-1 text-gray-600">
                  Position
                </label>
                <select
                  value={tempPosition}
                  onChange={(e) => setTempPosition(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-[0.65rem] focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {uniquePositions.map((p) => (
                    <option key={p} value={p}>
                      {p === "ALL" ? "All Positions" : p}
                    </option>
                  ))}
                </select>
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

        <div className="flex items-center gap-2">
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
            Add User
          </button>
        </div>
      </div>

      {/* Table */}
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
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-2 text-gray-400 italic">
                  No users found
                </td>
              </tr>
            ) : (
              sortedUsers.map((u) => (
                <tr key={u.SAP} className="hover:bg-blue-50 transition-colors">
                  <td className="px-2 py-1 border-b border-gray-200">{u.SAP}</td>
                  <td className="px-2 py-1 border-b border-gray-200">{u.name}</td>
                  <td className="px-2 py-1 border-b border-gray-200">{u.username}</td>
                  <td className="px-2 py-1 border-b border-gray-200">
                    {u.role?.role
                      ? ["ITBP", "ITGA", "SAP"].includes(
                          u.role.role.toUpperCase()
                        )
                        ? u.role.role.toUpperCase()
                        : u.role.role
                            .toLowerCase()
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")
                      : "-"}
                  </td>
                  <td className="px-2 py-1 border-b border-gray-200">
                    {u.position?.position || "-"}
                  </td>
                  <td className="px-2 py-1 border-b border-gray-200 text-center">
                    {u.totalProjects ?? 0}
                  </td>
                  <td className="px-2 py-1 border-b border-gray-200 text-center">
                    {u.totalTasks ?? 0}
                  </td>
                  <td className="px-2 py-1 border-b border-gray-200 text-left flex gap-1">
                    <button
                      onClick={() => setEditId(u.SAP)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-lg flex items-center justify-center text-[0.7rem] w-6 h-6 transition-colors shadow-sm"
                    >
                      <IoPencilOutline size={14} />
                    </button>
                    <button
                      onClick={() => deleteUser(u)}
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
        <AddUser
          onClose={() => setShowAddModal(false)}
          onSave={async () => {
            await mutate("users");
            setShowAddModal(false);
            showAlert("User added successfully", "success");
          }}
        />
      )}

      {/* Edit Modal */}
      {editId && (
        <EditUser
          SAP={editId}
          onClose={() => setEditId(null)}
          onSave={async () => {
            await mutate("users");
            setEditId(null);
            showAlert("User updated successfully", "success");
          }}
        />
      )}
    </div>
  );
};

export default UserList;
