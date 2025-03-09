import{_ as n,c as e,b as a,o as i}from"./app-BpUWo912.js";const l={};function c(d,s){return i(),e("div",null,s[0]||(s[0]=[a(`<h2 id="拉取镜像" tabindex="-1"><a class="header-anchor" href="#拉取镜像"><span>拉取镜像</span></a></h2><p>拉取elasticsearch和kibana镜像：</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre><code><span class="line">docker pull docker.elastic.co/elasticsearch/elasticsearch:7.17.25</span>
<span class="line">docker pull docker.elastic.co/kibana/kibana:7.17.25</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="docker-compose启动" tabindex="-1"><a class="header-anchor" href="#docker-compose启动"><span>docker-compose启动</span></a></h2><p>配置elastic search</p><div class="language-docker-compose line-numbers-mode" data-highlighter="prismjs" data-ext="docker-compose" data-title="docker-compose"><pre><code><span class="line">version: &#39;3.0&#39;</span>
<span class="line"></span>
<span class="line">services:</span>
<span class="line">  es01:</span>
<span class="line">    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.25</span>
<span class="line">    ports:</span>
<span class="line">      - &quot;9200:9200&quot;</span>
<span class="line">      - &quot;9300:9300&quot;</span>
<span class="line">    container_name: es01</span>
<span class="line">    environment:</span>
<span class="line">      discovery.type: single-node</span>
<span class="line">      ES_JAVA_OPTS: &quot;-Xms512m -Xmx1024m&quot;</span>
<span class="line">    networks:</span>
<span class="line">      - elastic</span>
<span class="line"></span>
<span class="line">networks:</span>
<span class="line">  elastic:</span>
<span class="line">    name: elastic</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>配置kibana</p><div class="language-docker-compose line-numbers-mode" data-highlighter="prismjs" data-ext="docker-compose" data-title="docker-compose"><pre><code><span class="line">version: &#39;3.0&#39;</span>
<span class="line"></span>
<span class="line">services:</span>
<span class="line">  kibana:</span>
<span class="line">    image: docker.elastic.co/kibana/kibana:7.17.25</span>
<span class="line">    networks:</span>
<span class="line">      - elastic</span>
<span class="line">    ports:</span>
<span class="line">      - 5601:5601</span>
<span class="line">    environment:</span>
<span class="line">      - ELASTICSEARCH_HOSTS=http://es01:9200</span>
<span class="line"></span>
<span class="line">networks:</span>
<span class="line">  elastic:</span>
<span class="line">    external: true</span>
<span class="line"></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>打开<a href="http://localhost:5601" target="_blank" rel="noopener noreferrer">链接</a>查看kibana。</p>`,9)]))}const p=n(l,[["render",c],["__file","setup.html.vue"]]),t=JSON.parse('{"path":"/java/elasticsearch/setup.html","title":"","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"拉取镜像","slug":"拉取镜像","link":"#拉取镜像","children":[]},{"level":2,"title":"docker-compose启动","slug":"docker-compose启动","link":"#docker-compose启动","children":[]}],"git":{"updatedTime":1731389313000,"contributors":[{"name":"zhongyan.zhou","email":"zhongyan.zhou@eulee.cn","commits":1,"url":"https://github.com/zhongyan.zhou"}]},"filePathRelative":"java/elasticsearch/setup.md"}');export{p as comp,t as data};
