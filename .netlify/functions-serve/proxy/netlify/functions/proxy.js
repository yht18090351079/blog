// netlify/functions/proxy.js
exports.handler = async (event, context) => {
  const { httpMethod, path, headers, body } = event;
  const apiPath = path.replace("/.netlify/functions/proxy", "");
  const apiUrl = `https://open.feishu.cn${apiPath}`;
  console.log("Proxying request to:", apiUrl);
  try {
    const requestOptions = {
      method: httpMethod,
      headers: {
        "Authorization": headers.authorization || headers.Authorization,
        "Content-Type": headers["content-type"] || "application/json"
      }
    };
    if (httpMethod === "POST" || httpMethod === "PUT") {
      requestOptions.body = body;
    }
    const response = await fetch(apiUrl, requestOptions);
    const data = await response.text();
    const contentType = response.headers.get("content-type");
    let responseBody = data;
    if (contentType && contentType.startsWith("image/")) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      responseBody = `data:${contentType};base64,${base64}`;
    } else {
      try {
        JSON.parse(data);
        responseBody = data;
      } catch (e) {
        responseBody = data;
      }
    }
    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Content-Type": contentType || "application/json"
      },
      body: responseBody
    };
  } catch (error) {
    console.error("Proxy error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Proxy error",
        message: error.message
      })
    };
  }
};
//# sourceMappingURL=proxy.js.map
