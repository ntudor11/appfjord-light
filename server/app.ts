import express from "express";
import cors from "cors";
import { analyzeRouter } from "./routes/analyze.js";
import { sampleDataRouter } from "./routes/sampleData.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", analyzeRouter);
app.use("/api", sampleDataRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
