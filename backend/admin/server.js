const express = require("express");
const cors = require("cors");

require("dotenv").config({
  path: "../../.env"
});

const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    realtime: {
      transport: WebSocket
    }
  }
);

// Test route
app.get("/", (req, res) => {
  res.send("V Marketing Backend is running!");
});

// Get contacts
app.get("/contacts", async (req, res) => {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});