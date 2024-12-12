## 相关概念

traceId，spanId，链路的唯一标识是traceId。spanId标识发起的请求，各span通过parentId关联起来。

## 下载zipkin.jar包

直接到中央仓库的[zipkin-server的ftp目录](https://repo1.maven.org/maven2/io/zipkin/zipkin-server/)下下载。

## 引入依赖

```xml
<!-- 版本信息 -->
<properties>
    <micrometer-tracking.version>1.2.0</micrometer-tracking.version>
    <micrometer-observation.version>1.12.0</micrometer-observation.version>
    <feign-micrometer.version>12.5</feign-micrometer.version>
    <zipkin-reporter-broker.version>2.17.0</zipkin-reporter-broker.version>
</properties>

        <!-- micrometer + zipkin -->
<dependencies>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bom</artifactId>
    <version>${micrometer-tracking.version}</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing</artifactId>
    <version>${micrometer-tracking.version}</version>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-brave</artifactId>
    <version>${micrometer-tracking.version}</version>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-observation</artifactId>
    <version>${micrometer-observation.version}</version>
</dependency>
<dependency>
    <groupId>io.zipkin.reporter2</groupId>
    <artifactId>zipkin-reporter-brave</artifactId>
    <version>${zipkin-reporter-broker.version}</version>
</dependency>
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-micrometer</artifactId>
    <version>${feign-micrometer.version}</version>
</dependency>
</dependencies>

```

## yaml配置

yaml配置如下，需要添加actutor依赖，并暴露必要的端点信息。：

```yaml
management:
  endpoints:
    web:
      exposure:
        include: 'prometheus,health,info,metrics' # 开放必要的端点
  zipkin:
    tracing:
      endpoint: http://localhost:9411/api/v2/spans # zipkin地址
  tracing:
    sampling:
      probability: 1.0 # 采样率，1.0表示全部采集
```
