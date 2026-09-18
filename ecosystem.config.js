module.exports = {
  apps: [
    {
      name: 'home-nas-engine',
      script: '/usr/local/bin/filebrowser',
      args: '-d /root/filebrowser.db',
      cwd: '/root',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      env: {
        PORT: '8080'
      }
    },
    {
      name: 'home-nas-gateway',
      script: 'index.js',
      cwd: '/root/android-home-nas/server',
      interpreter: 'node',
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        ENGINE_PORT: 8080
      }
    },
    {
      name: 'tunnel',
      script: '/usr/local/bin/cloudflared',
      args: 'tunnel --url http://localhost:3000 run bhair-ubuntu',
      cwd: '/root',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '100M'
    },
    {
      name: 'RedisDB',
      script: '/bin/redis-server',
      args: '*:6379',
      cwd: '/root',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '50M'
    }
  ]
};
