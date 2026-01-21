import axios from "axios";

class MyApi {
  /**
   * @param {Object} options
   * @param {string} options.baseUrl   Base URL of your backend (e.g. http://localhost:2800/v1)
   */
  constructor({ baseUrl } = {}) {
    if (!baseUrl) {
      throw new Error("MyApi: `baseUrl` is required");
    }
    this.baseUrl = baseUrl.replace(/\/+$/, "");

    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this._accessToken = null;
  }

  async login({ apiKey, secret }) {
    if (!apiKey || !secret) {
      throw new Error("login: both `apiKey` and `secret` are required");
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-api-secret": secret,
      },
    };
    const response = await this.http.get("/merchant/get-merchant", config);

    // console.log("res", response.data.data.keyCombo);

    const { keyCombo } = response.data.data.data;

    if (!keyCombo) {
      throw new Error("Auth response missing `accessToken`");
    }

    this._accessToken = keyCombo;
    this.http.defaults.headers["x-api-key-combo"] = keyCombo;

    return response.data;
  }
  async _request(path, { method = "GET", data = null, params = null } = {}) {
    if (!this._accessToken) {
      throw new Error(
        "Attempted API call before login – call `login()` first."
      );
    }

    const config = {
      url: path,
      method,
      params,
    };

    if (data) {
      config.data = data;
    }

    const resp = await this.http.request(config);
    return resp.data;
  }

  /* ------------------------------------------------------------------
   *  Example endpoint wrappers – replace / adapt to your real API routes
   * ------------------------------------------------------------------ */

  /** GET /users/:id */
  getPermissions() {
    return this._request(`/keys/get-key-permissions`);
  }

  /** POST /users   (payload: { name, email, … }) */
  createUser(payload) {
    return this._request("/users", { method: "POST", data: payload });
  }

  /** PUT /users/:id   (payload: partial user fields) */
  updateUser(id, payload) {
    return this._request(`/users/${encodeURIComponent(id)}`, {
      method: "PUT",
      data: payload,
    });
  }

  /** DELETE /users/:id */
  deleteUser(id) {
    return this._request(`/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  /** GET /orders?status=… */
  listOrders(query = {}) {
    return this._request("/orders", { params: query });
  }

  /** POST /orders   (payload: order object) */
  createOrder(order) {
    return this._request("/orders", { method: "POST", data: order });
  }

  // ------------------------------------------------------------------- //
  // Add more methods that correspond to your backend routes here.
  // ------------------------------------------------------------------- //
}

/* ---------------------------------------------------------------------
 * Export formats (ESM & CommonJS)
 * --------------------------------------------------------------------- */
export { MyApi };

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  // CommonJS fallback for older Node projects
  module.exports = { MyApi };
}
