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

const API_URL = "http://localhost:5000/users";
const specialRoles = ["ITBP", "ITGA", "SAP"];

const formatRoleName = (role) => {
  if (!role) return "-";
  const upper = role.toUpperCase();
  return specialRoles.includes(upper)
    ? upper
    : role
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
};

const UserList = () => {
  const { mutate } = useSWRConfig();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "SAP", direction: "asc" });

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [tempRole, setTempRole] = useState("ALL");
  const [tempPosition, setTempPosition] = useState("ALL");

  const fetcher = async () => (await axios.get(API_URL)).data;
  const { data: users, isLoading } = useSWR("users", fetcher);

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

  const deleteUser = ({ SAP, totalProjects, totalTasks }) => {
    if (totalProjects > 0 || totalTasks > 0) {
      return showAlert(
        "Cannot delete user who still has active projects or tasks",
        "error"
      );
    }

    showConfirm("Are you sure you want to delete this user?", async () => {
      try {
        await axios.delete(`${API_URL}/${SAP}`);
        mutate("users");
        showAlert("User deleted successfully", "success");
      } catch {
        showAlert("Failed to delete user", "error");
      }
    });
  };

  const updateFilterState = (role, position, active = false) => {
    setTempRole(role);
    setTempPosition(position);
    setShowFilterDropdown(active);
  };

const clearFilter = () => {
    updateFilterState("ALL", "ALL", false);
    setRoleFilter("ALL");
    setPositionFilter("ALL");
};

  const applyFilter = () => {
    setRoleFilter(tempRole);
    setPositionFilter(tempPosition);
    setShowFilterDropdown(false);
  };

  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const filterValue = search.toLowerCase();
  const filteredUsers = users?.filter(({ SAP, name, username, role, position }) => {
    const inSearch =
      name?.toLowerCase().includes(filterValue) ||
      username?.toLowerCase().includes(filterValue) ||
      SAP?.toString().includes(filterValue);

    const inRole =
      roleFilter === "ALL" ||
      role?.role?.toLowerCase() === roleFilter.toLowerCase();

    const inPosition =
      positionFilter === "ALL" ||
      position?.position?.toLowerCase() === positionFilter.toLowerCase();

    return inSearch && inRole && inPosition;
  });

  const sortedUsers = [...(filteredUsers ?? [])].sort((a, b) => {
    const { key, direction } = sortConfig;
    const valA = a[key] ?? "";
    const valB = b[key] ?? "";
    const order = direction === "asc" ? 1 : -1;

    return typeof valA === "number" && typeof valB === "number"
      ? (valA - valB) * order
      : valA.toString().localeCompare(valB.toString()) * order;
  });

  const renderSortIcon = (key) =>
    sortConfig.key !== key ? (
      <MdOutlineSort className="inline ml-1 text-lg text-blue-300" />
    ) : sortConfig.direction === "asc" ? (
      <MdOutlineArrowDropUp className="inline ml-1 text-lg text-blue-300" />
    ) : (
      <MdOutlineArrowDropDown className="inline ml-1 text-lg text-blue-300" />
    );

  if (isLoading)
    return (
      <h2 className="text-center mt-10 text-gray-600">
        Loading...
      </h2>
    );

  const uniqueRoles = ["ALL", ...new Set(users.map((u) => u.role?.role).filter(Boolean))];
  const uniquePositions = ["ALL", ...new Set(users.map((u) => u.position?.position).filter(Boolean))];

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

  return (
    <div className="p-6 min-h-screen font-sans text-[0.7rem]">
      <h2 className="flex items-center gap-2 font-bold text-sm mb-4 text-gray-800">
        <FiUsers className="text-blue-600" size={18} /> USER MANAGEMENT
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <div className="bg-white p-3 rounded-xl shadow flex justify-between items-center">
          <div>
            <div className="text-gray-500 text-[0.65rem]">Total Users</div>
            <div className="text-[0.8rem] font-bold text-gray-800">
              {filteredUsers?.length ?? 0}
            </div>
          </div>
          <div className="bg-blue-600 p-2.5 rounded-full text-white">
            <FiUsers size={16} />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2 mb-3 relative">
        <div className="relative">
          <button
            onClick={() =>
              showFilterDropdown
                ? setShowFilterDropdown(false)
                : updateFilterState(roleFilter, positionFilter, true)
            }
            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-[0.65rem] flex items-center gap-2 shadow-md"
          >
            <IoFilterOutline size={14} /> Filter
          </button>

          {showFilterDropdown && (
            <div className="absolute left-0 mt-2 w-64 bg-white shadow-xl rounded-xl border z-50 p-3">
              {[{ label: "Role", val: tempRole, set: setTempRole, list: uniqueRoles },
                { label: "Position", val: tempPosition, set: setTempPosition, list: uniquePositions }].map(
                ({ label, val, set, list }) => (
                  <div className="mb-2" key={label}>
                    <label className="text-[0.65rem] block mb-1 text-gray-600">
                      {label}
                    </label>
                    <select
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      className="w-full p-2 border rounded-lg text-[0.65rem]"
                    >
                      {list.map((v) => (
                        <option key={v} value={v}>
                          {v === "ALL" ? `All ${label}s` : v}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              )}

              <div className="flex justify-end gap-2 mt-3">
                <button onClick={clearFilter} className="bg-gray-300 px-3 py-1 rounded-lg text-[0.65rem]">
                  Clear
                </button>
                <button onClick={applyFilter} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-[0.65rem]">
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
            className="border rounded-md px-3 py-1 text-[0.65rem] w-44"
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-[0.65rem] shadow-md"
          >
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="table-fixed w-full text-[0.65rem]">
          <thead>
            <tr>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => key !== "action" && handleSort(key)}
                  className={`${key === "action" ? "cursor-default" : "cursor-pointer"}
                  px-2 py-1 font-semibold text-white bg-blue-600`}
                >
                  <div className="flex items-center gap-1">
                    <span>{label}</span>
                    {key !== "action" && renderSortIcon(key)}
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
                <tr key={u.SAP} className="hover:bg-blue-50">
                  <td className="px-2 py-1 border-b">{u.SAP}</td>
                  <td className="px-2 py-1 border-b">{u.name}</td>
                  <td className="px-2 py-1 border-b">{u.username}</td>
                  <td className="px-2 py-1 border-b">{formatRoleName(u.role?.role)}</td>
                  <td className="px-2 py-1 border-b">{u.position?.position ?? "-"}</td>
                  <td className="px-2 py-1 border-b text-center">{u.totalProjects ?? 0}</td>
                  <td className="px-2 py-1 border-b text-center">{u.totalTasks ?? 0}</td>
                  <td className="px-2 py-1 border-b flex gap-1">
                    <button
                      onClick={() => setEditId(u.SAP)}
                      className="bg-blue-500 text-white p-1 rounded-lg w-6 h-6 flex items-center justify-center"
                    >
                      <IoPencilOutline size={14} />
                    </button>
                    <button
                      onClick={() => deleteUser(u)}
                      className="bg-red-500 text-white p-1 rounded-lg w-6 h-6 flex items-center justify-center"
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

      {showAddModal && (
        <AddUser
          onClose={() => setShowAddModal(false)}
          onSave={async () => {
            await mutate("users");
            setShowAddModal(false);
            showAlert("User added successfully");
          }}
        />
      )}

      {editId && (
        <EditUser
          SAP={editId}
          onClose={() => setEditId(null)}
          onSave={async () => {
            await mutate("users");
            setEditId(null);
            showAlert("User updated successfully");
          }}
        />
      )}
    </div>
  );
};

export default UserList;
