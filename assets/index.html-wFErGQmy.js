import{_ as e,c as n,b as a,o as l}from"./app-D_mwDqhu.js";const i={};function t(d,s){return l(),n("div",null,s[0]||(s[0]=[a(`<h2 id="介绍" tabindex="-1"><a class="header-anchor" href="#介绍"><span>介绍</span></a></h2><p>这两天搞了个台小主机，千把米还是很香的，打电话给运营商说家里有ipv4地址，所以趁着周末搭建了个服务器用哈哈。</p><h2 id="docker配置代理" tabindex="-1"><a class="header-anchor" href="#docker配置代理"><span>docker配置代理</span></a></h2><p>docker必备技能哈哈，先来个代理吧，不然用起来着急。</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line"># 创建配置文件</span>
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
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="ssh连接时代理远程地址" tabindex="-1"><a class="header-anchor" href="#ssh连接时代理远程地址"><span>ssh连接时代理远程地址</span></a></h3><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">ssh -L 8080:192.168.22.1:80 user@your_home_server_ip</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div>`,13)]))}const c=e(i,[["render",t],["__file","index.html.vue"]]),p=JSON.parse('{"path":"/server/","title":"","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"介绍","slug":"介绍","link":"#介绍","children":[]},{"level":2,"title":"docker配置代理","slug":"docker配置代理","link":"#docker配置代理","children":[]},{"level":2,"title":"配置clash开启自启","slug":"配置clash开启自启","link":"#配置clash开启自启","children":[{"level":3,"title":"ssh连接时代理远程地址","slug":"ssh连接时代理远程地址","link":"#ssh连接时代理远程地址","children":[]}]}],"git":{"updatedTime":1732010728000,"contributors":[{"name":"zhongyan.zhou","email":"zhongyan.zhou@eulee.cn","commits":1,"url":"https://github.com/zhongyan.zhou"}]},"filePathRelative":"server/index.md"}');export{c as comp,p as data};
