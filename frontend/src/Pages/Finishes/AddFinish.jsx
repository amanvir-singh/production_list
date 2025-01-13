/* eslint-disable no-unused-vars */
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/Finishes/FinishForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const AddFinish = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/finishes/add`, {
        name,
        code,
      });
      navigate("/manage/finishesList");
    } catch (error) {
      console.error("Error adding finish:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while adding the finish."
      );
    }
  };

  const canAddFinish =
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "Inventory Associate" ||
    user.role === "admin";

  return (
    <div>
      <ErrorModal
        message={backendError}
        onClose={() => setBackendError("")}
        show={!!backendError}
      />
      <div className="finish-form">
        <h1>Add Finish</h1>
        {canAddFinish ? (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                required
              />
            </div>
            <button type="submit">Add Finish</button>
          </form>
        ) : (
          "You do not have permission to add a Finish. Please contact an administrator for assistance."
        )}
      </div>
    </div>
  );
};

export default AddFinish;
