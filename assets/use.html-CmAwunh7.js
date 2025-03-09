import{_ as n,c as a,b as e,o as t}from"./app-BpUWo912.js";const l={};function i(p,s){return t(),a("div",null,s[0]||(s[0]=[e(`<h2 id="介绍" tabindex="-1"><a class="header-anchor" href="#介绍"><span>介绍</span></a></h2><p><a href="https://www.elastic.co/guide/en/logstash/current/introduction.html" target="_blank" rel="noopener noreferrer">logstash</a>是一个数据收集和处理的管道，可以动态的收集不同来源的数据，根据约定处理成你想要的格式。</p><h2 id="安装" tabindex="-1"><a class="header-anchor" href="#安装"><span>安装</span></a></h2><h3 id="下载执行包" tabindex="-1"><a class="header-anchor" href="#下载执行包"><span>下载执行包</span></a></h3><p>尽量选择和es同版本的包，<a href="https://www.elastic.co/downloads/past-releases#logstash" target="_blank" rel="noopener noreferrer">下载地址</a>。</p><h3 id="docker方式" tabindex="-1"><a class="header-anchor" href="#docker方式"><span>docker方式</span></a></h3><h2 id="控制台的简单示例" tabindex="-1"><a class="header-anchor" href="#控制台的简单示例"><span>控制台的简单示例</span></a></h2><p>在config文件底下创建test.conf文件，内容为：</p><div class="language-config line-numbers-mode" data-highlighter="prismjs" data-ext="config" data-title="config"><pre><code><span class="line">input {</span>
<span class="line">  stdin { }</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">output {</span>
<span class="line">stdout { }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>mac电脑执行执行./bin/logstash -f ./config/test.conf，windows自行换成bat的程序。</p><p>执行结果如下，数据收集和输出构成了logstash的最基本的组成部分。</p><p><img src="https://github.com/zzygeo/picx-images-hosting/raw/master/20241101/logstash的简单测试.2rv56f7p72.webp" alt="logstash的简单测试"></p><h2 id="从数据库收集数据" tabindex="-1"><a class="header-anchor" href="#从数据库收集数据"><span>从数据库收集数据</span></a></h2><p>在插件章节找到<a href="https://www.elastic.co/guide/en/logstash/current/plugins-inputs-jdbc.html" target="_blank" rel="noopener noreferrer">jdbc部分</a>，官网示例如下：</p><div class="language-config line-numbers-mode" data-highlighter="prismjs" data-ext="config" data-title="config"><pre><code><span class="line">input {</span>
<span class="line">  jdbc {</span>
<span class="line">    jdbc_driver_library =&gt; &quot;mysql-connector-java-5.1.36-bin.jar&quot;</span>
<span class="line">    jdbc_driver_class =&gt; &quot;com.mysql.jdbc.Driver&quot;</span>
<span class="line">    jdbc_connection_string =&gt; &quot;jdbc:mysql://localhost:3306/mydb&quot;</span>
<span class="line">    jdbc_user =&gt; &quot;mysql&quot;</span>
<span class="line">    parameters =&gt; { &quot;favorite_artist&quot; =&gt; &quot;Beethoven&quot; }</span>
<span class="line">    schedule =&gt; &quot;* * * * *&quot;</span>
<span class="line">    statement =&gt; &quot;SELECT * from songs where artist = :favorite_artist&quot;</span>
<span class="line">  }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li><p>jdbc_driver_library直接复制maven仓库的jar包就好，填写为绝对路径。</p></li><li><p>jdbc_connection_string填写为实际路径。</p></li><li><p>jdbc_user、jdbc_password按需要添加。</p></li><li><p>parameters是占位参数，好处有<strong>速度快（只需局部替换）、模板、一定的防注入能力</strong>。</p></li><li><p>schedule是一个<a href="https://zhuanlan.zhihu.com/p/437328366" target="_blank" rel="noopener noreferrer">cron表达式</a>写法。</p></li><li><p>statement决定了查询的语句，从而决定了输入哪些数据。</p></li></ul><p>下面是一个改造过后的语句。</p><div class="language-config line-numbers-mode" data-highlighter="prismjs" data-ext="config" data-title="config"><pre><code><span class="line">input {</span>
<span class="line">  jdbc {</span>
<span class="line">    jdbc_driver_library =&gt; &quot;/Users/zzy/Downloads/logstash-7.17.9/config/postgresql-42.7.2.jar&quot;</span>
<span class="line">    jdbc_driver_class =&gt; &quot;org.postgresql.Driver&quot;</span>
<span class="line">    jdbc_connection_string =&gt; &quot;jdbc:postgresql://localhost:5432/gis?currentSchema=public&quot;</span>
<span class="line">    jdbc_user =&gt; &quot;zzygeo&quot;</span>
<span class="line">    jdbc_password =&gt; &quot;****&quot;</span>
<span class="line">    schedule =&gt; &quot;*/5 * * * * *&quot;</span>
<span class="line">    statement =&gt; &quot;select * from my_user where update_time &gt; :sql_last_value and update_time &lt; now() order by update_time asc&quot;</span>
<span class="line">    use_column_value =&gt; true</span>
<span class="line">    tracking_column =&gt; &quot;update_time&quot;</span>
<span class="line">    tracking_column_type =&gt; &quot;timestamp&quot;</span>
<span class="line">    jdbc_default_timezone =&gt; &quot;Asia/Shanghai&quot;</span>
<span class="line">  }</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">output {</span>
<span class="line">  stdout { }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>变化的点有以下：</p><p>statement变成了查询最后一次更新时间以后的数据，这里的:sql_last_value也是占位的写法，它跟use_column_value、tracking_column_type、tracking_column_type强相关，分别决定了是否采用占位的值、依据哪列及列类型。</p><p>因此务必按时间升序来查询，这个占位的值取得是上次查询的数据的最后一行（即最后一次更新时间），这个值陪持久在data/plugin/**底下。如下图：</p><p><img src="https://github.com/zzygeo/picx-images-hosting/raw/master/20241101/last_update_time存储.1sf1tcphlk.webp" alt="last_update_time存储"></p><h2 id="输出数据到elasticsearch" tabindex="-1"><a class="header-anchor" href="#输出数据到elasticsearch"><span>输出数据到elasticsearch</span></a></h2><div class="language-config line-numbers-mode" data-highlighter="prismjs" data-ext="config" data-title="config"><pre><code><span class="line">output {</span>
<span class="line">  stdout { }</span>
<span class="line"></span>
<span class="line">  elasticsearch {</span>
<span class="line">    hosts =&gt; &quot;http://localhost:9200&quot;</span>
<span class="line">    index =&gt; &quot;sys_user&quot; # 决定了document的索引</span>
<span class="line">    document_id =&gt; &quot;%{id}&quot; # 采用什么作为数据id，这里取的是查询到的数据的id字段</span>
<span class="line">  }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="filter" tabindex="-1"><a class="header-anchor" href="#filter"><span>filter</span></a></h2><p>在conf里配置filter用来对数据进行过滤处理，以下是一个示例配置：</p><div class="language-config line-numbers-mode" data-highlighter="prismjs" data-ext="config" data-title="config"><pre><code><span class="line">filter {</span>
<span class="line">    mutate {</span>
<span class="line">        rename =&gt; {</span>
<span class="line">            &quot;update_time&quot; =&gt; &quot;updateTime&quot; # 对查询出来的数据改名（比如数据库命名不规范的时候）</span>
<span class="line">        }</span>
<span class="line">        remove_filed =&gt; [&quot;password&quot;] # 删除一些字段，删除的字段不会被同步到es里</span>
<span class="line">    }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="常见的使用场景" tabindex="-1"><a class="header-anchor" href="#常见的使用场景"><span>常见的使用场景</span></a></h2><h3 id="多个jdbc参数" tabindex="-1"><a class="header-anchor" href="#多个jdbc参数"><span>多个jdbc参数</span></a></h3><p>在同步数据到es里的时候，可能会出现读取多个表的数据，通过处理以后写入到一个document的需求。下面展示了通过设置type、判断type来实现这一需求到示例。</p><div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json" data-title="json"><pre><code><span class="line">input <span class="token punctuation">{</span></span>
<span class="line">  jdbc <span class="token punctuation">{</span></span>
<span class="line">    jdbc_driver_library =&gt; <span class="token string">&quot;/Users/zzy/Downloads/logstash-7.17.9/config/postgresql-42.7.2.jar&quot;</span></span>
<span class="line">    jdbc_driver_class =&gt; <span class="token string">&quot;org.postgresql.Driver&quot;</span></span>
<span class="line">    jdbc_connection_string =&gt; <span class="token string">&quot;jdbc:postgresql://localhost:5432/gis?currentSchema=public&quot;</span></span>
<span class="line">    jdbc_user =&gt; <span class="token string">&quot;zzygeo&quot;</span></span>
<span class="line">    jdbc_password =&gt; <span class="token string">&quot;***&quot;</span></span>
<span class="line">    schedule =&gt; <span class="token string">&quot;*/30 * * * * *&quot;</span></span>
<span class="line">    statement =&gt; <span class="token string">&quot;select id, name, level, nstr, ST_AsText(coordinates) as coordinates, update_time from country where update_time &gt; :sql_last_value and update_time &lt; now() order by update_time asc, id asc&quot;</span></span>
<span class="line">    jdbc_paging_enabled =&gt; <span class="token boolean">true</span></span>
<span class="line">    jdbc_page_size =&gt; <span class="token number">1000</span></span>
<span class="line">    use_column_value =&gt; <span class="token boolean">true</span></span>
<span class="line">    tracking_column =&gt; <span class="token string">&quot;update_time&quot;</span></span>
<span class="line">    tracking_column_type =&gt; <span class="token string">&quot;timestamp&quot;</span></span>
<span class="line">    jdbc_default_timezone =&gt; <span class="token string">&quot;Asia/Shanghai&quot;</span></span>
<span class="line">    last_run_metadata_path =&gt; <span class="token string">&quot;/Users/zzy/Downloads/logstash-7.17.9/data/plugins/inputs/jdbc/country_date&quot;</span></span>
<span class="line">    type =&gt; <span class="token string">&quot;country&quot;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">input <span class="token punctuation">{</span></span>
<span class="line">  jdbc <span class="token punctuation">{</span></span>
<span class="line">    jdbc_driver_library =&gt; <span class="token string">&quot;/Users/zzy/Downloads/logstash-7.17.9/config/postgresql-42.7.2.jar&quot;</span></span>
<span class="line">    jdbc_driver_class =&gt; <span class="token string">&quot;org.postgresql.Driver&quot;</span></span>
<span class="line">    jdbc_connection_string =&gt; <span class="token string">&quot;jdbc:postgresql://localhost:5432/gis?currentSchema=public&amp;timezone=Asia/Shanghai&quot;</span></span>
<span class="line">    jdbc_user =&gt; <span class="token string">&quot;zzygeo&quot;</span></span>
<span class="line">    jdbc_password =&gt; <span class="token string">&quot;***&quot;</span></span>
<span class="line">    schedule =&gt; <span class="token string">&quot;*/30 * * * * *&quot;</span></span>
<span class="line">    statement =&gt; <span class="token string">&quot;select id, name as nstr, ST_AsText(coordinates) as coordinates, village as name, update_time from system_point where update_time &gt; :sql_last_value and update_time &lt; now() order by update_time asc, id asc&quot;</span></span>
<span class="line">    jdbc_paging_enabled =&gt; <span class="token boolean">true</span></span>
<span class="line">    jdbc_page_size =&gt; <span class="token number">10000</span></span>
<span class="line">    use_column_value =&gt; <span class="token boolean">true</span></span>
<span class="line">    tracking_column =&gt; <span class="token string">&quot;update_time&quot;</span></span>
<span class="line">    tracking_column_type =&gt; <span class="token string">&quot;timestamp&quot;</span></span>
<span class="line">    jdbc_default_timezone =&gt; <span class="token string">&quot;Asia/Shanghai&quot;</span></span>
<span class="line">    last_run_metadata_path =&gt; <span class="token string">&quot;/Users/zzy/Downloads/logstash-7.17.9/data/plugins/inputs/jdbc/point_date&quot;</span></span>
<span class="line">    type =&gt; <span class="token string">&quot;system_point&quot;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">filter <span class="token punctuation">{</span></span>
<span class="line">  if <span class="token punctuation">[</span>type<span class="token punctuation">]</span> == <span class="token string">&quot;system_point&quot;</span> <span class="token punctuation">{</span></span>
<span class="line">    mutate <span class="token punctuation">{</span></span>
<span class="line">      add_field =&gt; <span class="token punctuation">[</span><span class="token string">&quot;level&quot;</span><span class="token punctuation">,</span> <span class="token number">3</span><span class="token punctuation">]</span></span>
<span class="line">      add_field =&gt; <span class="token punctuation">[</span><span class="token string">&quot;combine_id&quot;</span><span class="token punctuation">,</span> <span class="token string">&quot;system_point:%{id}&quot;</span><span class="token punctuation">]</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line">  <span class="token punctuation">}</span> else if <span class="token punctuation">[</span>type<span class="token punctuation">]</span> == <span class="token string">&quot;country&quot;</span> <span class="token punctuation">{</span></span>
<span class="line">    mutate <span class="token punctuation">{</span></span>
<span class="line">      add_field =&gt; <span class="token punctuation">[</span><span class="token string">&quot;combine_id&quot;</span><span class="token punctuation">,</span> <span class="token string">&quot;country:%{id}&quot;</span><span class="token punctuation">]</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line">  </span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">output <span class="token punctuation">{</span></span>
<span class="line">  elasticsearch <span class="token punctuation">{</span></span>
<span class="line">    hosts =&gt; <span class="token string">&quot;http://localhost:9200&quot;</span></span>
<span class="line">    index =&gt; <span class="token string">&quot;point&quot;</span></span>
<span class="line">    document_id =&gt; <span class="token string">&quot;%{combine_id}&quot;</span></span>
<span class="line">    template =&gt; <span class="token string">&quot;/Users/zzy/Downloads/logstash-7.17.9/config/test.json&quot;</span></span>
<span class="line">    template_name =&gt; <span class="token string">&quot;point_template&quot;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在上面的示例里，给每个jdbc增加了type属性用来区分表信息，在filter部分，对聚合以后的document id也进行了区分</p><h3 id="分页参数的使用" tabindex="-1"><a class="header-anchor" href="#分页参数的使用"><span>分页参数的使用</span></a></h3><p>当在jdbc里设置jdbc_paging_enabled =&gt; true以后，会开启分页查询，jdbc_page_size表示limit的参数，如果不填会给默认值。</p><p>jdbc插件的分页，实际上是将sql语句当成了子查询语句，然后再使用limit * offset *的写法对数据进行过滤，切忌排序的时候<strong>不仅要按时间排序，还要按主健id</strong>（碰见过一种情况，updateTime是后来加的字段，表里有很多数据是同一个时间的，这样去分页查询的时候可能会查询出之前页面出现的数据，最终导致导入es的数据条数变少了）。</p><h3 id="时区的问题" tabindex="-1"><a class="header-anchor" href="#时区的问题"><span>时区的问题</span></a></h3><p>在logstash的里jdbc_default_timezone是对sql语句查询出来的时间进行转换的，<strong>默认会将时间转换为utc时间</strong>，所以一定要理解当前通过jdbc语句查询出来的时间到底是什么时区的。</p><p>这里以mysql jdbc和postgres jdbc来举例：</p><p>mysql的jdbc有<strong>serverTimezone</strong>参数，由于timestamp存的是时间戳，并不知道时区信息，如果不指定这个参数，会使用和客户端一样的时区进行数据转换。比如客户端使用东八区，那么该连接的时区也被设置为东八区，<strong>当指定了该参数，比如UTC时区，而jvm设置的时区为东八区的时候，查询出来的时间会从被认为utc时间并被转换为东八区的时间。</strong></p><p>pg的jdbc没有这样的参数，pg可以存储<strong>timestampz</strong>的时间戳，会携带时区信息，当查询这样的时间的时候，会<strong>根据jvm的时区自动对服务器查询出来的数据进行转换</strong>（在logstash的例子里，如果启动logstash的jvm设置的是utc时间，而jdbc插件配置里的时区写的是东八区的话，写入本地文件的时间进行一次从东八区到utc的转换，导致时间少了8小时）</p><p><strong>因为这个原因，我在数据同步的时候查询出来的时间总是比数据的最大时间大8个小时，导致每次定时任务都往es里写入大量的数据，cpu一直居高不下，因此生产环境对待时区问题一定要谨慎并且测试。</strong></p><h3 id="显式的指定mapping" tabindex="-1"><a class="header-anchor" href="#显式的指定mapping"><span>显式的指定mapping</span></a></h3><p>在output的es插件里，通过指定template参数和template_name可以显示的创建document模板，如下：</p><div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json" data-title="json"><pre><code><span class="line">output <span class="token punctuation">{</span></span>
<span class="line">  elasticsearch <span class="token punctuation">{</span></span>
<span class="line">    hosts =&gt; <span class="token string">&quot;http://localhost:9200&quot;</span></span>
<span class="line">    index =&gt; <span class="token string">&quot;point&quot;</span></span>
<span class="line">    document_id =&gt; <span class="token string">&quot;%{combine_id}&quot;</span></span>
<span class="line">    template =&gt; <span class="token string">&quot;/Users/zzy/Downloads/logstash-7.17.9/config/test.json&quot;</span></span>
<span class="line">    template_name =&gt; <span class="token string">&quot;point_template&quot;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>template示例（指定了索引名称，mapping，分词规则，扫描文档的间隔）：</p><div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json" data-title="json"><pre><code><span class="line"><span class="token punctuation">{</span></span>
<span class="line">    <span class="token property">&quot;index_patterns&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span></span>
<span class="line">        <span class="token string">&quot;point&quot;</span> </span>
<span class="line">    <span class="token punctuation">]</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">&quot;settings&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token property">&quot;analysis&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">            <span class="token property">&quot;analyzer&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">                <span class="token property">&quot;location_name&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">                    <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;custom&quot;</span><span class="token punctuation">,</span></span>
<span class="line">                    <span class="token property">&quot;tokenizer&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ik_max_word&quot;</span></span>
<span class="line">                <span class="token punctuation">}</span></span>
<span class="line">            <span class="token punctuation">}</span></span>
<span class="line">        <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token property">&quot;index&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">            <span class="token property">&quot;refresh_interval&quot;</span><span class="token operator">:</span> <span class="token string">&quot;15s&quot;</span></span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">&quot;mappings&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token property">&quot;properties&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">            <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">                <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;text&quot;</span><span class="token punctuation">,</span></span>
<span class="line">                <span class="token property">&quot;analyzer&quot;</span><span class="token operator">:</span> <span class="token string">&quot;location_name&quot;</span></span>
<span class="line">            <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token property">&quot;nstr&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">                <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;text&quot;</span><span class="token punctuation">,</span></span>
<span class="line">                <span class="token property">&quot;analyzer&quot;</span><span class="token operator">:</span> <span class="token string">&quot;location_name&quot;</span></span>
<span class="line">            <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">                <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;integer&quot;</span></span>
<span class="line">            <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token property">&quot;level&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">                <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;integer&quot;</span></span>
<span class="line">            <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token property">&quot;coordinates&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">                <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;keyword&quot;</span></span>
<span class="line">            <span class="token punctuation">}</span></span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,46)]))}const o=n(l,[["render",i],["__file","use.html.vue"]]),u=JSON.parse('{"path":"/java/logstash/use.html","title":"","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"介绍","slug":"介绍","link":"#介绍","children":[]},{"level":2,"title":"安装","slug":"安装","link":"#安装","children":[{"level":3,"title":"下载执行包","slug":"下载执行包","link":"#下载执行包","children":[]},{"level":3,"title":"docker方式","slug":"docker方式","link":"#docker方式","children":[]}]},{"level":2,"title":"控制台的简单示例","slug":"控制台的简单示例","link":"#控制台的简单示例","children":[]},{"level":2,"title":"从数据库收集数据","slug":"从数据库收集数据","link":"#从数据库收集数据","children":[]},{"level":2,"title":"输出数据到elasticsearch","slug":"输出数据到elasticsearch","link":"#输出数据到elasticsearch","children":[]},{"level":2,"title":"filter","slug":"filter","link":"#filter","children":[]},{"level":2,"title":"常见的使用场景","slug":"常见的使用场景","link":"#常见的使用场景","children":[{"level":3,"title":"多个jdbc参数","slug":"多个jdbc参数","link":"#多个jdbc参数","children":[]},{"level":3,"title":"分页参数的使用","slug":"分页参数的使用","link":"#分页参数的使用","children":[]},{"level":3,"title":"时区的问题","slug":"时区的问题","link":"#时区的问题","children":[]},{"level":3,"title":"显式的指定mapping","slug":"显式的指定mapping","link":"#显式的指定mapping","children":[]}]}],"git":{"updatedTime":1731389313000,"contributors":[{"name":"zhongyan.zhou","email":"zhongyan.zhou@eulee.cn","commits":1,"url":"https://github.com/zhongyan.zhou"}]},"filePathRelative":"java/logstash/use.md"}');export{o as comp,u as data};
