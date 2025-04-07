import React, { useState, useEffect, useContext } from "react";
import Select from "react-select";
import axios from "axios";
import "../../css/JobList/AddJob.scss";
import { AuthContext } from "../../Components/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

const EditJob = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [jobName, setJobName] = useState("");
  const [data, setData] = useState([]);
  const [jobListMaterials, setJobListMaterials] = useState([]);
  const [edgebands, setEdgebands] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchJobListMaterials();
    fetchEdgebands();
    fetchJobData();
  }, [jobId]);

  const fetchJobListMaterials = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/joblistmaterial`
      );
      setJobListMaterials(response.data);
    } catch (error) {
      console.error("Error fetching job list materials:", error);
    }
  };

  const fetchEdgebands = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/edgeband`
      );
      setEdgebands(response.data);
    } catch (error) {
      console.error("Error fetching edgebands:", error);
    }
  };

  const fetchJobData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/joblist/${jobId}`
      );
      const jobData = response.data;
      setJobName(jobData.jobName);

      const updatedData = jobData.partlist.map((part) => {
        const { _id, ...rest } = part;
        return {
          ...rest,
          grain: part.grain || "Length",
        };
      });

      updatedData.push({
        partname: "",
        material: "",
        length: "",
        width: "",
        quantity: "",
        grain: "Length", // Default grain value
        jobName1: jobData.jobName,
        EL: "",
        ER: "",
        ET: "",
        EB: "",
        partcomment: "",
        itemnumber: "",
      });

      setData(updatedData);
    } catch (error) {
      console.error("Error fetching job data:", error);
    }
  };
  const handleAddRow = () => {
    setData([
      ...data,
      {
        partname: "",
        material: "",
        length: "",
        width: "",
        quantity: "",
        grain: "Length", // Default grain value
        jobName1: jobName,
        EL: "",
        ER: "",
        ET: "",
        EB: "",
        partcomment: "",
        itemnumber: "",
      },
    ]);
  };

  const handleCellChange = (value, rowIndex, colIndex) => {
    const newData = [...data];
    const updatedRow = { ...newData[rowIndex] };

    // Match column index with the correct data field
    const columnsMapping = [
      "partname",
      "material",
      "length",
      "width",
      "quantity",
      "grain",
      "jobName1",
      "EL",
      "ER",
      "ET",
      "EB",
      "partcomment",
      "itemnumber",
    ];

    updatedRow[columnsMapping[colIndex]] = value;
    newData[rowIndex] = updatedRow;

    setData(newData);
  };

  const columns = [
    "Part Name",
    "Material",
    "Length",
    "Width",
    "Quantity",
    "Grain",
    "Job Name",
    "EL",
    "ER",
    "ET",
    "EB",
    "Part Comment",
    "Item Number",
  ];

  const grainOptions = [
    { value: "Length", label: "Length" },
    { value: "Width", label: "Width" },
    { value: "None", label: "None" },
  ];

  const narrowColumns = [2, 3, 4, 12];

  const handleSave = async () => {
    const filteredData = data.filter((row) => {
      return Object.values(row).some((cell, index) => {
        return index !== 5 && index !== 6 && cell.trim() !== "";
      });
    });

    if (filteredData.length === 0) {
      alert("Please fill in the required fields.");
      return;
    }

    const jobData = {
      jobName: jobName,
      CreatedBy: user.username,
      Addedto: "",
      Addedby: "",
      partlist: filteredData.map((row) => ({
        partname: row.partname,
        material: row.material,
        length: row.length,
        width: row.width,
        quantity: row.quantity,
        grain: row.grain,
        jobName1: jobName,
        EL: row.EL,
        ER: row.ER,
        ET: row.ET,
        EB: row.EB,
        partcomment: row.partcomment,
        itemnumber: row.itemnumber,
      })),
    };

    try {
      setIsSaving(true);
      const response = await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/joblist/${jobId}`,
        jobData
      );
      console.log(response.data);
      setIsSaving(false);
      navigate(`/jobList`);
    } catch (error) {
      console.error("Error saving job:", error);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/jobList");
  };

  const handleConfirmationClose = (confirmed) => {
    if (confirmed) {
      handleSave();
    }
    setShowConfirmation(false);
  };

  return (
    <div className="add-new-job-container">
      <div className="job-name-input-container">
        <input
          type="text"
          className="job-name-input"
          placeholder="Enter Job Name"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
        />
      </div>

      <div className="action-buttons">
        <button
          className="save-button"
          onClick={() => setShowConfirmation(true)}
          disabled={isSaving}
        >
          Save
        </button>
        <button
          className="cancel-button"
          onClick={handleCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>

      {showConfirmation && (
        <div className="confirmation-popup">
          <p>Are you sure you want to save this job?</p>
          <button onClick={() => handleConfirmationClose(true)}>Yes</button>
          <button onClick={() => handleConfirmationClose(false)}>No</button>
        </div>
      )}

      <div className="add-row-btn" onClick={handleAddRow}>
        <i className="fa fa-plus-circle"></i> + Add Row
      </div>

      <div className="table-container">
        {/* Table */}
        <table className="job-table">
          <thead>
            <tr>
              <th className="row-number">#</th> {/* Row number */}
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={
                    index === 0
                      ? "part-name-column"
                      : index === 1
                      ? "material-column"
                      : index === 5
                      ? "grain-column"
                      : index === 6
                      ? "job-name-column"
                      : index === 7 ||
                        index === 8 ||
                        index === 9 ||
                        index === 10
                      ? "edgeband-column"
                      : narrowColumns.includes(index)
                      ? "narrow-column"
                      : ""
                  }
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="row-number">{rowIndex + 1}</td>{" "}
                {/* Row number */}
                {Object.values(row).map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={
                      narrowColumns.includes(colIndex) ? "narrow-column" : ""
                    }
                  >
                    {colIndex === 1 ? (
                      // Material column with react-select
                      <Select
                        className="material-column"
                        value={
                          jobListMaterials.find(
                            (material) => material.code === cell
                          )
                            ? {
                                value: cell,
                                label: cell,
                              }
                            : null
                        }
                        onChange={(selectedOption) =>
                          handleCellChange(
                            selectedOption.value,
                            rowIndex,
                            colIndex
                          )
                        }
                        options={jobListMaterials.map((material) => ({
                          value: material.code,
                          label: material.code,
                        }))}
                        styles={{
                          control: (styles) => ({
                            ...styles,
                            width: "100%",
                            height: "100%",
                          }),
                          menu: (styles) => ({
                            ...styles,
                            zIndex: 999,
                          }),
                        }}
                      />
                    ) : colIndex === 7 ||
                      colIndex === 8 ||
                      colIndex === 9 ||
                      colIndex === 10 ? (
                      // EL, ER, ET, EB columns with react-select
                      <Select
                        className="edgeband-column"
                        value={
                          edgebands.find((edgeband) => edgeband.code === cell)
                            ? {
                                value: cell,
                                label: cell,
                              }
                            : null
                        }
                        onChange={(selectedOption) =>
                          handleCellChange(
                            selectedOption.value,
                            rowIndex,
                            colIndex
                          )
                        }
                        options={edgebands.map((edgeband) => ({
                          value: edgeband.code,
                          label: edgeband.code,
                        }))}
                        styles={{
                          control: (styles) => ({
                            ...styles,
                            width: "100%",
                            height: "100%",
                          }),
                          menu: (styles) => ({
                            ...styles,
                            zIndex: 999,
                          }),
                        }}
                      />
                    ) : colIndex === 5 ? (
                      // Grain column with react-select
                      <Select
                        className="grain-column"
                        value={{ value: cell, label: cell }}
                        onChange={(selectedOption) =>
                          handleCellChange(
                            selectedOption.value,
                            rowIndex,
                            colIndex
                          )
                        }
                        options={grainOptions}
                        styles={{
                          control: (styles) => ({
                            ...styles,
                            width: "100%",
                            height: "100%",
                          }),
                          menu: (styles) => ({
                            ...styles,
                            zIndex: 999,
                          }),
                        }}
                      />
                    ) : colIndex === 6 ? (
                      // Job Name column (non-editable)
                      <input
                        className="job-name-column"
                        type="text"
                        value={jobName}
                        readOnly
                      />
                    ) : colIndex === 2 || colIndex === 3 ? (
                      <input
                        type="text"
                        value={cell.$numberDecimal}
                        onChange={(e) =>
                          handleCellChange(e.target.value, rowIndex, colIndex)
                        }
                      />
                    ) : (
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) =>
                          handleCellChange(e.target.value, rowIndex, colIndex)
                        }
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EditJob;
