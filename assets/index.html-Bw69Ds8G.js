import{_ as n,c as a,b as e,o as t}from"./app-R1Ke_g-1.js";const p={};function i(l,s){return t(),a("div",null,s[0]||(s[0]=[e(`<h2 id="时间统一" tabindex="-1"><a class="header-anchor" href="#时间统一"><span>时间统一</span></a></h2><p><strong>在一个地球上，尽管人处于不同的时区，但是所对应的时刻是一致的</strong>，采用的标准是utc（协调世界时，Coordinated Universal Time）是一种时间标准，它是国际时间标准，用于在全球范围内进行时间同步。UTC是由国际电信联盟（ITU）定义的，并由世界时间标准机构（BIPM）进行维护。</p><p>因此时间统一就是在此基础上进行建立的。</p><h2 id="jdbc-postgres的时区设置" tabindex="-1"><a class="header-anchor" href="#jdbc-postgres的时区设置"><span>jdbc postgres的时区设置</span></a></h2><p>服务器时区：在数据库的配置文件里可以设置时区，会影响select now()、CURRENT_TIMESTAMP等函数的时间。</p><p>客户端时区：在java里就是jvm里设置的时区，当然网页前给用户看的时区也叫客户端时区。</p><p>时间不统一的问题就是服务器时区和客户端时区不一致导致的，比如执行定时任务，定时任务查询数据库，在java代码里又写了比较的时间，结果一个是0区时间，对比的却是8区时间，当然就会有问题。</p><p>再比如，网页接受用户时间的时候，客户在东八区，他理解时间是东八区的，结果服务器是直接按照utc时间存的，结果存入的时间大了8小时。</p><p>在pg里，不管数据库设置的是什么时区，存入的都是时间戳。当设置时间类型为timestampz，jdbc会自动根据jvm设置的时区进行时间转换，测试例子如下：</p><div class="language-java line-numbers-mode" data-highlighter="prismjs" data-ext="java" data-title="java"><pre><code><span class="line"><span class="token annotation punctuation">@Test</span></span>
<span class="line"><span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">test</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span><span class="token punctuation">{</span></span>
<span class="line">    <span class="token class-name">Connection</span> connection <span class="token operator">=</span> <span class="token class-name">DriverManager</span><span class="token punctuation">.</span><span class="token function">getConnection</span><span class="token punctuation">(</span><span class="token string">&quot;jdbc:postgresql://localhost:5432/gis?currentSchema=public&quot;</span><span class="token punctuation">,</span> <span class="token constant">USERNAME</span><span class="token punctuation">,</span> <span class="token constant">PASSWORD</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token class-name">ResultSet</span> resultSet <span class="token operator">=</span> connection<span class="token punctuation">.</span><span class="token function">createStatement</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">executeQuery</span><span class="token punctuation">(</span><span class="token string">&quot;select * from public.my_user&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">while</span> <span class="token punctuation">(</span>resultSet<span class="token punctuation">.</span><span class="token function">next</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">{</span></span>
<span class="line">        <span class="token class-name">String</span> updateTime <span class="token operator">=</span> resultSet<span class="token punctuation">.</span><span class="token function">getString</span><span class="token punctuation">(</span><span class="token string">&quot;update_time&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span>updateTime<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>结果如下：</p><p><img src="https://raw.githubusercontent.com/zzygeo/picx-images-hosting/master/postgres0时区.83a25idev7.webp" alt="postgres0时区"></p><p>当我使用东八区，结果如下：</p><p><img src="https://github.com/zzygeo/picx-images-hosting/raw/master/postgres8时区.4jo4fpcpv5.webp" alt="postgres8时区"></p><p>因此在使用postgres的时候，时间类型尽量<strong>使用timestampz，这样设置好jvm的时区时区</strong>转换就ok了。</p><h2 id="jdbc-mysql时区的问题" tabindex="-1"><a class="header-anchor" href="#jdbc-mysql时区的问题"><span>jdbc mysql时区的问题</span></a></h2><p>在mysql里，一般使用timestamp来存储数据，存储的是时间戳信息，以UTC时间为标准。</p><p>当插入时自动添加时间、更新时添加时间时，需要设置current_timestamp，这时要保证mysql数据库设置的时区为Asia/Shanghai。</p><p><strong>jdbc mysql的serverTimezone设置会指定mysql服务器的时区，当查询数据到达客户端（java端）会和jvm设置的时区进行比较然后进行转换。</strong></p><p>当设置serverTimeZone=Asia/Shanghai时，jdbc参数和查询的结果如下：</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">url: jdbc:mysql://localhost:3306/test_template?serverTimezone=Asia/Shanghai</span>
<span class="line"></span>
<span class="line">&quot;createTime&quot;: &quot;2024-09-08 17:55:47&quot;,</span>
<span class="line">&quot;updateTime&quot;: &quot;2024-09-08 17:55:47&quot;,</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>当设置serverTimeZone=UTC时，jdbc参数和查询的结果如下：</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">url: jdbc:mysql://localhost:3306/test_template?serverTimezone=UTC</span>
<span class="line"></span>
<span class="line">&quot;createTime&quot;: &quot;2024-09-09 01:55:47&quot;,</span>
<span class="line">&quot;updateTime&quot;: &quot;2024-09-09 01:55:47&quot;,</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里将原本+8的时间当作了utc时间，因此在转换的时候时间自然就变大了8小时。</p><p><strong>因此对于mysql，通过连接时配置数据库server的时区，并通过两时区的对比，返回正确的客户端时区的时间。</strong></p>`,25)]))}const o=n(p,[["render",i],["__file","index.html.vue"]]),u=JSON.parse('{"path":"/java/timezone/","title":"","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"时间统一","slug":"时间统一","link":"#时间统一","children":[]},{"level":2,"title":"jdbc postgres的时区设置","slug":"jdbc-postgres的时区设置","link":"#jdbc-postgres的时区设置","children":[]},{"level":2,"title":"jdbc mysql时区的问题","slug":"jdbc-mysql时区的问题","link":"#jdbc-mysql时区的问题","children":[]}],"git":{"updatedTime":1731634388000,"contributors":[{"name":"zhongyan.zhou","email":"zhongyan.zhou@eulee.cn","commits":2,"url":"https://github.com/zhongyan.zhou"}]},"filePathRelative":"java/timezone/index.md"}');export{o as comp,u as data};