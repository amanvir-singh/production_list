/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/Materials/MaterialForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const EditMaterial = () => {
  const [supplier, setSupplier] = useState("");
  const [name, setName] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [finish, setFinish] = useState("");
  const [thickness, setThickness] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [code, setCode] = useState("");
  const [manualCode, setManualCode] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [finishes, setFinishes] = useState([]);
  const [thicknesses, setThicknesses] = useState([]);
  const [backendError, setBackendError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canEditMaterial =
    user.role === "Reader" ||
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "admin";

  useEffect(() => {
    fetchSuppliers();
    fetchFinishes();
    fetchThicknesses();
    fetchMaterial();
  }, []);

  useEffect(() => {
    if (!manualCode) {
      generateCode();
    }
  }, [supplier, colorCode, finish, thickness, length, width, manualCode]);

  const fetchMaterial = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/materials/${id}`
      );
      const material = response.data;
      setSupplier(material.supplier);
      setName(material.name);
      setColorCode(material.colorCode);
      setFinish(material.finish);
      setThickness(material.thickness);
      setLength(material.length);
      setWidth(material.width);
      setCode(material.code);
    } catch (error) {
      console.error("Error fetching material:", error);
      setBackendError("Error fetching material data. Please try again.");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/suppliers`
      );
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchFinishes = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/finishes`
      );
      setFinishes(response.data);
    } catch (error) {
      console.error("Error fetching finishes:", error);
    }
  };

  const fetchThicknesses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/thicknesses`
      );
      setThicknesses(response.data);
    } catch (error) {
      console.error("Error fetching thicknesses:", error);
    }
  };

  const generateCode = () => {
    if (supplier && colorCode && finish && thickness && length && width) {
      const supplierCode =
        suppliers.find((s) => s.name === supplier)?.code || "";
      const finishCode = finishes.find((f) => f.name === finish)?.code || "";
      const thicknessCode =
        thicknesses.find((t) => t.name === thickness)?.code || "";
      setCode(
        `${supplierCode}_${colorCode}_${finishCode}_${thicknessCode}_${width}x${length}`
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedMaterialData = {
        supplier,
        name,
        colorCode,
        finish,
        thickness,
        length,
        width,
        code,
      };

      // Fetch the original material data
      const originalResponse = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/materials/${id}`
      );
      const originalMaterialData = originalResponse.data;

      // Update the material
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/materials/${id}`,
        updatedMaterialData
      );

      // Log the action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Edited Material: ${code}`,
        previousData: originalMaterialData,
        updatedData: updatedMaterialData,
      });

      navigate("/manage/materialsList");
    } catch (error) {
      console.error("Error updating material:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while updating the material."
      );
    }
  };

  return (
    <div>
      <ErrorModal
        message={backendError}
        onClose={() => setBackendError("")}
        show={!!backendError}
      />
      {canEditMaterial ? (
        <div className="material-form">
          <h1>Edit Material</h1>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="supplier">Supplier:</label>
              <select
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="name">Name (optional):</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="colorCode">Color Code:</label>
              <input
                type="text"
                id="colorCode"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="finish">Finish:</label>
              <select
                id="finish"
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
                required
              >
                <option value="">Select a finish</option>
                {finishes.map((f) => (
                  <option key={f._id} value={f.name}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="thickness">Thickness:</label>
              <select
                id="thickness"
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                required
              >
                <option value="">Select a thickness</option>
                {thicknesses.map((t) => (
                  <option key={t._id} value={t.name}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="length">Length (in feet):</label>
              <input
                type="number"
                id="length"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="width">Width (in feet):</label>
              <input
                type="number"
                id="width"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="code">Code:</label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={!manualCode}
                required
              />
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={manualCode}
                  onChange={(e) => setManualCode(e.target.checked)}
                />
                Change Code Manually
              </label>
            </div>
            <button type="submit">Update Material</button>
          </form>
        </div>
      ) : (
        "You do not have permission to edit a Material. Please contact an administrator for assistance."
      )}
    </div>
  );
};

export default EditMaterial;
