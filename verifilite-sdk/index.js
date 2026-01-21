import { MyApi } from "./sdk.js";

const api = new MyApi({ baseUrl: "http://localhost:2800/v1" });

api.login({ apiKey: "apiKey", secret: "secret" });

console.log(api);
