@echo off
echo 正在启动飞书文档查看器开发环境...
echo.

echo [1/2] 启动CORS代理服务器...
start "CORS Proxy" cmd /k "node cors-proxy.js"

echo [2/2] 等待代理服务器启动...
timeout /t 3 /nobreak >nul

echo [3/3] 启动HTTP服务器...
start "HTTP Server" cmd /k "python -m http.server 8000"

echo [4/4] 等待HTTP服务器启动...
timeout /t 3 /nobreak >nul

echo.
echo 开发环境启动完成！
echo.
echo CORS代理服务器: http://localhost:8080
echo 网站地址: http://localhost:8000
echo.
echo 正在打开浏览器...
start http://localhost:8000

echo.
echo 按任意键关闭所有服务器...
pause >nul

echo 正在关闭服务器...
taskkill /f /im python.exe 2>nul
taskkill /f /im node.exe 2>nul
echo 服务器已关闭。 