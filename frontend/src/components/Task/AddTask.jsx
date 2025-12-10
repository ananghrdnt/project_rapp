import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaTimes, FaSave } from "react-icons/fa";
import Alert from "../Alert";

const AddTask = ({ onClose, onSave }) => {
  const { id_project } = useParams();
  const navigate = useNavigate();

  const [dropdownData, setDropdownData] = useState({
    taskGroups: [],
    platforms: [],
    itgas: [],
    saps: [],
    dataScientists: []
  });

  const [form, setForm] = useState({
    assignedGroup: "",
    assignedTo: "",
    taskGroupId: "",
    taskDetail: "",
    planStart: "",
    planEnd: "",
    platformId: ""
  });

  const [durationText, setDurationText] = useState("");
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userRole = user.role?.toUpperCase() || "";
  const userName = user.name || "";
  const userSAP = user.SAP || "";

  const primaryBlue = "bg-blue-600";
  const primaryGreen = "bg-green-600 hover:bg-green-700";

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const getUsersByGroup = () => {
    const groupMap = {
      ITGA: dropdownData.itgas,
      SAP: dropdownData.saps,
      DATA_SCIENCE: dropdownData.dataScientists
    };
    return groupMap[form.assignedGroup] || [];
  };

  const validate = () => {
    const newErrors = {};
    const requiredFields = [
      "assignedTo",
      ...(userRole === "ADMIN" ? ["assignedGroup"] : []),
      "taskGroupId",
      "taskDetail",
      "planStart",
      "planEnd",
      "platformId"
    ];

    requiredFields.forEach((field) => {
      if (!form[field]) newErrors[field] = "This field is required";
    });

    if (form.planStart && form.planEnd) {
      const start = new Date(form.planStart);
      const end = new Date(form.planEnd);
      if (start > end) {
        newErrors.planStart = "Start date must be before end date";
        newErrors.planEnd = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [groupRes, platRes, itgaRes, sapRes, dsRes] = await Promise.all([
          axios.get("http://localhost:5000/task-groups", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:5000/platforms", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:5000/users?role=ITGA", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:5000/users?role=SAP", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:5000/users?role=DATA_SCIENCE", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setDropdownData({
          taskGroups: groupRes.data || [],
          platforms: platRes.data || [],
          itgas: itgaRes.data || [],
          saps: sapRes.data || [],
          dataScientists: dsRes.data || []
        });
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
      }
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (userSAP && userRole !== "ADMIN") {
      updateField("assignedGroup", userRole);
      updateField("assignedTo", userSAP.toString());
    }
  }, [userRole, userSAP]);

  // ✅ Perbaikan useEffect: hanya depend pada planStart & planEnd
  const { planStart, planEnd } = form;
  useEffect(() => {
    if (!planStart || !planEnd) return setDurationText("");

    const start = new Date(planStart);
    const end = new Date(planEnd);
    if (end >= start) {
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      setDurationText(`Project will do in ${diffDays} day${diffDays > 1 ? "s" : ""}`);
    } else setDurationText("");
  }, [planStart, planEnd]);

  const showError = (msg) => {
    setAlert({ message: msg, type: "error" });
  };

  const saveTask = async (e) => {
    e.preventDefault();
    if (!validate()) return showError("Please correct the errors before saving");

    setAlert({
      message: "Confirm add task?",
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
                  assigned_to: Number(form.assignedTo),
                  task_group_id: Number(form.taskGroupId),
                  task_detail: form.taskDetail,
                  plan_start_date: form.planStart,
                  plan_end_date: form.planEnd,
                  platform_id: Number(form.platformId),
                  status: "TO_DO",
                  task_progress: 0,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              onSave?.();
              onClose?.();
              navigate(`/projects/${id_project}`);
            } catch {
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
    `border rounded-lg px-2 py-1.5 text-xs w-full ${
      errors[field] ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[700px] shadow-2xl overflow-hidden">

        <div className={`p-4 flex justify-between items-center text-white ${primaryBlue}`}>
          <h3 className="text-sm font-bold">FORM ADD TASK</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={saveTask} className="p-6 grid grid-cols-2 gap-4">
          {userRole === "ADMIN" ? (
            <>
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="assignedGroup-task"
                  className="text-xs font-medium">Assigned Group</label>
                <select
                  id="assignedGroup-task"
                  value={form.assignedGroup}
                  onChange={(e) => updateField("assignedGroup", e.target.value)}
                  className={inputClass("assignedGroup")}
                >
                  <option value="">-- Select Group --</option>
                  <option value="ITGA">ITGA</option>
                  <option value="SAP">SAP</option>
                  <option value="DATA_SCIENCE">Data Science</option>
                </select>
                {errors.assignedGroup && (
                  <span className="text-red-500 text-xs">{errors.assignedGroup}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="assignedTo-task-role"
                  className="text-xs font-medium">Assigned To</label>
                <select
                  id="assignedTo-task-role"
                  value={form.assignedTo}
                  onChange={(e) => updateField("assignedTo", e.target.value)}
                  disabled={!form.assignedGroup}
                  className={inputClass("assignedTo")}
                >
                  <option value="">-- Select User --</option>
                  {getUsersByGroup().map((u) => (
                    <option key={u.SAP} value={u.SAP}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {errors.assignedTo && (
                  <span className="text-red-500 text-xs">{errors.assignedTo}</span>
                )}
              </div>
            </>
          ) : (
            <div className="col-span-2 flex flex-col gap-1">
              <label 
                htmlFor="assignedTo-task-user"
                className="text-xs font-medium">Assigned To</label>
              <input
                id="assignedTo-task-user"
                type="text"
                value={userName}
                disabled
                className="border rounded-lg px-2 py-1.5 text-xs bg-gray-100 text-gray-600"
              />
            </div>
          )}

          {/* Task Group */}
          <div>
            <label 
              htmlFor="taskGroup-task"
              className="text-xs font-medium">Task Group</label>
            <select
              id="taskGroup-task"
              value={form.taskGroupId}
              onChange={(e) => updateField("taskGroupId", e.target.value)}
              className={inputClass("taskGroupId")}
            >
              <option value="">-- Select Task Group --</option>
              {dropdownData.taskGroups.map((g) => (
                <option key={g.id_group} value={g.id_group}>
                  {g.task_group}
                </option>
              ))}
            </select>
            {errors.taskGroupId && (
              <span className="text-red-500 text-xs">{errors.taskGroupId}</span>
            )}
          </div>

          {/* Platform */}
          <div>
            <label 
              htmlFor="platform-task"
              className="text-xs font-medium">Platform</label>
            <select
              id="platform-task"
              value={form.platformId}
              onChange={(e) => updateField("platformId", e.target.value)}
              className={inputClass("platformId")}
            >
              <option value="">-- Select Platform --</option>
              {dropdownData.platforms.map((p) => (
                <option key={p.id_platform} value={p.id_platform}>
                  {p.platform}
                </option>
              ))}
            </select>
            {errors.platformId && (
              <span className="text-red-500 text-xs">{errors.platformId}</span>
            )}
          </div>

          {/* Task Detail */}
          <div className="col-span-2">
            <label 
              htmlFor="taskDetail-task"
              className="text-xs font-medium">Task Detail</label>
            <textarea
              id="taskDetail-task"
              value={form.taskDetail}
              onChange={(e) => updateField("taskDetail", e.target.value)}
              className={inputClass("taskDetail")}
              rows={2}
              placeholder="Details of task"
            />
            {errors.taskDetail && (
              <span className="text-red-500 text-xs">{errors.taskDetail}</span>
            )}
          </div>

          {/* Plan Start */}
          <div>
            <label 
              htmlFor="planStart-task"
              className="text-xs font-medium">Plan Start</label>
            <input
              id="planStart-task"
              type="date"
              value={form.planStart}
              onChange={(e) => updateField("planStart", e.target.value)}
              className={inputClass("planStart")}
            />
            {errors.planStart && (
              <span className="text-red-500 text-xs">{errors.planStart}</span>
            )}
          </div>

          {/* Plan End */}
          <div>
            <label 
              htmlFor="planEnd-task"
              className="text-xs font-medium">Plan End</label>
            <input
              id="planEnd-task"
              type="date"
              value={form.planEnd}
              onChange={(e) => updateField("planEnd", e.target.value)}
              className={inputClass("planEnd")}
            />
            {errors.planEnd && (
              <span className="text-red-500 text-xs">{errors.planEnd}</span>
            )}
          </div>

          {durationText && (
            <p className="col-span-2 text-green-600 text-xs">{durationText}</p>
          )}

          <div className="col-span-2 flex justify-end pt-6 border-t mt-4">
            <button
              type="submit"
              disabled={loading}
              className={`${loading ? "bg-gray-400" : primaryGreen} text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2`}
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
