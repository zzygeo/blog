## 拉取镜像

拉取elasticsearch和kibana镜像：

```text
docker pull docker.elastic.co/elasticsearch/elasticsearch:7.17.25
docker pull docker.elastic.co/kibana/kibana:7.17.25
```

## docker-compose启动

配置elastic search

```docker-compose
version: '3.0'

services:
  es01:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.25
    ports:
      - "9200:9200"
      - "9300:9300"
    container_name: es01
    environment:
      discovery.type: single-node
      ES_JAVA_OPTS: "-Xms512m -Xmx1024m"
    networks:
      - elastic

networks:
  elastic:
    name: elastic

```

配置kibana

```docker-compose
version: '3.0'

services:
  kibana:
    image: docker.elastic.co/kibana/kibana:7.17.25
    networks:
      - elastic
    ports:
      - 5601:5601
    environment:
      - ELASTICSEARCH_HOSTS=http://es01:9200

networks:
  elastic:
    external: true

```

打开[链接](http://localhost:5601)查看kibana。
