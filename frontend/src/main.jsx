import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import Header from "./Components/Header.jsx";
import { AuthProvider } from "./Components/AuthContext.jsx";
import "./index.css";
import Login from "./Pages/Login.jsx";
import Signup from "./Pages/Signup.jsx";
import SupplierList from "./Pages/Suppliers/SuppliersList";
import AddSupplier from "./Pages/Suppliers/AddSupplier";
import EditSupplier from "./Pages/Suppliers/EditSupplier";
import FinishesList from "./Pages/Finishes/FinishesList";
import AddFinish from "./Pages/Finishes/AddFinish";
import EditFinish from "./Pages/Finishes/EditFinish";
import ThicknessesList from "./Pages/Thicknesses/ThicknessesList";
import AddThickness from "./Pages/Thicknesses/AddThickness";
import EditThickness from "./Pages/Thicknesses/EditThickness";
import UsersList from "./Pages/Users/UsersList";
import AddUser from "./Pages/Users/AddUser";
import EditUser from "./Pages/Users/EditUser";
import MaterialsList from "./Pages/Materials/MaterialsList.jsx";
import AddMaterial from "./Pages/Materials/AddMaterial.jsx";
import EditMaterial from "./Pages/Materials/EditMaterial.jsx";
import JobStatusIndicatorList from "./Pages/JobStatusIndicators/JobStatusIndicatorList.jsx";
import AddJobStatusIndicator from "./Pages/JobStatusIndicators/AddJobStatusIndicator.jsx";
import EditJobStatusIndicator from "./Pages/JobStatusIndicators/EditJobStatusIndicator.jsx";
import StockStatusIndicatorList from "./Pages/StockStatusIndicators/StockStatusIndicatorList.jsx";
import AddStockStatusIndicator from "./Pages/StockStatusIndicators/AddStockStatusIndicator.jsx";
import EditStockStatusIndicator from "./Pages/StockStatusIndicators/EditStockStatusIndicator.jsx";
import ProductionList from "./Pages/ProductionList/ProductionList.jsx";
import ProductionListForm from "./Pages/ProductionList/ProductionListForm.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<ProductionList />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/manage/suppliersList" element={<SupplierList />} />
          <Route path="/add-supplier" element={<AddSupplier />} />
          <Route path="/edit-supplier/:id" element={<EditSupplier />} />
          <Route path="/manage/finishesList" element={<FinishesList />} />
          <Route path="/add-finish" element={<AddFinish />} />
          <Route path="/edit-finish/:id" element={<EditFinish />} />
          <Route path="/manage/thicknessesList" element={<ThicknessesList />} />
          <Route path="/add-thickness" element={<AddThickness />} />
          <Route path="/edit-thickness/:id" element={<EditThickness />} />
          <Route path="/manage/usersList" element={<UsersList />} />
          <Route path="/add-user" element={<AddUser />} />
          <Route path="/edit-user/:id" element={<EditUser />} />
          <Route path="/manage/materialsList" element={<MaterialsList />} />
          <Route path="/add-material" element={<AddMaterial />} />
          <Route path="/edit-material/:id" element={<EditMaterial />} />
          <Route
            path="/manage/jobStatusIndicatorsList"
            element={<JobStatusIndicatorList />}
          />
          <Route
            path="/add-job-status-indicator"
            element={<AddJobStatusIndicator />}
          />
          <Route
            path="/edit-job-status-indicator/:id"
            element={<EditJobStatusIndicator />}
          />
          <Route
            path="/manage/stockStatusIndicatorsList"
            element={<StockStatusIndicatorList />}
          />
          <Route
            path="/add-stock-status-indicator"
            element={<AddStockStatusIndicator />}
          />
          <Route
            path="/edit-stock-status-indicator/:id"
            element={<EditStockStatusIndicator />}
          />
          <Route path="/add-production-list" element={<ProductionListForm />} />
        </Routes>
      </Router>
    </AuthProvider>
  </StrictMode>
);
