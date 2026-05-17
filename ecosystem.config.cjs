module.exports = {
  apps: [{
    name: 'http-backend',
    script: 'server.js',
    cwd: '/root/htpgame',  // 修改为你服务器上的实际路径
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
