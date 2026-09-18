const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const supabase = require("./config/supabase");

const app = express();
const servicesFile = path.join(__dirname, "services-data.json");

function readServices() {
  return JSON.parse(fs.readFileSync(servicesFile, "utf8"));
}

function writeServices(services) {
  fs.writeFileSync(servicesFile, JSON.stringify(services, null, 2));
}


// ===============================
// Middleware
// ===============================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ===============================
// Frontend
// ===============================

app.use(express.static(path.join(__dirname, "frontend")));


// ===============================
// Admin Panel
// ===============================

app.use(
  "/admin",
  express.static(path.join(__dirname, "backend", "admin"))
);


// ===============================
// Home Page
// ===============================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "home.html"));
});


// ===============================
// Health Check
// ===============================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "V Marketing API is running!"
  });
});


// ===============================
// Setup Status
// ===============================

app.get("/api/setup-status", async (req, res) => {

  const { error } = await supabase
    .from("inquiries")
    .select("id")
    .limit(1);

  res.json({
    success: true,

    databaseConfigured: Boolean(
      process.env.SUPABASE_URL &&
      (
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SECRET_KEY
      )
    ),

    inquiriesTableReady: !error,

    message: error
      ? "Run supabase/schema.sql in the Supabase SQL Editor"
      : "Project setup is complete"
  });

});


// ===============================
// GET ALL INQUIRIES
// ===============================

app.get("/api/inquiries", async (req, res) => {

  try {

    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});


// ===============================
// CREATE INQUIRY
// ===============================

app.post("/api/inquiries", async (req, res) => {

  try {

    const {
      name,
      email,
      business,
      service,
      budget,
      goals
    } = req.body;


    // Validation

    if (!name || !email || !goals) {

      return res.status(400).json({
        success: false,
        message: "Name, email and goals are required"
      });

    }


    // Insert into Supabase

    const { data, error } = await supabase
      .from("inquiries")
      .insert([
        {
          name,
          email,
          business,
          service,
          budget,
          goals,
          status: "new"
        }
      ])
      .select();


    if (error) {

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }


    res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully!",
      data: data
    });


  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});


// ===============================
// UPDATE INQUIRY STATUS
// ===============================

app.patch("/api/inquiries/:id", async (req, res) => {

  const { status } = req.body;

  const allowedStatuses = [
    "new",
    "contacted",
    "closed"
  ];


  if (!allowedStatuses.includes(status)) {

    return res.status(400).json({
      success: false,
      message: "Invalid inquiry status"
    });

  }


  const { data, error } = await supabase
    .from("inquiries")
    .update({
      status: status
    })
    .eq("id", req.params.id)
    .select()
    .single();


  if (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }


  res.json({
    success: true,
    data: data
  });

});


// ===============================
// DELETE INQUIRY
// ===============================

app.delete("/api/inquiries/:id", async (req, res) => {

  const { error } = await supabase
    .from("inquiries")
    .delete()
    .eq("id", req.params.id);


  if (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }


  res.json({
    success: true,
    message: "Inquiry deleted successfully"
  });

});


// ===============================
// ADMIN LOGIN
// ===============================

app.post("/api/admin/login", (req, res) => {

  const {
    email,
    password
  } = req.body;


  if (
    !process.env.ADMIN_EMAIL ||
    !process.env.ADMIN_PASSWORD
  ) {

    return res.status(503).json({
      success: false,
      message: "Admin credentials are not configured on the server"
    });

  }


  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {

    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });

  }


  res.json({
    success: true,
    message: "Login successful"
  });

});


// ===============================
// START SERVER
// ===============================


app.get("/api/services", async (req, res) => {
  res.json({ success: true, data: readServices() });
});

app.post("/api/services", async (req, res) => {
  const { name, description, icon = "✦", status = "active" } = req.body;
  if (!name || !description || !["active", "inactive"].includes(status)) {
    return res.status(400).json({ success: false, message: "Name, description and valid status are required" });
  }

  const services = readServices();
  const data = { id: Date.now(), name, description, icon, status };
  services.push(data);
  writeServices(services);
  res.status(201).json({ success: true, data });
});

app.patch("/api/services/:id", async (req, res) => {
  const { name, description, icon = "✦", status } = req.body;
  if (!name || !description || !["active", "inactive"].includes(status)) {
    return res.status(400).json({ success: false, message: "Name, description and valid status are required" });
  }

  const services = readServices();
  const index = services.findIndex(service => String(service.id) === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Service not found" });
  services[index] = { ...services[index], name, description, icon, status };
  writeServices(services);
  res.json({ success: true, data: services[index] });
});

app.delete("/api/services/:id", async (req, res) => {
  const services = readServices();
  const filtered = services.filter(service => String(service.id) !== req.params.id);
  if (filtered.length === services.length) return res.status(404).json({ success: false, message: "Service not found" });
  writeServices(filtered);
  res.json({ success: true, message: "Service deleted successfully" });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `V Marketing server running on http://localhost:${PORT}`
    );
  });
}

module.exports = app;