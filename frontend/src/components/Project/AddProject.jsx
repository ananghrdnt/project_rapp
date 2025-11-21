import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaSave } from "react-icons/fa";
import Alert from "../Alert";

const AddProject = ({ onClose, onSave }) => {
  // Mengganti SAP dengan assigned_to (ID user, yaitu SAP user)
  const [assigned_to, setAssignedTo] = useState("");
  const [assigned_to_group, setAssignedToGroup] = useState(""); // State baru untuk pilihan ITBP/SAP/Data Science
  const [itbps, setItbps] = useState([]);
  const [saps, setSAPs] = useState([]); // State baru untuk user SAP
  const [dataScientists, setDataScientists] = useState([]); // State baru untuk user Data Science
  const [projectTypes, setProjectTypes] = useState([]); // State baru untuk Project Type dari tabel lain

  const [project_name, setProjectName] = useState("");
  // Mengganti project_type (string) menjadi project_type_id (string/number dari tabel ProjectType)
  const [project_type_id, setProjectTypeId] = useState("");
  const [level, setLevel] = useState("");
  const [req_date, setReqDate] = useState("");
  const [plan_start_date, setPlanStartDate] = useState("");
  const [plan_end_date, setPlanEndDate] = useState("");
  const [remark, setRemark] = useState("");
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userSAP, setUserSAP] = useState(""); // ID/SAP user yang login

  const primaryBlue = "bg-blue-600";
  const primaryGreen = "bg-green-600 hover:bg-green-700";

  // --- useEffects untuk Inisialisasi Data ---
  useEffect(() => {
    // Ambil data user login dari localStorage
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUserRole(userData.role?.toUpperCase() || "");
      setUserName(userData.name || "");
      setUserSAP(userData.SAP || ""); // ID/SAP user yang login
    }

    // Ambil daftar Project Types
    axios
      .get("http://localhost:5000/projecttypes") // Sesuaikan endpoint jika berbeda
      .then((res) => setProjectTypes(res.data))
      .catch((err) => console.error("Error fetching Project Types:", err));

    // Ambil daftar users untuk Assigned To (ITBP, SAP, Data Science)
    const fetchUsers = async () => {
      try {
        const [itbpRes, sapRes, dsRes] = await Promise.all([
          axios.get("http://localhost:5000/users?role=ITBP"),
          axios.get("http://localhost:5000/users?role=SAP"), // Asumsi endpoint user bisa difilter
          axios.get("http://localhost:5000/users?role=DATA_SCIENCE"),
        ]);
        setItbps(itbpRes.data);
        setSAPs(sapRes.data);
        setDataScientists(dsRes.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  // Set assigned_to otomatis berdasarkan role user yang login
  useEffect(() => {
    if (userSAP) {
      const role = userRole;
      if (role === "ITBP" || role === "SAP" || role === "DATA_SCIENCE") {
        setAssignedTo(userSAP.toString()); // Set ID/SAP user
        setAssignedToGroup(role); // Set grup otomatis
      }
      // Jika role ADMIN, biarkan assigned_to kosong untuk dipilih
    }
  }, [userRole, userSAP]);

  // Dapatkan daftar user yang akan ditampilkan di dropdown Assigned To (hanya untuk Admin)
  const getAssignedToUsers = () => {
    switch (assigned_to_group) {
      case "ITBP":
        return itbps;
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
    if (!project_name) newErrors.project_name = "Project name is required";
    // Mengubah validasi SAP menjadi assigned_to
    if (!assigned_to) newErrors.assigned_to = "Assigned To is required";
    if (userRole === "ADMIN" && !assigned_to_group)
      newErrors.assigned_to_group = "Assigned To Group is required";
    // Mengubah validasi project_type menjadi project_type_id
    if (!project_type_id)
      newErrors.project_type_id = "Project type is required";
    if (!level) newErrors.level = "Effort level is required";
    if (!req_date) newErrors.req_date = "Request date is required";
    if (!plan_start_date)
      newErrors.plan_start_date = "Plan start date is required";
    if (!plan_end_date) newErrors.plan_end_date = "Plan end date is required";
    if (!remark) newErrors.remark = "Remark is required";

    if (req_date && plan_start_date && plan_end_date) {
      const start = new Date(plan_start_date);
      const end = new Date(plan_end_date);
      if (start > end) {
        newErrors.plan_start_date = "Plan start cannot be after plan end";
      } else {
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (level === "LOW" && diffDays >= 7) {
          newErrors.plan_end_date = "Low effort should be less than 7 days";
        } else if (level === "MID" && (diffDays < 7 || diffDays > 21)) {
          newErrors.plan_end_date =
            "Mid effort should be between 7–21 days";
        } else if (level === "HIGH" && diffDays <= 21) {
          newErrors.plan_end_date = "High effort should be more than 21 days";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showError = (msg) => {
    setAlert({ message: msg, type: "error" });
    setTimeout(() => setAlert(null), 3000);
  };

  const saveProject = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showError("Failed to add project because of missing or invalid fields");
      return;
    }

    setAlert({
      message: "Are you sure you want to add this project?",
      type: "confirm",
      actions: [
        { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
        {
          label: "Confirm",
          type: "confirm",
          onClick: async () => {
            setLoading(true);
            try {
              const token = localStorage.getItem("token");
              await axios.post(
                "http://localhost:5000/projects",
                {
                  // Mengubah itbpSAP menjadi assigned_to
                  assigned_to: Number(assigned_to), // Pastikan ini dikirim sebagai Number (SAP user ID)
                  project_name,
                  // Mengubah project_type menjadi project_type_id
                  project_type_id,
                  level,
                  req_date,
                  plan_start_date,
                  plan_end_date,
                  remark,
                  status: "TO_DO",
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setAlert(null);
              onSave();
              onClose();
            } catch (err) {
              const msg =
                err.response?.data?.msg ||
                "Failed to add project, please try again!";
              showError(msg);
              console.error("Add project error:", msg);
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
      errors[field]
        ? "border-red-500 bg-red-50"
        : "border-gray-300 focus:border-blue-500"
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[700px] max-w-full shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
        <div
          className={`p-4 flex justify-between items-center text-white ${primaryBlue} border-b border-blue-700`}
        >
          <h3 className="text-sm font-bold m-0 tracking-wide">
            FORM ADD NEW PROJECT
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Close form"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={saveProject} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                Project Name
              </label>
              <input
                type="text"
                value={project_name}
                onChange={(e) => setProjectName(e.target.value)}
                className={inputClass("project_name")}
                placeholder="Project Name"
              />
              {errors.project_name && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.project_name}
                </span>
              )}
            </div>

            {/* Project Type - Menggunakan Project Types dari DB */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                Project Type
              </label>
              <select
                value={project_type_id}
  onChange={(e) => setProjectTypeId(Number(e.target.value))}
                  className={
                  inputClass("project_type_id") + " appearance-none cursor-pointer"
                }
              >
      <option value="">-- Select Project Type --</option>
{projectTypes.map((type) => (
  <option key={type.id_type} value={type.id_type}>
    {type.project_type
      .replace(/_/g, " ") // ubah underscore jadi spasi
      .toLowerCase() // ubah semua huruf jadi kecil
      .replace(/\b\w/g, (char) => char.toUpperCase())} {/* kapital tiap kata */}
  </option>
))}


              </select>
              {errors.project_type_id && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.project_type_id}
                </span>
              )}
            </div>

            {/* Assigned To - Bagian ini disesuaikan berdasarkan role */}
            {userRole === "ADMIN" ? (
              <>
                {/* Assigned To Group (Hanya Admin) */}
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-xs text-gray-700">
                    Assigned To Group
                  </label>
                  <select
                    value={assigned_to_group}
                    onChange={(e) => {
                      setAssignedToGroup(e.target.value);
                      setAssignedTo(""); // Reset user saat grup berubah
                    }}
                    className={
                      inputClass("assigned_to_group") +
                      " appearance-none cursor-pointer"
                    }
                  >
                    <option value="">-- Select Group --</option>
                    <option value="ITBP">ITBP</option>
                    <option value="SAP">SAP</option>
                    <option value="DATA_SCIENCE">Data Science</option>
                  </select>
                  {errors.assigned_to_group && (
                    <span className="text-red-500 text-xs mt-0.5">
                      {errors.assigned_to_group}
                    </span>
                  )}
                </div>

                {/* Assigned To User (Hanya Admin jika Group dipilih) */}
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-xs text-gray-700">
                    Assigned To User
                  </label>
                  <select
                    value={assigned_to}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className={
                      inputClass("assigned_to") + " appearance-none cursor-pointer"
                    }
                    disabled={!assigned_to_group}
                  >
                    <option value="">-- Select User --</option>
                    {getAssignedToUsers().map((user) => (
                      <option key={user.SAP} value={user.SAP}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  {errors.assigned_to && (
                    <span className="text-red-500 text-xs mt-0.5">
                      {errors.assigned_to}
                    </span>
                  )}
                </div>
              </>
            ) : (
              // Tampilan untuk ITBP/SAP/Data Science (Auto-filled)
              <div className="flex flex-col gap-1">
                <label className="font-medium text-xs text-gray-700">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={`${userName}`}
                  disabled
                  className="border rounded-lg px-2 py-1.5 text-xs bg-gray-100 text-gray-600 w-full"
                />
                <input type="hidden" value={assigned_to} name="assigned_to" />
              </div>
            )}
            
            {/* Effort Level */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                Effort Est Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={inputClass("level") + " appearance-none cursor-pointer"}
              >
                <option value="">-- Select Effort Level --</option>
                <option value="HIGH">High</option>
                <option value="MID">Mid</option>
                <option value="LOW">Low</option>
              </select>
              {errors.level && (
                <span className="text-red-500 text-xs mt-0.5">{errors.level}</span>
              )}
            </div>

            {/* Request Date */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                Request Date
              </label>
              <input
                type="date"
                value={req_date}
                onChange={(e) => setReqDate(e.target.value)}
                className={inputClass("req_date") + " appearance-none cursor-pointer"}
              />
              {errors.req_date && (
                <span className="text-red-500 text-xs mt-0.5">{errors.req_date}</span>
              )}
            </div>

            {/* Plan Start */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                Plan Start
              </label>
              <input
                type="date"
                value={plan_start_date}
                onChange={(e) => setPlanStartDate(e.target.value)}
                className={
                  inputClass("plan_start_date") + " appearance-none cursor-pointer"
                }
              />
              {errors.plan_start_date && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.plan_start_date}
                </span>
              )}
            </div>

            {/* Plan End */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                Plan End
              </label>
              <input
                type="date"
                value={plan_end_date}
                onChange={(e) => setPlanEndDate(e.target.value)}
                className={
                  inputClass("plan_end_date") + " appearance-none cursor-pointer"
                }
              />
              {errors.plan_end_date && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.plan_end_date}
                </span>
              )}
            </div>

            {/* Remark */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="font-medium text-xs text-gray-700">Remark</label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className={inputClass("remark")}
                placeholder="Project notes or brief description"
              />
              {errors.remark && (
                <span className="text-red-500 text-xs mt-0.5">{errors.remark}</span>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? "bg-gray-400 cursor-not-allowed" : primaryGreen
              } text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all duration-200 transform active:scale-[0.98] hover:shadow-lg`}
            >
              <FaSave className="w-4 h-4" /> {loading ? "Saving..." : "Save Project"}
            </button>
          </div>
        </form>

        {alert && (
          <Alert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
            actions={
              alert.actions || [
                { label: "OK", type: "confirm", onClick: () => setAlert(null) },
              ]
            }
          />
        )}
      </div>
    </div>
  );
};

export default AddProject;