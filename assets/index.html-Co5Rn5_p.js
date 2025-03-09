import{_ as e,c as n,b as a,o as l}from"./app-BpUWo912.js";const i={};function d(t,s){return l(),n("div",null,s[0]||(s[0]=[a(`<h2 id="介绍" tabindex="-1"><a class="header-anchor" href="#介绍"><span>介绍</span></a></h2><p>这两天搞了个台小主机，千把米还是很香的，打电话给运营商说家里有ipv4地址，所以趁着周末搭建了个服务器用哈哈。</p><h2 id="docker配置代理" tabindex="-1"><a class="header-anchor" href="#docker配置代理"><span>docker配置代理</span></a></h2><p>docker必备技能哈哈，先来个代理吧，不然用起来着急。</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line"># 创建配置文件</span>
<span class="line">sudo mkdir /etc/systemd/system/docker.service.d/ </span>
<span class="line">sudo vim /etc/systemd/system/docker.service.d/http-proxy.conf</span>
<span class="line"></span>
<span class="line"># 写入配置</span>
<span class="line">[Service]</span>
<span class="line">Environment=&quot;HTTP_PROXY=http://your_proxy_server:proxy_port&quot;</span>
<span class="line">Environment=&quot;HTTPS_PROXY=http://your_proxy_server:proxy_port&quot;</span>
<span class="line"></span>
<span class="line"># 重启服务</span>
<span class="line">sudo systemctl daemon-reload</span>
<span class="line">sudo systemctl restart docker</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="配置clash开启自启" tabindex="-1"><a class="header-anchor" href="#配置clash开启自启"><span>配置clash开启自启</span></a></h2><p>懂得都懂。</p><p>在/etc/systemd/system下创建clash.service文件，写入以下配置。</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">[Unit]</span>
<span class="line">Description=Clash Daemon</span>
<span class="line">Documentation=https://github.com/Dreamacro/clash</span>
<span class="line">After=network.target</span>
<span class="line"></span>
<span class="line">[Service]</span>
<span class="line">User=nobody</span>
<span class="line">Type=simple</span>
<span class="line">ExecStart=/home/zzy/clash/clash -d /home/zzy/clash</span>
<span class="line">Restart=on-failure</span>
<span class="line">RestartSec=5</span>
<span class="line"></span>
<span class="line">[Install]</span>
<span class="line">WantedBy=multi-user.target	</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>启动并设置开机自启</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">sudo systemctl daemon-reload</span>
<span class="line">sudo systemctl enable clash</span>
<span class="line">sudo systemctl start clash</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="clash的config配置" tabindex="-1"><a class="header-anchor" href="#clash的config配置"><span>clash的config配置</span></a></h3><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line"># 切记配置密码</span>
<span class="line">secret: your-secret</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="ssh连接时代理远程地址" tabindex="-1"><a class="header-anchor" href="#ssh连接时代理远程地址"><span>ssh连接时代理远程地址</span></a></h3><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">ssh -L 8080:192.168.22.1:80 user@your_home_server_ip</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><h2 id="ubuntu-server配置网络" tabindex="-1"><a class="header-anchor" href="#ubuntu-server配置网络"><span>ubuntu-server配置网络</span></a></h2><p>安装的时候务必插上网线，先采用dhcp分配地址，如果没有条件则使用手机线连接主机提供网络。</p><h3 id="安装依赖" tabindex="-1"><a class="header-anchor" href="#安装依赖"><span>安装依赖</span></a></h3><p>安装必要的网络依赖:</p><ul><li>network-manager - 网络管理工具</li><li>wpasupplicant - 提供对 WPA 加密的支持</li><li>wireless-tools - 提供 iwconfig、iwlist 等无线网络配置工具</li></ul><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">sudo apt install network-manager wpasupplicant wireless-tools</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>使用<code>ip a</code>查看网络，正常应该可以看到以太网和wifi模块。</p><p>如果没有看到列出无线网卡，除硬件故常或接触不良外，还可能是因为无线网卡未启动。可以尝试使用如下命令将其启动：</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">sudo ifconfig wlan0 up  # 启动名为 wlan0 的网络设备</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><h3 id="扫描无线网" tabindex="-1"><a class="header-anchor" href="#扫描无线网"><span>扫描无线网</span></a></h3><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">sudo iwlist wlan0 scan  # 注意将 wlan0 换成实际无线网卡的设备名</span>
<span class="line"># 如果太多信息造成干扰，可以使用 Linux 的 grep 命令对输出信息进行筛选，例如：</span>
<span class="line">sudo iwlist wlan0 scan | grep ESSID  # 仅查看 Wi-Fi 名称</span>
<span class="line">sudo iwlist wlan0 scan | grep -E &quot;Quality|ESSID&quot;  # 查看 Wi-Fi 名称和网络质量</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="安装mysql" tabindex="-1"><a class="header-anchor" href="#安装mysql"><span>安装mysql</span></a></h2><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line"># 先更新apt包</span>
<span class="line">sudo apt update</span>
<span class="line"></span>
<span class="line"># 查看mysql-server</span>
<span class="line">sudo apt search mysql-server</span>
<span class="line"></span>
<span class="line"># 安装</span>
<span class="line">sudo apt install -y mysql-server</span>
<span class="line"></span>
<span class="line"># 启动mysql</span>
<span class="line">sudo systemctl start mysql</span>
<span class="line"></span>
<span class="line"># 设置为开启自启</span>
<span class="line">sudo systemctl enable mysql</span>
<span class="line"></span>
<span class="line"># 修改默认的配置文件/etc/mysql/mysql.conf.d/mysqld.cnf</span>
<span class="line"></span>
<span class="line"># 如果mysql不认识时区，执行</span>
<span class="line">mysql_tzinfo_to_sql /usr/share/zoneinfo | mysql -u root -p</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,28)]))}const c=e(i,[["render",d],["__file","index.html.vue"]]),p=JSON.parse('{"path":"/server/","title":"","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"介绍","slug":"介绍","link":"#介绍","children":[]},{"level":2,"title":"docker配置代理","slug":"docker配置代理","link":"#docker配置代理","children":[]},{"level":2,"title":"配置clash开启自启","slug":"配置clash开启自启","link":"#配置clash开启自启","children":[{"level":3,"title":"clash的config配置","slug":"clash的config配置","link":"#clash的config配置","children":[]},{"level":3,"title":"ssh连接时代理远程地址","slug":"ssh连接时代理远程地址","link":"#ssh连接时代理远程地址","children":[]}]},{"level":2,"title":"ubuntu-server配置网络","slug":"ubuntu-server配置网络","link":"#ubuntu-server配置网络","children":[{"level":3,"title":"安装依赖","slug":"安装依赖","link":"#安装依赖","children":[]},{"level":3,"title":"扫描无线网","slug":"扫描无线网","link":"#扫描无线网","children":[]}]},{"level":2,"title":"安装mysql","slug":"安装mysql","link":"#安装mysql","children":[]}],"git":{"updatedTime":1741520286000,"contributors":[{"name":"zzy","email":"zzy_geo@163.com","commits":1,"url":"https://github.com/zzy"},{"name":"zhongyan.zhou","email":"zhongyan.zhou@eulee.cn","commits":2,"url":"https://github.com/zhongyan.zhou"}]},"filePathRelative":"server/index.md"}');export{c as comp,p as data};
