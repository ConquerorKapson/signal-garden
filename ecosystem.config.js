// PM2 Ecosystem Config for Signal Garden
// Docs: https://pm2.keymetrics.io/docs/usage/application-declaration/
module.exports = {
  apps: [
    {
      name: "signal-garden",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/home/ubuntu/signal-garden",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Restart if memory exceeds 512MB
      max_memory_restart: "512M",
      // Restart on file changes (disabled in prod)
      watch: false,
      // Log configuration
      error_file: "/home/ubuntu/.pm2/logs/signal-garden-error.log",
      out_file: "/home/ubuntu/.pm2/logs/signal-garden-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Graceful restart
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
