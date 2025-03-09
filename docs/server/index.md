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

### clash的config配置

```text
# 切记配置密码
secret: your-secret
```

### ssh连接时代理远程地址

```text
ssh -L 8080:192.168.22.1:80 user@your_home_server_ip
```

## ubuntu-server配置网络

安装的时候务必插上网线，先采用dhcp分配地址，如果没有条件则使用手机线连接主机提供网络。

### 安装依赖

安装必要的网络依赖:
- network-manager - 网络管理工具
- wpasupplicant - 提供对 WPA 加密的支持
- wireless-tools - 提供 iwconfig、iwlist 等无线网络配置工具

```text
sudo apt install network-manager wpasupplicant wireless-tools
```

使用`ip a`查看网络，正常应该可以看到以太网和wifi模块。

如果没有看到列出无线网卡，除硬件故常或接触不良外，还可能是因为无线网卡未启动。可以尝试使用如下命令将其启动：

```text
sudo ifconfig wlan0 up  # 启动名为 wlan0 的网络设备
```

### 扫描无线网

```text
sudo iwlist wlan0 scan  # 注意将 wlan0 换成实际无线网卡的设备名
# 如果太多信息造成干扰，可以使用 Linux 的 grep 命令对输出信息进行筛选，例如：
sudo iwlist wlan0 scan | grep ESSID  # 仅查看 Wi-Fi 名称
sudo iwlist wlan0 scan | grep -E "Quality|ESSID"  # 查看 Wi-Fi 名称和网络质量
```

## 安装mysql

```text
# 先更新apt包
sudo apt update

# 查看mysql-server
sudo apt search mysql-server

# 安装
sudo apt install -y mysql-server

# 启动mysql
sudo systemctl start mysql

# 设置为开启自启
sudo systemctl enable mysql

# 修改默认的配置文件/etc/mysql/mysql.conf.d/mysqld.cnf

# 如果mysql不认识时区，执行
mysql_tzinfo_to_sql /usr/share/zoneinfo | mysql -u root -p
```
