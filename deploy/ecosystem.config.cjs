/** PM2 app for the TI Water API. Migrations run in the deploy script, not here. */
module.exports = {
  apps: [
    {
      name: 'tiwater-api',
      cwd: '/var/www/tiwater/TI_water_api',
      script: 'src/index.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
