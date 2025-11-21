import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaTimes, FaSave } from "react-icons/fa";
import Alert from "../Alert";

const AddTask = ({ onClose, onSave }) => {
  const { id_project } = useParams();
  const [taskGroups, setTaskGroups] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  const [itgas, setItgas] = useState([]);
  const [saps, setSaps] = useState([]);
  const [dataScientists, setDataScientists] = useState([]);

  const [assignedGroup, setAssignedGroup] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [taskGroupId, setTaskGroupId] = useState("");
  const [taskDetail, setTaskDetail] = useState("");
  const [planStart, setPlanStart] = useState("");
  const [planEnd, setPlanEnd] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [durationText, setDurationText] = useState("");

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userSAP, setUserSAP] = useState("");

  const navigate = useNavigate();
  const primaryBlue = "bg-blue-600";
  const primaryGreen = "bg-green-600 hover:bg-green-700";

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserRole(user.role?.toUpperCase() || "");
      setUserName(user.name || "");
      setUserSAP(user.SAP || "");
    }
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [groupRes, platRes, itgaRes, sapRes, dsRes] = await Promise.all([
          axios.get("http://localhost:5000/task-groups"),
          axios.get("http://localhost:5000/platforms"),
          axios.get("http://localhost:5000/users?role=ITGA"),
          axios.get("http://localhost:5000/users?role=SAP"),
          axios.get("http://localhost:5000/users?role=DATA_SCIENCE"),
        ]);
        setTaskGroups(groupRes.data || []);
        setPlatforms(platRes.data || []);
        setItgas(itgaRes.data || []);
        setSaps(sapRes.data || []);
        setDataScientists(dsRes.data || []);
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
      }
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (userSAP && userRole !== "ADMIN") {
      setAssignedGroup(userRole);
      setAssignedTo(userSAP.toString());
    }
  }, [userRole, userSAP]);

  useEffect(() => {
    if (planStart && planEnd) {
      const start = new Date(planStart);
      const end = new Date(planEnd);
      if (end >= start) {
        const diffMs = end - start;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        setDurationText(`Project will do in ${diffDays} day${diffDays > 1 ? "s" : ""}`);
      } else {
        setDurationText("");
      }
    } else {
      setDurationText("");
    }
  }, [planStart, planEnd]);

  const getUsersByGroup = () => {
    switch (assignedGroup) {
      case "ITGA":
        return itgas;
      case "SAP":
        return saps;
      case "DATA_SCIENCE":
        return dataScientists;
      default:
        return [];
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!assignedTo) newErrors.assignedTo = "Assigned user is required";
    if (userRole === "ADMIN" && !assignedGroup)
      newErrors.assignedGroup = "Assigned group is required";
    if (!taskGroupId) newErrors.taskGroupId = "Task group is required";
    if (!taskDetail) newErrors.taskDetail = "Task detail is required";
    if (!planStart) newErrors.planStart = "Plan start date is required";
    if (!planEnd) newErrors.planEnd = "Plan end date is required";
    if (!platformId) newErrors.platformId = "Platform is required";

    if (planStart && planEnd) {
      const start = new Date(planStart);
      const end = new Date(planEnd);
      if (start > end) {
        newErrors.planStart = "Plan start cannot be after plan end";
        newErrors.planEnd = "Plan end cannot be before plan start";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showError = (msg) => {
    setAlert({ message: msg, type: "error" });
  };

  const saveTask = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showError("Failed to add task because of missing or invalid fields");
      return;
    }

    setAlert({
      message: "Are you sure you want to add this task?",
      type: "confirm",
      actions: [
        { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
        {
          label: "Confirm",
          type: "confirm",
          onClick: async () => {
            try {
              setLoading(true);
              const token = localStorage.getItem("token");
              await axios.post(
                "http://localhost:5000/tasks",
                {
                  id_project,
                  assigned_to: Number(assignedTo),
                  task_group_id: Number(taskGroupId),
                  task_detail: taskDetail,
                  plan_start_date: planStart,
                  plan_end_date: planEnd,
                  platform_id: Number(platformId),
                  status: "TO_DO",
                  task_progress: 0,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (onSave) onSave();
              if (onClose) onClose();
              navigate(`/projects/${id_project}`);
            } catch (err) {
              console.error(err);
              showError("Failed to add task");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    });
  };

  const inputClass = (field) =>
    `border rounded-lg px-2 py-1.5 text-xs w-full transition duration-150 ease-in-out placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[700px] shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
        <div
          className={`p-4 flex justify-between items-center text-white ${primaryBlue} border-b border-blue-700`}
        >
          <h3 className="text-sm font-bold m-0 tracking-wide">
            FORM ADD TASK
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Close form"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={saveTask} className="p-6 grid grid-cols-2 gap-4">
          {userRole === "ADMIN" ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium">Assigned Group</label>
                <select
                  value={assignedGroup}
                  onChange={(e) => {
                    setAssignedGroup(e.target.value);
                    setAssignedTo("");
                  }}
                  className={inputClass("assignedGroup")}
                >
                  <option value="">-- Select Group --</option>
                  <option value="ITGA">ITGA</option>
                  <option value="SAP">SAP</option>
                  <option value="DATA_SCIENCE">Data Science</option>
                </select>
                {errors.assignedGroup && (
                  <span className="text-red-500 text-xs mt-0.5">{errors.assignedGroup}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium">Assigned To</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className={inputClass("assignedTo")}
                  disabled={!assignedGroup}
                >
                  <option value="">-- Select User --</option>
                  {getUsersByGroup().map((u) => (
                    <option key={u.SAP} value={u.SAP}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {errors.assignedTo && (
                  <span className="text-red-500 text-xs mt-0.5">{errors.assignedTo}</span>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium">Assigned To</label>
              <input
                type="text"
                value={`${userName}`}
                disabled
                className="border rounded-lg px-2 py-1.5 text-xs bg-gray-100 text-gray-600 w-full"
              />
            </div>
          )}

          {/* Task Group */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Task Group</label>
            <select
              value={taskGroupId}
              onChange={(e) => setTaskGroupId(e.target.value)}
              className={inputClass("taskGroupId")}
            >
              <option value="">-- Select Task Group --</option>
              {taskGroups.map((g) => (
                <option key={g.id_group} value={g.id_group}>
                  {g.task_group}
                </option>
              ))}
            </select>
            {errors.taskGroupId && (
              <span className="text-red-500 text-xs mt-0.5">{errors.taskGroupId}</span>
            )}
          </div>

          {/* Platform */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Platform</label>
            <select
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
              className={inputClass("platformId")}
            >
              <option value="">-- Select Platform --</option>
              {platforms.map((p) => (
                <option key={p.id_platform} value={p.id_platform}>
                  {p.platform}
                </option>
              ))}
            </select>
            {errors.platformId && (
              <span className="text-red-500 text-xs mt-0.5">{errors.platformId}</span>
            )}
          </div>

          {/* Task Detail */}
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-xs font-medium">Task Detail</label>
            <textarea
              value={taskDetail}
              onChange={(e) => setTaskDetail(e.target.value)}
              rows={2}
              className={inputClass("taskDetail")}
              placeholder="Details of task"
            />
            {errors.taskDetail && (
              <span className="text-red-500 text-xs mt-0.5">{errors.taskDetail}</span>
            )}
          </div>

          {/* Plan Start */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Plan Start</label>
            <input
              type="date"
              value={planStart}
              onChange={(e) => setPlanStart(e.target.value)}
              className={inputClass("planStart")}
            />
            {errors.planStart && (
              <span className="text-red-500 text-xs mt-0.5">{errors.planStart}</span>
            )}
          </div>

          {/* Plan End */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Plan End</label>
            <input
              type="date"
              value={planEnd}
              onChange={(e) => setPlanEnd(e.target.value)}
              className={inputClass("planEnd")}
            />
            {errors.planEnd && (
              <span className="text-red-500 text-xs mt-0.5">{errors.planEnd}</span>
            )}
          </div>

          {durationText && <div className="col-span-2 text-green-600 text-xs">{durationText}</div>}

          <div className="col-span-2 flex justify-end pt-6 border-t mt-4">
            <button
              type="submit"
              disabled={loading}
              className={`${loading ? "bg-gray-400 cursor-not-allowed" : primaryGreen} text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2`}
            >
              <FaSave className="w-4 h-4" /> {loading ? "Saving..." : "Save Task"}
            </button>
          </div>
        </form>

        {alert && (
          <Alert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
            actions={alert.actions || [{ label: "OK", type: "confirm", onClick: () => setAlert(null) }]}
          />
        )}
      </div>
    </div>
  );
};

export default AddTask;
