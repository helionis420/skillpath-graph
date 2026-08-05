import serverless from "serverless-http";
import { createApp } from "../server/src/app.js";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const app = createApp();
const handler = serverless(app);

export default handler;
