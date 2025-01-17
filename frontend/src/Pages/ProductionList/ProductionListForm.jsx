import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../Components/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import "../../css/ProductionList/ProductionListForm.scss";
import ConfirmationModal from "./ConfirmationModal";

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
        stockStatus: "",
        jobStatus: "",
      },
    ],
    priority: 0,
    note: "",
  });
  const [materials, setMaterials] = useState([]);
  const [stockStatuses, setStockStatuses] = useState([]);
  const [jobStatuses, setJobStatuses] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    fetchMaterials();
    fetchStockStatuses();
    fetchJobStatuses();
    if (id) {
      fetchProductionList();
    }
  }, [id]);

  useEffect(() => {
    if (!id && stockStatuses.length > 0 && jobStatuses.length > 0) {
      const defaultStockStatus =
        stockStatuses.find((status) => status.defaultForNew)?.name || "";
      const defaultJobStatus =
        jobStatuses.find((status) => status.defaultForNew)?.name || "";

      console.log(
        "Setting default statuses:",
        defaultStockStatus,
        defaultJobStatus
      );

      setFormData((prevData) => ({
        ...prevData,
        materials: prevData.materials.map((material) => ({
          ...material,
          stockStatus: defaultStockStatus,
          jobStatus: defaultJobStatus,
        })),
      }));
    }
  }, [id, stockStatuses, jobStatuses]);

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

  const setDefaultStatuses = () => {
    const defaultStockStatus =
      stockStatuses.find((status) => status.defaultForNew)?.name || "";
    const defaultJobStatus =
      jobStatuses.find((status) => status.defaultForNew)?.name || "";

    setFormData((prevData) => ({
      ...prevData,
      materials: prevData.materials.map((material) => ({
        ...material,
        stockStatus: defaultStockStatus,
        jobStatus: defaultJobStatus,
      })),
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMaterialChange = (index, field, value) => {
    const newMaterials = [...formData.materials];
    newMaterials[index][field] = value;
    if (field === "customMaterial") {
      newMaterials[index].material = value ? "" : newMaterials[index].material;
    }
    if (field === "jobStatus") {
      const jobStatusToArchive = jobStatuses.find(
        (status) => status.name === value && status.defaultForAutoArchive
      );
      // if (jobStatusToArchive) {
      //   alert(
      //     "This job status will automatically archive the job upon saving."
      //   );
      // }
    }
    setFormData({ ...formData, materials: newMaterials });
  };

  const addMaterial = () => {
    const defaultStockStatus =
      stockStatuses.find((status) => status.defaultForNew)?.name || "";
    const defaultJobStatus =
      jobStatuses.find((status) => status.defaultForNew)?.name || "";

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
          stockStatus: defaultStockStatus,
          jobStatus: defaultJobStatus,
        },
      ],
    });
  };

  const removeMaterial = (index) => {
    const newMaterials = [...formData.materials];
    newMaterials.splice(index, 1);
    setFormData({ ...formData, materials: newMaterials });
  };

  const handleSaveClick = () => {
    setActionType("save");
    setIsModalOpen(true);
  };

  const handleCancelClick = () => {
    setActionType("cancel");
    setIsModalOpen(true);
  };

  const confirmCancelAction = () => {
    setIsModalOpen(false);
    setActionType(null);
    navigate("/");
  };

  const confirmSaveAction = async () => {
    try {
      let savedJob;
      if (id) {
        savedJob = await axios.put(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${id}`,
          formData
        );
      } else {
        savedJob = await axios.post(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/add`,
          formData
        );
      }

      const allMaterialsAutoArchive = formData.materials.every((material) => {
        const jobStatus = jobStatuses.find(
          (status) => status.name === material.jobStatus
        );
        return jobStatus && jobStatus.defaultForAutoArchive;
      });

      if (allMaterialsAutoArchive) {
        await axios.patch(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${
            savedJob.data._id
          }/archive`
        );
      }

      navigate("/");
    } catch (error) {
      console.error("Error saving production list:", error);
    }
    setIsModalOpen(false);
    setActionType(null);
  };

  const canEditAll = ["Editor", "Manager", "admin"].includes(user.role);
  const isStockManager = user.role === "Inventory Associate";

  if (!user) {
    return (
      <div className="production-list-form">
        <h2>Login Required</h2>
        <div className="login-message">
          <p>Please log in to add or edit a job.</p>
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="production-list-form">
      <h2>{id ? "Edit Job" : "Add New Job"}</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="input-group">
          <label htmlFor="jobName">Job Name:</label>
          <input
            id="jobName"
            type="text"
            name="jobName"
            value={formData.jobName}
            onChange={handleChange}
            placeholder="Enter Job Name"
            required
            disabled={isStockManager}
          />
        </div>
        <div className="input-group">
          <label htmlFor="cutlistName">Cutlist Name:</label>
          <input
            id="cutlistName"
            type="text"
            name="cutlistName"
            value={formData.cutlistName}
            onChange={handleChange}
            placeholder="Enter Cutlist Name"
            required
            disabled={isStockManager}
          />
        </div>
        {formData.materials.map((material, index) => (
          <div key={index} className="material-entry">
            <h3>Material {index + 1}</h3>
            <div className="material-selection">
              <label className="custom-checkbox">
                Custom Material
                <input
                  type="checkbox"
                  checked={!!material.customMaterial}
                  onChange={(e) =>
                    handleMaterialChange(
                      index,
                      "customMaterial",
                      e.target.checked ? " " : ""
                    )
                  }
                  disabled={isStockManager}
                />
                <span className="checkmark"></span>
              </label>
              {material.customMaterial ? (
                <div className="input-group">
                  <label htmlFor={`customMaterial-${index}`}>
                    Custom Material:
                  </label>
                  <input
                    id={`customMaterial-${index}`}
                    type="text"
                    value={material.customMaterial}
                    onChange={(e) =>
                      handleMaterialChange(
                        index,
                        "customMaterial",
                        e.target.value
                      )
                    }
                    placeholder="Enter Custom Material"
                    disabled={isStockManager}
                  />
                </div>
              ) : (
                <div className="input-group">
                  <label htmlFor={`material-${index}`}>Material:</label>
                  <select
                    id={`material-${index}`}
                    value={material.material}
                    onChange={(e) =>
                      handleMaterialChange(index, "material", e.target.value)
                    }
                    disabled={isStockManager}
                  >
                    <option value="">Select Material</option>
                    {materials.map((m) => (
                      <option key={m._id} value={m.code}>
                        {m.code}
                      </option>
                    ))}
                  </select>
                </div>
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
                  disabled={isStockManager}
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
                  disabled={isStockManager}
                />
              </label>
            </div>
            {(canEditAll || isStockManager) && (
              <div className="input-group">
                <label htmlFor={`stockStatus-${index}`}>Stock Status:</label>
                <select
                  id={`stockStatus-${index}`}
                  value={material.stockStatus}
                  onChange={(e) =>
                    handleMaterialChange(index, "stockStatus", e.target.value)
                  }
                  disabled={!canEditAll && !isStockManager}
                >
                  <option value="">Select Stock Status</option>
                  {stockStatuses.map((status) => (
                    <option key={status._id} value={status.name}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {canEditAll && (
              <div className="input-group">
                <label htmlFor={`jobStatus-${index}`}>Job Status:</label>
                <select
                  id={`jobStatus-${index}`}
                  value={material.jobStatus}
                  onChange={(e) =>
                    handleMaterialChange(index, "jobStatus", e.target.value)
                  }
                  disabled={!canEditAll}
                >
                  <option value="">Select Job Status</option>
                  {jobStatuses.map((status) => (
                    <option key={status._id} value={status.name}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={() => removeMaterial(index)}
              disabled={isStockManager}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addMaterial} disabled={isStockManager}>
          Add Material
        </button>
        {canEditAll && (
          <div className="priority-input">
            <label htmlFor="priority">Priority:</label>
            <input
              id="priority"
              type="number"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              placeholder="Enter Priority"
              disabled={!canEditAll}
            />
          </div>
        )}
        <div className="input-group">
          <label htmlFor="note">Note:</label>
          <textarea
            id="note"
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Enter Note"
            disabled={isStockManager}
          />
        </div>
        <button type="button" onClick={handleSaveClick} className="form-button">
          Save
        </button>
        <button className="form-button" onClick={handleCancelClick}>
          Cancel
        </button>
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={
            actionType === "save" ? confirmSaveAction : confirmCancelAction
          }
          message={`Are you sure you want to ${
            actionType === "save" ? "save" : "cancel creating/editing"
          } this job?`}
        />
      </form>
    </div>
  );
};

export default ProductionListForm;
