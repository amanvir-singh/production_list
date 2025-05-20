const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const mongoose = require("mongoose");

const { schemas } = require("../createModels");

const JobList = mongoose.model("joblists", schemas.jobListSchema, "joblists");

// Create
router.post("/add", async (req, res) => {
  try {
    const jobList = new JobList(req.body);
    await jobList.save();
    res.status(201).json(jobList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all (non-archived)
router.get("/", async (req, res) => {
  try {
    const jobLists = await JobList.find({ archived: false });
    res.json(jobLists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read all archived
router.get("/archived", async (req, res) => {
  try {
    const archivedLists = await JobList.find({ archived: true });
    res.json(archivedLists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read one
router.get("/:id", async (req, res) => {
  try {
    const jobList = await JobList.findById(req.params.id);
    if (!jobList)
      return res.status(404).json({ message: "Job List not found" });
    res.json(jobList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const jobList = await JobList.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!jobList)
      return res.status(404).json({ message: "Job List not found" });
    res.json(jobList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Archive
router.patch("/:id/archive", async (req, res) => {
  try {
    const jobList = await JobList.findByIdAndUpdate(
      req.params.id,
      { archived: true },
      { new: true }
    );
    if (!jobList)
      return res.status(404).json({ message: "Job List not found" });
    res.json(jobList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Unarchive
router.patch("/:id/unarchive", async (req, res) => {
  try {
    const jobList = await JobList.findByIdAndUpdate(
      req.params.id,
      { archived: false },
      { new: true }
    );
    if (!jobList)
      return res.status(404).json({ message: "Job List not found" });
    res.json(jobList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const jobList = await JobList.findByIdAndDelete(req.params.id);
    if (!jobList)
      return res.status(404).json({ message: "Job List not found" });
    res.json({ message: "Job List deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create-ptx", async (req, res) => {
  try {
    const { filename, job, user } = req.body;

    if (!filename || !job) {
      return res.status(400).send("Filename and job data are required");
    }

    const currentTime = moment().format("YYYY-MM-DD hh:mm:ss A");

    let fileContent = [];

    const header = `JOBS,1,${filename.slice(0, -4)},${filename.slice(
      0,
      -4
    )},${currentTime},${currentTime},Customer,0,,,,,`;
    fileContent.push(header);

    const distinctMaterials = [
      ...new Set(job.partlist.map((part) => part.material)),
    ];

    const materialIndexMap = {};
    distinctMaterials.forEach((material, index) => {
      const materialsLine = `MATERIALS,1,${
        index + 1
      },${material},${material},1,3,0,0,0,0,0,0,0,0,0,4,1,1,1`;
      //fileContent.push(materialsLine);
      materialIndexMap[material] = index + 1;
    });

    // PARTS_REQ lines (for each part in job)
    job.partlist.forEach((part, index) => {
      const materialNumber = materialIndexMap[part.material] || 1;

      const partReqLine = `PARTS_REQ,1,${index + 1},${
        part.partname
      },${materialNumber},${part.length?.$numberDecimal},${
        part.width?.$numberDecimal
      },${part.quantity},0,0,${getGrainValue(part.grain)},1`;

      fileContent.push(partReqLine);
    });

    // PARTS_UDI lines (for each part in job)
    job.partlist.forEach((part, index) => {
      const partUdiLine = `PARTS_UDI,1,${index + 1},${job.jobName},${
        job.jobName
      },,${job.jobName},,,,,,,,${part.material},,${part.EL ? part.EL : ""},${
        part.ER ? part.ER : ""
      },${part.ET ? part.ET : ""},${part.EB ? part.EB : ""},${part.partname},${
        part.length?.$numberDecimal
      },${part.width?.$numberDecimal},${part.length?.$numberDecimal},${
        part.width?.$numberDecimal
      },,,,,0,B1,${part.partcomment},${part.itemnumber},,,${
        part.material
      },,,,,,,,,,,,,,,,,,,,,,,,,,,`;

      fileContent.push(partUdiLine);
    });

    distinctMaterials.forEach((material, index) => {
      const materialsLine = `MATERIALS,1,${
        index + 1
      },${material},${material},1,3,0,0,0,0,0,0,0,0,0,4,1,1,1`;
      fileContent.push(materialsLine);
    });

    const dirPath = "H:/PTX";
    const filePath = path.join(dirPath, `${filename}`);

    fs.writeFileSync(filePath, fileContent.join("\n"), "utf8");

    // Update the job document in the database
    await JobList.findByIdAndUpdate(
      job._id,
      {
        Addedto: filename,
        Addedby: user,
        archived: true,
      },
      { new: true }
    );

    // Respond to client
    res.status(200).send({
      message: "File created successfully!",
      filename: `${filename}.ptx`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating PTX file");
  }
});

const getGrainValue = (grain) => {
  switch (grain) {
    case "None":
      return 0;
    case "Length":
      return 1;
    case "Width":
      return 2;
    default:
      return 1;
  }
};

module.exports = router;
