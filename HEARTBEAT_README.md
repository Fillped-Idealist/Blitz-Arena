# 心跳监控系统使用说明

## 概述

这个心跳监控系统会定期向5000端口发送请求，保持沙盒会话活跃，防止超时重启。

## 脚本说明

### 1. heartbeat.sh - 心跳主脚本
- **功能**：每30分钟向5000端口发送一次请求
- **自动恢复**：如果服务无响应，尝试重启服务
- **日志记录**：所有心跳记录保存在 `/tmp/heartbeat.log`

### 2. check-heartbeat.sh - 状态检查脚本
- **功能**：查看心跳脚本运行状态和最近日志
- **使用方法**：`./check-heartbeat.sh`

### 3. stop-heartbeat.sh - 停止脚本
- **功能**：停止心跳监控
- **使用方法**：`./stop-heartbeat.sh`

## 使用方法

### 启动心跳监控
```bash
nohup /workspace/projects/heartbeat.sh > /tmp/heartbeat-output.log 2>&1 &
```

### 检查心跳状态
```bash
/workspace/projects/check-heartbeat.sh
```

### 停止心跳监控
```bash
/workspace/projects/stop-heartbeat.sh
```

### 查看完整日志
```bash
cat /tmp/heartbeat.log
```

### 实时监控日志
```bash
tail -f /tmp/heartbeat.log
```

## 配置参数

在 `heartbeat.sh` 中可以修改以下参数：

```bash
HEARTBEAT_INTERVAL=1800  # 心跳间隔（秒），默认30分钟
PORT=5000                # 监控端口
LOG_FILE="/tmp/heartbeat.log"  # 日志文件路径
```

## 当前状态

- ✅ 心跳脚本已启动
- ✅ 进程ID: 10947
- ✅ 5000端口响应正常 (HTTP 200)
- ✅ 日志文件: `/tmp/heartbeat.log`

## 注意事项

1. 心跳脚本会持续运行，直到手动停止或沙盒重启
2. 每次心跳都会记录时间戳和HTTP状态码
3. 如果服务意外停止，脚本会尝试自动重启
4. 建议定期检查心跳状态，确保系统正常运行

## 故障排除

### 如果心跳脚本停止运行
1. 检查进程：`ps aux | grep heartbeat`
2. 查看错误日志：`cat /tmp/heartbeat-output.log`
3. 重新启动：`nohup /workspace/projects/heartbeat.sh > /tmp/heartbeat-output.log 2>&1 &`

### 如果5000端口无响应
1. 检查服务状态：`curl -I http://localhost:5000`
2. 手动重启服务：`coze dev`
3. 查看Next.js日志：`cat /tmp/dev-restart.log`
