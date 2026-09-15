import "dotenv/config";
import { createApp } from "./app";

const port = Number(process.env.PORT || 3000);

createApp().listen(port, () => {
  console.log(`Week 1 API listening on port ${port}`);
});
