/* eslint-disable no-unused-vars */
import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import "../../css/TLFInventoryFixer/TLFInventoryFixerForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const AddTLFInventoryFixer = () => {
  const [boardCode, setBoardCode] = useState(null);
  const [qtyToFix, setQtyToFix] = useState("");
  const [inventoryData, setInventoryData] = useState([]);
  const [backendError, setBackendError] = useState("");
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const canAddInventoryFixer = user.role === "Editor" || user.role === "admin";

  const fetchTLFInventory = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/TLFInventory`
      );
      const boards = response.data[0]?.boards || [];
      setInventoryData(
        boards.map((board) => ({
          value: board.BoardCode,
          label: board.BoardCode,
        }))
      );
    } catch (error) {
      console.error("Error fetching TLF Inventory data:", error);
      setErrorModalOpen(true);
    }
  };

  useEffect(() => {
    fetchTLFInventory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!boardCode) {
      setBackendError("Board Code is required.");
      return;
    }
    try {
      const tlfinventoryFixerData = {
        BoardCode: boardCode.value,
        QtytoFix: qtyToFix,
      };

      // Add the TLF Inventory Fixer
      const response = await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/tlfinventoryfixer/add`,
        tlfinventoryFixerData
      );

      // Log the action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Added TLF Inventory Fixer: ${boardCode.value}`,
        updatedData: tlfinventoryFixerData,
      });

      navigate("/manage/tlfInventoryFixerList");
    } catch (error) {
      console.error("Error adding TLF Inventory Fixer:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while adding the TLF Inventory Fixer."
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
      <div className="tlf-inventory-fixer-form">
        <h1>Add TLF Inventory Fixer</h1>
        {canAddInventoryFixer ? (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="boardCode">Board Code:</label>
              <Select
                id="boardCode"
                options={inventoryData}
                value={boardCode}
                onChange={setBoardCode}
                placeholder="Select Board Code"
                isSearchable
                className="react-select__control"
                required
              />
            </div>
            <div>
              <label htmlFor="qtyToFix">Quantity to Fix:</label>
              <input
                type="number"
                id="qtyToFix"
                value={qtyToFix}
                onChange={(e) => setQtyToFix(e.target.value)}
                required
              />
            </div>
            <button type="submit">Add TLF Inventory Fixer</button>
          </form>
        ) : (
          "You do not have permission to add a TLF Inventory Fixer. Please contact an administrator for assistance."
        )}
      </div>
    </div>
  );
};

export default AddTLFInventoryFixer;
