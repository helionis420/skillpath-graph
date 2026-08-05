import { probeDatabase } from "./db/probe.js";
import { config } from "./config.js";

const uri = config.cognodb.uri;
if (!uri) {
  console.error("COGNODB_URI is not set");
  process.exit(1);
}

probeDatabase(uri).then((result) => {
  console.log(JSON.stringify(result, null, 2));
});
