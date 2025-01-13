import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../Components/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import "../../css/Production List/ProductionListForm.scss";

const ProductionListForm = () => {
  const [formData, setFormData] = useState({
    jobName: "",
    cutlistName: "",
    materials: [
      {
        material: "",
        customMaterial: "",
        quantitySaw: 0,
        quantityCNC: 0,
        isCustom: false,
      },
    ],
    stockStatus: "",
    jobStatus: "",
    priority: 0,
    note: "",
  });
  const [materials, setMaterials] = useState([]);
  const [stockStatuses, setStockStatuses] = useState([]);
  const [jobStatuses, setJobStatuses] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchMaterials();
    fetchStockStatuses();
    fetchJobStatuses();
    if (id) {
      fetchProductionList();
    }
  }, [id]);

  const fetchProductionList = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/productionLists/${id}`
      );
      setFormData(response.data);
    } catch (error) {
      console.error("Error fetching production list:", error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/materials`
      );
      setMaterials(response.data);
      console.log(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchStockStatuses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/stockStatusIndicators`
      );
      setStockStatuses(response.data);
    } catch (error) {
      console.error("Error fetching stock status indicators:", error);
    }
  };

  const fetchJobStatuses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/jobStatusIndicators`
      );
      setJobStatuses(response.data);
    } catch (error) {
      console.error("Error fetching job status indicators:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMaterialChange = (index, field, value) => {
    const newMaterials = [...formData.materials];
    newMaterials[index][field] = value;
    if (field === "isCustom") {
      newMaterials[index].material = "";
      newMaterials[index].customMaterial = "";
    }
    setFormData({ ...formData, materials: newMaterials });
  };

  const addMaterial = () => {
    setFormData({
      ...formData,
      materials: [
        ...formData.materials,
        {
          material: "",
          customMaterial: "",
          quantitySaw: 0,
          quantityCNC: 0,
          isCustom: false,
        },
      ],
    });
  };

  const removeMaterial = (index) => {
    const newMaterials = [...formData.materials];
    newMaterials.splice(index, 1);
    setFormData({ ...formData, materials: newMaterials });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await axios.put(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${id}`,
          formData
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/add`,
          formData
        );
      }
      navigate("/");
    } catch (error) {
      console.error("Error saving production list:", error);
    }
  };

  const canEditAll =
    user.role === "Editor" || user.role === "Manager" || user.role === "admin";
  const isStockManager = user.role === "Inventory Associates";

  return (
    <div className="production-list-form">
      <h2>{id ? "Edit Job" : "Add New Job"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="jobName"
          value={formData.jobName}
          onChange={handleChange}
          placeholder="Job Name"
          required
        />
        <input
          type="text"
          name="cutlistName"
          value={formData.cutlistName}
          onChange={handleChange}
          placeholder="Cutlist Name"
          required
        />
        {formData.materials.map((material, index) => (
          <div key={index} className="material-entry">
            <div className="material-selection">
              <label>
                <input
                  type="checkbox"
                  checked={material.isCustom}
                  onChange={(e) =>
                    handleMaterialChange(index, "isCustom", e.target.checked)
                  }
                />
                Custom Material
              </label>
              {material.isCustom ? (
                <input
                  type="text"
                  value={material.customMaterial}
                  onChange={(e) =>
                    handleMaterialChange(
                      index,
                      "customMaterial",
                      e.target.value
                    )
                  }
                  placeholder="Custom Material"
                />
              ) : (
                <select
                  value={material.material}
                  onChange={(e) =>
                    handleMaterialChange(index, "material", e.target.value)
                  }
                >
                  <option value="">Select Material</option>
                  {materials.map((m) => (
                    <option key={m._id} value={m.code}>
                      {m.code}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="quantity-inputs">
              <label>
                Saw Quantity:
                <input
                  type="number"
                  value={material.quantitySaw}
                  onChange={(e) =>
                    handleMaterialChange(
                      index,
                      "quantitySaw",
                      parseInt(e.target.value)
                    )
                  }
                />
              </label>
              <label>
                CNC Quantity:
                <input
                  type="number"
                  value={material.quantityCNC}
                  onChange={(e) =>
                    handleMaterialChange(
                      index,
                      "quantityCNC",
                      parseInt(e.target.value)
                    )
                  }
                />
              </label>
            </div>
            <button type="button" onClick={() => removeMaterial(index)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addMaterial}>
          Add Material
        </button>

        {canEditAll || isStockManager ? (
          <select
            name="stockStatus"
            value={formData.stockStatus}
            onChange={handleChange}
            disabled={!canEditAll && !isStockManager}
          >
            <option value="">Select Stock Status</option>
            {stockStatuses.map((status) => (
              <option key={status._id} value={status.name}>
                {status.name}
              </option>
            ))}
          </select>
        ) : (
          <></>
        )}

        {canEditAll ? (
          <select
            name="jobStatus"
            value={formData.jobStatus}
            onChange={handleChange}
            disabled={!canEditAll}
          >
            <option value="">Select Job Status</option>
            {jobStatuses.map((status) => (
              <option key={status._id} value={status.name}>
                {status.name}
              </option>
            ))}
          </select>
        ) : (
          <></>
        )}
        {canEditAll ? (
          <div className="priority-input">
            <label>
              Priority:
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                placeholder="Priority"
                disabled={!canEditAll}
              />
            </label>
          </div>
        ) : (
          <></>
        )}
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="Note"
        />

        <button type="submit">Save</button>
        <button type="button" onClick={() => navigate("/production-list")}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default ProductionListForm;
