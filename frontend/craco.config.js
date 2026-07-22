// craco.config.js
const path = require("path");
require("dotenv").config();

// Environment variable overrides
const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

let webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // CRA's source-map-loader follows vendor sourcemaps into node_modules and can
      // throw ENOENT (e.g. react-is/index.js when the package isn't hoisted / uses exports).
      for (const rule of webpackConfig.module.rules) {
        if (
          rule &&
          rule.enforce === "pre" &&
          rule.loader &&
          String(rule.loader).includes("source-map-loader")
        ) {
          const prev = rule.exclude;
          rule.exclude = [
            ...(Array.isArray(prev) ? prev : prev != null ? [prev] : []),
            /node_modules/,
          ];
          break;
        }
      }

      // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
        ],
      };

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }
      return webpackConfig;
    },
  },
};

webpackConfig.devServer = (devServerConfig) => {
  // Ignore stale WDS_SOCKET_PORT=443 (HTTPS preview setups). Use the browser's page origin for HMR WS.
  devServerConfig.client = {
    ...(devServerConfig.client || {}),
    webSocketURL: "auto://0.0.0.0:0/ws",
  };

  // Default to local FastAPI when REACT_APP_API_PROXY_TARGET is unset (avoids 502/500 from a broken remote API during dev).
  const proxyTarget =
    process.env.REACT_APP_API_PROXY_TARGET?.trim() ||
    process.env.REACT_APP_BACKEND_URL?.trim() ||
    "http://127.0.0.1:8000";
  /** Set REACT_APP_API_PROXY_INSECURE_SSL=true only if upstream uses invalid/self-signed TLS. */
  const proxySecure = process.env.REACT_APP_API_PROXY_INSECURE_SSL !== "true";
  devServerConfig.proxy = {
    ...(typeof devServerConfig.proxy === "object" &&
    devServerConfig.proxy != null &&
    !Array.isArray(devServerConfig.proxy)
      ? devServerConfig.proxy
      : {}),
    "/api": {
      target: proxyTarget,
      changeOrigin: true,
      secure: proxySecure,
      xfwd: true,
      cookieDomainRewrite: "",
      cookiePathRewrite: "/",
      onProxyReq(proxyReq) {
        try {
          const u = new URL(proxyTarget);
          proxyReq.setHeader("X-Forwarded-Proto", u.protocol.replace(":", ""));
          proxyReq.setHeader("X-Forwarded-Host", u.hostname);
        } catch {
          /* ignore */
        }
      },
    },
  };

  // Add health check endpoints if enabled
  if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // Call original setup if exists
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }

      // Setup health endpoints
      setupHealthEndpoints(devServer, healthPluginInstance);

      return middlewares;
    };
  }

  return devServerConfig;
};

module.exports = webpackConfig;
