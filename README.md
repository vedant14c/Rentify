# Rentify

## Local development

The recommended development workflow starts both application servers with the
project launcher:

```cmd
cd /d D:\Rentify
start-dev.cmd
```

This starts:

- Spring Boot backend at <http://localhost:8080> in a separate PowerShell window
- React/Vite frontend at <http://localhost:5173> in the current terminal

Open <http://localhost:5173> to use the development frontend. Normal
frontend/backend development does not require a frontend build, `dist`
synchronization, or Maven packaging.