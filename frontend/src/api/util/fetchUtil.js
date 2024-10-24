import { config } from "../../config";
import { ValueCheckerUtil } from "./valueCheckerUtil";

const BASE_URL = config.API_URL;
const GET = "GET";
const POST = "POST";
const DELETE = "DELETE";
const PUT = "PUT";
const APPLICATION_JSON = "application/json";
const MUTIPLEFILE = "multipart/form-data"

export class FetchUtil {
  static async getPromise(url, requestOptions, data) {
    if (data && typeof data === "object") {
      url += `?${this.objectToRequestParams(data)}`;
    }
    return await fetch(`${BASE_URL}${url}/`, requestOptions)
      .then(this.responseToJSON)
      .then(this.handleResponse);
  }

  static async getNoTokenAPI(url, data) {
    const requestOptions = {
      method: GET,
    };
    return await this.getPromise(url, requestOptions, data);
  }

  static async getAPI(url, data) {
    const requestOptions = {
      method: GET,
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    };
    return await this.getPromise(url, requestOptions, data);
  }

  static async postAPI(url, data) {
    const requestOptions = {
      method: POST,
      headers: {
        "Content-Type": APPLICATION_JSON,
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(this.clearObject(data)),
    };
    return await this.getPromise(url, requestOptions);
  }

  static async postFormDataAPI(url, data) {
    const requestOptions = {
      method: POST,
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: this.clearFormData(data),
    };
    return await this.getPromise(url, requestOptions);
  }

  static async postFileFormDataAPI(url, data) {
    const requestOptions = {
      method: POST,
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: data,
    };
    return await this.getPromise(url, requestOptions);
  }

  static async postFileAPI(url, data) {
    const requestOptions = {
      method: POST,
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
        "Content-Type": MUTIPLEFILE
      },
      body: JSON.stringify(data)
    };
    return await this.getPromise(url, requestOptions);
  }

  static async putAPI(url, data) {
    const requestOptions = {
      method: PUT,
      headers: {
        "Content-Type": APPLICATION_JSON,
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(this.clearObject(data)),
    };
    return await this.getPromise(url, requestOptions);
  }

  static async putFileFormDataAPI(url, data) {
    const requestOptions = {
      method: PUT,
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: data,
    };
    return await this.getPromise(url, requestOptions);
  }

  static async deleteAPI(url) {
    const requestOptions = {
      method: DELETE,
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    };
    return await this.getPromise(url, requestOptions);
  }

  static async deleteHasData(url, data) {
    const requestOptions = {
      method: DELETE,
      body: JSON.stringify(this.clearObject(data)),
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    };
    return await this.getPromise(url, requestOptions);
  }

  static async exportExcelFileGET(url, data) {
    if (data && typeof data === "object") {
      url += `?${this.arrayObjectToRequestParams(data)}`;
    }
    const requestOptions = {
      method: GET,
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      responseType: "arraybuffer",
    };
    return await fetch(`${BASE_URL}${url}`, requestOptions).then(
      this.responseToBlob
    );
  }

  static async exportExcelFile(url, data) {
    const requestOptions = {
      method: POST,
      headers: {
        "Content-Type": APPLICATION_JSON,
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(this.clearObject(data)),
    };
    return await fetch(`${BASE_URL}${url}`, requestOptions).then(
      this.responseToBlob
    );
  }

  static objectToRequestParams(object) {
    var paramsStringArray = [];
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        paramsStringArray.push(
          encodeURIComponent(key) + "=" + encodeURIComponent(object[key])
        );
      }
    }
    return paramsStringArray.join("&");
  }

  static arrayObjectToRequestParams(object) {
    var paramsStringArray = [];
    for (var index in object) {
      if (object.hasOwnProperty(index)) {
        for (var key in object[index]) {
          if (object[index].hasOwnProperty(key)) {
            paramsStringArray.push(
              encodeURIComponent(key) +
              "=" +
              encodeURIComponent(object[index][key])
            );
          }
        }
      }
    }
    return paramsStringArray.join("&");
  }

  static responseToJSON(response) {
    return response.json();
  }

  static responseToBlob(response) {
    return response.blob();
  }

  static handleResponse(response) {
    if (response.code === "token_not_valid") {
      alert('token已經過期，請重新登入')
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('is_superuser');
      localStorage.removeItem('is_staff');
      localStorage.removeItem('is_login');
      localStorage.removeItem('avatar');
      window.location.href = "/login";
      return;
    }
    
    if (response.status) {
      return {
        message: response.message,
        data: response.data,
      };
    } else {
      throw new Error(response.message);
    }
  }

  static clearObject(object) {
    Object.keys(object).forEach((key) => {
      if (
        ValueCheckerUtil.isUndefinedOrNull(object[key]) ||
        ValueCheckerUtil.isEmpty(object[key])
      ) {
        delete object[key];
      }
    });
    return object;
  }

  static clearFormData(formData) {
    for (const key of formData.keys()) {
      const value = formData.get(key);
      if (
        ValueCheckerUtil.isUndefinedOrNull(value) ||
        ValueCheckerUtil.isEmpty(value)
      ) {
        if (value instanceof File) {
          continue;
        }
        formData.delete(key);
      }
    }
    return formData;
  }
}
