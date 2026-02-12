import express from "express";

const router = express.Router();

// test endpoint
router.get("/", (req, res) => {
  res.json([
    { id: 1, name: "İnek 1" },
    { id: 2, name: "İnek 2" }
  ]);
});

export default router;
