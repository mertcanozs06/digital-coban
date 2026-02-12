import express from "express";

const router = express.Router();

// test endpoint
router.get("/", (req, res) => {
  res.json([
    {
      id: 1,
      name: "Kuzey Merası",
      lat: 39.9208,
      lng: 32.8541
    },
    {
      id: 2,
      name: "Güney Merası",
      lat: 39.9300,
      lng: 32.8600
    }
  ]);
});

export default router;
