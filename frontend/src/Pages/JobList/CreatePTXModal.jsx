import { useEffect, useState } from "react";
import axios from "axios";
import "../../css/JobList/CreatePTXModal.scss";

const CreatePTXModal = ({
  isOpen,
  onClose,
  onCreatePTX,
  jobName,
  job,
  user,
}) => {
  const [ptxName, setPtxName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [isFileCreated, setIsFileCreated] = useState(false);

  useEffect(() => {
    const formattedJobName = jobName.replace(/\s+/g, "_");
    setPtxName(formattedJobName);
  }, [jobName]);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      // Send request to backend to create PTX
      const response = await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/joblist/create-ptx`,
        { filename: `${ptxName}.ptx`, job: job, user: user }
      );
      if (response.status === 200) {
        setMessage("File created successfully!");
        setIsFileCreated(true); // Mark the file as created
      }
    } catch (error) {
      setMessage("Error creating PTX file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOnclose = () => {
    setMessage("");
    setIsFileCreated(false); // Reset file created state when modal closes
    onClose();
  };

  return (
    isOpen && (
      <div className="ptx-modal">
        <div className="ptx-modal-content">
          <h2>Create PTX</h2>
          <p>This will generate the PTX file named:</p>
          <div className="ptx-name-container">
            <input
              type="text"
              value={ptxName}
              onChange={(e) => setPtxName(e.target.value)}
              disabled={isFileCreated} // Disable input when file is created
            />
            <span>.ptx</span>
          </div>
          <div>
            {!isFileCreated && (
              <>
                <button onClick={handleOnclose}>Cancel</button>
                <button onClick={handleProcess} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Process"}
                </button>
              </>
            )}

            {isFileCreated && <button onClick={handleOnclose}>OK</button>}
          </div>
          {message && <p>{message}</p>}
        </div>
      </div>
    )
  );
};

export default CreatePTXModal;
