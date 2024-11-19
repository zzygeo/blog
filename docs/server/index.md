## 介绍

这两天搞了个台小主机，千把米还是很香的，打电话给运营商说家里有ipv4地址，所以趁着周末搭建了个服务器用哈哈。

## docker配置代理

docker必备技能哈哈，先来个代理吧，不然用起来着急。

```text
# 创建配置文件
sudo mkdir /etc/systemd/system/docker.service.d/ 
sudo vim /etc/systemd/system/docker.service.d/http-proxy.conf

# 写入配置
[Service]
Environment="HTTP_PROXY=http://your_proxy_server:proxy_port"
Environment="HTTPS_PROXY=http://your_proxy_server:proxy_port"

# 重启服务
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 配置clash开启自启

懂得都懂。

在/etc/systemd/system下创建clash.service文件，写入以下配置。

```
[Unit]
Description=Clash Daemon
Documentation=https://github.com/Dreamacro/clash
After=network.target

[Service]
User=nobody
Type=simple
ExecStart=/home/zzy/clash/clash -d /home/zzy/clash
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target	
```

启动并设置开机自启

```
sudo systemctl daemon-reload
sudo systemctl enable clash
sudo systemctl start clash
```

### ssh连接时代理远程地址

```text
ssh -L 8080:192.168.22.1:80 user@your_home_server_ip
```
