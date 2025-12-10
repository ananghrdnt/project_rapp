import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaTimes, FaSave } from "react-icons/fa";
import Alert from "../Alert";

const EditTask = ({ id_task, onClose, onSave }) => {
  const { id_project } = useParams();
  const navigate = useNavigate();

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
  const [actualStart, setActualStart] = useState("");
  const [actualEnd, setActualEnd] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [taskProgress, setTaskProgress] = useState(0);

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [durationText, setDurationText] = useState("");

  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");

  const primaryBlue = "bg-blue-600";
  const primaryGreen = "bg-green-600 hover:bg-green-700";

  // Ambil data user dari localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserRole(user.role?.toUpperCase() || "");
      setUserName(user.name || "");
    }
  }, []);

  // Fetch dropdown data
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

  // Fetch task detail
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const t = (await axios.get(`http://localhost:5000/tasks/${id_task}`)).data;
        setAssignedGroup(t.user?.role?.role?.toUpperCase() || "");
        setAssignedTo(t.assigned_to?.toString() || "");
        setTaskGroupId(t.task_group_id?.toString() || "");
        setTaskDetail(t.task_detail || "");
        setPlanStart(t.plan_start_date?.substring(0, 10) || "");
        setPlanEnd(t.plan_end_date?.substring(0, 10) || "");
        setActualStart(t.actual_start?.substring(0, 10) || "");
        setActualEnd(t.actual_end?.substring(0, 10) || "");
        setPlatformId(t.platform_id?.toString() || "");
        setTaskProgress(t.task_progress || 0);
      } catch (err) {
        console.error(err);
      }
    };
    if (id_task) fetchTask();
  }, [id_task]);

  // Hitung durasi project
  useEffect(() => {
    if (!planStart || !planEnd) return setDurationText("");
    const start = new Date(planStart);
    const end = new Date(planEnd);
    if (end >= start) {
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      setDurationText(`Project will do in ${diffDays} day${diffDays > 1 ? "s" : ""}`);
    } else setDurationText("");
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
    if (userRole === "ADMIN" && !assignedGroup) newErrors.assignedGroup = "Assigned group is required";
    if (!assignedTo) newErrors.assignedTo = "Assigned user is required";
    if (!taskGroupId) newErrors.taskGroupId = "Task group is required";
    if (!taskDetail) newErrors.taskDetail = "Task detail is required";
    if (!planStart) newErrors.planStart = "Plan start date is required";
    if (!planEnd) newErrors.planEnd = "Plan end date is required";
    if (!platformId) newErrors.platformId = "Platform is required";

    if (planStart && planEnd && new Date(planStart) > new Date(planEnd)) {
      newErrors.planStart = "Plan start cannot be after plan end";
      newErrors.planEnd = "Plan end cannot be before plan start";
    }
    if (actualStart && actualEnd && new Date(actualEnd) < new Date(actualStart)) {
      newErrors.actualEnd = "Actual end cannot be before actual start";
    }
    if (Number(taskProgress) < 0 || Number(taskProgress) > 100) {
      newErrors.taskProgress = "Progress must be between 0-100";
    }
    if (Number(taskProgress) > 0 && !actualStart) newErrors.actualStart = "Actual start required when progress > 0%";
    if (actualStart && Number(taskProgress) === 0) newErrors.taskProgress = "Progress must be > 0% when actual start filled";
    if (Number(taskProgress) === 100 && !actualEnd) newErrors.actualEnd = "Actual end required when progress = 100%";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showAlert = (msg, type = "error") => {
    setAlert({ message: msg, type });
  };

  const updateTask = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    let status = "TO_DO";
    if (Number(taskProgress) === 100) status = "COMPLETED";
    else if (Number(taskProgress) > 0) status = "IN_PROGRESS";

    setAlert({
      message: "Are you sure you want to update this task?",
      type: "confirm",
      actions: [
        { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
        {
          label: "Confirm",
          type: "confirm",
          onClick: async () => {
            setLoading(true);
            try {
              await axios.patch(
                `http://localhost:5000/tasks/${id_task}`,
                {
                  id_project,
                  assigned_group: assignedGroup,
                  assigned_to: Number(assignedTo),
                  task_group_id: Number(taskGroupId),
                  task_detail: taskDetail,
                  plan_start_date: planStart,
                  plan_end_date: planEnd,
                  actual_start: actualStart,
                  actual_end: actualEnd,
                  platform_id: Number(platformId),
                  task_progress: Number(taskProgress),
                  status,
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
              );
              setAlert(null);
              onSave?.();
              onClose?.();
              navigate(`/projects/${id_project}`);
            } catch (err) {
              console.error(err.response?.data || err.message);
              showAlert("Failed to update task", "error");
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
      <div className="bg-white rounded-xl w-[700px] shadow-2xl overflow-hidden">
        <div className={`p-4 flex justify-between items-center text-white ${primaryBlue} border-b`}>
          <h3 className="text-sm font-bold">FORM EDIT TASK</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={updateTask} className="p-6 grid grid-cols-2 gap-4">
          {/* Assigned Group & To */}
          {userRole === "ADMIN" && (
            <>
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="assignedGroup-EditTask"
                  className="text-xs font-medium">Assigned Group</label>
                <select
                  id="assignedGroup-EditTask"
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
                {errors.assignedGroup && <span className="text-red-500 text-xs mt-0.5">{errors.assignedGroup}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="assignedTo-EditTask-role"
                  className="text-xs font-medium">Assigned To</label>
                <select
                  id="assignedTo-EditTask-role"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  disabled={!assignedGroup}
                  className={inputClass("assignedTo")}
                >
                  <option value="">-- Select User --</option>
                  {getUsersByGroup().map((u) => (
                    <option key={u.SAP} value={u.SAP}>{u.name}</option>
                  ))}
                </select>
                {errors.assignedTo && <span className="text-red-500 text-xs mt-0.5">{errors.assignedTo}</span>}
              </div>
            </>
          )}

          {userRole !== "ADMIN" && (
            <div className="flex flex-col gap-1 col-span-2">
              <label 
                htmlFor="assignedTo-EditTask-user"
                className="text-xs font-medium">Assigned To</label>
              <input 
                id="assignedTo-EditTask-user"
                type="text"
                value={userName} 
                disabled className="border rounded-lg px-2 py-1.5 text-xs bg-gray-100 text-gray-600 w-full" />
            </div>
          )}

          {/* Task Group */}
          <div className="flex flex-col gap-1">
            <label 
              htmlFor="assignedGroup-EditTask"
              className="text-xs font-medium">Task Group</label>
            <select 
              id="assignedGroup-EditTask"
              value={taskGroupId}
              onChange={(e) => setTaskGroupId(e.target.value)} 
              className={inputClass("taskGroupId")}>
              <option value="">-- Select Task Group --</option>
              {taskGroups.map((g) => (
                <option key={g.id_group} value={g.id_group}>{g.task_group}</option>
              ))}
            </select>
            {errors.taskGroupId && <span className="text-red-500 text-xs mt-0.5">{errors.taskGroupId}</span>}
          </div>

          {/* Platform */}
          <div className="flex flex-col gap-1">
            <label 
              htmlFor="platform-EditTask"
              className="text-xs font-medium">Platform</label>
            <select 
              id="platform-EditTask"
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)} 
              className={inputClass("platformId")}>
              <option value="">-- Select Platform --</option>
              {platforms.map((p) => (
                <option key={p.id_platform} value={p.id_platform}>{p.platform}</option>
              ))}
            </select>
            {errors.platformId && <span className="text-red-500 text-xs mt-0.5">{errors.platformId}</span>}
          </div>

          {/* Task Detail */}
          <div className="flex flex-col gap-1 col-span-2">
            <label 
              htmlFor="taskDetail-EditTask"
              className="text-xs font-medium">Task Detail</label>
            <textarea htmlFor="taskDetail-EditTask" value={taskDetail} onChange={(e) => setTaskDetail(e.target.value)} rows={2} className={inputClass("taskDetail")} placeholder="Details of task" />
            {errors.taskDetail && <span className="text-red-500 text-xs mt-0.5">{errors.taskDetail}</span>}
          </div>

          {/* Plan Start / End */}
          <div className="flex flex-col gap-1">
            <label htmlFor="planStart-EditTask" className="text-xs font-medium">Plan Start</label>
            <input id="planStart-EditTask" type="date" value={planStart} onChange={(e) => setPlanStart(e.target.value)} className={inputClass("planStart")} />
            {errors.planStart && <span className="text-red-500 text-xs mt-0.5">{errors.planStart}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="planEnd-EditTask" className="text-xs font-medium">Plan End</label>
            <input id="planEnd-EditTask" type="date" value={planEnd} onChange={(e) => setPlanEnd(e.target.value)} className={inputClass("planEnd")} />
            {errors.planEnd && <span className="text-red-500 text-xs mt-0.5">{errors.planEnd}</span>}
          </div>

          {/* Actual Start / End */}
          <div className="flex flex-col gap-1">
            <label htmlFor="actualStart-EditTask" className="text-xs font-medium">Actual Start</label>
            <input id="actualStart-EditTask" type="date" value={actualStart} onChange={(e) => setActualStart(e.target.value)} className={inputClass("actualStart")} />
            {errors.actualStart && <span className="text-red-500 text-xs mt-0.5">{errors.actualStart}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="actualEnd-EditTask" className="text-xs font-medium">Actual End</label>
            <input id="actualEnd-EditTask" type="date" value={actualEnd} onChange={(e) => setActualEnd(e.target.value)} disabled={Number(taskProgress) < 100} className={inputClass("actualEnd")} />
            {errors.actualEnd && <span className="text-red-500 text-xs mt-0.5">{errors.actualEnd}</span>}
          </div>

          {/* Progress */}
          <div className="flex flex-col gap-1">
            <label htmlFor="progress-EditTask" className="text-xs font-medium">Progress (%)</label>
            <input id="progress-EditTask" type="number" min="0" max="100" value={taskProgress} onChange={(e) => setTaskProgress(Number(e.target.value))} className={inputClass("taskProgress")} />
            {errors.taskProgress && <span className="text-red-500 text-xs mt-0.5">{errors.taskProgress}</span>}
          </div>

          {durationText && <div className="col-span-2 text-green-600 text-xs">{durationText}</div>}

          {/* Footer */}
          <div className="col-span-2 flex justify-end pt-6 border-t mt-4">
            <button type="submit" disabled={loading} className={`${loading ? "bg-gray-400 cursor-not-allowed" : primaryGreen} text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2`}>
              <FaSave className="w-4 h-4" /> {loading ? "Updating..." : "Update Task"}
            </button>
          </div>
        </form>

        {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} actions={alert.actions || [{ label: "OK", type: "confirm", onClick: () => setAlert(null) }]} />}
      </div>
    </div>
  );
};

export default EditTask;
