const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { spawn } = require("child_process");
const { readFileSync } = require("fs");
const PNG = require("pngjs").PNG;
const rgbaToZ64 = require("zpl-image").rgbaToZ64;
const axios = require("axios");
const sharp = require("sharp");
const net = require("net");

const TARGET_DIR = "\\\\10.101.60.1\\d\\control\\m60-c1\\data\\cnc\\mp4";
//const TARGET_DIR = "H:\\mp4_dump";
const WMF_IMAGE_DIR = "H:\\Part Pictures";

const EXCLUDED_FOLDERS = [
  "00__MPR_BACK",
  "00_After_Saw",
  "mpr-parts",
  "Models3d",
];

const PRINTER_IP = "192.168.78.207";
const PRINTER_PORT = 9100;

const ZPL_TEMPLATE = readFileSync(
  path.join(__dirname, "..", "static", "ZPL_Template.txt"),
  "utf-8"
);

async function imagePathToZPLBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);

  const resizedBuffer = await sharp(imageBuffer)
    .resize({
      width: 160,
      height: 160,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  const png = PNG.sync.read(resizedBuffer);
  const res = rgbaToZ64(png.data, png.width, { black: 53 });

  return `^GFA,${res.length},${res.length},${res.rowlen},${res.z64}`;
}

async function imageToZPLBase64(imageUrl) {
  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  const resizedBuffer = await sharp(response.data)
    .resize({
      width: 197,
      height: 197,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  const png = PNG.sync.read(resizedBuffer);
  const res = rgbaToZ64(png.data, png.width, { black: 53 });

  return `^GFA,${res.length},${res.length},${res.rowlen},${res.z64}`;
}

async function generateZPL(labelData, partImage) {
  let zpl = ZPL_TEMPLATE;

  const fields = {
    Job_Name: labelData.Job_Name,
    Work_Order_Name: labelData.Work_Order_Name,
    Edge_Top: labelData.Edge_Top,
    Edge_Bottom: labelData.Edge_Bottom,
    Edge_Left: labelData.Edge_Left,
    Edge_Right: labelData.Edge_Right,
    Item_No: labelData.itemNumber,
    Part_Name: labelData.partName,
    Material_Code: labelData.material,
    Length: labelData.size.split(" x ")[0],
    Width: labelData.size.split(" x ")[1],
    Note: labelData.Note || "",
    Back_Machining: labelData.Back_Machining,
    Side_Machining: labelData.Side_Machining,
    Rotation: labelData.rotation,
    Part_ID: labelData.cutritePartId,
  };

  for (const [key, value] of Object.entries(fields)) {
    zpl = zpl.replaceAll(`{{${key}}}`, value || "");
  }

  const barcodeImagePath = path.join(
    "H:/Data_Matrix",
    `${labelData.cutritePartId}_0.png`
  );

  const partImageZPL = await imageToZPLBase64(partImage);
  const barcodeImageZPL = await imagePathToZPLBase64(barcodeImagePath);

  zpl = zpl.replace("{Part_Image}", partImageZPL || "");
  zpl = zpl.replace("{Barcode_Image}", barcodeImageZPL || "");

  return zpl;
}

const getAllMPRFiles = (dirPath, filesList = []) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    const folderNamesInPath = fullPath.toLowerCase().split(path.sep);
    const shouldSkip = EXCLUDED_FOLDERS.some((excludedFolder) =>
      folderNamesInPath.includes(excludedFolder.toLowerCase())
    );

    if (entry.isDirectory()) {
      if (shouldSkip) {
        continue;
      }

      // Recurse into subfolders if not skipped
      getAllMPRFiles(fullPath, filesList);
    } else if (entry.isFile() && fullPath.toLowerCase().endsWith(".mpr")) {
      filesList.push({
        name: entry.name,
        fullPath,
        relativePath: path.relative(TARGET_DIR, fullPath),
      });
    }
  }

  filesList.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  return filesList;
};

router.get("/mprfiles", (req, res) => {
  try {
    // Check if directory is accessible
    if (!fs.existsSync(TARGET_DIR)) {
      return res.status(404).json({
        error:
          "Shared directory not found. The host machine may be offline or unreachable.",
      });
    }

    fs.access(TARGET_DIR, fs.constants.R_OK, (err) => {
      if (err) {
        return res.status(403).json({
          error:
            "Access to the shared directory is denied. It may be offline or credentials may be required.",
        });
      }

      try {
        const files = getAllMPRFiles(TARGET_DIR);
        return res.json(files);
      } catch (scanError) {
        console.error("Error scanning directory:", scanError);
        return res.status(500).json({ error: "Failed to scan the directory." });
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Unexpected server error." });
  }
});

router.get("/label-images/:partId", (req, res) => {
  const partId = req.params.partId;
  const safeFileName = path.basename(partId); // Prevent path traversal
  const filePath = path.join(WMF_IMAGE_DIR, `${safeFileName}.wmf`);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send("Image not found");
    }

    res.setHeader("Content-Type", "image/png");

    const magick = spawn("magick", [filePath, "png:-"]);

    magick.stdout.pipe(res);
    magick.stderr.on("data", (data) => {
      console.error(`magick stderr: ${data}`);
    });

    magick.on("error", (error) => {
      console.error(`Failed to start magick process: ${error}`);
      res.status(500).send("Image conversion error");
    });

    magick.on("close", (code) => {
      if (code !== 0) {
        console.error(`magick process exited with code ${code}`);
      }
    });
  });
});

const deriveGroupBase = (mprFileName) => {
  const parts = mprFileName.split("_");
  if (parts.length < 4) return null;
  const base = `${parts[0]}_${parts[1]}_${parts[2]}_${parts[3].slice(0, 2)}`;
  return base;
};

router.get("/label-data/:fileName", (req, res) => {
  const { fileName } = req.params;
  const base = deriveGroupBase(fileName);
  if (!base) {
    return res.status(400).json({ error: "Invalid MPR file name format" });
  }

  // Build file paths
  const dir = findContainingFolder(TARGET_DIR, fileName);
  if (!dir) return res.status(404).json({ error: "MPR folder not found." });
  const folderName = path.basename(dir);

  const csvPath = path.join(dir, `${folderName}.csv`);
  const pnxPath = path.join(dir, `${folderName}.pnx`);
  const mprPath = path.join(dir, fileName);

  if (!fs.existsSync(csvPath) || !fs.existsSync(pnxPath)) {
    return res
      .status(404)
      .json({ error: "Required CSV or PNX file not found." });
  }

  try {
    const csvLines = fs
      .readFileSync(csvPath, "utf-8")
      .split(/\r?\n/)
      .filter(Boolean);
    const matchingCsvRows = csvLines.filter((line) => {
      const cols = line.split(";");
      return (
        cols[2].includes(fileName) && cols[28] && !cols[28].includes("REST")
      );
    });

    const partRefs = matchingCsvRows.map((line) => {
      const cols = line.split(";");
      const cutriteId = path.basename(cols[28], ".mpr");
      return {
        cutritePartId: cutriteId,
        rotation: cols[19],
      };
    });

    const pnxLines = fs.readFileSync(pnxPath, "utf-8").split(/\r?\n/).slice(3);

    const result = partRefs
      .map((ref, index) => {
        const match = pnxLines.find((line) => line.includes(ref.cutritePartId));
        if (!match) return null;

        const parts = match.split(",");

        return {
          id: index + 1,
          Job_Name: parts[13],
          Work_Order_Name: parts[15],
          Edge_Top: parts[27],
          Edge_Bottom: parts[28],
          Edge_Left: parts[25],
          Edge_Right: parts[26],
          itemNumber: parts[41],
          partName: parts[29],
          partId: parts[19].replace(/\.wmf$/i, ""),
          cutritePartId: ref.cutritePartId,
          size: `${parts[33]} x ${parts[32]}`,
          material: parts[47],
          Note: parts[40],
          Back_Machining: parts[35] ? parts[35] : "NA",
          Side_Machining: parts[34] ? parts[34] : "NA",
          rotation: Math.trunc(ref.rotation),
        };
      })
      .filter(Boolean);

    return res.json(result);
  } catch (err) {
    console.error("Error parsing files:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Helper to find the folder where the .mpr file exists
function findContainingFolder(startPath, fileName) {
  const entries = fs.readdirSync(startPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(startPath, entry.name);
    if (entry.isDirectory()) {
      const found = findContainingFolder(fullPath, fileName);
      if (found) return found;
    } else if (entry.isFile() && entry.name === fileName) {
      return startPath;
    }
  }

  return null;
}

router.post("/print-label", async (req, res) => {
  try {
    const { labelData, partImage } = req.body;

    const zplCode = await generateZPL(labelData, partImage);

    res.status(200).json({ zplCode });
  } catch (err) {
    console.error("Failed to generate ZPL", err);
    res.status(500).send("Failed to generate ZPL");
  }
});

router.post("/print-label-batch", async (req, res) => {
  try {
    const { labels } = req.body;

    if (!Array.isArray(labels)) {
      return res.status(400).send("Invalid request format.");
    }

    const zplList = [];

    for (const item of labels) {
      const zpl = await generateZPL(item.labelData, item.partImage);
      zplList.push(zpl);
    }

    const combinedZPL = zplList.join("\n");

    res.status(200).json({ zplCode: combinedZPL });
  } catch (err) {
    console.error("Batch ZPL generation failed", err);
    res.status(500).send("Batch ZPL generation failed");
  }
});

router.post("/print-label-tcp", (req, res) => {
  const { zplCode } = req.body;

  if (!zplCode) {
    return res.status(400).json({ error: "ZPL content is required" });
  }

  const client = new net.Socket();

  client.connect(PRINTER_PORT, PRINTER_IP, () => {
    client.write(zplCode, () => {
      client.end();
      console.log("Data sent to printer");
      res.json({ message: "Label sent to printer" });
    });
  });

  client.on("error", (err) => {
    console.error("Printer connection error:", err.message);
    res.status(500).json({ error: "Failed to print: " + err.message });
  });

  client.on("timeout", () => {
    console.error("Printer connection timed out");
    client.destroy();
    res.status(504).json({ error: "Printer connection timed out" });
  });
});

module.exports = router;
