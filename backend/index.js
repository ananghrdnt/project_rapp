import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// import semua route
import ProjectRoute from "./routes/ProjectRoute.js";
import EngineerRoute from "./routes/EngineerRoute.js";
import TaskRoute from "./routes/TaskRoute.js";
import DashboardRoute from "./routes/DashboardRoute.js";
import AuthRoute from "./routes/AuthRoute.js"; // ✅ tambahkan import auth route
import ItbpRoutes from "./routes/ItbpRoute.js";
import userRoutes from "./routes/UserRoute.js";
import ProjectTypeRoute from "./routes/ProjectTypeRoute.js";
import TaskGroupRoute from "./routes/TaskGroupRoute.js";
import PlatformRoute from "./routes/PlatformRoute.js";
import RoleRoute from "./routes/RoleRoute.js";
import PositionRoute from "./routes/PositionRoute.js";



dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// routes utama
app.use(userRoutes);
app.use(ProjectRoute);
app.use(EngineerRoute);
app.use(TaskRoute);
app.use("/task-groups", TaskGroupRoute);
app.use("/platforms", PlatformRoute);
app.use(DashboardRoute);
app.use("/auth", AuthRoute); // ✅ tambahkan route untuk login
app.use(ItbpRoutes);
app.use(RoleRoute);
app.use("/positions", PositionRoute);
app.use("/projecttypes", ProjectTypeRoute); // <-- TAMBAHKAN AWALAN PATH DI SINI
app.listen(process.env.APP_PORT, () => {
  console.log("Server up and running...");
});
