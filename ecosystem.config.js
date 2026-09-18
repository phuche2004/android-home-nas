module.exports = {
  apps: [
    {
      name: 'home-nas',
      script: '/usr/local/bin/filebrowser',
      args: '-d /root/filebrowser.db',
      cwd: '/root',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      env: {
        NODE_ENV: 'production'
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
